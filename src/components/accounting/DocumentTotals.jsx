// Totals under a document's line items (quotation, proforma, invoice), with an
// optional round off to the nearest rupee.
import { documentTotals } from './lineAmounts';
import { amountInWords } from './invoiceFormat';
import '../../styles/DocumentTotals.css';

function DocumentTotals({ items, roundTotal, onRoundTotalChange, currency = 'INR', exchangeRate = 1, disabled = false }) {
  const totals = documentTotals(items, roundTotal);
  const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);

  return (
    <div className="dt">
      <dl className="dt-summary">
        <div className="dt-row"><dt>Total</dt><dd>{money(totals.subtotal)}</dd></div>
        {totals.discount > 0 && <div className="dt-row is-discount"><dt>Special discount</dt><dd>−{money(totals.discount)}</dd></div>}
        {totals.discount > 0 && <div className="dt-row"><dt>Sub total</dt><dd>{money(totals.taxable)}</dd></div>}
        <div className="dt-row"><dt>GST</dt><dd>{money(totals.tax)}</dd></div>
        <div className="dt-row dt-round">
          <dt>
            <label className="dt-switch">
              <input type="checkbox" checked={roundTotal} disabled={disabled} onChange={(e) => onRoundTotalChange(e.target.checked)} />
              <span>Round off to the nearest rupee</span>
            </label>
          </dt>
          <dd>{roundTotal ? `${totals.roundOff < 0 ? '−' : ''}${money(Math.abs(totals.roundOff))}` : '—'}</dd>
        </div>
        <div className="dt-row dt-net"><dt>Net amount</dt><dd>{money(totals.total)}</dd></div>
        {currency === 'INR' && totals.total > 0 && <p className="dt-words">{amountInWords(totals.total)}</p>}
        {currency !== 'INR' && (
          <div className="dt-row"><dt>Base amount (INR)</dt><dd>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totals.total * (Number(exchangeRate) || 1))}</dd></div>
        )}
      </dl>
    </div>
  );
}

export default DocumentTotals;
