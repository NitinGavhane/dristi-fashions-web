/**
 * Client-side logic tests for the storefront.
 *
 * The key invariant: the numbers shown to the customer before payment (this
 * app's `pricing.ts`) must equal what the backend actually charges
 * (`app/core/gst.py` + `app/services/delivery_service.py`). Divergence means
 * quoting a price we do not charge. Backend parity was proven separately in
 * `testing/logic_test.py`; here the same rules are asserted on the web side.
 *
 * Run:  npx tsx scripts/logic-test.ts
 */
import assert from 'node:assert/strict';
import {
  isIntraState,
  gstBreakup,
  computeDeliveryFee,
  orderTotals,
} from '../src/lib/pricing';
import { formatCurrency, formatDate, formatDateTime, humanizeStatus, initials } from '../src/lib/format';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}`);
    console.log(`      ${e instanceof Error ? e.message : e}`);
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

test('isIntraState recognises seller state + aliases, defaults on unknown', () => {
  for (const s of ['West Bengal', 'WB', 'wb', 'westbengal', 'Bengal', '  West Bengal  ']) {
    assert.equal(isIntraState(s), true, `'${s}' should be intra`);
  }
  for (const s of [null, undefined, '', '   ']) {
    assert.equal(isIntraState(s), true, `'${s}' should default intra`);
  }
  for (const s of ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu']) {
    assert.equal(isIntraState(s), false, `'${s}' should be inter`);
  }
});

test('gstBreakup intra-state splits 18% into 9+9, zero IGST', () => {
  const b = gstBreakup(1000, 'West Bengal');
  assert.equal(b.cgst, 90);
  assert.equal(b.sgst, 90);
  assert.equal(b.igst, 0);
  assert.equal(b.total, 180);
  assert.equal(b.intraState, true);
});

test('gstBreakup inter-state is single IGST 18%', () => {
  const b = gstBreakup(1000, 'Karnataka');
  assert.equal(b.cgst, 0);
  assert.equal(b.sgst, 0);
  assert.equal(b.igst, 180);
  assert.equal(b.total, 180);
  assert.equal(b.intraState, false);
});

test('GST total identical whether intra or inter (parity invariant)', () => {
  for (const amount of [0.01, 1, 99.99, 100, 1234.567, 99999.99]) {
    const intra = gstBreakup(amount, 'West Bengal');
    const inter = gstBreakup(amount, 'Karnataka');
    assert.equal(intra.total, inter.total, `parity broken at ${amount}`);
  }
});

test('gstBreakup rounding stays banker-free and 2dp', () => {
  assert.equal(gstBreakup(99.99, 'Karnataka').igst, 18.0); // 17.9982 -> 18
  assert.equal(gstBreakup(0, 'Karnataka').total, 0);
});

test('computeDeliveryFee mirrors backend rules', () => {
  assert.equal(computeDeliveryFee(0, null), 0, 'no settings -> free');
  assert.equal(computeDeliveryFee(100, { fee: 0, freeThreshold: null }), 0, 'zero fee -> free');
  assert.equal(computeDeliveryFee(999, { fee: 50, freeThreshold: 1000 }), 50, 'below threshold -> fee');
  assert.equal(computeDeliveryFee(1000, { fee: 50, freeThreshold: 1000 }), 0, 'at threshold -> free');
  assert.equal(computeDeliveryFee(1500, { fee: 50, freeThreshold: 1000 }), 0, 'above threshold -> free');
  assert.equal(computeDeliveryFee(500, { fee: 49.95, freeThreshold: null }), 49.95, '2dp fee');
});

test('half-cent fee rounding divergence is documented, not hidden', () => {
  // A pathological fee of 49.995 (-2dp, unrealistic but representable) rounds
  // differently: Python round() = 49.99 (banker's), JS Math.round() = 50.
  // Admin-entered fees are in whole rupees/paise, so this cannot arise in
  // practice unless a fee is hand-crafted to 3 decimal places.
  assert.equal(computeDeliveryFee(500, { fee: 49.995, freeThreshold: null }), 50);
});

test('orderTotals is internally consistent for a spread of inputs', () => {
  const subtotals = [0, 99.99, 250, 999.99, 1500];
  const states = ['West Bengal', 'Karnataka', 'Delhi', null];
  const settingsList = [
    null,
    { fee: 0, freeThreshold: null },
    { fee: 49, freeThreshold: null },
    { fee: 49, freeThreshold: 1000 },
  ];
  for (const subtotal of subtotals) {
    for (const state of states) {
      for (const delivery of settingsList) {
        const t = orderTotals(subtotal, state, delivery);
        const expectGst = round2(subtotal * 0.18);
        assert.equal(t.subtotal, round2(subtotal));
        assert.equal(t.gst.total, expectGst, `gst ${subtotal}/${state}`);
        assert.equal(round2(t.grandTotal), round2(t.subtotal + t.gst.total + t.deliveryFee),
          `grandTotal composition ${subtotal}/${String(state)}/${JSON.stringify(delivery)}`);
      }
    }
  }
});

test('orderTotals spot values match backend-calculated reference', () => {
  // subtotal 1000, Karnataka -> 180 IGST, free delivery, grandTotal 1180
  const t = orderTotals(1000, 'Karnataka', { fee: 0, freeThreshold: null });
  assert.equal(t.gst.total, 180);
  assert.equal(t.deliveryFee, 0);
  assert.equal(t.grandTotal, 1180);
  // subtotal 999.99, West Bengal -> gst 180 (90+90), fee 50, grandTotal 1229.99
  const t2 = orderTotals(999.99, 'West Bengal', { fee: 50, freeThreshold: 1000 });
  assert.equal(t2.gst.cgst, 90);
  assert.equal(t2.gst.sgst, 90);
  assert.equal(t2.deliveryFee, 50);
  assert.equal(t2.grandTotal, 1229.99);
});

test('formatCurrency hides paise on round prices', () => {
  assert.equal(formatCurrency(1000), '₹1,000');
  assert.equal(formatCurrency(999.5), '₹999.50');
  assert.equal(formatCurrency(1139.99), '₹1,139.99');
});

test('formatDate/DateTime tolerate missing or invalid input', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate('not-a-date'), '');
  assert.equal(formatDate(undefined), '');
  assert.equal(formatDateTime(''), '');
});

test('humanizeStatus converts snake_case', () => {
  assert.equal(humanizeStatus('placed'), 'Placed');
  assert.equal(humanizeStatus('out_for_delivery'), 'Out For Delivery');
  assert.equal(humanizeStatus(null), '');
  assert.equal(humanizeStatus(''), '');
});

test('initials takes first two words', () => {
  assert.equal(initials('Nitin Gavhane'), 'NG');
  assert.equal(initials('  spaced   name '), 'SN');
  assert.equal(initials('Single'), 'S');
});

console.log(`\nRESULT: ${passed} passed, ${failed} failed, ${passed + failed} total`);
process.exit(failed ? 1 : 0);