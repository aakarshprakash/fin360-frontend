// Invoice template builder (Settings › Invoice Template). Edits the template
// settings object owned by AccountingSettings — { invoiceTheme, layout,
// termsAndConditions, footerText, … } — and shows a live A4 preview. Saving
// stays with the page's "Save Template" button.
import InvoicePrintView from './InvoicePrintView';
import { Panel, ScaledPreview, Segmented, TextField, Toggle } from './TemplateBuilderParts';
import {
  ACCENT_SWATCHES, INVOICE_TEMPLATES, MAX_CUSTOM_FIELDS, isCustomised, newFieldId, resolveInvoiceLayout,
} from './invoiceTemplates';
import '../../styles/InvoiceTemplateBuilder.css';

const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-00042',
  date: new Date().toISOString(),
  dueDate: new Date(Date.now() + 15 * 864e5).toISOString(),
  customer: 'Malabar Diagnostics Pvt Ltd',
  customerAddress: 'Fort Road\nKannur 670001',
  customerPhone: '98470 12345',
  customerGst: '32AABCM1234F1Z5',
  customerEmail: 'accounts@malabardiagnostics.in',
  customerState: 'Kerala',
  customerContact: 'Mr. Anil Kumar – 98470 12345',
  notes: 'Payment 100% against delivery.',
  items: [
    { description: 'Ankle Cuff for Doppler', hsnCode: '90189019', quantity: 2, unit: 'NOS', unitPrice: 1250, taxRate: 5, taxAmount: 125, total: 2625 },
    { description: 'Annual maintenance visit', hsnCode: '998719', quantity: 1, unit: 'SET', unitPrice: 4000, taxRate: 18, taxAmount: 720, total: 4720 },
  ],
  subtotal: 6500, tax: 845, total: 7345, amountPaid: 2000,
};

const SAMPLE_FIELD_VALUES = { orderref: 'email/140926 – 14-09-2026', lotcode: 'LT-2609', lrno: '' };

