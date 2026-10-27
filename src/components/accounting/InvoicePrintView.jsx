// Invoice Print View — a professional A4 GST tax invoice. Company details come
// from Settings > Business & Tax Details; everything about the layout (preset,
// design, colours, font, logo, sections, columns, labels, custom fields)
// comes from the invoice template, resolved by invoiceTemplates.js. Sized in
// mm so screen preview, print and "Save as PDF" match.
import { API_ORIGIN } from '../../utils/api';
import { FONT_STACKS, TEXT_SIZES, resolveInvoiceLayout, textOn } from './invoiceTemplates';
import {
  amountInWords, fmt, fmtDate, fmtQty, fmtRate, gstLabel, gstLines, num, oneLine,
  panFromGstin, stateCodeFor,
} from './invoiceFormat';
import InvoiceBoxedView from './InvoiceBoxedView';
import '../../styles/InvoicePrint.css';

const defaultCompany = {
  companyName: '', address: '', phone: '', mobile: '', email: '', website: '',
  state: '', stateCode: '', gstNumber: '', pan: '', cin: '', bankDetails: '',
  sealSignatureImage: '', companyLogo: '',
};

// Everything both layouts print, worked out once
function buildModel({ invoice, company, paymentMethods, template }) {
  const co = { ...defaultCompany, ...(company || {}) };
  const tplSettings = template && typeof template === 'object' ? template : { invoiceTheme: template };
  const L = resolveInvoiceLayout(tplSettings.invoiceTheme, tplSettings.layout);
  const methodsRaw = Array.isArray(paymentMethods) ? paymentMethods : (Array.isArray(paymentMethods?.methods) ? paymentMethods.methods : []);

  const items = invoice.items || [];
  const hasDiscount = items.some((i) => num(i.discount) > 0);
  const hasTax = items.some((i) => num(i.taxRate) > 0 || num(i.taxAmount) > 0);
  const cols = {
    hsn: L.columns.hsn,
    uom: L.columns.uom,
    discount: hasDiscount,
    taxable: hasTax && L.columns.taxableValue,
    rate: hasTax && L.columns.gstRate,
    gst: hasTax && L.columns.gstAmount,
  };

  const extra = invoice.extraFields && typeof invoice.extraFields === 'object' ? invoice.extraFields : {};
  const fieldsAt = (position) => (L.fields || [])
    .filter((f) => f.position === position)
    .map((f) => ({ id: f.id, label: f.label, value: extra[f.id] || '' }));

  const discount = num(invoice.discount);
  const amountPaid = num(invoice.amountPaid);
  const amountCredited = num(invoice.amountCredited);
  const customerGstin = invoice.customerGst || '';
  const termsText = (tplSettings.termsAndConditions || '').trim();
  const footerText = (tplSettings.footerText || '').trim();
  const accent = L.style.accentColor;

  return {
    co,
    L,
    invoice,
    items,
    cols,
    hasTax,
    curr: invoice?.currency || 'INR',
    methods: methodsRaw.filter((m) => m.enabled !== false),
    discount,
    amountPaid,
    amountCredited,
    settled: amountPaid + amountCredited > 0,
    balanceDue: Math.max(0, num(invoice.total) - amountPaid - amountCredited),
    taxableTotal: num(invoice.subtotal) - discount,
    taxes: gstLines(items, invoice.tax, co.state, invoice.customerState),
    words: amountInWords(invoice.total),
    customer: {
      name: invoice.customer || '—',
      address: invoice.customerAddress || '',
      phone: invoice.customerPhone || '',
      email: invoice.customerEmail || '',
      gstin: customerGstin,
      pan: invoice.customerPan || panFromGstin(customerGstin),
      state: invoice.customerState || '',
      stateCode: stateCodeFor(invoice.customerState, customerGstin),
      contact: invoice.customerContact || '',
    },
    shipTo: (invoice.shipTo || '').trim(),
    detailFields: fieldsAt('details'),
    footerFields: fieldsAt('footer'),
    taxIds: [
      co.cin && ['CIN', co.cin],
      co.gstNumber && ['GSTIN', co.gstNumber],
      co.pan && ['PAN', co.pan],
    ].filter(Boolean),
    companyStateCode: co.stateCode || stateCodeFor(co.state, co.gstNumber),
    termsText: L.sections.terms ? termsText : '',
    footerText: L.sections.footerMessage ? footerText : '',
    notes: L.sections.notes ? (invoice.notes || '').trim() : '',
    logoSrc: L.logo.show && co.companyLogo ? `${API_ORIGIN}/storage/${co.companyLogo}` : '',
    sealSrc: co.sealSignatureImage && invoice?.useSignature !== false ? `${API_ORIGIN}/storage/${co.sealSignatureImage}` : '',
    docStyle: {
      '--accent': accent,
      '--accent-text': textOn(accent),
      '--accent-soft': `${accent}1A`,
      '--inv-fs': TEXT_SIZES[L.style.textSize] || TEXT_SIZES.normal,
      '--inv-font': FONT_STACKS[L.style.font] || FONT_STACKS.modern,
      '--logo-h': `${L.logo.size}mm`,
    },
  };
}

