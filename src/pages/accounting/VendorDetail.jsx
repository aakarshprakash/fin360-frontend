// Vendor Detail - Ledger and payment history
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getVendor, getVendorLedger } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function VendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setError(false);
      try {
        const [vendorRes, ledgerRes] = await Promise.all([getVendor(id), getVendorLedger(id)]);
        if (cancelled) return;
        const vendorRaw = vendorRes.data?.data || vendorRes.data;
        if (vendorRaw?.id) {
          setVendor(vendorRaw);
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

  if (error || !vendor) {
    return (
      <Layout>
        <div className="accounting-page">
          <Link to="/vendors" className="acc-back-link">← Back to Vendors</Link>
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
        <Link to="/vendors" className="acc-back-link">← Back to Vendors</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.vendor}</div>
            <div>
              <h1 className="page-title">{vendor.name}</h1>
              <p className="page-subtitle">{vendor.email} • {vendor.paymentTerms}</p>
            </div>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><p className="kpi-label">Outstanding Balance</p><p className="kpi-value" style={{color:'var(--error-600)'}}>{formatCurrency(vendor.balance)}</p></div>
          <div className="acc-kpi-card"><p className="kpi-label">GST Number</p><p className="kpi-value" style={{fontSize:'16px',fontFamily:'monospace'}}>{vendor.gstNumber}</p></div>
          <div className="acc-kpi-card"><p className="kpi-label">Payment Terms</p><p className="kpi-value" style={{fontSize:'18px'}}>{vendor.paymentTerms}</p></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar"><h3 style={{margin:0,fontSize:'16px',fontWeight:600}}>Vendor Ledger</h3></div>
          <table className="acc-table">
            <thead><tr><th>Date</th><th>Description</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th><th style={{textAlign:'right'}}>Balance</th></tr></thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td>{new Date(entry.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                  <td style={{fontWeight:500}}>{entry.description}</td>
                  <td style={{textAlign:'right'}}>{entry.debit > 0 ? <span className="acc-amount credit">{formatCurrency(entry.debit)}</span> : '-'}</td>
                  <td style={{textAlign:'right'}}>{entry.credit > 0 ? <span className="acc-amount debit">{formatCurrency(entry.credit)}</span> : '-'}</td>
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

export default VendorDetail;

