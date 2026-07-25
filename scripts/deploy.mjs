/**
 * One-command deploy of the storefront to AWS.
 *
 *   npm run deploy
 *
 * Ships the production build to the customer site https://dristifashions.com,
 * which is served by nginx from /usr/share/nginx/dristi-web on the EC2 box.
 *
 * How it works (SSH is closed on the box — everything goes over AWS SSM):
 *   1. vite build                          -> dist/
 *   2. tar dist/                           -> dristi-web.tgz
 *   3. aws s3 cp   the tarball to the uploads bucket's deploy/ prefix
 *      (public-read; the box's instance role can PutObject but not GetObject,
 *       so the box curls it back over the public URL)
 *   4. aws ssm send-command  runs a root script on the box that curls + extracts
 *      the tarball, sanity-checks it, swaps it into the live dir (old -> .bak)
 *      and reloads nginx. `set -e` aborts BEFORE touching the live dir if the
 *      download or sanity check fails.
 *   5. delete the staged tarball from S3.
 *
 * Credentials come from your local `aws` CLI config — nothing secret is committed
 * or stored in GitHub. You need the AWS CLI installed and `aws sts get-caller-identity`
 * working for account 078525505229 (region ap-south-1).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---- AWS resources (not secret; safe to commit) -------------------------- */
const REGION = 'ap-south-1';
const BUCKET = 'dristi-uploads-078525505229';
const KEY = 'deploy/dristi-web.tgz';
const INSTANCE = 'i-0cb2f33a4ac2e3cee';
const LIVE_DIR = '/usr/share/nginx/dristi-web';
const SITE = 'https://dristifashions.com';
const PUBLIC_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${KEY}`;

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/* The AWS CLI is not always on PATH in Git Bash; allow an override, else fall
 * back to the default Windows install path, else trust PATH. */
function resolveAws() {
  if (process.env.AWS_CLI) return process.env.AWS_CLI;
  const win = 'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe';
  return existsSync(win) ? win : 'aws';
}
const AWS = resolveAws();

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
}
function step(msg) {
  console.log(`\n\u2192 ${msg}`);
}

/* The script that runs as root on the box. Kept in sync with the manual runbook. */
const remoteScript = `set -e
URL="${PUBLIC_URL}"
WORK=/home/ec2-user/webdeploy
LIVE=${LIVE_DIR}
rm -rf "$WORK"; mkdir -p "$WORK/new"
echo "== downloading =="
curl -fsSL "$URL" -o "$WORK/dristi-web.tgz"
echo "== extracting =="
tar xzf "$WORK/dristi-web.tgz" -C "$WORK/new"
echo "== sanity check =="
test -f "$WORK/new/index.html"
ls "$WORK/new/assets"/index-*.js >/dev/null
echo "== swapping into place =="
rm -rf "$LIVE.bak"
if [ -d "$LIVE" ]; then mv "$LIVE" "$LIVE.bak"; fi
mv "$WORK/new" "$LIVE"
chown -R nginx:nginx "$LIVE"
echo "== nginx reload =="
nginx -t
systemctl reload nginx
rm -rf "$WORK"
echo "== live title =="
grep -o "<title>[^<]*</title>" "$LIVE/index.html"
echo DONE`;

async function main() {
  step('Checking AWS credentials');
  try {
    const who = JSON.parse(run(AWS, ['sts', 'get-caller-identity', '--output', 'json']));
    console.log(`  account ${who.Account} as ${who.Arn.split('/').pop()}`);
  } catch {
    console.error('  ERROR: the AWS CLI is not configured. Run `aws configure` (account 078525505229) or set AWS_CLI to its path.');
    process.exit(1);
  }

  step('Building (vite build)');
  run('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });

  const staging = mkdtempSync(join(tmpdir(), 'dristi-deploy-'));
  const tarball = join(staging, 'dristi-web.tgz');
  try {
    step('Packing dist/');
    // System tar (present on Windows 10+, macOS, Linux, Git Bash).
    run('tar', ['-czf', tarball, '-C', DIST, '.']);

    step('Uploading to S3');
    run(AWS, ['s3', 'cp', tarball, `s3://${BUCKET}/${KEY}`, '--region', REGION]);

    step('Deploying on EC2 via SSM');
    const inputFile = join(staging, 'ssm-input.json');
    writeFileSync(
      inputFile,
      JSON.stringify({
        InstanceIds: [INSTANCE],
        DocumentName: 'AWS-RunShellScript',
        Comment: 'deploy dristhi-fashions-web',
        Parameters: { commands: [remoteScript] },
      }),
    );
    const commandId = run(AWS, [
      'ssm', 'send-command', '--region', REGION,
      '--cli-input-json', `file://${inputFile}`,
      '--query', 'Command.CommandId', '--output', 'text',
    ]).trim();
    console.log(`  command ${commandId}`);

    let status = 'Pending';
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 5000));
      status = run(AWS, [
        'ssm', 'get-command-invocation', '--region', REGION,
        '--command-id', commandId, '--instance-id', INSTANCE,
        '--query', 'Status', '--output', 'text',
      ]).trim();
      process.stdout.write(`  status: ${status}\r`);
      if (['Success', 'Failed', 'Cancelled', 'TimedOut'].includes(status)) break;
    }
    console.log('');

    const field = q => run(AWS, [
      'ssm', 'get-command-invocation', '--region', REGION,
      '--command-id', commandId, '--instance-id', INSTANCE,
      '--query', q, '--output', 'text',
    ]).trimEnd();
    console.log(field('StandardOutputContent').split('\n').map(l => `  | ${l}`).join('\n'));

    if (status !== 'Success') {
      console.error('\n  ERROR: deploy did not succeed. stderr:');
      console.error(field('StandardErrorContent').split('\n').map(l => `  ! ${l}`).join('\n'));
      process.exit(1);
    }
  } finally {
    step('Cleaning up S3');
    try {
      run(AWS, ['s3', 'rm', `s3://${BUCKET}/${KEY}`, '--region', REGION]);
    } catch {
      console.warn('  (could not remove staged tarball; safe to ignore)');
    }
    rmSync(staging, { recursive: true, force: true });
  }

  console.log(`\n\u2705 Live at ${SITE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
