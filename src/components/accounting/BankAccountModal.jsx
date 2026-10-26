// Bank Account Modal - Create/Edit bank accounts
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

function BankAccountModal({ account, onSave, onClose }) {
  const [form, setForm] = useState({
    bankName: '', accountNumber: '', currency: 'INR', openingBalance: 0, accountType: 'Savings',
  });

  useEffect(() => { if (account) setForm({ ...account }); }, [account]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...account, ...form, openingBalance: Number(form.openingBalance), balance: account?.balance || Number(form.openingBalance) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{account ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-group"><label>Bank Name *</label><input type="text" value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})} required /></div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Account Number *</label><input type="text" value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})} required /></div>
              <div className="acc-form-group"><label>Account Type</label>
                <select value={form.accountType} onChange={(e) => setForm({...form, accountType: e.target.value})}>
                  <option>Savings</option><option>Current</option><option>Fixed Deposit</option><option>Cash</option>
                </select>
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Currency</label>
                <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
                  <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="AED">AED</option>
                </select>
              </div>
              <div className="acc-form-group"><label>Opening Balance</label><input type="number" value={form.openingBalance} onChange={(e) => setForm({...form, openingBalance: e.target.value})} /></div>
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{account ? 'Update' : 'Add'} Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BankAccountModal;

