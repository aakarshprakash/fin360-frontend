// Accounting Customers Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import CustomerModal from '../../components/accounting/CustomerModal';
import { getAccountingCustomers, createAccountingCustomer, updateAccountingCustomer, deleteAccountingCustomer } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function AccountingCustomers() {
  const navigate = useNavigate();
  const { data: customers, setData: setCustomers, loading, error } = useAccountingFetch(getAccountingCustomers, []);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');


  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.gstNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (customer) => {
    try {
      if (editingCustomer) {
        const response = await updateAccountingCustomer(editingCustomer.id, customer);
        const updated = response.data || customer;
        setCustomers(customers.map(c => c.id === updated.id ? updated : c));
      } else {
        const response = await createAccountingCustomer(customer);
        const created = response.data || { ...customer, id: Date.now() };
        setCustomers([...customers, created]);
      }
    } catch {
      if (editingCustomer) {
        setCustomers(customers.map(c => c.id === customer.id ? customer : c));
      } else {
        setCustomers([...customers, { ...customer, id: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try { await deleteAccountingCustomer(id); } catch { /* fallback */ }
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.customer}</div>
            <div>
              <h1 className="page-title">Customers</h1>
              <p className="page-subtitle">Manage customer accounts • {customers.length} customers</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { setEditingCustomer(null); setShowModal(true); }}>
              + Add Customer
            </button>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon" >{ICONS.customer}</div></div>
            <p className="kpi-value">{customers.length}</p>
            <p className="kpi-label">Total Customers</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon" >{ICONS.income}</div></div>
            <p className="kpi-value">{formatCurrency(customers.reduce((s,c) => s + (Number(c.balance) || 0), 0))}</p>
            <p className="kpi-label">Total Receivable</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon" >{ICONS.dashboard}</div></div>
            <p className="kpi-value">{formatCurrency(customers.reduce((s,c) => s + (Number(c.creditLimit) || 0), 0))}</p>
            <p className="kpi-label">Total Credit Limit</p>
          </div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search customers..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <div className="acc-loading"><span className="spinner"></span> Loading...</div>
          ) : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : filtered.length === 0 ? (
            <div className="acc-empty-state">
              <div className="empty-icon">{ICONS.customer}</div>
              <h3>No customers found</h3>
              <p>Add your first customer to get started</p>
            </div>
          ) : (
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>GST Number</th>
                  <th>Phone</th>
                  <th>Currency</th>
                  <th style={{textAlign:'right'}}>Balance</th>
                  <th style={{textAlign:'right'}}>Credit Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.id} onClick={() => navigate(`/customers/${customer.id}`)}>
                    <td>
                      <div><strong>{customer.name}</strong></div>
                      <div style={{fontSize:'12px',color:'var(--neutral-500)'}}>{customer.email}</div>
                    </td>
                    <td style={{fontFamily:'monospace',fontSize:'12px'}}>{customer.gstNumber || '-'}</td>
                    <td>{customer.phone}</td>
                    <td><span className="acc-status-badge active">{customer.currency}</span></td>
                    <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(customer.balance, customer.currency)}</span></td>
                    <td style={{textAlign:'right'}}>{formatCurrency(customer.creditLimit, customer.currency)}</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}}
                          onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}}
                          onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <CustomerModal customer={editingCustomer} onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingCustomer(null); }} />
        )}
      </div>
    </Layout>
  );
}

export default AccountingCustomers;

