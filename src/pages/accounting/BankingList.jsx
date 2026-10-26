// Banking List - Manage bank accounts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import BankAccountModal from '../../components/accounting/BankAccountModal';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function BankingList() {
  const navigate = useNavigate();
  const { data: bankAccounts, setData: setBankAccounts, loading, error } = useAccountingFetch(getBankAccounts, []);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);


  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const totalBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);

  const handleSave = async (account) => {
    try {
      if (editingAccount) {
        const response = await updateBankAccount(editingAccount.id, account);
        const updated = response.data || account;
        setBankAccounts(bankAccounts.map(a => a.id === updated.id ? updated : a));
      } else {
        const response = await createBankAccount(account);
        const created = response.data || { ...account, id: Date.now() };
        setBankAccounts([...bankAccounts, created]);
      }
    } catch {
      if (editingAccount) { setBankAccounts(bankAccounts.map(a => a.id === account.id ? account : a)); }
      else { setBankAccounts([...bankAccounts, { ...account, id: Date.now() }]); }
    }
    setShowModal(false); setEditingAccount(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bank account?')) {
      try { await deleteBankAccount(id); } catch { /* fallback */ }
      setBankAccounts(bankAccounts.filter(a => a.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.bankBuilding}</div><div><h1 className="page-title">Banking</h1><p className="page-subtitle">Manage bank accounts and transactions</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => { setEditingAccount(null); setShowModal(true); }}>+ Add Account</button></div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.bankBuilding}</div></div><p className="kpi-value">{formatCurrency(totalBalance)}</p><p className="kpi-label">Total Balance ({bankAccounts.length} accounts)</p></div>
        </div>

        {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
          <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
            Couldn't load this data. Please check your connection and try again.
          </div>
        ) : (
          <div className="acc-card-grid">
            {bankAccounts.map(account => (
              <div key={account.id} className="acc-card" onClick={() => navigate(`/banking/${account.id}`)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <div style={{display:'flex',alignItems:'center'}}>{account.accountType === 'Cash' ? ICONS.wallet : ICONS.bankBuilding}</div>
                  <span className="acc-status-badge active">{account.accountType}</span>
                </div>
                <h3 style={{fontSize:'16px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 4px'}}>{account.bankName}</h3>
                <p style={{fontSize:'13px',color:'var(--neutral-500)',margin:'0 0 12px',fontVariantNumeric:'tabular-nums'}}>{account.accountNumber}</p>
                <p style={{fontSize:'24px',fontWeight:700,color:'var(--primary-600)',margin:'0 0 4px'}}>{formatCurrency(account.balance)}</p>
                <p style={{fontSize:'12px',color:'var(--neutral-400)',margin:0}}>Opening: {formatCurrency(account.openingBalance)}</p>
                <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
                  <button className="acc-btn acc-btn-secondary" style={{padding:'4px 12px',fontSize:'12px',flex:1}} onClick={(e) => { e.stopPropagation(); setEditingAccount(account); setShowModal(true); }}>Edit</button>
                  <button className="acc-btn acc-btn-danger" style={{padding:'4px 12px',fontSize:'12px'}} onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && <BankAccountModal account={editingAccount} onSave={handleSave} onClose={() => { setShowModal(false); setEditingAccount(null); }} />}
      </div>
    </Layout>
  );
}

export default BankingList;

