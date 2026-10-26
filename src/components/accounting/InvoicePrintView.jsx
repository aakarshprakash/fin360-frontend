// Invoice Print View — matches the classic Indian distributor invoice format
// used across Quotation/Proforma Invoice/Invoice (S.No/Description/HSN-SAC/Qty/Rate/
// Amount table, structured Terms & Conditions, CIN/GSTIN/PAN + signature footer).
// Nothing here is hardcoded — company details come from Accounting Settings > Company.
import { API_ORIGIN } from '../../utils/api';

const defaultCompany = {
  companyName: '', address: '', phone: '', mobile: '', email: '', website: '',
  state: '', stateCode: '', gstNumber: '', pan: '', cin: '', bankDetails: '',
  sealSignatureImage: '', companyLogo: '',
};
const defaultPaymentMethods = [];

function numberToWords(num) {
  if (!num || num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(Math.round(Math.abs(num))) + ' Rupees Only';
}

function InvoicePrintView({ invoice, company, paymentMethods }) {
  const co = { ...defaultCompany, ...(company || {}) };
  const methodsRaw = Array.isArray(paymentMethods) ? paymentMethods : (Array.isArray(paymentMethods?.methods) ? paymentMethods.methods : defaultPaymentMethods);
  const methods = methodsRaw.filter(m => m.enabled !== false);

  const curr = invoice?.currency || 'INR';
  const fmt = (amount) => (Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const balanceDue = (Number(invoice.total) || 0) - (Number(invoice.amountPaid) || 0);
  const hasDiscount = (invoice.items || []).some(i => Number(i.discount) > 0);
  const items = invoice.items || [];
  const netDiscount = Number(invoice.discount) || 0;
  const subTotal = (Number(invoice.subtotal) || 0) - netDiscount;
  const amountPaid = Number(invoice.amountPaid) || 0;

  const contactLine = [co.phone && `Phone No: ${co.phone}`, co.mobile && `Mobile No: ${co.mobile}`].filter(Boolean).join('   ');
  const webLine = [co.email && `email: ${co.email}`, co.website && `Web: ${co.website}`].filter(Boolean).join('   ');

  return (
    <div className="inv-print qtn-print">
      {/* Header */}
      <header className="qtn-header">
        {co.companyLogo && <img src={`${API_ORIGIN}/storage/${co.companyLogo}`} alt={co.companyName} className="qtn-logo" />}
        <div className="qtn-header-text">
          {co.companyName && <h1 className="qtn-company-name">{co.companyName}</h1>}
          {co.address && <p className="qtn-co-line">{co.address}</p>}
          {contactLine && <p className="qtn-co-line">{contactLine}</p>}
          {webLine && <p className="qtn-co-line">{webLine}</p>}
        </div>
      </header>
      {(co.state || co.stateCode) && (
        <p className="qtn-state-line">State: {co.state || '—'}{co.stateCode ? `, ${co.stateCode}` : ''}</p>
      )}

      <div className="qtn-title-bar">Tax Invoice</div>

      {/* Bill To + Invoice meta */}
      <div className="qtn-meta-grid">
        <div className="qtn-meta-to">
          <p className="qtn-meta-label">Bill To</p>
          <p className="qtn-customer-name">{invoice.customer || '—'}</p>
          {invoice.customerAddress && <p className="qtn-meta-line">{invoice.customerAddress}</p>}
          {invoice.customerPhone && <p className="qtn-meta-line">Phone No: {invoice.customerPhone}</p>}
          {invoice.customerEmail && <p className="qtn-meta-line">Email: {invoice.customerEmail}</p>}
          <p className="qtn-meta-line">GSTIN: {invoice.customerGst || '—'}</p>
          {invoice.customerState && <p className="qtn-meta-line">State: {invoice.customerState}</p>}
        </div>
        <table className="qtn-meta-table">
          <tbody>
            <tr><td className="qtn-mt-label">Invoice No</td><td className="qtn-mt-colon">:</td><td className="qtn-mt-value">{invoice.invoiceNumber}</td></tr>
            <tr><td className="qtn-mt-label">Invoice Date</td><td className="qtn-mt-colon">:</td><td className="qtn-mt-value">{fmtDate(invoice.date)}</td></tr>
            <tr><td className="qtn-mt-label">Due Date</td><td className="qtn-mt-colon">:</td><td className="qtn-mt-value">{fmtDate(invoice.dueDate)}</td></tr>
            {curr !== 'INR' && <tr><td className="qtn-mt-label">Currency</td><td className="qtn-mt-colon">:</td><td className="qtn-mt-value">{curr}</td></tr>}
            {co.gstNumber && <tr><td className="qtn-mt-label">Seller GSTIN</td><td className="qtn-mt-colon">:</td><td className="qtn-mt-value">{co.gstNumber}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Items Table */}
      <table className="qtn-items">
        <thead>
          <tr>
            <th style={{width:'32px'}}>S.No</th>
            <th style={{textAlign:'left'}}>Description</th>
            <th style={{width:'78px'}}>HSN/SAC</th>
            <th style={{width:'64px'}}>Quantity</th>
            <th style={{width:'96px'}}>Rate</th>
            {hasDiscount && <th style={{width:'86px'}}>Discount</th>}
            <th style={{width:'104px'}}>Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="qtn-td-center">{idx + 1}</td>
              <td className="qtn-td-left">{item.description || '—'}</td>
              <td className="qtn-td-mono">{item.hsnCode || item.hsn_code || '—'}</td>
              <td>{(Number(item.quantity) || 0).toFixed(2)}</td>
              <td>{fmt(item.unitPrice || item.price)}</td>
              {hasDiscount && <td>{Number(item.discount) > 0 ? fmt(item.discount) : '—'}</td>}
              <td className="qtn-td-bold">{fmt(item.total)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={hasDiscount ? 7 : 6} className="qtn-td-empty">No items</td></tr>
          )}
        </tbody>
      </table>

      {/* Amount in words + Totals */}
      <div className="qtn-totals-row">
        <div className="qtn-words">
          <p className="qtn-meta-label">Amount in Words</p>
          <p className="qtn-words-text">{numberToWords(invoice.total)}</p>
        </div>
        <table className="qtn-totals-table">
          <tbody>
            <tr><td>Total</td><td>{fmt(invoice.subtotal)}</td></tr>
            {netDiscount > 0 && <tr><td>Discount</td><td>{fmt(netDiscount)}</td></tr>}
            {netDiscount > 0 && <tr><td>Sub Total</td><td>{fmt(subTotal)}</td></tr>}
            {Number(invoice.tax) > 0 && <tr><td>Tax (GST)</td><td>{fmt(invoice.tax)}</td></tr>}
            <tr className="qtn-net-row"><td>Net Amount</td><td>{fmt(invoice.total)}</td></tr>
            {amountPaid > 0 && <tr><td>Paid</td><td>{fmt(amountPaid)}</td></tr>}
            {amountPaid > 0 && <tr className="qtn-balance-row"><td>Balance Due</td><td>{fmt(balanceDue)}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Payment Information */}
      {methods.length > 0 && (
        <div className="qtn-terms-block">
          <p className="qtn-terms-title">Payment Information :</p>
          <table className="qtn-terms-table">
            <tbody>
              {methods.map(m => {
                const detail = m.type === 'bank'
                  ? [m.bankName, m.accountHolderName, m.accountNumber && `A/C: ${m.accountNumber}`, m.ifscCode && `IFSC: ${m.ifscCode}`].filter(Boolean).join(', ')
                  : m.type === 'upi' ? (m.upiId || '') : m.type === 'cash' ? 'Cash payment accepted' : '';
                return (
                  <tr key={m.id}>
                    <td className="qtn-tt-label">{m.name}</td>
                    <td className="qtn-tt-colon">:</td>
                    <td className="qtn-tt-value">{detail || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Terms & Conditions */}
      {(co.bankDetails || invoice.notes || invoice.termsAndConditions) && (
        <div className="qtn-terms-block">
          <p className="qtn-terms-title">Terms &amp; Conditions :</p>
          {co.bankDetails && (
            <table className="qtn-terms-table">
              <tbody>
                <tr>
                  <td className="qtn-tt-label">Our Bank Details</td>
                  <td className="qtn-tt-colon">:</td>
                  <td className="qtn-tt-value" style={{whiteSpace:'pre-line'}}>{co.bankDetails}</td>
                </tr>
              </tbody>
            </table>
          )}
          {invoice.notes && <p className="qtn-extra-note"><strong>Notes:</strong> {invoice.notes}</p>}
          <p className="qtn-extra-note">{invoice.termsAndConditions || 'Payment is due within 30 days of the invoice date. Late payments may be subject to interest charges.'}</p>
        </div>
      )}

      {/* Footer band — CIN/GSTIN/PAN + Signature */}
      <div className="qtn-footer-band">
        <table className="qtn-footer-left-table">
          <tbody>
            {co.cin && <tr><td className="qtn-tt-label">CIN</td><td className="qtn-tt-colon">:</td><td className="qtn-tt-value">{co.cin}</td></tr>}
            {co.gstNumber && <tr><td className="qtn-tt-label">GSTIN</td><td className="qtn-tt-colon">:</td><td className="qtn-tt-value">{co.gstNumber}</td></tr>}
            {co.pan && <tr><td className="qtn-tt-label">PAN No</td><td className="qtn-tt-colon">:</td><td className="qtn-tt-value">{co.pan}</td></tr>}
          </tbody>
        </table>
        <div className="qtn-footer-right">
          <p className="qtn-for-company">For {co.companyName || 'the Company'}</p>
          {co.sealSignatureImage && invoice?.useSignature !== false && (
            <img className="qtn-signature-img" src={`${API_ORIGIN}/storage/${co.sealSignatureImage}`} alt="Seal & Signature" />
          )}
          <p className="qtn-sign-line">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}

export default InvoicePrintView;
