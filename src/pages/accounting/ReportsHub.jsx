// Reports Hub - Links to all financial reports
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const reports = [
  { type: 'balance-sheet', title: 'Balance Sheet', icon: ICONS.dashboard, desc: 'Assets, liabilities and equity at a point in time' },
  { type: 'profit-loss', title: 'Profit & Loss', icon: ICONS.reports, desc: 'Revenue and expenses over a period' },
  { type: 'trial-balance', title: 'Trial Balance', icon: ICONS.scale, desc: 'All account balances to verify debits equal credits' },
  { type: 'general-ledger', title: 'General Ledger', icon: ICONS.journal, desc: 'Detailed transactions for every account' },
  { type: 'cash-flow', title: 'Cash Flow Statement', icon: ICONS.droplet, desc: 'Cash inflows and outflows by activity' },
  { type: 'income-report', title: 'Income Report', icon: ICONS.income, desc: 'All income categorized by source' },
  { type: 'expense-report', title: 'Expense Report', icon: ICONS.expense, desc: 'All expenses categorized by type' },
  { type: 'gst-summary', title: 'GST Summary Report', icon: ICONS.tax, desc: 'GST collected vs input tax credit' },
];

function ReportsHub() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.reports}</div><div><h1 className="page-title">Financial Reports</h1><p className="page-subtitle">Generate and view financial reports</p></div></div>
        </div>

        <div className="acc-card-grid">
          {reports.map(report => (
            <div key={report.type} className="acc-card" onClick={() => navigate(`/reports/${report.type}`)}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'var(--primary-100)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',color:'var(--primary-700)'}}>{report.icon}</div>
              <h3 style={{fontSize:'15px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 6px'}}>{report.title}</h3>
              <p style={{fontSize:'12px',color:'var(--neutral-500)',margin:0,lineHeight:'1.5'}}>{report.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default ReportsHub;

