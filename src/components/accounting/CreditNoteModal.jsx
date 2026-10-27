// Issue a credit note against an invoice: credit some or all of its lines
// (returns, price adjustments) or add a custom line.
import { useEffect, useState } from 'react';
import { FileMinus, Plus, Trash2, X } from 'lucide-react';
import { createInvoiceCreditNote } from '../../utils/accountingApi';
import '../../styles/Products.css';
import '../../styles/InvoiceSettlement.css';

const REASONS = [
  ['return', 'Goods returned'],
  ['price_adjustment', 'Price adjustment'],
  ['discount', 'Discount after sale'],
  ['damaged', 'Damaged / defective'],
  ['other', 'Other'],
];
const amt = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (v) => `₹${amt(v)}`;
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100;
const num = (v) => Number(v) || 0;

// Price per unit after any line discount, so crediting the full quantity never exceeds the line
const netUnitPrice = (item) => {
  const qty = num(item.quantity);
  return qty > 0 ? round2((qty * num(item.unitPrice) - num(item.discount)) / qty) : num(item.unitPrice);
};

function CreditNoteModal({ invoice, outstanding, onDone, onClose }) {
  const [lines, setLines] = useState(() => (invoice.items || []).map((it) => ({
    description: it.description || '',
    maxQty: num(it.quantity),
    quantity: 0,
    unitPrice: netUnitPrice(it),
    taxRate: num(it.taxRate),
    custom: false,
  })));
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), reasonType: 'return', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (idx, patch) => setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addCustom = () => setLines([...lines, { description: '', maxQty: null, quantity: 1, unitPrice: 0, taxRate: 0, custom: true }]);

  const active = lines.filter((l) => num(l.quantity) > 0 && l.description.trim());
  const subtotal = round2(active.reduce((s, l) => s + round2(num(l.quantity) * num(l.unitPrice)), 0));
  const tax = round2(active.reduce((s, l) => s + round2(round2(num(l.quantity) * num(l.unitPrice)) * num(l.taxRate) / 100), 0));
  const total = round2(subtotal + tax);
  const tooMuch = total > outstanding + 0.005;
  const overQty = lines.some((l) => l.maxQty != null && num(l.quantity) > l.maxQty);

  const submit = async (e) => {
    e.preventDefault();
    if (!active.length || total <= 0 || tooMuch || overQty) return;
    setSaving(true);
    setError('');
    try {
      const res = await createInvoiceCreditNote(invoice.id, {
        date: form.date,
        reasonType: form.reasonType,
        reason: form.reason || null,
        items: active.map((l) => ({ description: l.description.trim(), quantity: num(l.quantity), unitPrice: num(l.unitPrice), taxRate: num(l.taxRate) })),
      });
      onDone(res.data?.invoice, res.data?.message || 'Credit note created.');
    } catch (err) {
      const body = err.response?.data;
      setError((body?.errors && Object.values(body.errors)[0]?.[0]) || body?.message || 'Could not create the credit note.');
      setSaving(false);
    }
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="pm st-dialog st-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="cn-title" onClick={(e) => e.stopPropagation()}>
        <header className="pm-head">
          <span className="pm-head-icon st-icon-credit"><FileMinus size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="cn-title">New credit note</h2>
            <p>Against {invoice.invoiceNumber} · {invoice.customer} · {money(outstanding)} outstanding</p>
          </div>
          <button type="button" className="pm-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <form onSubmit={submit} className="pm-form">
          <div className="st-body">
            <div className="pm-card-body st-grid">
              <div className="pm-field">
                <label htmlFor="cn-date">Date<span className="pm-req"> *</span></label>
                <input id="cn-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="pm-field">
                <label htmlFor="cn-reason-type">Reason<span className="pm-req"> *</span></label>
                <select id="cn-reason-type" className="st-select" value={form.reasonType} onChange={(e) => setForm({ ...form, reasonType: e.target.value })}>
                  {REASONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </div>
              <div className="pm-field">
                <label htmlFor="cn-reason">Details</label>
                <input id="cn-reason" type="text" maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. 1 unit returned, damaged in transit" />
              </div>
            </div>

            <div className="st-lines-wrap">
              <table className="st-lines">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="st-c-qty">Qty to credit</th>
                    <th className="st-c-num">Rate (₹)</th>
                    <th className="st-c-gst">GST %</th>
                    <th className="st-c-num">Amount</th>
                    <th aria-label="Remove" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const amount = round2(num(l.quantity) * num(l.unitPrice));
                    const lineTotal = round2(amount + amount * num(l.taxRate) / 100);
                    const over = l.maxQty != null && num(l.quantity) > l.maxQty;
                    return (
                      <tr key={idx} className={num(l.quantity) > 0 ? 'is-on' : ''}>
                        <td>
                          {l.custom ? (
                            <input type="text" aria-label="Description" value={l.description} maxLength={500} placeholder="Description, e.g. Price adjustment"
                              onChange={(e) => update(idx, { description: e.target.value })} />
                          ) : (
                            <span className="st-line-name">{l.description}<small>Invoiced {l.maxQty}</small></span>
                          )}
                        </td>
                        <td className="st-c-qty">
                          <input type="number" aria-label={`Quantity to credit for ${l.description || 'line'}`} min="0" max={l.maxQty ?? undefined} step="any"
                            className={over ? 'is-invalid' : ''} value={l.quantity} onChange={(e) => update(idx, { quantity: e.target.value })} />
                          {!l.custom && (
                            <button type="button" className="st-all" onClick={() => update(idx, { quantity: l.maxQty })}>All</button>
                          )}
                        </td>
                        <td className="st-c-num">
                          {l.custom ? (
                            <input type="number" aria-label="Rate" min="0" step="0.01" value={l.unitPrice} onChange={(e) => update(idx, { unitPrice: e.target.value })} />
                          ) : amt(l.unitPrice)}
                        </td>
                        <td className="st-c-gst">
                          {l.custom ? (
                            <input type="number" aria-label="GST %" min="0" max="100" step="0.01" value={l.taxRate} onChange={(e) => update(idx, { taxRate: e.target.value })} />
                          ) : `${l.taxRate}%`}
                        </td>
                        <td className="st-c-num st-strong">{num(l.quantity) > 0 ? money(lineTotal) : '—'}</td>
                        <td>
                          {l.custom && (
                            <button type="button" className="st-remove" aria-label="Remove line" onClick={() => setLines(lines.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="button" className="st-add" onClick={addCustom}><Plus size={14} aria-hidden="true" /> Add custom line</button>
            </div>

            <div className="st-totals">
              <div><span>Taxable value</span><b>{money(subtotal)}</b></div>
              <div><span>GST reversed</span><b>{money(tax)}</b></div>
              <div className="st-totals-grand"><span>Credit note total</span><b>{money(total)}</b></div>
              <div><span>Balance after credit</span><b className={tooMuch ? 'is-bad' : ''}>{tooMuch ? 'Exceeds outstanding' : money(Math.max(0, outstanding - total))}</b></div>
            </div>
          </div>

          <footer className="pm-foot">
            {error ? <p className="pm-error" role="alert">{error}</p> : (
              <p className="pm-foot-hint">
                {overQty ? 'A quantity is more than was invoiced.' : tooMuch ? `The credit is more than the ${money(outstanding)} outstanding.` : 'Reverses the sale and its GST in the ledger.'}
              </p>
            )}
            <div className="pm-foot-actions">
              <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="acc-btn acc-btn-primary" disabled={saving || !active.length || total <= 0 || tooMuch || overQty}>
                {saving ? 'Saving…' : `Issue credit note${total > 0 ? ` · ${money(total)}` : ''}`}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default CreditNoteModal;
