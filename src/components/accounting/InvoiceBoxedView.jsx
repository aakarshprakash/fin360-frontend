// "Boxed" invoice design: the ruled, all-boxes GST tax invoice (letterhead,
// CIN/GSTIN/PAN beside the invoice details, Bill To / Ship To, item grid whose
// column rules run to the foot of the page, totals, declaration, receiver's
// note and signatory). Receives the model built by InvoicePrintView.
import { useLayoutEffect, useRef, useState } from 'react';
import { fmt, fmtDateNumeric, fmtQty, gstLabel, num, splitKeyValues } from './invoiceFormat';

const A4_HEIGHT_PX = (297 / 25.4) * 96;

function KeyValues({ rows, className = '' }) {
  return (
    <table className={`bx-kv ${className}`}>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={`${k}-${i}`}>
            {k == null ? <td colSpan={3}>{v}</td> : (
              <>
                <th>{k}</th>
                <td className="bx-colon">:</td>
                <td>{v}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Party({ cu, L, withContact }) {
  return (
    <div className="bx-party">
      <p className="bx-party-name">{cu.name}</p>
      {cu.address && <p className="bx-pre">{cu.address}</p>}
      {cu.phone && <p>Phone: {cu.phone}</p>}
      {cu.email && <p>Email: {cu.email}</p>}
      {cu.state && <p>State: {cu.state}{cu.stateCode ? `, State Code: ${cu.stateCode}` : ''}</p>}
      {L.details.customerGstin && <p>GSTIN: {cu.gstin || 'Unregistered'}</p>}
      {L.details.customerPan && cu.pan && <p>PAN: {cu.pan}</p>}
      {withContact && L.details.contactPerson && cu.contact && <p>Contact Person: {cu.contact}</p>}
    </div>
  );
}

function InvoiceBoxedView({ M }) {
  const { co, L, invoice, items, cols, customer: cu } = M;
  const docRef = useRef(null);
  const [pages, setPages] = useState(1);

  // The page number sits at the end of the document, i.e. on its last page
  const showPageNumber = L.sections.pageNumber;
  useLayoutEffect(() => {
    const el = docRef.current;
    if (!showPageNumber || !el) return undefined;
    const measure = () => setPages(Math.max(1, Math.ceil((el.offsetHeight - 4) / A4_HEIGHT_PX)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showPageNumber]);

  const cur = M.curr === 'INR' ? 'Rs.' : M.curr;
  const phoneLine = [co.phone && `Phone No: ${co.phone}`, co.mobile && `Cell: ${co.mobile}`].filter(Boolean).join(', ');
  const webLine = [co.email && `Email: ${co.email}`, co.website && `Web: ${co.website}`].filter(Boolean).join('   ');
  const stateLine = co.state ? `State: ${co.state}${M.companyStateCode ? `, State Code: ${M.companyStateCode}` : ''}` : '';

  const taxIdsInBand = L.header.taxIds === 'letterhead' && M.taxIds.length > 0;
  const details = [
    ['Invoice No', <b key="n">{invoice.invoiceNumber}</b>],
    ['Invoice Date', fmtDateNumeric(invoice.date)],
    L.details.dueDate && ['Due Date', fmtDateNumeric(invoice.dueDate)],
    ...M.detailFields.map((f) => [f.label, f.value]),
    L.details.placeOfSupply && cu.state && ['Place of Supply', `${cu.state}${cu.stateCode ? ` (${cu.stateCode})` : ''}`],
    M.curr !== 'INR' && ['Currency', M.curr],
    L.details.sellerGstin && !taxIdsInBand && co.gstNumber && ['Seller GSTIN', co.gstNumber],
  ].filter(Boolean);
  const half = Math.ceil(details.length / 2);

  const bank = L.sections.bankDetails && co.bankDetails ? splitKeyValues(co.bankDetails) : [];
  const leftInfo = bank.length > 0 || (L.sections.paymentOptions && M.methods.length > 0) || (L.header.taxIds === 'footer' && M.taxIds.length > 0);
  const declaration = L.sections.declaration && (L.texts.declaration || '').trim();
  const showFieldsRow = M.footerFields.length > 0 || declaration;
  const showReceived = L.sections.receivedNote && (L.texts.receivedNote || L.texts.closingNote);

  const amountOf = (item) => (cols.gst ? num(item.total) : num(item.quantity) * num(item.unitPrice || item.price) - num(item.discount));
  const colCount = 5 + [cols.hsn, cols.uom, cols.discount, cols.taxable, cols.rate, cols.gst].filter(Boolean).length;

  return (
    <div
      ref={docRef}
      className={`inv-print inv-doc bx-doc bx-logo-${L.logo.position}`}
      style={M.docStyle}
    >
      <div className="bx-box">
        {/* ── Letterhead ─────────────────────────────────────── */}
        <header className={`bx-head ${M.logoSrc ? 'has-logo' : ''}`}>
          {M.logoSrc && L.logo.position !== 'center' && <img className="bx-logo" src={M.logoSrc} alt="" />}
          <div className="bx-co">
            {M.logoSrc && L.logo.position === 'center' && <img className="bx-logo" src={M.logoSrc} alt="" />}
            {co.companyName && <h1>{co.companyName}</h1>}
            {L.header.tagline && <p className="bx-tagline">{L.header.tagline}</p>}
            {L.header.showAddress && co.address && <p className="bx-pre bx-co-big">{co.address}</p>}
            {L.header.showContact && phoneLine && <p className="bx-co-big">{phoneLine}</p>}
            {L.header.showContact && webLine && <p className="bx-co-big">{webLine}</p>}
            {L.header.showState && stateLine && <p className="bx-co-big">{stateLine}</p>}
          </div>
        </header>

        <div className="bx-title">
          <h2>{L.header.title || 'TAX INVOICE'}</h2>
          {L.header.subtitle && <span>{L.header.subtitle}</span>}
        </div>

        {/* ── Company IDs & invoice details ──────────────────── */}
        <div className="bx-row bx-split">
          {taxIdsInBand ? (
            <>
              <div className="bx-cell"><KeyValues rows={M.taxIds} /></div>
              <div className="bx-cell"><KeyValues rows={details} /></div>
            </>
          ) : (
            <>
              <div className="bx-cell"><KeyValues rows={details.slice(0, half)} /></div>
              <div className="bx-cell"><KeyValues rows={details.slice(half)} /></div>
            </>
          )}
        </div>

        {/* ── Bill To / Ship To ───────────────────────────────── */}
        <div className={`bx-row ${L.details.shipTo ? 'bx-split' : ''}`}>
          <div className="bx-cell bx-cell-flush">
            <div className="bx-cellhead">{L.labels.billTo || 'Bill To'}</div>
            <Party cu={cu} L={L} withContact />
          </div>
          {L.details.shipTo && (
            <div className="bx-cell bx-cell-flush">
              <div className="bx-cellhead">{L.labels.shipTo || 'Ship To'}</div>
              {M.shipTo ? (
                <div className="bx-party">
                  <p className="bx-party-name">{M.shipTo.split('\n')[0]}</p>
                  <p className="bx-pre">{M.shipTo.split('\n').slice(1).join('\n')}</p>
                </div>
              ) : (
                <Party cu={cu} L={L} />
              )}
            </div>
          )}
        </div>

        {/* ── Items: column rules run down to the totals ─────── */}
        <div className="bx-items">
          <table>
            <thead>
              <tr>
                <th className="bx-c-idx">S.No</th>
                <th className="bx-c-desc">{L.labels.description || 'Description of Goods'}</th>
                {cols.hsn && <th className="bx-c-hsn">HSN / SAC</th>}
                <th className="bx-c-qty">Qty</th>
                {cols.uom && <th className="bx-c-uom">UOM</th>}
                <th className="bx-c-amt">Rate<br />({cur})</th>
                {cols.discount && <th className="bx-c-amt">Disc.<br />({cur})</th>}
                {cols.taxable && <th className="bx-c-amt">Taxable<br />Value</th>}
                {cols.rate && <th className="bx-c-uom">GST<br />%</th>}
                {cols.gst && <th className="bx-c-amt">GST<br />({cur})</th>}
                <th className="bx-c-amt">Amount<br />({cur})</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const rate = num(item.unitPrice || item.price);
                return (
                  <tr key={item.id || idx}>
                    <td className="bx-c-idx">{idx + 1}</td>
                    <td className="bx-c-desc">{item.description || '—'}</td>
                    {cols.hsn && <td className="bx-c-hsn">{item.hsnCode || item.hsn_code || ''}</td>}
                    <td className="bx-num">{fmtQty(item.quantity)}</td>
                    {cols.uom && <td className="bx-c-uom">{item.unit || ''}</td>}
                    <td className="bx-num">{fmt(rate)}</td>
                    {cols.discount && <td className="bx-num">{num(item.discount) > 0 ? fmt(item.discount) : ''}</td>}
                    {cols.taxable && <td className="bx-num">{fmt(num(item.quantity) * rate - num(item.discount))}</td>}
                    {cols.rate && <td className="bx-num">{num(item.taxRate) ? `${num(item.taxRate)}%` : ''}</td>}
                    {cols.gst && <td className="bx-num">{fmt(item.taxAmount)}</td>}
                    <td className="bx-num">{fmt(amountOf(item))}</td>
                  </tr>
                );
              })}
              <tr className="bx-fill">
                {Array.from({ length: colCount }, (_, i) => <td key={i} />)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bank details & totals ───────────────────────────── */}
        <div className="bx-row bx-sum">
          <div className="bx-cell">
            {leftInfo && <p className="bx-h">{L.labels.bankDetails || 'Additional Information'} :</p>}
            {bank.length > 0 && <KeyValues rows={bank} className="bx-kv-bank" />}
            {L.sections.paymentOptions && M.methods.length > 0 && (
              <KeyValues
                className="bx-kv-bank"
                rows={M.methods.map((m) => [m.name, m.type === 'bank'
                  ? [m.bankName, m.accountNumber && `A/C ${m.accountNumber}`, m.ifscCode && `IFSC ${m.ifscCode}`].filter(Boolean).join(', ')
                  : m.type === 'upi' ? (m.upiId || '') : m.type === 'cash' ? 'Cash payment accepted' : ''])}
              />
            )}
            {L.header.taxIds === 'footer' && M.taxIds.length > 0 && <KeyValues rows={M.taxIds} className="bx-kv-bank" />}
          </div>
          <div className="bx-cell">
            <table className="bx-totals">
              <tbody>
                <tr className="bx-strong"><th>Amount ({cur})</th><td>{fmt(M.taxableTotal)}</td></tr>
                {M.discount > 0 && <tr><th>Discount</th><td>− {fmt(M.discount)}</td></tr>}
                {M.taxes.map((t) => (
                  <tr key={gstLabel(t)}><th>{gstLabel(t)}</th><td>{fmt(t.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bx-row bx-sum">
          <div className="bx-cell bx-words">
            {L.sections.amountInWords && <><b>Amount in words : </b><b>{M.words}</b></>}
          </div>
          <div className="bx-cell bx-net">
            <table className="bx-totals">
              <tbody>
                <tr className="bx-strong"><th>Net Total ({cur})</th><td>{fmt(invoice.total)}</td></tr>
                {M.amountPaid > 0 && <tr><th>Amount Paid</th><td>{fmt(M.amountPaid)}</td></tr>}
                {M.amountCredited > 0 && <tr><th>Credit Notes</th><td>− {fmt(M.amountCredited)}</td></tr>}
                {M.settled && <tr className="bx-strong"><th>Balance Due</th><td>{fmt(M.balanceDue)}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Custom fields & declaration ─────────────────────── */}
        {showFieldsRow && (
          <div className="bx-row bx-sum">
            <div className="bx-cell">
              {M.footerFields.length > 0 && <KeyValues rows={M.footerFields.map((f) => [f.label, f.value])} className="bx-kv-fields" />}
            </div>
            <div className="bx-cell bx-declaration">{declaration}</div>
          </div>
        )}

        {M.notes && (
          <div className="bx-row bx-line">
            {L.labels.notes || 'Remarks'}: <b className="bx-pre-inline">{M.notes}</b>
          </div>
        )}
        {M.termsText && (
          <div className="bx-row bx-line">
            {L.labels.termsHeading && <b>{L.labels.termsHeading}: </b>}
            <span className="bx-pre-inline">{M.termsText}</span>
          </div>
        )}
        {M.footerText && <div className="bx-row bx-line bx-thanks">{M.footerText}</div>}

        {/* ── Receiver's note & signatory ─────────────────────── */}
        {(showReceived || L.signature.show) && (
          <div className="bx-row bx-sum bx-signrow">
            <div className="bx-cell bx-received">
              {showReceived && (
                <>
                  <p>{L.texts.receivedNote}</p>
                  <p>{L.texts.closingNote}</p>
                </>
              )}
            </div>
            <div className="bx-cell bx-sign">
              {L.signature.show && (
                <>
                  {L.signature.forCompany && <p className="bx-sign-for">For {co.companyName || 'the Company'}</p>}
                  <div className="bx-sign-space">{M.sealSrc && <img src={M.sealSrc} alt="Seal & Signature" />}</div>
                  <p className="bx-sign-label">{L.labels.signatory || 'Authorised Signatory'}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bx-below">
        <span>{L.sections.computerGenerated ? 'This is a computer-generated invoice.' : ''}</span>
        <span>{L.sections.pageNumber ? `Page ${pages} of ${pages}` : ''}</span>
      </div>
    </div>
  );
}

export default InvoiceBoxedView;
