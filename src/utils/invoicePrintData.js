// Everything an invoice print needs besides the invoice itself: company letterhead
// details, payment methods and the chosen print template. Shared by the invoice
// list (quick print) and the invoice detail page.
import { getAccountingSettings, getInvoiceTemplateSettings, getPaymentMethods } from './accountingApi';

const unwrap = (res) => res.data?.data || res.data;

export async function loadInvoicePrintData() {
  const [settingsRes, methodsRes, templateRes] = await Promise.allSettled([
    getAccountingSettings(),
    getPaymentMethods(),
    getInvoiceTemplateSettings(),
  ]);

  const result = { company: null, methods: [], template: { invoiceTheme: 'default', layout: null } };
  if (settingsRes.status === 'fulfilled') {
    result.company = unwrap(settingsRes.value)?.company || null;
  }
  if (methodsRes.status === 'fulfilled') {
    const raw = unwrap(methodsRes.value);
    const list = raw?.methods || raw;
    result.methods = Array.isArray(list) ? list : [];
  }
  if (templateRes.status === 'fulfilled') {
    const t = unwrap(templateRes.value) || {};
    result.template = {
      invoiceTheme: t.invoiceTheme || 'default',
      layout: t.layout || null,
      termsAndConditions: t.termsAndConditions || '',
      footerText: t.footerText || '',
    };
  }
  return result;
}

// Print-window CSS. A zero @page margin stops the browser from printing its own
// header/footer (date, page title, about:blank, page count); the invoice sheet
// (.inv-doc) carries its own A4 margins.
export const PRINT_PAGE_CSS = `
  @page { size: A4; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .inv-print { box-shadow: none; margin: 0; border-radius: 0; }
    .no-print { display: none !important; }
  }
`;
