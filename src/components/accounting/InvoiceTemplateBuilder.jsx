// Invoice template builder (Settings › Invoice Template). Edits the template
// settings object owned by AccountingSettings — { invoiceTheme, layout,
// termsAndConditions, footerText, … } — and shows a live A4 preview. Saving
// stays with the page's "Save Template" button.
import { useLayoutEffect, useRef, useState } from 'react';
import InvoicePrintView from './InvoicePrintView';
import {
  ACCENT_SWATCHES, INVOICE_TEMPLATES, isCustomised, resolveInvoiceLayout,
} from './invoiceTemplates';
import '../../styles/InvoiceTemplateBuilder.css';

const A4_PX = { width: 794, height: 1123 }; // 210 × 297 mm at 96 dpi

const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-00042',
  date: new Date().toISOString(),
  dueDate: new Date(Date.now() + 15 * 864e5).toISOString(),
  customer: 'Malabar Diagnostics Pvt Ltd',
  customerAddress: 'Fort Road\nKannur 670001',
  customerPhone: '98470 12345',
  customerGst: '32AABCM1234F1Z5',
  customerState: 'Kerala',
  notes: 'Delivered to the clinic reception.',
  items: [
    { description: 'Ankle Cuff for Doppler', hsnCode: '90189019', quantity: 2, unitPrice: 1250, taxRate: 5, taxAmount: 125, total: 2625 },
    { description: 'Annual maintenance visit', hsnCode: '998719', quantity: 1, unitPrice: 4000, taxRate: 18, taxAmount: 720, total: 4720 },
  ],
  subtotal: 6500, tax: 845, total: 7345, amountPaid: 2000,
};

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="itb-toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="itb-field">
      <span className="itb-label">{label}</span>
      <div className="itb-segmented" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={value === v}
            className={value === v ? 'is-on' : ''}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, maxLength, placeholder, multiline }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <label className="itb-field">
      <span className="itb-label">{label}</span>
      <Input
        type={multiline ? undefined : 'text'}
        value={value || ''}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Panel({ title, children, open }) {
  return (
    <details className="itb-panel" open={open}>
      <summary>{title}</summary>
      <div className="itb-panel-body">{children}</div>
    </details>
  );
}

