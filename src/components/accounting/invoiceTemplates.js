// Invoice print templates. A template = a base preset (invoice_theme) plus the
// builder's customisations (layout), merged over it. InvoicePrintView reads
// only the resolved layout, never preset ids. Keep keys in sync with
// InvoiceSettingsController::LAYOUT_SCHEMA on the backend.

export const DEFAULT_DECLARATION = 'Certified that the particulars given above are true and correct and the amount indicated '
  + 'represents the price actually charged and that there is no additional consideration directly or indirectly from the buyer';

// design: 'modern' (open layout) or 'boxed' (ruled grid, classic GST format).
// fields: custom fields whose values are typed on each invoice; position
// 'details' prints beside Invoice No/Date, 'footer' above the signature.
const LETTERHEAD = {
  style: { design: 'modern', accentColor: '#111827', font: 'modern', textSize: 'normal', tableStyle: 'solid' },
  logo: { show: true, size: 26, position: 'left' },
  header: {
    title: 'Tax Invoice', subtitle: 'Original for Recipient', tagline: '',
    showAddress: true, showContact: true, showState: true, taxIds: 'letterhead',
  },
  details: {
    sellerGstin: false, placeOfSupply: true, customerGstin: true, customerPan: false,
    contactPerson: false, dueDate: true, shipTo: false,
  },
  columns: { hsn: true, uom: false, taxableValue: true, gstRate: true, gstAmount: true },
  sections: {
    amountInWords: true, bankDetails: true, paymentOptions: false, terms: false,
    notes: true, footerMessage: false, computerGenerated: true,
    declaration: false, receivedNote: false, pageNumber: false,
  },
  labels: {
    billTo: 'Bill To', shipTo: 'Ship To', description: 'Description', bankDetails: 'Bank Details',
    notes: 'Notes', termsHeading: 'Terms & Conditions', signatory: 'Authorized Signatory',
  },
  texts: {
    declaration: DEFAULT_DECLARATION,
    receivedNote: 'Received the above goods in good condition',
    closingNote: '',
  },
  fields: [],
  signature: { show: true, forCompany: true },
};

const STANDARD = {
  ...LETTERHEAD,
  header: { ...LETTERHEAD.header, taxIds: 'footer' },
  details: { ...LETTERHEAD.details, sellerGstin: true },
  sections: { ...LETTERHEAD.sections, paymentOptions: true, terms: true },
};

// The ruled, all-boxes GST tax invoice many Indian businesses already use
const CLASSIC = {
  style: { design: 'boxed', accentColor: '#111827', font: 'clean', textSize: 'normal', tableStyle: 'solid' },
  logo: { show: true, size: 26, position: 'left' },
  header: {
    title: 'TAX INVOICE', subtitle: '', tagline: '',
    showAddress: true, showContact: true, showState: true, taxIds: 'letterhead',
  },
  details: {
    sellerGstin: false, placeOfSupply: false, customerGstin: true, customerPan: true,
    contactPerson: true, dueDate: false, shipTo: true,
  },
  columns: { hsn: true, uom: true, taxableValue: false, gstRate: false, gstAmount: false },
  sections: {
    amountInWords: true, bankDetails: true, paymentOptions: false, terms: false,
    notes: true, footerMessage: false, computerGenerated: false,
    declaration: true, receivedNote: true, pageNumber: true,
  },
  labels: {
    billTo: 'Bill To', shipTo: 'Ship To', description: 'Description of Goods', bankDetails: 'Additional Information',
    notes: 'Remarks', termsHeading: 'Terms & Conditions', signatory: 'Authorised Signatory',
  },
  texts: {
    declaration: DEFAULT_DECLARATION,
    receivedNote: 'Received the above goods in good condition',
    closingNote: 'Please return one copy of challan with seal & signature',
  },
  fields: [
    { id: 'orderref', label: 'Order No & Date', position: 'details' },
    { id: 'lotcode', label: 'Lot Code', position: 'footer' },
    { id: 'lrno', label: 'LR No', position: 'footer' },
  ],
  signature: { show: true, forCompany: true },
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
  {
    id: 'classic',
    label: 'Classic GST',
    description: 'Ruled boxes: CIN/GSTIN/PAN, Bill To & Ship To, UOM column, order and dispatch fields, declaration and receiver note.',
    layout: CLASSIC,
  },
];

export const MAX_CUSTOM_FIELDS = 8;
// Field ids are stored as keys on each invoice: lower-case letters/digits only
export const newFieldId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

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

// Section-by-section merge: unknown or missing keys fall back to the preset.
// List sections (fields) are replaced whole.
export function resolveInvoiceLayout(themeId, custom) {
  const base = presetFor(themeId).layout;
  if (!custom || typeof custom !== 'object') return base;
  return Object.fromEntries(Object.entries(base).map(([section, values]) => {
    const own = custom[section];
    if (Array.isArray(values)) return [section, Array.isArray(own) ? own : values];
    return [section, { ...values, ...(own && typeof own === 'object' && !Array.isArray(own) ? own : {}) }];
  }));
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
