// Bank Account Detail - Transaction history and reconciliation
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import BankTransactionModal from '../../components/accounting/BankTransactionModal';
import { getBankAccount, getBankTransactions, createBankTransaction } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function BankAccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setError(false);
      try {
        const [accRes, txnRes] = await Promise.all([getBankAccount(id), getBankTransactions(id)]);
        if (cancelled) return;
        const accRaw = accRes.data?.data || accRes.data;
        if (accRaw?.id) {
          setAccount(accRaw);
        } else {
          setError(true);
        }
        const txnRaw = txnRes.data?.data || txnRes.data;
        const tData = txnRaw?.transactions || txnRaw;
        setTransactions(Array.isArray(tData) ? tData : []);
      } catch {
        if (cancelled) return;
        setError(true);
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handleSaveTxn = async (txn) => {
    try { await createBankTransaction(id, txn); } catch { /* fallback */ }
    setTransactions([txn, ...transactions]);
    setShowTxnModal(false);
  };

  const filteredTxns = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);
  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' || t.type === 'transfer').reduce((s, t) => s + t.amount, 0);

  if (loading) return <Layout><div className="accounting-page"><div className="acc-loading"><span className="spinner"></span> Loading...</div></div></Layout>;

  if (error || !account) {
    return (
      <Layout>
        <div className="accounting-page">
          <Link to="/banking" className="acc-back-link">← Back to Banking</Link>
          <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
            Couldn't load this data. Please check your connection and try again.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/banking" className="acc-back-link">← Back to Banking</Link>
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.bankBuilding}</div><div><h1 className="page-title">{account.bankName}</h1><p className="page-subtitle">{account.accountNumber} • {account.accountType}</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => setShowTxnModal(true)}>+ Record Transaction</button></div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.income}</div></div><p className="kpi-value" style={{color:'var(--primary-600)'}}>{formatCurrency(account.balance)}</p><p className="kpi-label">Current Balance</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.bill}</div></div><p className="kpi-value" style={{color:'var(--success-700)'}}>{formatCurrency(totalDeposits)}</p><p className="kpi-label">Total Deposits</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.expense}</div></div><p className="kpi-value" style={{color:'var(--error-600)'}}>{formatCurrency(totalWithdrawals)}</p><p className="kpi-label">Total Withdrawals</p></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <h3 style={{margin:0,fontSize:'16px',fontWeight:600}}>Transaction History</h3>
            <select className="acc-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option><option value="deposit">Deposits</option><option value="withdrawal">Withdrawals</option><option value="transfer">Transfers</option>
            </select>
          </div>
          <table className="acc-table">
            <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Type</th><th style={{textAlign:'right'}}>Amount</th><th style={{textAlign:'right'}}>Balance</th></tr></thead>
            <tbody>
              {filteredTxns.map(txn => (
                <tr key={txn.id}>
                  <td>{new Date(txn.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td style={{fontWeight:500}}>{txn.description}</td>
                  <td style={{fontFamily:'monospace',fontSize:'12px'}}>{txn.reference}</td>
                  <td><span className={`acc-status-badge ${txn.type === 'deposit' ? 'paid' : txn.type === 'withdrawal' ? 'overdue' : 'pending'}`}>
                    {txn.type === 'deposit' ? '↗ Deposit' : txn.type === 'withdrawal' ? '↙ Withdrawal' : '↔ Transfer'}
                  </span></td>
                  <td style={{textAlign:'right'}}><span className={`acc-amount ${txn.type === 'deposit' ? 'credit' : 'debit'}`}>
                    {txn.type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span></td>
                  <td style={{textAlign:'right'}}><span className="acc-amount">{formatCurrency(txn.balance)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showTxnModal && <BankTransactionModal bankAccountId={id} onSave={handleSaveTxn} onClose={() => setShowTxnModal(false)} />}
      </div>
    </Layout>
  );
}

export default BankAccountDetail;