// Custom fields: name + where it prints; values are typed on each invoice
function FieldsEditor({ fields, onChange }) {
  const update = (idx, patch) => onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  return (
    <div className="itb-fields">
      {fields.map((f, idx) => (
        <div className="itb-fieldrow" key={f.id}>
          <input
            type="text"
            value={f.label}
            maxLength={40}
            placeholder="Field name"
            aria-label={`Custom field ${idx + 1} name`}
            onChange={(e) => update(idx, { label: e.target.value })}
          />
          <select
            value={f.position}
            aria-label={`Where ${f.label || 'this field'} prints`}
            onChange={(e) => update(idx, { position: e.target.value })}
          >
            <option value="details">Beside invoice no.</option>
            <option value="footer">Above signature</option>
          </select>
          <button
            type="button"
            className="itb-remove"
            aria-label={`Remove ${f.label || 'field'}`}
            onClick={() => onChange(fields.filter((_, i) => i !== idx))}
          >
            ✕
          </button>
        </div>
      ))}
      {fields.length < MAX_CUSTOM_FIELDS && (
        <button
          type="button"
          className="itb-link"
          onClick={() => onChange([...fields, { id: newFieldId(), label: '', position: 'details' }])}
        >
          + Add field
        </button>
      )}
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
  const setFields = (fields) => onChange({ ...template, layout: { ...L, fields } });
  const boxed = L.style.design === 'boxed';
  const sampleInvoice = {
    ...SAMPLE_INVOICE,
    extraFields: Object.fromEntries((L.fields || []).map((f) => [f.id, SAMPLE_FIELD_VALUES[f.id] ?? (f.label ? `Sample ${f.label.toLowerCase()}` : '')])),
  };

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
          <Segmented label="Design" value={L.style.design} onChange={set('style', 'design')}
            options={[['modern', 'Modern'], ['boxed', 'Boxed (ruled)']]} />
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
          {!boxed && (
            <Segmented label="Item table" value={L.style.tableStyle} onChange={set('style', 'tableStyle')}
              options={[['solid', 'Solid'], ['light', 'Light'], ['lines', 'Lines']]} />
          )}
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
          <TextField label="Lines under company name" value={L.header.tagline} maxLength={300} multiline onChange={set('header', 'tagline')}
            placeholder="e.g. (Under Rule 7 of GST Rules 2017)" />
          <Toggle label="Company address" checked={L.header.showAddress} onChange={set('header', 'showAddress')} />
          <Toggle label="Phone & email" checked={L.header.showContact} onChange={set('header', 'showContact')} />
          <Toggle label="State" checked={L.header.showState} onChange={set('header', 'showState')} />
          <Segmented label="GSTIN / PAN" value={L.header.taxIds} onChange={set('header', 'taxIds')}
            options={[['letterhead', 'Letterhead'], ['footer', 'Footer'], ['hidden', 'Hide']]} />
        </Panel>

        <Panel title="Customer & details">
          <TextField label="Customer heading" value={L.labels.billTo} maxLength={30} onChange={set('labels', 'billTo')} placeholder="Bill To" />
          <Toggle label="Ship To" checked={L.details.shipTo} onChange={set('details', 'shipTo')}
            hint="Typed on the invoice; same as Bill To when left empty" />
          {L.details.shipTo && (
            <TextField label="Ship To heading" value={L.labels.shipTo} maxLength={30} onChange={set('labels', 'shipTo')} placeholder="Ship To" />
          )}
          <Toggle label="Customer GSTIN" checked={L.details.customerGstin} onChange={set('details', 'customerGstin')} />
          <Toggle label="Customer PAN" checked={L.details.customerPan} onChange={set('details', 'customerPan')}
            hint="Taken from the GSTIN when not entered" />
          <Toggle label="Contact person" checked={L.details.contactPerson} onChange={set('details', 'contactPerson')} />
          <Toggle label="Due date" checked={L.details.dueDate} onChange={set('details', 'dueDate')} />
          <Toggle label="Place of supply" checked={L.details.placeOfSupply} onChange={set('details', 'placeOfSupply')} />
          <Toggle label="Seller GSTIN in details" checked={L.details.sellerGstin} onChange={set('details', 'sellerGstin')} />
        </Panel>

        <Panel title="Custom fields">
          <p className="itb-hint">Extra boxes such as Order No &amp; Date, Lot Code, LR No or Vehicle No. You fill them in on each invoice.</p>
          <FieldsEditor fields={L.fields || []} onChange={setFields} />
        </Panel>

        <Panel title="Item columns">
          <TextField label="Description heading" value={L.labels.description} maxLength={40} onChange={set('labels', 'description')} placeholder="Description" />
          <Toggle label="HSN / SAC" checked={L.columns.hsn} onChange={set('columns', 'hsn')} />
          <Toggle label="Unit (UOM)" checked={L.columns.uom} onChange={set('columns', 'uom')}
            hint="NOS, KG, BOX… from the product, or typed per line" />
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
          {L.sections.notes && (
            <TextField label="Notes heading" value={L.labels.notes} maxLength={30} onChange={set('labels', 'notes')} placeholder="Remarks" />
          )}
          <Toggle label="Declaration" checked={L.sections.declaration} onChange={set('sections', 'declaration')} />
          {L.sections.declaration && (
            <TextField label="Declaration text" value={L.texts.declaration} maxLength={600} multiline onChange={set('texts', 'declaration')} />
          )}
          <Toggle label="Receiver’s note" checked={L.sections.receivedNote} onChange={set('sections', 'receivedNote')}
            hint="Printed beside the signature" />
          {L.sections.receivedNote && (
            <>
              <TextField label="Note" value={L.texts.receivedNote} maxLength={150} onChange={set('texts', 'receivedNote')}
                placeholder="Received the above goods in good condition" />
              <TextField label="Second line" value={L.texts.closingNote} maxLength={150} onChange={set('texts', 'closingNote')}
                placeholder="Please return one copy with seal & signature" />
            </>
          )}
          <Toggle label="Footer message" checked={L.sections.footerMessage} onChange={set('sections', 'footerMessage')} />
          {L.sections.footerMessage && (
            <TextField label="Message" value={template.footerText} maxLength={200} onChange={setText('footerText')} placeholder="Thank you for your business!" />
          )}
          <Toggle label="“Computer-generated invoice” note" checked={L.sections.computerGenerated} onChange={set('sections', 'computerGenerated')} />
          {boxed && <Toggle label="Page number" checked={L.sections.pageNumber} onChange={set('sections', 'pageNumber')} />}
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
          <InvoicePrintView invoice={sampleInvoice} company={company} paymentMethods={methods} template={{ ...template, layout: L }} />
        </ScaledPreview>
      </div>
    </div>
  );
}

export default InvoiceTemplateBuilder;
