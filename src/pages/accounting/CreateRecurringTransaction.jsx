// Create Recurring Transaction — schedule a repeating income/expense entry
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createRecurringTransaction } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function CreateRecurringTransaction() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRecurringTransaction({
        type: form.type,
        category: form.category,
        amount: Number(form.amount),
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
        description: form.description || null,
      });
      navigate('/recurring');
    } catch {
      navigate('/recurring');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/recurring" className="acc-back-link">← Back to Recurring Transactions</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.repeat}</div>
            <div><h1 className="page-title">New Recurring Transaction</h1><p className="page-subtitle">Automatically schedule an income or expense</p></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px'}}>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Type *</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="acc-form-group">
                <label>Category *</label>
                <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="e.g., Office Rent" required />
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Amount *</label>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="acc-form-group">
                <label>Frequency *</label>
                <select value={form.frequency} onChange={(e) => setForm({...form, frequency: e.target.value})}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required />
              </div>
              <div className="acc-form-group">
                <label>End Date (optional)</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
              </div>
            </div>
            <div className="acc-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Optional notes..." />
            </div>
          </div>

          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
            <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/recurring')}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Recurring Transaction'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateRecurringTransaction;
