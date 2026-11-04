// The amounts on one invoice / quotation / proforma line. Mirrors LineAmounts.php
// so the forms show exactly what the server saves: each amount is rounded to
// paise, and the lines add up exactly to the document's totals.

// Same half-paisa result as PHP's round(): 252808.725 → 252808.73, despite binary floats
export const round2 = (v) => Math.round(Number(((Number(v) || 0) * 100).toPrecision(15))) / 100;

export const STANDARD_GST_RATES = [0, 3, 5, 12, 18, 28, 40];

const num = (v) => Number(v) || 0;

export const lineGross = (item) => round2(num(item.quantity) * num(item.unitPrice));

const gstFactor = (item) => 1 + num(item.taxRate ?? item.tax_rate) / 100;

// Discount on a line (before GST, as saved), entered as a percentage or an
// amount (discountMode says which). A typed amount is off the price including
// GST, the way prices are quoted: 2,500 off 6,50,000 gives 6,47,500.
export function lineDiscount(item) {
  const gross = lineGross(item);
  if (item.discountMode === 'amount') return Math.min(round2(round2(item.discountAmount) / gstFactor(item)), gross);
  return round2((gross * Math.min(num(item.discountPercent), 100)) / 100);
}

// The same discount as an amount off the price including GST
export const discountWithGst = (item) => round2(lineDiscount(item) * gstFactor(item));

export function lineAmounts(item) {
  const gross = lineGross(item);
  const discount = lineDiscount(item);
  const net = round2(gross - discount);
  const tax = round2((net * num(item.taxRate)) / 100);
  return { gross, discount, net, tax, total: round2(net + tax) };
}

export const NO_DISCOUNT = { discountMode: 'percent', discountPercent: 0, discountAmount: 0 };

export const discountAsPercent = (discount, gross) => (gross > 0 ? round2((num(discount) / gross) * 100) : 0);

// Lines store the discount as an amount before GST. Back on the form it shows as
// a percentage when it was a tidy one (28%), otherwise as the amount typed
// (₹5,000, off the price including GST).
export function discountFromSaved(item) {
  const saved = round2(item.discount);
  if (saved <= 0) return { ...NO_DISCOUNT };
  const gross = round2(num(item.quantity) * num(item.unitPrice || item.unit_price || item.price));
  const percent = discountAsPercent(saved, gross);
  const withGst = round2(saved * gstFactor(item));
  if (Math.abs(round2((gross * percent) / 100) - saved) <= 0.01) {
    return { discountMode: 'percent', discountPercent: percent, discountAmount: withGst };
  }
  return { discountMode: 'amount', discountPercent: percent, discountAmount: withGst };
}

// A document's totals. Mirrors LineAmounts::totals() on the server: rounding
// goes to the nearest rupee and the paise difference is shown as the round
// off, so total = subtotal - discount + tax + roundOff.
export function documentTotals(items, roundTotal) {
  const lines = items.map(lineAmounts);
  const sum = (key) => round2(lines.reduce((s, l) => s + l[key], 0));
  const subtotal = sum('gross');
  const discount = sum('discount');
  const tax = sum('tax');
  const exact = round2(subtotal - discount + tax);
  const total = roundTotal ? Math.round(exact) : exact;
  return { subtotal, discount, taxable: round2(subtotal - discount), tax, roundOff: round2(total - exact), total };
}
