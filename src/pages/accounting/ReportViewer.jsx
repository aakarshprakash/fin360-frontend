// Report Viewer - Configurable report page based on type
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getReport } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const reportConfigs = {
  'balance-sheet': { title: 'Balance Sheet', icon: ICONS.dashboard },
  'profit-loss': { title: 'Profit & Loss Statement', icon: ICONS.reports },
  'trial-balance': { title: 'Trial Balance', icon: ICONS.scale },
  'general-ledger': { title: 'General Ledger', icon: ICONS.journal },
  'cash-flow': { title: 'Cash Flow Statement', icon: ICONS.droplet },
  'income-report': { title: 'Income Report', icon: ICONS.income },
  'expense-report': { title: 'Expense Report', icon: ICONS.expense },
  'gst-summary': { title: 'GST Summary Report', icon: ICONS.tax },
};

function ReportViewer() {
  const { type } = useParams();
  const config = reportConfigs[type] || { title: 'Report', icon: ICONS.dashboard };
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-03-08');

  useEffect(() => {
    const controller = new AbortController();
    const fetchReport = async () => {
      setLoading(true);
      setError(false);
      try {
        const r = await getReport(type, { dateFrom, dateTo });
        if (controller.signal.aborted) return;
        const raw = r.data?.data || r.data;
        if (raw) {
          setReportData(raw);
        } else {
          setReportData(null);
          setError(true);
        }
      } catch {
        if (controller.signal.aborted) return;
        setReportData(null);
        setError(true);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    fetchReport();
    return () => { controller.abort(); };
  }, [type, dateFrom, dateTo]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const renderSectionReport = () => (
    <>
      {reportData.sections?.map((section, idx) => (
        <div key={idx} style={{marginBottom:'24px'}}>
          <h3 style={{fontSize:'16px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 12px',padding:'12px 20px',background:'var(--neutral-50)',borderRadius:'8px'}}>
            {section.title}
          </h3>
          <table className="acc-table">
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i}>
                  <td style={{paddingLeft:'40px'}}>{item.account || item.description}</td>
                  <td style={{textAlign:'right',fontWeight:500}}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr style={{background:'var(--neutral-100)',fontWeight:600}}>
                <td style={{paddingLeft:'40px'}}>Total {section.title}</td>
                <td style={{textAlign:'right'}}>{formatCurrency(section.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      {reportData.netProfit !== undefined && (
        <div style={{padding:'16px 20px',background:'var(--success-50)',borderRadius:'10px',display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'16px'}}>
          <span>Net Profit</span>
          <span style={{color:'var(--success-700)'}}>{formatCurrency(reportData.netProfit)}</span>
        </div>
      )}
      {reportData.netPayable !== undefined && (
        <div style={{padding:'16px 20px',background:'var(--primary-50)',borderRadius:'10px',display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'16px'}}>
          <span>Net GST Payable</span>
          <span style={{color:'var(--primary-600)'}}>{formatCurrency(reportData.netPayable)}</span>
        </div>
      )}
    </>
  );

  const renderTrialBalance = () => (
    <table className="acc-table">
      <thead><tr><th>Code</th><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
      <tbody>
        {reportData.items?.map((item, idx) => (
          <tr key={idx}>
            <td style={{fontVariantNumeric:'tabular-nums',color:'var(--neutral-400)'}}>{item.code}</td>
            <td>{item.account}</td>
            <td style={{textAlign:'right'}}>{item.debit > 0 ? <span className="acc-amount debit">{formatCurrency(item.debit)}</span> : '-'}</td>
            <td style={{textAlign:'right'}}>{item.credit > 0 ? <span className="acc-amount credit">{formatCurrency(item.credit)}</span> : '-'}</td>
          </tr>
        ))}
        <tr style={{background:'var(--neutral-100)',fontWeight:600}}>
          <td colSpan="2">Totals</td>
          <td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(reportData.totalDebit)}</span></td>
          <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(reportData.totalCredit)}</span></td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/reports" className="acc-back-link">← Back to Reports</Link>
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{config.icon}</div><div><h1 className="page-title">{config.title}</h1><p className="page-subtitle">Period: {dateFrom} to {dateTo}</p></div></div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-secondary" onClick={() => window.print()}>{ICONS.printer} Print</button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="acc-table-container" style={{padding:'16px 20px',marginBottom:'24px'}}>
          <div style={{display:'flex',gap:'16px',alignItems:'center',flexWrap:'wrap'}}>
            <div className="acc-form-group" style={{marginBottom:0}}>
              <label>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{padding:'8px 12px',border:'1px solid var(--neutral-200)',borderRadius:'8px'}} />
            </div>
            <div className="acc-form-group" style={{marginBottom:0}}>
              <label>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{padding:'8px 12px',border:'1px solid var(--neutral-200)',borderRadius:'8px'}} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="acc-loading"><span className="spinner"></span> Generating report...</div>
        ) : error || !reportData ? (
          <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
            Couldn't load this data. Please check your connection and try again.
          </div>
        ) : (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h2 style={{fontSize:'20px',fontWeight:600,textAlign:'center',margin:'0 0 24px',color:'var(--neutral-800)'}}>{config.title}</h2>
            <p style={{textAlign:'center',fontSize:'13px',color:'var(--neutral-500)',margin:'-16px 0 24px'}}>
              Period: {new Date(dateFrom).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} to {new Date(dateTo).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
            </p>
            {type === 'trial-balance' ? renderTrialBalance() : renderSectionReport()}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ReportViewer;

