// Currency Modal - Create/Edit currencies
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

function CurrencyModal({ currency, onSave, onClose }) {
  const [form, setForm] = useState({ code: '', name: '', symbol: '', exchangeRate: 1, isBase: false });
  useEffect(() => { if (currency) setForm({ ...currency }); }, [currency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...currency, ...form, exchangeRate: Number(form.exchangeRate) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" style={{maxWidth:'450px'}} onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{currency ? 'Edit Currency' : 'Add Currency'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Currency Code *</label><input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g., USD" required maxLength={3} /></div>
              <div className="acc-form-group"><label>Symbol</label><input type="text" value={form.symbol} onChange={(e) => setForm({...form, symbol: e.target.value})} placeholder="e.g., $" /></div>
            </div>
            <div className="acc-form-group"><label>Currency Name *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., US Dollar" required /></div>
            <div className="acc-form-group"><label>Exchange Rate (1 unit = ? INR)</label><input type="number" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm({...form, exchangeRate: e.target.value})} /></div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{currency ? 'Update' : 'Add'} Currency</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CurrencyModal;

