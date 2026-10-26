// Create Journal Entry - Manual double-entry form with debit/credit balance validation
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createJournalEntry } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const defaultAccounts = [
  'Cash', 'Bank - HDFC', 'Bank - SBI', 'Accounts Receivable', 'Accounts Payable',
  'Sales Revenue', 'Service Income', 'Interest Income', 'Cost of Goods Sold',
  'Salary Expense', 'Rent Expense', 'Utilities Expense', 'Marketing Expense',
  'Office Supplies', 'GST Payable', 'Input GST', 'Owner\'s Equity', 'Retained Earnings',
];

function CreateJournalEntry() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], reference: '', description: '', currency: 'INR',
  });
  const [lines, setLines] = useState([
    { account: '', debit: 0, credit: 0, description: '' },
    { account: '', debit: 0, credit: 0, description: '' },
  ]);

  const addLine = () => setLines([...lines, { account: '', debit: 0, credit: 0, description: '' }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    // If entering debit, clear credit and vice versa
    if (field === 'debit' && Number(value) > 0) {
      updated[idx] = { ...updated[idx], debit: Number(value), credit: 0 };
    } else if (field === 'credit' && Number(value) > 0) {
      updated[idx] = { ...updated[idx], credit: Number(value), debit: 0 };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setLines(updated);
  };

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const difference = totalDebit - totalCredit;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) { alert('Debit total must equal Credit total!'); return; }
    setSaving(true);
    try { await createJournalEntry({ ...form, lines, debitTotal: totalDebit, creditTotal: totalCredit });
      navigate('/journal-entries');
    } catch { navigate('/journal-entries'); } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/journal-entries" className="acc-back-link">← Back to Journal Entries</Link>
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.journal}</div><div><h1 className="page-title">Create Journal Entry</h1><p className="page-subtitle">Manual double-entry accounting</p></div></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px'}}>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Date *</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required /></div>
              <div className="acc-form-group"><label>Reference</label><input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} placeholder="e.g., JV-0016" /></div>
            </div>
            <div className="acc-form-group"><label>Description *</label><input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Entry description" required /></div>
          </div>

          {/* Journal Lines */}
          <div className="acc-table-container" style={{marginBottom:'24px'}}>
            <div className="acc-table-toolbar"><h3 style={{margin:0}}>Entry Lines</h3><button type="button" className="acc-btn acc-btn-secondary" onClick={addLine}>+ Add Line</button></div>
            <table className="acc-line-items">
              <thead><tr><th style={{width:'30%'}}>Account</th><th style={{width:'25%'}}>Description</th><th style={{width:'18%',textAlign:'right'}}>Debit (₹)</th><th style={{width:'18%',textAlign:'right'}}>Credit (₹)</th><th style={{width:'5%'}}></th></tr></thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select value={line.account} onChange={(e) => updateLine(idx, 'account', e.target.value)}>
                        <option value="">Select Account</option>
                        {defaultAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    <td><input type="text" value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} placeholder="Line note" /></td>
                    <td><input type="number" min="0" step="0.01" value={line.debit || ''} onChange={(e) => updateLine(idx, 'debit', e.target.value)} placeholder="0.00" style={{textAlign:'right'}} /></td>
                    <td><input type="number" min="0" step="0.01" value={line.credit || ''} onChange={(e) => updateLine(idx, 'credit', e.target.value)} placeholder="0.00" style={{textAlign:'right'}} /></td>
                    <td>{lines.length > 2 && <button type="button" onClick={() => removeLine(idx)} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'var(--error-50)',color:'var(--error-600)',cursor:'pointer'}}>✕</button>}</td>
                  </tr>
                ))}
                {/* Totals */}
                <tr style={{background:'var(--neutral-50)',fontWeight:600}}>
                  <td colSpan="2" style={{textAlign:'right',paddingRight:'16px'}}>Totals</td>
                  <td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(totalDebit)}</span></td>
                  <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(totalCredit)}</span></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Balance indicator */}
            <div style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:'1px solid var(--neutral-200)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{width:'10px',height:'10px',borderRadius:'50%',background: isBalanced ? 'var(--success-500)' : 'var(--error-500)'}}></span>
                <span style={{fontSize:'14px',fontWeight:500,color: isBalanced ? 'var(--success-700)' : 'var(--error-600)'}}>
                  {isBalanced ? '✓ Entry is balanced' : `✗ Unbalanced — Difference: ${formatCurrency(Math.abs(difference))}`}
                </span>
              </div>
              {!isBalanced && difference !== 0 && (
                <span style={{fontSize:'12px',color:'var(--neutral-500)'}}>
                  {difference > 0 ? 'Credit side needs more' : 'Debit side needs more'}
                </span>
              )}
            </div>
          </div>

          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
            <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/journal-entries')}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving || !isBalanced}>{saving ? 'Saving...' : 'Post Entry'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateJournalEntry;

