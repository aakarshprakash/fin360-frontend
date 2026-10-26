// Accounting Customer Detail - Ledger and transaction history
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAccountingCustomer, getCustomerLedger } from '../../utils/accountingApi';
import '../../styles/Accounting.css';

function AccountingCustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setError(false);
      try {
        const [custRes, ledgerRes] = await Promise.all([
          getAccountingCustomer(id),
          getCustomerLedger(id),
        ]);
        if (cancelled) return;
        const custRaw = custRes.data?.data || custRes.data;
        if (custRaw?.id) {
          setCustomer(custRaw);
        } else {
          setError(true);
        }
        const ledgerRaw = ledgerRes.data?.data || ledgerRes.data;
        const lData = ledgerRaw?.entries || ledgerRaw;
        setLedger(Array.isArray(lData) ? lData : []);
      } catch {
        if (cancelled) return;
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (loading) return <Layout><div className="accounting-page"><div className="acc-loading"><span className="spinner"></span> Loading...</div></div></Layout>;

  if (error || !customer) {
    return (
      <Layout>
        <div className="accounting-page">
          <Link to="/customers" className="acc-back-link">← Back to Customers</Link>
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
        <Link to="/customers" className="acc-back-link">← Back to Customers</Link>

        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">👤</div>
            <div>
              <h1 className="page-title">{customer.name}</h1>
              <p className="page-subtitle">{customer.email} • {customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Customer Info Cards */}
        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <p className="kpi-label">Outstanding Balance</p>
            <p className="kpi-value" style={{color:'var(--primary-600)'}}>{formatCurrency(customer.balance)}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Credit Limit</p>
            <p className="kpi-value">{formatCurrency(customer.creditLimit)}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">GST Number</p>
            <p className="kpi-value" style={{fontSize:'16px',fontFamily:'monospace'}}>{customer.gstNumber || 'N/A'}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Currency</p>
            <p className="kpi-value" style={{fontSize:'18px'}}>{customer.currency}</p>
          </div>
        </div>

        {/* Ledger */}
        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <h3 style={{margin:0,fontSize:'16px',fontWeight:600}}>Customer Ledger</h3>
          </div>
          <table className="acc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th style={{textAlign:'right'}}>Debit</th>
                <th style={{textAlign:'right'}}>Credit</th>
                <th style={{textAlign:'right'}}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td style={{fontWeight:500}}>{entry.description}</td>
                  <td style={{textAlign:'right'}}>{entry.debit > 0 ? <span className="acc-amount debit">{formatCurrency(entry.debit)}</span> : '-'}</td>
                  <td style={{textAlign:'right'}}>{entry.credit > 0 ? <span className="acc-amount credit">{formatCurrency(entry.credit)}</span> : '-'}</td>
                  <td style={{textAlign:'right'}}><span className="acc-amount">{formatCurrency(entry.balance)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default AccountingCustomerDetail;