/**
 * @param template  { invoiceTheme, layout, termsAndConditions, footerText }
 *                  (a bare preset id string is accepted too)
 */
function InvoicePrintView(props) {
  const M = buildModel(props);
  if (M.L.style.design === 'boxed') return <InvoiceBoxedView M={M} />;

  const { co, L, invoice, items, cols, customer: cu } = M;
  const colCount = 5 + Object.values(cols).filter(Boolean).length;
  const contact = [co.phone && `Ph: ${co.phone}`, co.mobile && `Mob: ${co.mobile}`, co.email, co.website].filter(Boolean);
  const stateLine = co.state ? `${co.state}${M.companyStateCode ? ` (Code ${M.companyStateCode})` : ''}` : '';
  const footerFields = M.footerFields.filter((f) => f.value);
  const declaration = L.sections.declaration && (L.texts.declaration || '').trim();
  const showNotesBlock = M.notes || M.termsText || footerFields.length > 0 || declaration;

  return (
    <div
      className={`inv-print inv-doc inv-table-${L.style.tableStyle} inv-logo-${L.logo.position}`}
      style={M.docStyle}
    >
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <header className="inv-head">
        <div className="inv-brand">
          {M.logoSrc && <img className="inv-logo" src={M.logoSrc} alt={co.companyName} />}
          <div className="inv-co">
            {co.companyName && <h1>{co.companyName}</h1>}
            {L.header.tagline && <p className="inv-tagline">{L.header.tagline}</p>}
            {L.header.showAddress && co.address && <p className="inv-co-address">{oneLine(co.address)}</p>}
            {L.header.showContact && contact.length > 0 && <p>{contact.join('  ·  ')}</p>}
            {L.header.showState && stateLine && <p>State: {stateLine}</p>}
            {L.header.taxIds === 'letterhead' && M.taxIds.length > 0 && (
              <p className="inv-taxids">
                {M.taxIds.map(([k, v]) => <span key={k}><b>{k}:</b> {v}</span>)}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="inv-titlebar">
        <h2>{L.header.title || 'Tax Invoice'}</h2>
        {L.header.subtitle && <p>{L.header.subtitle}</p>}
      </div>

      {/* ── Parties & invoice details ──────────────────────────── */}
      <section className="inv-parties">
        <div className={`inv-party-pair ${L.details.shipTo ? 'has-shipto' : ''}`}>
          <div className="inv-billto">
            <p className="inv-label">{L.labels.billTo || 'Bill To'}</p>
            <p className="inv-billto-name">{cu.name}</p>
            {cu.address && <p>{oneLine(cu.address)}</p>}
            {cu.phone && <p>Phone: {cu.phone}</p>}
            {cu.email && <p>Email: {cu.email}</p>}
            {L.details.customerGstin && <p>GSTIN: {cu.gstin || 'Unregistered'}</p>}
            {L.details.customerPan && cu.pan && <p>PAN: {cu.pan}</p>}
            {cu.state && <p>State: {cu.state}{cu.stateCode ? ` (Code ${cu.stateCode})` : ''}</p>}
            {L.details.contactPerson && cu.contact && <p>Contact: {cu.contact}</p>}
          </div>
          {L.details.shipTo && (
            <div className="inv-billto">
              <p className="inv-label">{L.labels.shipTo || 'Ship To'}</p>
              {M.shipTo ? (
                <>
                  <p className="inv-billto-name">{M.shipTo.split('\n')[0]}</p>
                  <p className="inv-pre">{M.shipTo.split('\n').slice(1).join('\n')}</p>
                </>
              ) : (
                <>
                  <p className="inv-billto-name">{cu.name}</p>
                  {cu.address && <p>{oneLine(cu.address)}</p>}
                  {cu.state && <p>State: {cu.state}</p>}
                </>
              )}
            </div>
          )}
        </div>
        <table className="inv-details">
          <tbody>
            <tr><th>Invoice No.</th><td>{invoice.invoiceNumber}</td></tr>
            <tr><th>Invoice Date</th><td>{fmtDate(invoice.date)}</td></tr>
            {L.details.dueDate && <tr><th>Due Date</th><td>{fmtDate(invoice.dueDate)}</td></tr>}
            {M.detailFields.filter((f) => f.value).map((f) => <tr key={f.id}><th>{f.label}</th><td>{f.value}</td></tr>)}
            {L.details.placeOfSupply && cu.state && <tr><th>Place of Supply</th><td>{cu.state}</td></tr>}
            {M.curr !== 'INR' && <tr><th>Currency</th><td>{M.curr}</td></tr>}
            {L.details.sellerGstin && co.gstNumber && <tr><th>Seller GSTIN</th><td>{co.gstNumber}</td></tr>}
          </tbody>
        </table>
      </section>

      {/* ── Line items ─────────────────────────────────────────── */}
      <table className="inv-items">
        <thead>
          <tr>
            <th className="c-idx">#</th>
            <th className="c-desc">{L.labels.description || 'Description'}</th>
            {cols.hsn && <th>HSN/SAC</th>}
            <th className="c-num">Qty</th>
            {cols.uom && <th>Unit</th>}
            <th className="c-num">Rate</th>
            {cols.discount && <th className="c-num">Discount</th>}
            {cols.taxable && <th className="c-num">Taxable Value</th>}
            {cols.rate && <th className="c-num">GST %</th>}
            {cols.gst && <th className="c-num">GST</th>}
            <th className="c-num">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const rate = num(item.unitPrice || item.price);
            const taxable = num(item.quantity) * rate - num(item.discount);
            return (
              <tr key={item.id || idx}>
                <td className="c-idx">{idx + 1}</td>
                <td className="c-desc">{item.description || '—'}</td>
                {cols.hsn && <td>{item.hsnCode || item.hsn_code || '—'}</td>}
                <td className="c-num">{fmtQty(item.quantity)}</td>
                {cols.uom && <td>{item.unit || '—'}</td>}
                <td className="c-num">{fmt(rate)}</td>
                {cols.discount && <td className="c-num">{num(item.discount) > 0 ? fmt(item.discount) : '—'}</td>}
                {cols.taxable && <td className="c-num">{fmt(taxable)}</td>}
                {cols.rate && <td className="c-num">{fmtRate(item.taxRate)}</td>}
                {cols.gst && <td className="c-num">{fmt(item.taxAmount)}</td>}
                <td className="c-num c-strong">{fmt(item.total)}</td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={colCount} className="inv-empty">No items</td></tr>
          )}
        </tbody>
      </table>

      {/* ── Words, bank details & totals ───────────────────────── */}
      <section className="inv-summary">
        <div className="inv-summary-left">
          {L.sections.amountInWords && (
            <div className="inv-block">
              <p className="inv-label">Amount in Words</p>
              <p className="inv-words">{M.words}</p>
            </div>
          )}
          {L.sections.bankDetails && co.bankDetails && (
            <div className="inv-block">
              <p className="inv-label">{L.labels.bankDetails || 'Bank Details'}</p>
              <p className="inv-pre">{co.bankDetails}</p>
            </div>
          )}
          {L.sections.paymentOptions && M.methods.length > 0 && (
            <div className="inv-block">
              <p className="inv-label">Payment Options</p>
              <table className="inv-kv">
                <tbody>
                  {M.methods.map((m) => {
                    const detail = m.type === 'bank'
                      ? [m.bankName, m.accountNumber && `A/C ${m.accountNumber}`, m.ifscCode && `IFSC ${m.ifscCode}`].filter(Boolean).join(', ')
                      : m.type === 'upi' ? (m.upiId || '') : m.type === 'cash' ? 'Cash payment accepted' : '';
                    return <tr key={m.id}><th>{m.name}</th><td>{detail || '—'}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <table className="inv-totals">
          <tbody>
            <tr><th>{M.hasTax ? 'Taxable Amount' : 'Sub Total'}</th><td>{fmt(M.taxableTotal)}</td></tr>
            {M.discount > 0 && <tr><th>Discount</th><td>− {fmt(M.discount)}</td></tr>}
            {M.taxes.map((t) => <tr key={gstLabel(t)}><th>{gstLabel(t)}</th><td>{fmt(t.amount)}</td></tr>)}
            <tr className="inv-grand"><th>Total</th><td>₹ {fmt(invoice.total)}</td></tr>
            {M.amountPaid > 0 && <tr><th>Amount Paid</th><td>{fmt(M.amountPaid)}</td></tr>}
            {M.amountCredited > 0 && <tr><th>Credit Notes</th><td>− {fmt(M.amountCredited)}</td></tr>}
            {M.settled && (
              <tr className="inv-due"><th>Balance Due</th><td>₹ {fmt(M.balanceDue)}</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ── Notes, terms & custom fields ───────────────────────── */}
      {showNotesBlock && (
        <section className="inv-notes">
          {footerFields.length > 0 && (
            <p className="inv-fields">
              {footerFields.map((f) => <span key={f.id}><b>{f.label}:</b> {f.value}</span>)}
            </p>
          )}
          {M.notes && <p><b>{L.labels.notes || 'Notes'}:</b> {M.notes}</p>}
          {M.termsText && (
            <p>
              {L.labels.termsHeading && <b>{L.labels.termsHeading}: </b>}
              <span className="inv-pre-inline">{M.termsText}</span>
            </p>
          )}
          {declaration && <p className="inv-declaration">{declaration}</p>}
        </section>
      )}

      {/* ── Footer: tax IDs, message, signatory ────────────────── */}
      <footer className="inv-foot">
        <div className="inv-foot-left">
          {L.header.taxIds === 'footer' && M.taxIds.length > 0 && (
            <table className="inv-kv">
              <tbody>
                {M.taxIds.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              </tbody>
            </table>
          )}
          {L.sections.receivedNote && L.texts.receivedNote && <p className="inv-received">{L.texts.receivedNote}</p>}
          {M.footerText && <p className="inv-thanks">{M.footerText}</p>}
          {L.sections.receivedNote && L.texts.closingNote && <p className="inv-computer">{L.texts.closingNote}</p>}
          {L.sections.computerGenerated && <p className="inv-computer">This is a computer-generated invoice.</p>}
        </div>
        {L.signature.show && (
          <div className="inv-sign">
            {L.signature.forCompany && <p>For {co.companyName || 'the Company'}</p>}
            <div className="inv-sign-space">
              {M.sealSrc && <img src={M.sealSrc} alt="Seal & Signature" />}
            </div>
            <p className="inv-sign-line">{L.labels.signatory || 'Authorized Signatory'}</p>
          </div>
        )}
      </footer>
    </div>
  );
}

export default InvoicePrintView;