// A4 sheet scaled to the available width
function ScaledPreview({ children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.7);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, (entry.contentRect.width - 2) / A4_PX.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="itb-preview" ref={ref}>
      <div className="itb-preview-frame" style={{ width: A4_PX.width * scale, height: A4_PX.height * scale }}>
        <div className="itb-preview-page" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function InvoiceTemplateBuilder({ template, onChange, company, methods }) {
  const L = resolveInvoiceLayout(template.invoiceTheme, template.layout);
  const customised = isCustomised(template.invoiceTheme, template.layout);

  const set = (section, key) => (value) => onChange({
    ...template,
    layout: { ...L, [section]: { ...L[section], [key]: value } },
  });
  const setText = (key) => (value) => onChange({ ...template, [key]: value });

  const choosePreset = (id) => {
    if (id === template.invoiceTheme && !customised) return;
    if (customised && !window.confirm('Switch preset? Your customisations will be replaced by the preset’s settings.')) return;
    onChange({ ...template, invoiceTheme: id, layout: null });
  };

  const accentIsSwatch = ACCENT_SWATCHES.some((s) => s.value.toLowerCase() === L.style.accentColor.toLowerCase());

  return (
    <div className="itb">
      <div className="itb-controls">
        <div className="itb-presets">
          <div className="itb-presets-head">
            <span className="itb-label">Start from</span>
            {customised && (
              <button type="button" className="itb-link" onClick={() => onChange({ ...template, layout: null })}>
                Reset to preset
              </button>
            )}
          </div>
          <div className="itb-preset-list" role="radiogroup" aria-label="Preset">
            {INVOICE_TEMPLATES.map((t) => {
              const active = (template.invoiceTheme || 'default') === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  role="radio"
                  aria-checked={active}
                  className={`itb-preset ${active ? 'is-on' : ''}`}
                  onClick={() => choosePreset(t.id)}
                  title={t.description}
                >
                  <strong>{t.label}</strong>
                  {active && customised && <small>Customised</small>}
                </button>
              );
            })}
          </div>
        </div>

        <Panel title="Brand & style" open>
          <div className="itb-field">
            <span className="itb-label">Accent colour</span>
            <div className="itb-swatches">
              {ACCENT_SWATCHES.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  className={`itb-swatch ${s.value.toLowerCase() === L.style.accentColor.toLowerCase() ? 'is-on' : ''}`}
                  style={{ background: s.value }}
                  onClick={() => set('style', 'accentColor')(s.value)}
                  aria-label={s.name}
                  title={s.name}
                />
              ))}
              <label className={`itb-swatch itb-swatch-custom ${accentIsSwatch ? '' : 'is-on'}`} title="Custom colour">
                <input
                  type="color"
                  value={L.style.accentColor}
                  onChange={(e) => set('style', 'accentColor')(e.target.value.toUpperCase())}
                  aria-label="Custom accent colour"
                />
              </label>
            </div>
          </div>
          <Segmented label="Font" value={L.style.font} onChange={set('style', 'font')}
            options={[['modern', 'Modern'], ['classic', 'Classic'], ['clean', 'Clean']]} />
          <Segmented label="Text size" value={L.style.textSize} onChange={set('style', 'textSize')}
            options={[['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']]} />
          <Segmented label="Item table" value={L.style.tableStyle} onChange={set('style', 'tableStyle')}
            options={[['solid', 'Solid'], ['light', 'Light'], ['lines', 'Lines']]} />
        </Panel>

        <Panel title="Logo">
          <Toggle label="Show logo" checked={L.logo.show} onChange={set('logo', 'show')}
            hint="Upload it in Business & Tax Details" />
          <label className="itb-field">
            <span className="itb-label">Size <b>{L.logo.size} mm</b></span>
            <input type="range" min="14" max="40" step="1" value={L.logo.size}
              onChange={(e) => set('logo', 'size')(Number(e.target.value))} disabled={!L.logo.show} />
          </label>
          <Segmented label="Position" value={L.logo.position} onChange={set('logo', 'position')}
            options={[['left', 'Left'], ['center', 'Centred'], ['right', 'Right']]} />
        </Panel>

        <Panel title="Header">
          <TextField label="Document title" value={L.header.title} maxLength={40} onChange={set('header', 'title')} placeholder="Tax Invoice" />
          <TextField label="Subtitle (leave empty to hide)" value={L.header.subtitle} maxLength={60} onChange={set('header', 'subtitle')} />
          <Toggle label="Company address" checked={L.header.showAddress} onChange={set('header', 'showAddress')} />
          <Toggle label="Phone & email" checked={L.header.showContact} onChange={set('header', 'showContact')} />
          <Toggle label="State" checked={L.header.showState} onChange={set('header', 'showState')} />
          <Segmented label="GSTIN / PAN" value={L.header.taxIds} onChange={set('header', 'taxIds')}
            options={[['letterhead', 'Letterhead'], ['footer', 'Footer'], ['hidden', 'Hide']]} />
        </Panel>

        <Panel title="Customer & details">
          <TextField label="Customer heading" value={L.labels.billTo} maxLength={30} onChange={set('labels', 'billTo')} placeholder="Bill To" />
          <Toggle label="Customer GSTIN" checked={L.details.customerGstin} onChange={set('details', 'customerGstin')} />
          <Toggle label="Place of supply" checked={L.details.placeOfSupply} onChange={set('details', 'placeOfSupply')} />
          <Toggle label="Seller GSTIN in details" checked={L.details.sellerGstin} onChange={set('details', 'sellerGstin')} />
        </Panel>

        <Panel title="Item columns">
          <Toggle label="HSN / SAC" checked={L.columns.hsn} onChange={set('columns', 'hsn')} />
          <Toggle label="Taxable value" checked={L.columns.taxableValue} onChange={set('columns', 'taxableValue')} />
          <Toggle label="GST %" checked={L.columns.gstRate} onChange={set('columns', 'gstRate')} />
          <Toggle label="GST amount" checked={L.columns.gstAmount} onChange={set('columns', 'gstAmount')}
            hint="Tax columns only print when the invoice has GST" />
        </Panel>

        <Panel title="Totals & payment">
          <Toggle label="Amount in words" checked={L.sections.amountInWords} onChange={set('sections', 'amountInWords')} />
          <Toggle label="Bank details" checked={L.sections.bankDetails} onChange={set('sections', 'bankDetails')} />
          {L.sections.bankDetails && (
            <TextField label="Bank details heading" value={L.labels.bankDetails} maxLength={30} onChange={set('labels', 'bankDetails')} />
          )}
          <Toggle label="Payment options" checked={L.sections.paymentOptions} onChange={set('sections', 'paymentOptions')}
            hint="From Settings › Payment Methods" />
        </Panel>

        <Panel title="Terms, notes & footer">
          <Toggle label="Terms & conditions" checked={L.sections.terms} onChange={set('sections', 'terms')} />
          {L.sections.terms && (
            <>
              <TextField label="Terms heading" value={L.labels.termsHeading} maxLength={40} onChange={set('labels', 'termsHeading')} />
              <TextField label="Terms text" value={template.termsAndConditions} maxLength={5000} multiline onChange={setText('termsAndConditions')} />
            </>
          )}
          <Toggle label="Invoice notes" checked={L.sections.notes} onChange={set('sections', 'notes')} hint="Notes typed on each invoice" />
          <Toggle label="Footer message" checked={L.sections.footerMessage} onChange={set('sections', 'footerMessage')} />
          {L.sections.footerMessage && (
            <TextField label="Message" value={template.footerText} maxLength={200} onChange={setText('footerText')} placeholder="Thank you for your business!" />
          )}
          <Toggle label="“Computer-generated invoice” note" checked={L.sections.computerGenerated} onChange={set('sections', 'computerGenerated')} />
        </Panel>

        <Panel title="Signature">
          <Toggle label="Signature block" checked={L.signature.show} onChange={set('signature', 'show')}
            hint="Seal image comes from Business & Tax Details" />
          {L.signature.show && (
            <>
              <Toggle label={`“For ${company?.companyName || 'company'}”`} checked={L.signature.forCompany} onChange={set('signature', 'forCompany')} />
              <TextField label="Signatory label" value={L.labels.signatory} maxLength={40} onChange={set('labels', 'signatory')} placeholder="Authorized Signatory" />
            </>
          )}
        </Panel>
      </div>

      <div className="itb-preview-col">
        <p className="itb-preview-note">Live preview with sample data · A4</p>
        <ScaledPreview>
          <InvoicePrintView invoice={SAMPLE_INVOICE} company={company} paymentMethods={methods} template={{ ...template, layout: L }} />
        </ScaledPreview>
      </div>
    </div>
  );
}

export default InvoiceTemplateBuilder;
