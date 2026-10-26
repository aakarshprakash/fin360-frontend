// Invoice print templates. A template = a base preset (invoice_theme) plus the
// builder's customisations (layout), merged over it. InvoicePrintView reads
// only the resolved layout, never preset ids. Keep keys in sync with
// InvoiceSettingsController::LAYOUT_SCHEMA on the backend.

const LETTERHEAD = {
  style: { accentColor: '#111827', font: 'modern', textSize: 'normal', tableStyle: 'solid' },
  logo: { show: true, size: 26, position: 'left' },
  header: {
    title: 'Tax Invoice', subtitle: 'Original for Recipient',
    showAddress: true, showContact: true, showState: true, taxIds: 'letterhead',
  },
  details: { sellerGstin: false, placeOfSupply: true, customerGstin: true },
  columns: { hsn: true, taxableValue: true, gstRate: true, gstAmount: true },
  sections: {
    amountInWords: true, bankDetails: true, paymentOptions: false, terms: false,
    notes: true, footerMessage: false, computerGenerated: true,
  },
  labels: { billTo: 'Bill To', bankDetails: 'Bank Details', termsHeading: 'Terms & Conditions', signatory: 'Authorized Signatory' },
  signature: { show: true, forCompany: true },
};

const STANDARD = {
  ...LETTERHEAD,
  header: { ...LETTERHEAD.header, taxIds: 'footer' },
  details: { ...LETTERHEAD.details, sellerGstin: true },
  sections: { ...LETTERHEAD.sections, paymentOptions: true, terms: true },
};

export const INVOICE_TEMPLATES = [
  {
    id: 'default',
    label: 'Standard',
    description: 'Seller GSTIN in the invoice details, payment options, terms & conditions, and GSTIN/PAN above the signature.',
    layout: STANDARD,
  },
  {
    id: 'letterhead',
    label: 'Letterhead',
    description: 'GSTIN and PAN in the letterhead. No payment options or standard terms — just bank details and signature.',
    layout: LETTERHEAD,
  },
];

export const ACCENT_SWATCHES = [
  { name: 'Ink', value: '#111827' },
  { name: 'Navy', value: '#1E3A8A' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Purple', value: '#5B21B6' },
  { name: 'Maroon', value: '#9F1239' },
  { name: 'Forest', value: '#166534' },
];

export const FONT_STACKS = {
  modern: "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  classic: "Georgia, 'Times New Roman', serif",
  clean: 'Arial, Helvetica, sans-serif',
};

export const TEXT_SIZES = { small: '8.5pt', normal: '9pt', large: '9.75pt' };

const presetFor = (id) => (INVOICE_TEMPLATES.find((t) => t.id === id) || INVOICE_TEMPLATES[0]);

// Section-by-section merge: unknown or missing keys fall back to the preset
export function resolveInvoiceLayout(themeId, custom) {
  const base = presetFor(themeId).layout;
  if (!custom || typeof custom !== 'object') return base;
  return Object.fromEntries(Object.entries(base).map(([section, values]) => [
    section,
    { ...values, ...(custom[section] && typeof custom[section] === 'object' ? custom[section] : {}) },
  ]));
}

export const isCustomised = (themeId, custom) =>
  JSON.stringify(resolveInvoiceLayout(themeId, custom)) !== JSON.stringify(presetFor(themeId).layout);

// Readable text colour on a filled accent background
export function textOn(hex) {
  const h = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex.slice(1) : '111827';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#111827' : '#FFFFFF';
}
