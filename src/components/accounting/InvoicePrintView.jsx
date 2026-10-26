// Invoice Print View — a professional A4 GST tax invoice. Company details come
// from Settings > Business & Tax Details; layout variations (Standard /
// Letterhead) come from invoiceTemplates.js. Sized in mm so screen preview,
// print and "Save as PDF" match.
import { API_ORIGIN } from '../../utils/api';
import { resolveInvoiceTemplate } from './invoiceTemplates';
import '../../styles/InvoicePrint.css';

const defaultCompany = {
  companyName: '', address: '', phone: '', mobile: '', email: '', website: '',
  state: '', stateCode: '', gstNumber: '', pan: '', cin: '', bankDetails: '',
  sealSignatureImage: '', companyLogo: '',
};

// Indian numbering (lakh / crore), with paise
function amountInWords(value) {
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

const num = (v) => Number(v) || 0;
const fmt = (v) => num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtRate = (r) => `${num(r).toFixed(2).replace(/\.?0+$/, '')}%`;
const fmtDate = (d) => (d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');
const sameState = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
// Addresses are stored multi-line, sometimes with a trailing comma per line
const oneLine = (s) => String(s).replace(/\s*,?\s*\n\s*/g, ', ');

// GST summary grouped by rate. Intra-state supplies split into CGST + SGST and
// inter-state supplies show IGST; when the customer's state is unknown the
// tax is shown as plain GST rather than guessing.
function gstLines(items, invoiceTax, sellerState, buyerState) {
  const byRate = new Map();
  items.forEach((i) => {
    const rate = num(i.taxRate);
    const amt = num(i.taxAmount);
    if (rate > 0 || amt > 0) byRate.set(rate, (byRate.get(rate) || 0) + amt);
  });
  const itemTax = [...byRate.values()].reduce((s, v) => s + v, 0);
  if (!byRate.size || Math.abs(itemTax - num(invoiceTax)) > 0.05) {
    return num(invoiceTax) > 0 ? [{ label: 'GST', amount: num(invoiceTax) }] : [];
  }
  const intra = sameState(sellerState, buyerState);
  const inter = sellerState && buyerState && !intra;
  return [...byRate.entries()].flatMap(([rate, amount]) => {
    if (intra) {
      return [
        { label: `CGST @ ${fmtRate(rate / 2)}`, amount: amount / 2 },
        { label: `SGST @ ${fmtRate(rate / 2)}`, amount: amount / 2 },
      ];
    }
    return [{ label: `${inter ? 'IGST' : 'GST'} @ ${fmtRate(rate)}`, amount }];
  });
}

function InvoicePrintView({ invoice, company, paymentMethods, template }) {
  const co = { ...defaultCompany, ...(company || {}) };
  const tpl = resolveInvoiceTemplate(template);
  const methodsRaw = Array.isArray(paymentMethods) ? paymentMethods : (Array.isArray(paymentMethods?.methods) ? paymentMethods.methods : []);
  const methods = methodsRaw.filter((m) => m.enabled !== false);

  const items = invoice.items || [];
  const curr = invoice?.currency || 'INR';
  const hasDiscount = items.some((i) => num(i.discount) > 0);
  const hasTax = items.some((i) => num(i.taxRate) > 0 || num(i.taxAmount) > 0);
  const discount = num(invoice.discount);
  const amountPaid = num(invoice.amountPaid);
  const balanceDue = num(invoice.total) - amountPaid;
  const taxes = gstLines(items, invoice.tax, co.state, invoice.customerState);

  const contact = [co.phone && `Ph: ${co.phone}`, co.mobile && `Mob: ${co.mobile}`, co.email, co.website].filter(Boolean);
  const taxIds = [
    co.gstNumber && ['GSTIN', co.gstNumber],
    co.pan && ['PAN', co.pan],
    co.cin && ['CIN', co.cin],
  ].filter(Boolean);
  const stateLine = co.state ? `${co.state}${co.stateCode ? ` (Code ${co.stateCode})` : ''}` : '';
  const colCount = 6 + (hasDiscount ? 1 : 0) + (hasTax ? 3 : 0);

  return (
    <div className="inv-print inv-doc">
      {/* ── Letterhead ─────────────────────────────────────────── */}
      <header className="inv-head">
        <div className="inv-brand">
          {co.companyLogo && (
            <img className="inv-logo" src={`${API_ORIGIN}/storage/${co.companyLogo}`} alt={co.companyName} />
          )}
          <div className="inv-co">
            {co.companyName && <h1>{co.companyName}</h1>}
            {co.address && <p className="inv-co-address">{oneLine(co.address)}</p>}
            {contact.length > 0 && <p>{contact.join('  ·  ')}</p>}
            {stateLine && <p>State: {stateLine}</p>}
            {tpl.taxIdsInLetterhead && taxIds.length > 0 && (
              <p className="inv-taxids">
                {taxIds.map(([k, v]) => <span key={k}><b>{k}:</b> {v}</span>)}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="inv-titlebar">
        <h2>Tax Invoice</h2>
        <p>Original for Recipient</p>
      </div>

      {/* ── Parties & invoice details ──────────────────────────── */}
      <section className="inv-parties">
        <div className="inv-billto">
          <p className="inv-label">Bill To</p>
          <p className="inv-billto-name">{invoice.customer || '—'}</p>
          {invoice.customerAddress && <p>{oneLine(invoice.customerAddress)}</p>}
          {invoice.customerPhone && <p>Phone: {invoice.customerPhone}</p>}
          {invoice.customerEmail && <p>Email: {invoice.customerEmail}</p>}
          <p>GSTIN: {invoice.customerGst || 'Unregistered'}</p>
          {invoice.customerState && <p>State: {invoice.customerState}</p>}
        </div>
        <table className="inv-details">
          <tbody>
            <tr><th>Invoice No.</th><td>{invoice.invoiceNumber}</td></tr>
            <tr><th>Invoice Date</th><td>{fmtDate(invoice.date)}</td></tr>
            <tr><th>Due Date</th><td>{fmtDate(invoice.dueDate)}</td></tr>
            {invoice.customerState && <tr><th>Place of Supply</th><td>{invoice.customerState}</td></tr>}
            {curr !== 'INR' && <tr><th>Currency</th><td>{curr}</td></tr>}
            {tpl.sellerGstinInDetails && co.gstNumber && <tr><th>Seller GSTIN</th><td>{co.gstNumber}</td></tr>}
          </tbody>
        </table>
      </section>

      {/* ── Line items ─────────────────────────────────────────── */}
      <table className="inv-items">
        <thead>
          <tr>
            <th className="c-idx">#</th>
            <th className="c-desc">Description</th>
            <th>HSN/SAC</th>
            <th className="c-num">Qty</th>
            <th className="c-num">Rate</th>
            {hasDiscount && <th className="c-num">Discount</th>}
            {hasTax && <th className="c-num">Taxable Value</th>}
            {hasTax && <th className="c-num">GST %</th>}
            {hasTax && <th className="c-num">GST</th>}
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
                <td>{item.hsnCode || item.hsn_code || '—'}</td>
                <td className="c-num">{num(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className="c-num">{fmt(rate)}</td>
                {hasDiscount && <td className="c-num">{num(item.discount) > 0 ? fmt(item.discount) : '—'}</td>}
                {hasTax && <td className="c-num">{fmt(taxable)}</td>}
                {hasTax && <td className="c-num">{fmtRate(item.taxRate)}</td>}
                {hasTax && <td className="c-num">{fmt(item.taxAmount)}</td>}
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
          <div className="inv-block">
            <p className="inv-label">Amount in Words</p>
            <p className="inv-words">{amountInWords(invoice.total)}</p>
          </div>
          {co.bankDetails && (
            <div className="inv-block">
              <p className="inv-label">Bank Details</p>
              <p className="inv-pre">{co.bankDetails}</p>
            </div>
          )}
          {tpl.showPaymentMethods && methods.length > 0 && (
            <div className="inv-block">
              <p className="inv-label">Payment Options</p>
              <table className="inv-kv">
                <tbody>
                  {methods.map((m) => {
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
            <tr><th>{hasTax ? 'Taxable Amount' : 'Sub Total'}</th><td>{fmt(num(invoice.subtotal) - discount)}</td></tr>
            {discount > 0 && <tr><th>Discount</th><td>− {fmt(discount)}</td></tr>}
            {taxes.map((t) => <tr key={t.label}><th>{t.label}</th><td>{fmt(t.amount)}</td></tr>)}
            <tr className="inv-grand"><th>Total</th><td>₹ {fmt(invoice.total)}</td></tr>
            {amountPaid > 0 && <tr><th>Amount Paid</th><td>{fmt(amountPaid)}</td></tr>}
            {amountPaid > 0 && (
              <tr className="inv-due"><th>Balance Due</th><td>₹ {fmt(balanceDue)}</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ── Notes & terms ──────────────────────────────────────── */}
      {(invoice.notes || invoice.termsAndConditions || tpl.showDefaultTerms) && (
        <section className="inv-notes">
          {invoice.notes && <p><b>Notes:</b> {invoice.notes}</p>}
          {(invoice.termsAndConditions || tpl.showDefaultTerms) && (
            <p>
              {tpl.bankSectionTitle && <b>{tpl.bankSectionTitle}: </b>}
              {invoice.termsAndConditions || 'Payment is due within 30 days of the invoice date. Late payments may be subject to interest charges.'}
            </p>
          )}
        </section>
      )}

      {/* ── Footer: tax IDs (Standard) + signatory ─────────────── */}
      <footer className="inv-foot">
        <div className="inv-foot-left">
          {tpl.taxIdsInFooter && taxIds.length > 0 && (
            <table className="inv-kv">
              <tbody>
                {taxIds.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              </tbody>
            </table>
          )}
          <p className="inv-computer">This is a computer-generated invoice.</p>
        </div>
        <div className="inv-sign">
          <p>For {co.companyName || 'the Company'}</p>
          <div className="inv-sign-space">
            {co.sealSignatureImage && invoice?.useSignature !== false && (
              <img src={`${API_ORIGIN}/storage/${co.sealSignatureImage}`} alt="Seal & Signature" />
            )}
          </div>
          <p className="inv-sign-line">Authorized Signatory</p>
        </div>
      </footer>
    </div>
  );
}

export default InvoicePrintView;
