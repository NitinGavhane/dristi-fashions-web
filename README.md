# Dristi Fashions — Storefront

React + Vite storefront for the Garment E-commerce Platform. Every screen reads
from the FastAPI backend in [`../backend`](../backend); there is no mock data in
the app.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev        # http://localhost:3000
```

Out of the box this talks to the deployed AWS backend. To point it somewhere
else, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (Vite inlines it
at build time, so restart the dev server after changing it).

| Environment | `VITE_API_BASE_URL`                      |
| ----------- | ---------------------------------------- |
| AWS (default) | `https://d100c6f2kgsym4.cloudfront.net` |
| Local backend | `http://localhost:8000`                 |

```bash
npm run build      # production bundle into dist/
npm run preview    # serve the built bundle
npm run lint       # tsc --noEmit
```

## Deploying a change

The site is hosted on AWS: nginx serves it from `/usr/share/nginx/dristi-web` on
the EC2 box, reachable at **https://dristifashions.com**. Shipping an update is
two steps — save the code, then push the build live:

```bash
git add -A && git commit -m "..."   # save your work
git push                            # back it up to GitHub

npm run deploy                      # build + ship to AWS (goes live)
```

`npm run deploy` (`scripts/deploy.mjs`) builds `dist/`, tars it, uploads it to
the `dristi-uploads` S3 bucket, then runs a one-shot script on the box over AWS
**SSM** (port 22 is closed) that swaps the new build into place — keeping the
previous build next to it as `dristi-web.bak` — and reloads nginx. If the upload
or a sanity check fails, it aborts *before* the live directory is touched.

**Prerequisites:** the AWS CLI installed and configured for account
`078525505229` / region `ap-south-1` (`aws sts get-caller-identity` must work).
Nothing secret is committed — the deploy uses your local AWS credentials. If the
CLI isn't on your `PATH`, set `AWS_CLI` to its full path before running.

> Pushing to GitHub does **not** deploy. `git push` only backs up the code;
> `npm run deploy` is what updates the live site.

## How it talks to the backend

| File | Responsibility |
| --- | --- |
| `src/lib/apiClient.ts` | fetch wrapper: base URL, bearer token storage, refresh-and-replay on 401/403, snake_case → camelCase |
| `src/lib/api.ts` | one typed function per backend endpoint; the only place paths and request bodies are written |
| `src/lib/mappers.ts` | converts backend DTOs into the UI's domain model |
| `src/lib/pricing.ts` | client-side mirror of the backend's GST and delivery rules |
| `src/context/StoreContext.tsx` | session, cart, wishlist, addresses, orders and wallet state |

Backend responses are snake_case and the UI is camelCase; `apiClient` converts
responses automatically, while request bodies are written in snake_case by hand
inside `src/lib/api.ts`.

### Pricing must stay in step

`src/lib/pricing.ts` duplicates `app/core/gst.py` and
`app/services/delivery_service.py` so the cart and checkout can quote a total
*before* the order exists. The backend is always authoritative — if the two ever
disagree, the customer is shown a price we do not charge. Update both together.

Currently: 9% CGST + 9% SGST for a West Bengal delivery address, 18% IGST
elsewhere, applied on top of the item subtotal. Delivery charges come from
`GET /api/v1/delivery`.

## Brand assets

| File | Used for |
| --- | --- |
| `assets/logo.png` | the master artwork — imported by `DristiLogo` and used as the `og:image` |
| `assets/logo-icon.png` | 256px favicon (emblem only) |
| `assets/apple-touch-icon.png` | 180px iOS home-screen icon, flattened onto brand navy |

`logo.png` is a stacked lockup: emblem on top, wordmark beneath, centred in a
square canvas with transparent padding. `DristiLogo` carries two crop
rectangles measured from its alpha channel — one for the emblem alone
(headers, where the wordmark would be an illegible smudge at 44px) and one for
the trimmed full lockup (the About page). **Replacing the artwork means
re-measuring those crops.**

The two icons are cut from the same file; regenerate them if the logo changes.

> `logo.png` is 629 KB and ships on every page for a ~44px header emblem. A
> resized copy (≈600px wide) would cut that to well under 100 KB.

## Things worth knowing

- **No free-delivery advertising.** The header promo bar and the home-page
  delivery strip only appear when a delivery fee is actually configured; with
  none set they render nothing rather than promising free delivery. The cart,
  checkout and order pages still show `Free` on the delivery line, because that
  states what the order is genuinely being charged.
- **Guest carts.** A signed-out customer's bag lives in `localStorage` and is
  pushed to the server cart on sign-in, so nothing chosen while browsing
  anonymously is lost.
- **Orders survive failed payments.** Checkout creates the order first, then
  takes payment. A cancelled or failed payment leaves the order `pending` so the
  customer can retry from their order page instead of rebuilding the bag.
- **The bag is cleared client-side.** `POST /api/v1/orders` does not empty the
  cart, so the storefront removes the lines itself after a successful order.
- **Prices exclude GST.** Product pages say so explicitly, because GST is added
  to the subtotal at checkout rather than baked into the listed price.
- **No coupon or wallet redemption at checkout.** The backend's `create_order`
  always records a zero discount and does not debit the wallet, so the
  storefront does not offer either — the wallet is shown read-only. Both would
  need backend work before the UI could honestly present them.
