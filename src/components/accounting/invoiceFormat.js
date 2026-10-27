// Formatting and GST helpers shared by the invoice print layouts.

export const num = (v) => Number(v) || 0;
export const fmt = (v) => num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtQty = (v) => num(v).toLocaleString('en-IN', { maximumFractionDigits: 3 });
export const fmtRate = (r) => `${num(r).toFixed(2).replace(/\.?0+$/, '')}%`;
export const fmtDate = (d) => (d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');
// 15-09-2026
export const fmtDateNumeric = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}-${x.getFullYear()}`;
};
export const sameState = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
// Addresses are stored multi-line, sometimes with a trailing comma per line
export const oneLine = (s) => String(s).replace(/\s*,?\s*\n\s*/g, ', ');

// Indian numbering (lakh / crore), with paise
export function amountInWords(value) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const words = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${words(n % 100)}` : ''}`;
    if (n < 100000) return `${words(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${words(n % 1000)}` : ''}`;
    if (n < 10000000) return `${words(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${words(n % 100000)}` : ''}`;
    return `${words(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${words(n % 10000000)}` : ''}`;
  };
  const total = Math.round(Math.abs(Number(value) || 0) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  return `Rupees ${rupees ? words(rupees) : 'Zero'}${paise ? ` and ${words(paise)} Paise` : ''} Only`;
}

// GST summary grouped by rate: [{ name, rate, amount }]. Intra-state supplies
// split into CGST + SGST and inter-state supplies show IGST; when the
// customer's state is unknown the tax is shown as plain GST rather than
// guessing. rate is null when items don't add up to the invoice tax.
export function gstLines(items, invoiceTax, sellerState, buyerState) {
  const byRate = new Map();
  items.forEach((i) => {
    const rate = num(i.taxRate);
    const amt = num(i.taxAmount);
    if (rate > 0 || amt > 0) byRate.set(rate, (byRate.get(rate) || 0) + amt);
  });
  const itemTax = [...byRate.values()].reduce((s, v) => s + v, 0);
  if (!byRate.size || Math.abs(itemTax - num(invoiceTax)) > 0.05) {
    return num(invoiceTax) > 0 ? [{ name: 'GST', rate: null, amount: num(invoiceTax) }] : [];
  }
  const intra = sameState(sellerState, buyerState);
  const inter = sellerState && buyerState && !intra;
  return [...byRate.entries()].flatMap(([rate, amount]) => {
    if (intra) {
      return [
        { name: 'CGST', rate: rate / 2, amount: amount / 2 },
        { name: 'SGST', rate: rate / 2, amount: amount / 2 },
      ];
    }
    return [{ name: inter ? 'IGST' : 'GST', rate, amount }];
  });
}

export const gstLabel = (t) => (t.rate == null ? t.name : `${t.name} @ ${fmtRate(t.rate)}`);

const GST_STATE_CODES = {
  'jammu and kashmir': '01', 'himachal pradesh': '02', punjab: '03', chandigarh: '04',
  uttarakhand: '05', haryana: '06', delhi: '07', rajasthan: '08', 'uttar pradesh': '09',
  bihar: '10', sikkim: '11', 'arunachal pradesh': '12', nagaland: '13', manipur: '14',
  mizoram: '15', tripura: '16', meghalaya: '17', assam: '18', 'west bengal': '19',
  jharkhand: '20', odisha: '21', chhattisgarh: '22', 'madhya pradesh': '23', gujarat: '24',
  'dadra and nagar haveli and daman and diu': '26', maharashtra: '27', karnataka: '29',
  goa: '30', lakshadweep: '31', kerala: '32', 'tamil nadu': '33', puducherry: '34',
  'andaman and nicobar islands': '35', telangana: '36', 'andhra pradesh': '37', ladakh: '38',
};
const STATE_ALIASES = { orissa: 'odisha', pondicherry: 'puducherry', 'nct of delhi': 'delhi', 'new delhi': 'delhi' };

export const GST_STATES = Object.keys(GST_STATE_CODES)
  .map((s) => s.replace(/\b(\w)/g, (c) => c.toUpperCase()).replace(/\bAnd\b/g, 'and'));

// GST state code: from the GSTIN's first two digits, else from the state name
export function stateCodeFor(state, gstin) {
  const g = String(gstin || '').trim();
  if (/^\d{2}[A-Z]/i.test(g)) return g.slice(0, 2);
  const key = String(state || '').trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ');
  return GST_STATE_CODES[STATE_ALIASES[key] || key] || '';
}

// State name for a GSTIN's leading state code, e.g. 32… → Kerala
export function stateFromGstin(gstin) {
  const code = String(gstin || '').trim().slice(0, 2);
  const i = Object.values(GST_STATE_CODES).indexOf(code);
  return /^\d{2}$/.test(code) && i >= 0 ? GST_STATES[i] : '';
}

// A GSTIN embeds the holder's PAN (characters 3–12)
export function panFromGstin(gstin) {
  const m = /^\d{2}([A-Z]{5}\d{4}[A-Z])[0-9A-Z]{3}$/i.exec(String(gstin || '').trim());
  return m ? m[1].toUpperCase() : '';
}

// Bank details are free text; "Key: Value" lines become a two-column list
export function splitKeyValues(text) {
  return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
    const i = line.indexOf(':');
    return i > 0 && i < 40 ? [line.slice(0, i).trim(), line.slice(i + 1).trim()] : [null, line];
  });
}
