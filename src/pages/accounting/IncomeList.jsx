// Income List - Track all incoming money
import { useState } from 'react';
import Layout from '../../components/Layout';
import IncomeModal from '../../components/accounting/IncomeModal';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function IncomeList() {
  const { showSnackbar } = useSnackbar();
  const { data: incomes, setData: setIncomes, loading, error } = useAccountingFetch(getIncomes, []);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');


  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const categories = [...new Set(incomes.map(i => i.category))];
  const filtered = incomes.filter(i => {
    const matchSearch = (i.category || '').toLowerCase().includes(searchQuery.toLowerCase()) || (i.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) || (i.reference || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const handleSave = async (income) => {
    try {
      if (editingIncome) {
        const response = await updateIncome(editingIncome.id, income);
        const updated = response.data?.data || response.data || income;
        setIncomes(incomes.map(i => i.id === editingIncome.id ? updated : i));
      } else {
        const response = await createIncome(income);
        const created = response.data?.data || response.data;
        if (created?.id) setIncomes([created, ...incomes]);
      }
      showSnackbar(editingIncome ? 'Income updated.' : 'Income recorded.', 'success');
      setShowModal(false); setEditingIncome(null);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not save this income entry. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this income entry? This cannot be undone.')) {
      try {
        await deleteIncome(id);
        setIncomes(incomes.filter(i => i.id !== id));
        showSnackbar('Income entry deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this income entry. Please try again.', 'error');
      }
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon" >{ICONS.income}</div><div><h1 className="page-title">Income</h1><p className="page-subtitle">Track all incoming money</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => { setEditingIncome(null); setShowModal(true); }}>+ Record Income</button></div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.income}</div></div><p className="kpi-value">{formatCurrency(totalIncome)}</p><p className="kpi-label">Total Income</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.dashboard}</div></div><p className="kpi-value">{incomes.length}</p><p className="kpi-label">Entries</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.reports}</div></div><p className="kpi-value">{formatCurrency(totalIncome / (incomes.length || 1))}</p><p className="kpi-label">Average Income</p></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search income..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              <thead><tr><th>Date</th><th>Category</th><th>Customer</th><th>Payment Method</th><th>Reference</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--neutral-400)',padding:'32px'}}>{incomes.length === 0 ? 'No income recorded yet' : 'No income entries match your filters'}</td></tr>
                ) : filtered.map(income => (
                  <tr key={income.id}>
                    <td>{new Date(income.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td><span className="acc-status-badge paid">{income.category}</span></td>
                    <td>{income.customer || '-'}</td>
                    <td>{income.paymentMethod}</td>
                    <td style={{fontFamily:'monospace',fontSize:'12px'}}>{income.reference || '-'}</td>
                    <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(income.amount)}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => { setEditingIncome(income); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDelete(income.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && <IncomeModal income={editingIncome} onSave={handleSave} onClose={() => { setShowModal(false); setEditingIncome(null); }} />}
      </div>
    </Layout>
  );
}

export default IncomeList;
