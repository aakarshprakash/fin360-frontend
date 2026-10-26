// Account Modal - Create/Edit accounting accounts
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

const accountTypes = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];
const accountGroups = {
  Assets: ['Current Assets', 'Fixed Assets', 'Other Assets'],
  Liabilities: ['Current Liabilities', 'Long-term Liabilities'],
  Equity: ['Equity'],
  Income: ['Revenue', 'Other Income'],
  Expenses: ['Direct Expenses', 'Operating Expenses', 'Other Expenses'],
};

function AccountModal({ account, onSave, onClose }) {
  const [form, setForm] = useState({
    code: '', name: '', type: 'Assets', group: 'Current Assets',
    description: '', openingBalance: 0,
  });

  useEffect(() => {
    if (account) {
      setForm({
        code: account.code || '', name: account.name || '',
        type: account.type || 'Assets', group: account.group || 'Current Assets',
        description: account.description || '', openingBalance: account.balance || 0,
      });
    }
  }, [account]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...account, ...form, balance: Number(form.openingBalance) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{account ? 'Edit Account' : 'New Account'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Account Code</label>
                <input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} placeholder="e.g., 1000" required />
              </div>
              <div className="acc-form-group">
                <label>Account Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., Cash" required />
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Account Type</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value, group: accountGroups[e.target.value][0]})}>
                  {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="acc-form-group">
                <label>Account Group</label>
                <select value={form.group} onChange={(e) => setForm({...form, group: e.target.value})}>
                  {accountGroups[form.type].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="acc-form-group">
              <label>Opening Balance (₹)</label>
              <input type="number" value={form.openingBalance} onChange={(e) => setForm({...form, openingBalance: e.target.value})} />
            </div>
            <div className="acc-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Optional description..." />
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{account ? 'Update' : 'Create'} Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccountModal;
