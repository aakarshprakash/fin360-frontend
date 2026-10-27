// Stock Modal — receive, issue or count stock for one product, with the full
// movement history (opening stock, manual moves, invoice deductions).
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adjustStock, getStockMovements } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import '../../styles/Products.css';

const MODES = [
  { id: 'in', label: 'Stock in', hint: 'Goods received from a supplier or returned' },
  { id: 'out', label: 'Stock out', hint: 'Damaged, used internally or given away' },
  { id: 'set', label: 'Set count', hint: 'Physical count — sets the stock to this number' },
];

const TYPE_LABELS = {
  opening: 'Opening stock', in: 'Stock in', out: 'Stock out', adjustment: 'Count adjustment',
  invoice: 'Invoice', invoice_reversal: 'Invoice deleted',
};

const qtyFmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });

function StockModal({ product, onUpdated, onClose }) {
  const [mode, setMode] = useState('in');
  const [form, setForm] = useState({ quantity: '', date: new Date().toISOString().slice(0, 10), reference: '', note: '' });
  const [movements, setMovements] = useState(null);
  const [current, setCurrent] = useState(Number(product.stockQuantity) || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getStockMovements(product.id)
      .then((res) => { if (!cancelled) setMovements(res.data?.data || []); })
      .catch(() => { if (!cancelled) setMovements([]); });
    return () => { cancelled = true; };
  }, [product.id]);

  const qty = Number(form.quantity);
  const after = mode === 'in' ? current + qty : mode === 'out' ? current - qty : qty;
  const valid = form.quantity !== '' && qty >= 0 && (mode === 'set' || qty > 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      const res = await adjustStock(product.id, { type: mode, quantity: qty, date: form.date, reference: form.reference || null, note: form.note || null });
      const saved = res.data?.data;
      const movement = res.data?.movement;
      setCurrent(Number(saved?.stockQuantity) || 0);
      if (movement) setMovements((list) => [{ ...movement, user: null }, ...(list || [])]);
      setForm({ ...form, quantity: '', reference: '', note: '' });
      onUpdated(saved);
    } catch (err) {
      const body = err.response?.data;
      setError((body?.errors && Object.values(body.errors)[0]?.[0]) || body?.message || 'Could not update stock.');
    }
    setSaving(false);
  };

  const unit = product.unit || 'NOS';
  const low = product.reorderLevel != null && current <= Number(product.reorderLevel);

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal stock-modal" role="dialog" aria-labelledby="stock-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <div>
            <h2 id="stock-modal-title">Stock · {product.name}</h2>
            {product.sku && <p className="prod-sub">SKU {product.sku}</p>}
          </div>
          <button type="button" className="acc-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="acc-modal-body">
          <div className="stock-now">
            <div>
              <span className="stock-now-label">In stock</span>
              <strong className={current <= 0 ? 'is-out' : low ? 'is-low' : ''}>{qtyFmt(current)} <small>{unit}</small></strong>
            </div>
            {product.reorderLevel != null && (
              <div><span className="stock-now-label">Reorder level</span><strong>{qtyFmt(product.reorderLevel)} <small>{unit}</small></strong></div>
            )}
          </div>

          <form onSubmit={submit} className="stock-form">
            <div className="stock-modes" role="radiogroup" aria-label="Movement type">
              {MODES.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={mode === m.id}
                  className={mode === m.id ? 'is-on' : ''} onClick={() => setMode(m.id)}>{m.label}</button>
              ))}
            </div>
            <p className="prod-hint">{MODES.find((m) => m.id === mode).hint}</p>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label htmlFor="s-qty">{mode === 'set' ? 'Counted quantity' : 'Quantity'} ({unit})</label>
                <input id="s-qty" type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="acc-form-group">
                <label htmlFor="s-date">Date</label>
                <input id="s-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="acc-form-group">
                <label htmlFor="s-ref">Reference</label>
                <input id="s-ref" type="text" maxLength={100} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="GRN / bill / DC no." />
              </div>
            </div>
            <div className="acc-form-group">
              <label htmlFor="s-note">Note</label>
              <input id="s-note" type="text" maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            {valid && <p className={`stock-after ${after < 0 ? 'is-out' : ''}`}>Stock after this: <b>{qtyFmt(after)} {unit}</b></p>}
            {error && <p className="prod-error" role="alert">{error}</p>}
            <div className="stock-submit">
              <button type="submit" className="acc-btn acc-btn-primary" disabled={!valid || saving}>{saving ? 'Saving…' : 'Update stock'}</button>
            </div>
          </form>

          <h3 className="stock-history-title">History</h3>
          {movements === null ? (
            <div className="acc-loading"><span className="spinner"></span> Loading…</div>
          ) : movements.length === 0 ? (
            <p className="prod-hint">No stock movements yet.</p>
          ) : (
            <div className="stock-history">
              <table className="acc-table">
                <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th style={{ textAlign: 'right' }}>Change</th><th style={{ textAlign: 'right' }}>Balance</th></tr></thead>
                <tbody>
                  {movements.map((m) => {
                    const change = Number(m.quantity);
                    return (
                      <tr key={m.id}>
                        <td>{m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td>
                          {TYPE_LABELS[m.type] || m.type}
                          {m.note && <small className="stock-note">{m.note}</small>}
                        </td>
                        <td>{m.reference || '—'}</td>
                        <td className={`stock-change ${change < 0 ? 'is-neg' : 'is-pos'}`}>{change > 0 ? '+' : ''}{qtyFmt(change)}</td>
                        <td style={{ textAlign: 'right' }}>{qtyFmt(m.balanceAfter)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockModal;
