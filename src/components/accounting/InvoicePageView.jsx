// Invoice printed on the company's full-page letterhead. The letterhead carries
// the company name, logo and address, so this prints everything below it:
// title, parties, items, totals, terms and signatory. Receives the model built
// by InvoicePrintView.
import LetterheadDocument from './LetterheadDocument';
import { fmt, fmtDateNumeric, fmtQty, fmtRate, gstLabel, num, splitKeyValues } from './invoiceFormat';

function Party({ cu, L, withContact }) {
  return (
    <div className="lhp-party">
      <p className="lhp-party-name">{cu.name}</p>
      {cu.address && <p className="lhp-pre">{cu.address}</p>}
      {cu.phone && <p>Phone: {cu.phone}</p>}
      {cu.email && <p>Email: {cu.email}</p>}
      {cu.state && <p>State: {cu.state}{cu.stateCode ? ` (${cu.stateCode})` : ''}</p>}
      {L.details.customerGstin && <p>GSTIN: {cu.gstin || 'Unregistered'}</p>}
      {L.details.customerPan && cu.pan && <p>PAN: {cu.pan}</p>}
      {withContact && L.details.contactPerson && cu.contact && <p>Contact: {cu.contact}</p>}
    </div>
  );
}

function InvoicePageView({ M }) {
  const { co, L, invoice, items, cols, customer: cu } = M;
  const cur = M.curr === 'INR' ? '₹' : M.curr;
  const amountOf = (item) => (cols.gst ? num(item.total) : num(item.quantity) * num(item.unitPrice || item.price) - num(item.discount));

  const details = [
    ['Invoice No', <b key="n">{invoice.invoiceNumber}</b>],
    ['Date', fmtDateNumeric(invoice.date)],
    L.details.dueDate && ['Due Date', fmtDateNumeric(invoice.dueDate)],
    ...M.detailFields.filter((f) => f.value).map((f) => [f.label, f.value]),
    L.details.placeOfSupply && cu.state && ['Place of Supply', cu.state],
    M.curr !== 'INR' && ['Currency', M.curr],
    L.details.sellerGstin && L.header.taxIds !== 'letterhead' && co.gstNumber && ['Seller GSTIN', co.gstNumber],
  ].filter(Boolean);

  const groupCols = [
    '8mm', null,
    ...(cols.hsn ? ['18mm'] : []),
    '10mm',
    ...(cols.uom ? ['11mm'] : []),
    '21mm',
    ...(cols.discount ? ['17mm'] : []),
    ...(cols.taxable ? ['21mm'] : []),
    ...(cols.rate ? ['11mm'] : []),
    ...(cols.gst ? ['18mm'] : []),
    '24mm',
  ];

  const groups = {
    items: {
      cols: groupCols,
      head: (
        <tr>
          <th className="lhp-center">#</th>
          <th>{L.labels.description || 'Description'}</th>
          {cols.hsn && <th className="lhp-center">HSN/SAC</th>}
          <th className="lhp-num">Qty</th>
          {cols.uom && <th className="lhp-center">Unit</th>}
          <th className="lhp-num">Rate ({cur})</th>
          {cols.discount && <th className="lhp-num">Disc.</th>}
          {cols.taxable && <th className="lhp-num">Taxable</th>}
          {cols.rate && <th className="lhp-num">GST %</th>}
          {cols.gst && <th className="lhp-num">GST</th>}
          <th className="lhp-num">Amount ({cur})</th>
        </tr>
      ),
    },
  };

  const bank = L.sections.bankDetails && co.bankDetails ? splitKeyValues(co.bankDetails) : [];
  const footerFields = M.footerFields.filter((f) => f.value);
  const declaration = L.sections.declaration && (L.texts.declaration || '').trim();
  const received = L.sections.receivedNote && (L.texts.receivedNote || L.texts.closingNote);

  const blocks = [
    {
      key: 'title',
      keepWithNext: true,
      node: (
        <div className="lhp-title">
          <h2>{L.header.title || 'TAX INVOICE'}</h2>
          {L.header.subtitle && <p>{L.header.subtitle}</p>}
          {L.header.taxIds === 'letterhead' && M.taxIds.length > 0 && (
            <div className="lhp-taxids">{M.taxIds.map(([k, v]) => <span key={k}><b>{k}:</b> {v}</span>)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'parties',
      keepWithNext: true,
      node: (
        <div className={`lhp-parties ${L.details.shipTo ? '' : 'no-ship'}`}>
          <div>
            <p className="lhp-label">{L.labels.billTo || 'Bill To'}</p>
            <Party cu={cu} L={L} withContact />
          </div>
          {L.details.shipTo && (
            <div>
              <p className="lhp-label">{L.labels.shipTo || 'Ship To'}</p>
              {M.shipTo ? (
                <div className="lhp-party">
                  <p className="lhp-party-name">{M.shipTo.split('\n')[0]}</p>
                  <p className="lhp-pre">{M.shipTo.split('\n').slice(1).join('\n')}</p>
                </div>
              ) : <Party cu={cu} L={L} />}
            </div>
          )}
          <table className="lhp-kv">
            <tbody>{details.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody>
          </table>
        </div>
      ),
    },
    ...items.map((item, idx) => {
      const rate = num(item.unitPrice || item.price);
      return {
        key: `item-${item.id || idx}`,
        group: 'items',
        node: (
          <tr className={idx === 0 ? '' : 'lhp-row-first'}>
            <td className="lhp-center">{idx + 1}</td>
            <td>{item.description || '—'}</td>
            {cols.hsn && <td className="lhp-center">{item.hsnCode || item.hsn_code || ''}</td>}
            <td className="lhp-num">{fmtQty(item.quantity)}</td>
            {cols.uom && <td className="lhp-center">{item.unit || ''}</td>}
            <td className="lhp-num">{fmt(rate)}</td>
            {cols.discount && <td className="lhp-num">{num(item.discount) > 0 ? fmt(item.discount) : ''}</td>}
            {cols.taxable && <td className="lhp-num">{fmt(num(item.quantity) * rate - num(item.discount))}</td>}
            {cols.rate && <td className="lhp-num">{num(item.taxRate) ? fmtRate(item.taxRate) : ''}</td>}
            {cols.gst && <td className="lhp-num">{fmt(item.taxAmount)}</td>}
            <td className="lhp-num lhp-strong">{fmt(amountOf(item))}</td>
          </tr>
        ),
      };
    }),
    {
      key: 'summary',
      node: (
        <div className="lhp-summary">
          <div className="lhp-summary-left">
            {L.sections.amountInWords && (
              <div>
                <p className="lhp-label">Amount in Words</p>
                <p className="lhp-words">{M.words}</p>
              </div>
            )}
            {bank.length > 0 && (
              <div>
                <p className="lhp-label">{L.labels.bankDetails || 'Bank Details'}</p>
                <table className="lhp-kv">
                  <tbody>
                    {bank.map(([k, v], i) => (
                      <tr key={i}>{k == null ? <td colSpan={2}>{v}</td> : <><th>{k}</th><td>{v}</td></>}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {L.sections.paymentOptions && M.methods.length > 0 && (
              <div>
                <p className="lhp-label">Payment Options</p>
                <table className="lhp-kv">
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
          <table className="lhp-totals">
            <tbody>
              <tr><th>{M.hasTax ? 'Taxable Amount' : 'Sub Total'}</th><td>{fmt(M.taxableTotal)}</td></tr>
              {M.discount > 0 && <tr><th>Discount</th><td>− {fmt(M.discount)}</td></tr>}
              {M.taxes.map((t) => <tr key={gstLabel(t)}><th>{gstLabel(t)}</th><td>{fmt(t.amount)}</td></tr>)}
              <tr className="lhp-grand"><th>Total</th><td>{cur} {fmt(invoice.total)}</td></tr>
              {M.amountPaid > 0 && <tr><th>Amount Paid</th><td>{fmt(M.amountPaid)}</td></tr>}
              {M.amountCredited > 0 && <tr><th>Credit Notes</th><td>− {fmt(M.amountCredited)}</td></tr>}
              {M.settled && <tr className="lhp-due"><th>Balance Due</th><td>{cur} {fmt(M.balanceDue)}</td></tr>}
            </tbody>
          </table>
        </div>
      ),
    },
    footerFields.length > 0 && {
      key: 'fields',
      node: <p className="lhp-fields">{footerFields.map((f) => <span key={f.id}><b>{f.label}:</b> {f.value}</span>)}</p>,
    },
    M.notes && { key: 'notes', node: <p className="lhp-para"><b>{L.labels.notes || 'Notes'}:</b> <span className="lhp-pre">{M.notes}</span></p> },
    M.termsText && {
      key: 'terms',
      node: <p className="lhp-para">{L.labels.termsHeading && <b>{L.labels.termsHeading}: </b>}<span className="lhp-pre">{M.termsText}</span></p>,
    },
    declaration && { key: 'declaration', node: <p className="lhp-para lhp-small">{declaration}</p> },
    (received || L.signature.show || M.footerText || L.sections.computerGenerated) && {
      key: 'sign',
      node: (
        <div className="lhp-signrow">
          <div className="lhp-signrow-left lhp-small">
            {received && <p>{L.texts.receivedNote}</p>}
            {received && L.texts.closingNote && <p>{L.texts.closingNote}</p>}
            {M.footerText && <p className="lhp-strong">{M.footerText}</p>}
            {L.sections.computerGenerated && <p>This is a computer-generated invoice.</p>}
          </div>
          {L.signature.show && (
            <div className="lhp-sign">
              {L.signature.forCompany && <p className="lhp-sign-for">For {co.companyName || 'the Company'}</p>}
              <div className="lhp-sign-space">{M.sealSrc && <img src={M.sealSrc} alt="Seal & signature" />}</div>
              <p className="lhp-sign-label">{L.labels.signatory || 'Authorized Signatory'}</p>
            </div>
          )}
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <LetterheadDocument
      company={co}
      blocks={blocks}
      groups={groups}
      contentKey={M.contentKey}
      showPageNumbers={L.sections.pageNumber}
      style={{
        '--lhp-accent': L.style.accentColor,
        '--lhp-accent-text': M.docStyle['--accent-text'],
        '--lhp-fs': M.docStyle['--inv-fs'],
        '--lhp-font': M.docStyle['--inv-font'],
      }}
    />
  );
}

export default InvoicePageView;
