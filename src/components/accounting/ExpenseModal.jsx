// Expense Modal - Create/Edit expense entry
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';
import { ICONS } from './AccountingIcons';

function ExpenseModal({ expense, onSave, onClose }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], category: 'Office Rent', amount: 0,
    currency: 'INR', exchangeRate: 1, paymentMethod: 'Bank Transfer',
    vendor: '', reference: '', notes: '',
  });

  useEffect(() => { if (expense) setForm({ ...expense }); }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...expense, ...form, amount: Number(form.amount) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{expense ? 'Edit Expense' : 'Record Expense'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
              </div>
              <div className="acc-form-group">
                <label>Category *</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  <option>Office Rent</option><option>Electricity</option><option>Salaries</option>
                  <option>Travel</option><option>Software Subscription</option><option>Office Supplies</option>
                  <option>Marketing</option><option>Utilities</option><option>Insurance</option>
                  <option>Maintenance</option><option>Other Expense</option>
                </select>
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Amount *</label>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="acc-form-group">
                <label>Currency</label>
                <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
                  <option value="INR">INR</option><option value="USD">USD</option>
                  <option value="EUR">EUR</option><option value="AED">AED</option>
                </select>
              </div>
            </div>
            {form.currency !== 'INR' && (
              <div className="acc-form-group">
                <label>Exchange Rate (1 {form.currency} = ? INR)</label>
                <input type="number" step="0.01" value={form.exchangeRate}
                  onChange={(e) => setForm({...form, exchangeRate: e.target.value})} />
              </div>
            )}
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})}>
                  <option>Bank Transfer</option><option>Cash</option><option>UPI</option>
                  <option>Cheque</option><option>Credit Card</option><option>Other</option>
                </select>
              </div>
              <div className="acc-form-group">
                <label>Reference</label>
                <input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} />
              </div>
            </div>
            <div className="acc-form-group">
              <label>Vendor (optional)</label>
              <input type="text" value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} />
            </div>
            <div className="acc-form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
            </div>

            {form.amount > 0 && (
              <div className="acc-entry-preview">
                <h4>{ICONS.edit} Auto Accounting Entry</h4>
                <table>
                  <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
                  <tbody>
                    <tr><td>{form.category}</td>
                      <td style={{textAlign:'right'}}><span className="acc-amount debit">₹{Number(form.amount).toLocaleString('en-IN')}</span></td><td>-</td></tr>
                    <tr><td>{form.paymentMethod === 'Cash' ? 'Cash' : 'Bank'}</td><td>-</td>
                      <td style={{textAlign:'right'}}><span className="acc-amount credit">₹{Number(form.amount).toLocaleString('en-IN')}</span></td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{expense ? 'Update' : 'Save'} Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseModal;

