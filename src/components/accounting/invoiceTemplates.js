// Invoice print templates. Stored per company as invoice_template_settings.invoice_theme;
// InvoicePrintView reads the flags below instead of checking template ids directly.

export const INVOICE_TEMPLATES = [
  {
    id: 'default',
    label: 'Standard',
    description: 'Seller GSTIN beside the invoice details, payment methods, terms & conditions, and GSTIN/PAN above the signature.',
    taxIdsInLetterhead: false,
    sellerGstinInDetails: true,
    showPaymentMethods: true,
    bankSectionTitle: 'Terms & Conditions', // heading above the bank-details block; null hides it
    showDefaultTerms: true,
    taxIdsInFooter: true,
  },
  {
    id: 'letterhead',
    label: 'Letterhead',
    description: 'GSTIN and PAN in the letterhead under the address. No payment-methods block or standard terms — just your bank details and signature.',
    taxIdsInLetterhead: true,
    sellerGstinInDetails: false,
    showPaymentMethods: false,
    bankSectionTitle: null,
    showDefaultTerms: false,
    taxIdsInFooter: false,
  },
];

// Unknown or legacy values (modern / classic / minimal never had layouts) fall back to Standard
export const resolveInvoiceTemplate = (id) =>
  INVOICE_TEMPLATES.find((t) => t.id === id) || INVOICE_TEMPLATES[0];
