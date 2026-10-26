// Income & Expense Dashboard
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getIncomeExpenseSummary } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const emptySummary = {
  dailyIncome: 0, monthlyIncome: 0, yearlyIncome: 0,
  dailyExpense: 0, monthlyExpense: 0, yearlyExpense: 0,
  incomeByCategory: [],
  expenseByCategory: [],
  incomeTrend: [],
};

function IncomeExpenseDashboard() {
  const navigate = useNavigate();
  const { data: raw, loading, error } = useAccountingFetch(getIncomeExpenseSummary, emptySummary);
  const [period, setPeriod] = useState('monthly');

  // Backend returns category rows as { category, total }; normalize to
  // { category, amount, pct } for the bar chart (pct computed client-side —
  // the API never returns one).
  const normalizeCategories = (rows) => {
    const list = Array.isArray(rows) ? rows.map(r => ({ category: r.category, amount: Number(r.total ?? r.amount) || 0 })) : [];
    const max = Math.max(1, ...list.map(r => r.amount));
    return list.map(r => ({ ...r, pct: Math.round((r.amount / max) * 100) }));
  };

  const data = {
    ...raw,
    incomeByCategory: normalizeCategories(raw.incomeByCategory),
    expenseByCategory: normalizeCategories(raw.expenseByCategory),
    incomeTrend: Array.isArray(raw.incomeTrend) ? raw.incomeTrend : [],
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const getPeriodIncome = () => period === 'daily' ? data.dailyIncome : period === 'monthly' ? data.monthlyIncome : data.yearlyIncome;
  const getPeriodExpense = () => period === 'daily' ? data.dailyExpense : period === 'monthly' ? data.monthlyExpense : data.yearlyExpense;

  const barColors = ['var(--primary-600)', 'var(--accent-500)', 'var(--warning-500)', 'var(--success-500)', 'var(--neutral-500)', 'var(--error-400)'];
  const maxTrend = Math.max(1, ...data.incomeTrend.flatMap(t => [t.income, t.expense]));

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon" >{ICONS.dashboard}</div><div><h1 className="page-title">Income & Expense Overview</h1><p className="page-subtitle">Financial summary and trends</p></div></div>
          <div className="header-actions">
            <div className="acc-tabs" style={{borderBottom:'none',marginBottom:0}}>
              {['daily','monthly','yearly'].map(p => (
                <button key={p} className={`acc-tab ${period===p?'active':''}`} onClick={() => setPeriod(p)} type="button">
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="acc-loading"><span className="spinner"></span> Loading...</div>
        ) : error ? (
          <div style={{padding:'16px 20px',marginBottom:'20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
            Couldn't load financial data. Please check your connection and try again.
          </div>
        ) : (
        <>
        {/* KPIs */}
        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.income}</div></div><p className="kpi-value" style={{color:'var(--success-700)'}}>{formatCurrency(getPeriodIncome())}</p><p className="kpi-label">Total Income ({period})</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.expense}</div></div><p className="kpi-value" style={{color:'var(--error-600)'}}>{formatCurrency(getPeriodExpense())}</p><p className="kpi-label">Total Expenses ({period})</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.reports}</div></div><p className="kpi-value" style={{color:'var(--primary-600)'}}>{formatCurrency(getPeriodIncome() - getPeriodExpense())}</p><p className="kpi-label">Net Profit ({period})</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.dashboard}</div></div><p className="kpi-value">{Math.round(((getPeriodIncome() - getPeriodExpense()) / (getPeriodIncome() || 1)) * 100)}%</p><p className="kpi-label">Profit Margin</p></div>
        </div>

        {/* Charts */}
        <div className="acc-charts-grid">
          {/* Income vs Expense Trend */}
          <div className="acc-chart-card">
            <h3>Income vs Expense Trend</h3>
            {data.incomeTrend.length === 0 ? (
              <div style={{padding:'32px 0',textAlign:'center',color:'var(--neutral-400)',fontSize:'13px'}}>No income or expense entries recorded yet</div>
            ) : (
            <>
            <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'220px',paddingTop:'20px'}}>
              {data.incomeTrend.map((item, idx) => (
                <div key={idx} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                  <div style={{display:'flex',gap:'2px',alignItems:'flex-end',width:'100%'}}>
                    <div style={{flex:1,height:`${(item.income/maxTrend)*180}px`,background:'var(--success-500)',borderRadius:'4px 4px 0 0',minHeight: item.income > 0 ? '10px' : '0'}} title={`Income: ${formatCurrency(item.income)}`} />
                    <div style={{flex:1,height:`${(item.expense/maxTrend)*180}px`,background:'var(--error-500)',borderRadius:'4px 4px 0 0',minHeight: item.expense > 0 ? '10px' : '0'}} title={`Expense: ${formatCurrency(item.expense)}`} />
                  </div>
                  <span style={{fontSize:'11px',color:'var(--neutral-500)',fontWeight:500}}>{item.month}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'20px',justifyContent:'center',marginTop:'12px'}}>
              <span style={{fontSize:'12px',display:'flex',alignItems:'center',gap:'6px'}}><span style={{width:'12px',height:'12px',background:'var(--success-500)',borderRadius:'3px',display:'inline-block'}}></span> Income</span>
              <span style={{fontSize:'12px',display:'flex',alignItems:'center',gap:'6px'}}><span style={{width:'12px',height:'12px',background:'var(--error-500)',borderRadius:'3px',display:'inline-block'}}></span> Expense</span>
            </div>
            </>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="acc-chart-card">
            <h3>Expense Breakdown</h3>
            {data.expenseByCategory.length === 0 ? (
              <div style={{padding:'32px 0',textAlign:'center',color:'var(--neutral-400)',fontSize:'13px'}}>No expenses recorded this month</div>
            ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'12px',paddingTop:'12px'}}>
              {data.expenseByCategory.map((item, idx) => (
                <div key={idx}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                    <span style={{fontSize:'13px',color:'var(--neutral-700)',fontWeight:500}}>{item.category}</span>
                    <span style={{fontSize:'13px',color:'var(--neutral-500)'}}>{formatCurrency(item.amount)}</span>
                  </div>
                  <div style={{height:'8px',background:'var(--neutral-100)',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{width:`${item.pct}%`,height:'100%',background:barColors[idx % barColors.length],borderRadius:'4px'}} />
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
        </>
        )}

        {/* Quick links */}
        <div className="acc-card-grid">
          <div className="acc-card" onClick={() => navigate('/income')}>
            <div style={{marginBottom:'8px'}}>{ICONS.income}</div>
            <h3 style={{fontSize:'15px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 4px'}}>Manage Income</h3>
            <p style={{fontSize:'13px',color:'var(--neutral-500)',margin:0}}>View and record income entries</p>
          </div>
          <div className="acc-card" onClick={() => navigate('/expenses')}>
            <div style={{marginBottom:'8px'}}>{ICONS.expense}</div>
            <h3 style={{fontSize:'15px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 4px'}}>Manage Expenses</h3>
            <p style={{fontSize:'13px',color:'var(--neutral-500)',margin:0}}>View and record expense entries</p>
          </div>
          <div className="acc-card" onClick={() => navigate('/reports/profit-loss')}>
            <div style={{marginBottom:'8px'}}>{ICONS.reports}</div>
            <h3 style={{fontSize:'15px',fontWeight:600,color:'var(--neutral-800)',margin:'0 0 4px'}}>P&L Report</h3>
            <p style={{fontSize:'13px',color:'var(--neutral-500)',margin:0}}>Detailed profit & loss statement</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default IncomeExpenseDashboard;
