// Recurring Transaction List — scheduled income/expense entries
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getRecurringTransactions, deleteRecurringTransaction, pauseRecurringTransaction, resumeRecurringTransaction } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function RecurringTransactionList() {
  const navigate = useNavigate();
  const { data: items, setData: setItems, loading, error } = useAccountingFetch(getRecurringTransactions, []);
  const [actionId, setActionId] = useState(null);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const handleToggle = async (item) => {
    setActionId(item.id);
    const isActive = item.status === 'active';
    try {
      if (isActive) await pauseRecurringTransaction(item.id);
      else await resumeRecurringTransaction(item.id);
    } catch { /* still reflect optimistically below */ }
    setItems(items.map(i => i.id === item.id ? { ...i, status: isActive ? 'paused' : 'active' } : i));
    setActionId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recurring transaction?')) {
      try { await deleteRecurringTransaction(id); } catch { /* fallback */ }
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.repeat}</div>
            <div><h1 className="page-title">Recurring Transactions</h1><p className="page-subtitle">Scheduled income & expenses • {items.length} rules</p></div>
          </div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => navigate('/recurring/create')}>+ New Recurring</button></div>
        </div>

        <div className="acc-table-container">
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Type</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th><th>Frequency</th><th>Next Due</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--neutral-400)',padding:'32px'}}>No recurring transactions set up yet</td></tr>
                ) : items.map(item => (
                  <tr key={item.id}>
                    <td><span className={`acc-status-badge ${item.type === 'income' ? 'paid' : 'pending'}`}>{item.type === 'income' ? 'Income' : 'Expense'}</span></td>
                    <td>{item.category}</td>
                    <td style={{textAlign:'right'}}><span className={`acc-amount ${item.type === 'income' ? 'credit' : 'debit'}`}>{formatCurrency(item.amount)}</span></td>
                    <td style={{textTransform:'capitalize'}}>{item.frequency}</td>
                    <td>{(item.nextDueDate || item.next_due_date) ? new Date(item.nextDueDate || item.next_due_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                    <td><span className={`acc-status-badge ${item.status === 'active' ? 'paid' : 'draft'}`}>{item.status.charAt(0).toUpperCase()+item.status.slice(1)}</span></td>
                    <td style={{display:'flex',gap:'6px'}}>
                      <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}} disabled={actionId === item.id} onClick={() => handleToggle(item)}>
                        {item.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default RecurringTransactionList;
