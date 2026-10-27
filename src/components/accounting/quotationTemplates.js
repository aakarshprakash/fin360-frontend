// Quotation template defaults. Keep in sync with
// AccountingSettingsController::defaultQuotation() / QUOTATION_RULES.

export const DEFAULT_QUOTATION_TERMS = [
  { title: 'PRICE', showBank: false, text: 'The equipment price is offered in INR and is exclusive of GST or any other local taxes, unless otherwise specified. The offer is valid for 60 days and thereafter subject to confirmation from our end.' },
  { title: 'PAYMENT TERMS', showBank: true, text: 'Standard payment terms are 50% in advance and the balance against delivery.\nPayment to be made to the account below.' },
  { title: 'EQUIPMENT DELIVERY', showBank: false, text: 'The ordered equipment shall be dispatched within 3-5 weeks from the date of the confirmed purchase order and receipt of the advance payment.' },
  { title: 'INSTALLATION AND DEMONSTRATION', showBank: false, text: 'The equipment shall be installed by our service representative at no cost upon receipt of the installation readiness letter. Additional visits or demonstrations on request will be charged. The purchaser shall provide a proper power supply and the specified environmental conditions.' },
  { title: 'WARRANTY', showBank: false, text: 'The equipment carries a standard warranty of 12 months from the date of installation or 15 months from the date of delivery, whichever is earlier, against manufacturing defects or workmanship. Accessories supplied with the product carry a 6-month warranty.' },
  { title: 'AMC', showBank: false, text: 'We recommend an annual maintenance contract for periodic maintenance of the equipment after the standard warranty period expires.' },
];

export const DEFAULT_QUOTATION_SETTINGS = {
  // Classic design: terms table rows
  validity: '30 Days', gstNote: '', deliveryTime: '', deliveryMode: '',
  warranty: '', paymentTerms: '', computerConfiguration: '', training: '',
  // Letterhead design
  design: 'classic',
  headerType: 'company',
  headerImage: '',
  footerType: 'none',
  footerImage: '',
  footerText: '',
  title: 'QUOTATION',
  showProductImages: true,
  showFeatures: true,
  showTotals: true,
  termsPage: true,
  termsTitle: 'TERMS AND CONDITIONS',
  showSignature: true,
  terms: DEFAULT_QUOTATION_TERMS,
  // Rich-text terms page (HTML); empty = built from `terms`
  termsHtml: '',
};

export const resolveQuotationSettings = (s) => ({ ...DEFAULT_QUOTATION_SETTINGS, ...(s || {}) });
