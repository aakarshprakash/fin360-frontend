// Bank Transaction Modal - Record deposits, withdrawals, transfers
import { useState } from 'react';
import '../../styles/Accounting.css';

function BankTransactionModal({ bankAccountId, onSave, onClose }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], type: 'deposit', amount: 0,
    description: '', reference: '', transferTo: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, bankAccountId, amount: Number(form.amount), id: Date.now() });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>Record Transaction</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Date *</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required /></div>
              <div className="acc-form-group"><label>Type *</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="transfer">Internal Transfer</option>
                </select>
              </div>
            </div>
            <div className="acc-form-group"><label>Amount *</label><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required /></div>
            <div className="acc-form-group"><label>Description</label><input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
            <div className="acc-form-group"><label>Reference</label><input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} /></div>
            {form.type === 'transfer' && (
              <div className="acc-form-group"><label>Transfer To Account</label><input type="text" value={form.transferTo} onChange={(e) => setForm({...form, transferTo: e.target.value})} placeholder="Target bank account" /></div>
            )}
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">Record Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BankTransactionModal;

