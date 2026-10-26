// Expense List - Track all business expenses
import { useState } from 'react';
import Layout from '../../components/Layout';
import ExpenseModal from '../../components/accounting/ExpenseModal';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function ExpenseList() {
  const { showSnackbar } = useSnackbar();
  const { data: expenses, setData: setExpenses, loading, error } = useAccountingFetch(getExpenses, []);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');


  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const categories = [...new Set(expenses.map(e => e.category))];
  const filtered = expenses.filter(e => {
    const matchSearch = (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.vendor || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchSearch && matchCat;
  });
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleSave = async (expense) => {
    try {
      if (editingExpense) {
        const response = await updateExpense(editingExpense.id, expense);
        const updated = response.data?.data || response.data || expense;
        setExpenses(expenses.map(e => e.id === editingExpense.id ? updated : e));
      } else {
        const response = await createExpense(expense);
        const created = response.data?.data || response.data;
        if (created?.id) setExpenses([created, ...expenses]);
      }
      showSnackbar(editingExpense ? 'Expense updated.' : 'Expense recorded.', 'success');
      setShowModal(false); setEditingExpense(null);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not save this expense. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense entry? This cannot be undone.')) {
      try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
        showSnackbar('Expense deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this expense. Please try again.', 'error');
      }
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon" >{ICONS.expense}</div><div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Track all business expenses</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => { setEditingExpense(null); setShowModal(true); }}>+ Record Expense</button></div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.expense}</div></div><p className="kpi-value">{formatCurrency(totalExpenses)}</p><p className="kpi-label">Total Expenses</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.dashboard}</div></div><p className="kpi-value">{expenses.length}</p><p className="kpi-label">Entries</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.trendDown}</div></div><p className="kpi-value">{formatCurrency(totalExpenses / (expenses.length || 1))}</p><p className="kpi-label">Average Expense</p></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="acc-filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Date</th><th>Category</th><th>Vendor</th><th>Payment Method</th><th>Reference</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--neutral-400)',padding:'32px'}}>{expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match your filters'}</td></tr>
                ) : filtered.map(expense => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td><span className="acc-status-badge overdue">{expense.category}</span></td>
                    <td>{expense.vendor || '-'}</td>
                    <td>{expense.paymentMethod}</td>
                    <td style={{fontFamily:'monospace',fontSize:'12px'}}>{expense.reference || '-'}</td>
                    <td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(expense.amount)}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => { setEditingExpense(expense); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDelete(expense.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && <ExpenseModal expense={editingExpense} onSave={handleSave} onClose={() => { setShowModal(false); setEditingExpense(null); }} />}
      </div>
    </Layout>
  );
}

export default ExpenseList;
