// The ruled rows of the Classic GST invoice, shared by the stand-alone design
// (InvoiceBoxedView) and the one printed on a full-page letterhead
// (InvoiceBoxedPageView). Each takes the model built by InvoicePrintView.
import { fmt, fmtDateNumeric, fmtQty, fmtSigned, gstLabel, num, splitKeyValues } from './invoiceFormat';

const currencyLabel = (M) => (M.curr === 'INR' ? 'Rs.' : M.curr);

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

export function BoxedTitle({ M }) {
  const { L } = M;
  return (
    <div className="bx-title">
      <h2>{L.header.title || 'TAX INVOICE'}</h2>
      {L.header.subtitle && <span>{L.header.subtitle}</span>}
    </div>
  );
}

// Company IDs beside the invoice details
export function BoxedDetailsRow({ M }) {
  const { co, L, invoice, customer: cu } = M;
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
  return (
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
  );
}

export function BoxedParties({ M }) {
  const { L, customer: cu } = M;
  return (
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
  );
}

export function BoxedItemHead({ M }) {
  const { L, cols } = M;
  const cur = currencyLabel(M);
  return (
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
  );
}

export function BoxedItemRow({ M, item, index }) {
  const { cols } = M;
  const rate = num(item.unitPrice || item.price);
  const taxable = num(item.quantity) * rate - num(item.discount);
  return (
    <tr>
      <td className="bx-c-idx">{index + 1}</td>
      <td className="bx-c-desc">{item.description || '—'}</td>
      {cols.hsn && <td className="bx-c-hsn">{item.hsnCode || item.hsn_code || ''}</td>}
      <td className="bx-num">{fmtQty(item.quantity)}</td>
      {cols.uom && <td className="bx-c-uom">{item.unit || ''}</td>}
      <td className="bx-num">{fmt(rate)}</td>
      {cols.discount && <td className="bx-num">{num(item.discount) > 0 ? fmt(item.discount) : ''}</td>}
      {cols.taxable && <td className="bx-num">{fmt(taxable)}</td>}
      {cols.rate && <td className="bx-num">{num(item.taxRate) ? `${num(item.taxRate)}%` : ''}</td>}
      {cols.gst && <td className="bx-num">{fmt(item.taxAmount)}</td>}
      <td className="bx-num">{fmt(cols.gst ? num(item.total) : taxable)}</td>
    </tr>
  );
}

// Bank details & totals
export function BoxedTotalsRow({ M }) {
  const { co, L, invoice } = M;
  const cur = currencyLabel(M);
  const bank = L.sections.bankDetails && co.bankDetails ? splitKeyValues(co.bankDetails) : [];
  const leftInfo = bank.length > 0 || (L.sections.paymentOptions && M.methods.length > 0) || (L.header.taxIds === 'footer' && M.taxIds.length > 0);
  return (
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
            {num(invoice.roundOff) !== 0 && <tr><th>Round Off</th><td>{fmtSigned(invoice.roundOff)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BoxedWordsRow({ M }) {
  const { L, invoice } = M;
  const cur = currencyLabel(M);
  return (
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
  );
}

// Custom fields (Lot Code, LR No…) beside the declaration
export function BoxedFieldsRow({ M }) {
  const declaration = M.L.sections.declaration && (M.L.texts.declaration || '').trim();
  if (!M.footerFields.length && !declaration) return null;
  return (
    <div className="bx-row bx-sum">
      <div className="bx-cell">
        {M.footerFields.length > 0 && <KeyValues rows={M.footerFields.map((f) => [f.label, f.value])} className="bx-kv-fields" />}
      </div>
      <div className="bx-cell bx-declaration">{declaration}</div>
    </div>
  );
}

export function BoxedNoteRows({ M }) {
  const { L } = M;
  return (
    <>
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
    </>
  );
}

// Receiver's note & signatory
export function BoxedSignRow({ M }) {
  const { co, L } = M;
  const showReceived = L.sections.receivedNote && (L.texts.receivedNote || L.texts.closingNote);
  if (!showReceived && !L.signature.show) return null;
  return (
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
  );
}
