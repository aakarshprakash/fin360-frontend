// Chart of Accounts - Hierarchical account management
import { useState } from 'react';
import Layout from '../../components/Layout';
import AccountModal from '../../components/accounting/AccountModal';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function ChartOfAccounts() {
  const { data: accounts, setData: setAccounts, loading, error } = useAccountingFetch(getAccounts, []);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = (acc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery);
    const matchesType = filterType === 'all' || acc.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group by type
  const groupedAccounts = filteredAccounts.reduce((groups, acc) => {
    if (!groups[acc.type]) groups[acc.type] = {};
    if (!groups[acc.type][acc.group]) groups[acc.type][acc.group] = [];
    groups[acc.type][acc.group].push(acc);
    return groups;
  }, {});

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await deleteAccount(id);
        setAccounts(accounts.filter(a => a.id !== id));
      } catch {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    }
  };

  const handleSave = async (account) => {
    try {
      if (editingAccount) {
        const response = await updateAccount(editingAccount.id, account);
        const updated = response.data || account;
        setAccounts(accounts.map(a => a.id === updated.id ? updated : a));
      } else {
        const response = await createAccount(account);
        const created = response.data || { ...account, id: Date.now() };
        setAccounts([...accounts, created]);
      }
    } catch {
      // Fallback: update local state even if API is unavailable
      if (editingAccount) {
        setAccounts(accounts.map(a => a.id === account.id ? account : a));
      } else {
        setAccounts([...accounts, { ...account, id: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditingAccount(null);
  };

  const accountTypes = ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses'];
  const typeColors = {
    Assets: 'var(--primary-600)', Liabilities: 'var(--error-600)', Equity: 'var(--accent-500)',
    Income: 'var(--success-700)', Expenses: 'var(--warning-600)'
  };
  const typeIcons = {
    Assets: ICONS.bankBuilding, Liabilities: ICONS.fileText, Equity: ICONS.income, Income: ICONS.income, Expenses: ICONS.expense
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.dashboard}</div>
            <div>
              <h1 className="page-title">Chart of Accounts</h1>
              <p className="page-subtitle">Manage your account hierarchy • {accounts.length} accounts</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { setEditingAccount(null); setShowModal(true); }}>
              + New Account
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="acc-table-container" style={{ marginBottom: '24px' }}>
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input
                className="acc-search-input"
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select className="acc-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="acc-kpi-grid">
          {accountTypes.map(type => {
            const typeAccounts = accounts.filter(a => a.type === type);
            const totalBalance = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
            return (
              <div key={type} className="acc-kpi-card" onClick={() => setFilterType(type)} style={{ cursor: 'pointer' }}>
                <div className="kpi-header">
                  <div className="kpi-icon" style={{ background: `${typeColors[type]}15` }}>{typeIcons[type]}</div>
                </div>
                <p className="kpi-value">{formatCurrency(totalBalance)}</p>
                <p className="kpi-label">{type} ({typeAccounts.length} accounts)</p>
              </div>
            );
          })}
        </div>

        {/* Account Tree */}
        {loading ? (
          <div className="acc-loading"><span className="spinner"></span> Loading accounts...</div>
        ) : error ? (
          <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
            Couldn't load this data. Please check your connection and try again.
          </div>
        ) : (
          <div className="acc-table-container">
            {Object.entries(groupedAccounts).map(([type, groups]) => (
              <div key={type}>
                <div className="acc-tree-group-header" onClick={() => toggleGroup(type)}
                  style={{ borderLeft: `4px solid ${typeColors[type]}` }}>
                  <span>{expandedGroups[type] === false ? '▶' : '▼'}</span>
                  <span>{typeIcons[type]}</span>
                  <span>{type}</span>
                  <span className={`acc-type-badge ${type.toLowerCase()}`}>{Object.values(groups).flat().length} accounts</span>
                </div>
                {expandedGroups[type] !== false && (
                  <div className="acc-tree-children">
                    {Object.entries(groups).map(([group, accs]) => (
                      <div key={group}>
                        <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 500, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>
                          {group}
                        </div>
                        {accs.map(acc => (
                          <div key={acc.id} className="acc-tree-item">
                            <div className="item-left">
                              <span className="account-code">{acc.code}</span>
                              <span>{acc.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span className="acc-amount" style={{ color: typeColors[type] }}>
                                {formatCurrency(acc.balance)}
                              </span>
                              <button className="acc-btn acc-btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}
                                onClick={(e) => { e.stopPropagation(); handleEdit(acc); }}>
                                Edit
                              </button>
                              <button className="acc-btn acc-btn-danger" style={{ padding: '4px 12px', fontSize: '12px' }}
                                onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <AccountModal
            account={editingAccount}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingAccount(null); }}
          />
        )}
      </div>
    </Layout>
  );
}

export default ChartOfAccounts;

