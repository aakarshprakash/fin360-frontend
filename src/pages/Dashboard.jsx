// Dashboard — the Fin360 home: KPIs, income vs expenses, expense mix,
// recent cash movements and invoices coming due. Data: GET /accounting/dashboard/overview
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, CalendarRange, FileText, Receipt, ScrollText,
  TrendingUp, Wallet, Plus, FileClock,
} from 'lucide-react';
import Layout from '../components/Layout';
import { IncomeExpenseBars, ExpenseDonut, Sparkline } from '../components/charts/FinCharts';
import { SERIES } from '../components/charts/chartColors';
import { getDashboardOverview } from '../utils/accountingApi';
import { useAccountingFetch } from '../utils/useAccountingFetch';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { formatDate, formatMoney, toISODate } from '../utils/format';
import '../styles/FinDashboard.css';

const PERIODS = [
  { id: 'this-month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'this-quarter', label: 'This quarter' },
  { id: 'this-fy', label: 'This financial year' },
  { id: 'last-12', label: 'Last 12 months' },
  { id: 'custom', label: 'Custom range' },
];

function periodRange(id, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (id) {
    case 'last-month': return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case 'this-quarter': {
      const q = Math.floor(m / 3) * 3;
      return [new Date(y, q, 1), today];
    }
    case 'this-fy': {
      // Indian financial year: 1 April – 31 March
      const startYear = m >= 3 ? y : y - 1;
      return [new Date(startYear, 3, 1), today];
    }
    case 'last-12': return [new Date(y, m - 11, 1), today];
    case 'this-month':
    default: return [new Date(y, m, 1), today];
  }
}

const EMPTY = {
  period: {},
  kpis: {},
  monthly: [],
  expenseBreakdown: [],
  recent: [],
  upcomingInvoices: [],
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Delta({ value, upIsGood = true }) {
  if (value === null || value === undefined) {
    return <span className="fd-delta is-flat">No prior data</span>;
  }
  const up = value >= 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`fd-delta ${good ? 'is-good' : 'is-bad'}`}>
      <Icon size={12} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
}

function KpiCard({ label, value, tone, delta, upIsGood, spark, sparkColor, footer, to }) {
  const body = (
    <>
      <div className="fd-kpi-head">
        <span className={`fd-kpi-dot is-${tone}`} />
        <span className="fd-kpi-label">{label}</span>
      </div>
      <div className="fd-kpi-value">{value}</div>
      <div className="fd-kpi-foot">
        {footer ?? <Delta value={delta} upIsGood={upIsGood} />}
        {spark && <Sparkline values={spark} color={sparkColor} />}
      </div>
    </>
  );
  return to
    ? <Link to={to} className="fd-card fd-kpi is-link">{body}</Link>
    : <div className="fd-card fd-kpi">{body}</div>;
}

function dueLabel(days) {
  if (days === null || days === undefined) return { text: 'No due date', tone: 'muted' };
  if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`, tone: 'danger' };
  if (days === 0) return { text: 'Due today', tone: 'warn' };
  return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: days <= 7 ? 'warn' : 'muted' };
}

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const canManage = hasPermission('manage_accounting');
  const [period, setPeriod] = useState('this-fy');
  const [custom, setCustom] = useState(() => {
    const [from, to] = periodRange('this-month');
    return { from: toISODate(from), to: toISODate(to) };
  });

  const range = useMemo(() => {
    if (period === 'custom') return custom;
    const [from, to] = periodRange(period);
    return { from: toISODate(from), to: toISODate(to) };
  }, [period, custom]);

  const { data, loading, error } = useAccountingFetch(
    useCallback(() => getDashboardOverview(range), [range]),
    EMPTY,
    { deps: [range.from, range.to] }
  );

  const { kpis, monthly, expenseBreakdown, recent, upcomingInvoices } = data;
  const firstName = (user?.name || '').split(' ')[0];

  const quickActions = [
    { label: 'Create Invoice', icon: FileText, to: '/invoices/create', tone: 'purple' },
    { label: 'Record Income', icon: TrendingUp, to: '/income', tone: 'green' },
    { label: 'Record Expense', icon: Wallet, to: '/expenses', tone: 'orange' },
    { label: 'New Bill', icon: Receipt, to: '/bills/create', tone: 'pink' },
    { label: 'New Quotation', icon: ScrollText, to: '/quotations/create', tone: 'slate' },
  ];

  return (
    <Layout>
      <div className="fd-page">
        <header className="fd-header">
          <div>
            <p className="fd-eyebrow">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="fd-title">Dashboard</h1>
          </div>
          <div className="fd-header-actions">
            <label className="fd-period">
              <CalendarRange size={16} />
              <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Reporting period">
                {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
            {period === 'custom' && (
              <div className="fd-custom-range">
                <input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="From date" />
                <span>–</span>
                <input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="To date" />
              </div>
            )}
            {canManage && (
              <button type="button" className="fd-btn-primary" onClick={() => navigate('/invoices/create')}>
                <Plus size={16} strokeWidth={2.5} /> Create Invoice
              </button>
            )}
          </div>
        </header>

        <p className="fd-range-note">
          {formatDate(range.from)} – {formatDate(range.to)}
          {error && <span className="fd-error"> · Couldn’t load the latest figures. Showing what’s available.</span>}
        </p>

        <section className={`fd-kpis ${loading ? 'is-loading' : ''}`} aria-label="Key figures">
          <KpiCard
            label="Total Income"
            tone="purple"
            value={formatMoney(kpis.totalIncome)}
            delta={kpis.incomeChange}
            spark={monthly.map((m) => m.income)}
            sparkColor={SERIES.income}
            to="/income"
          />
          <KpiCard
            label="Total Expenses"
            tone="orange"
            value={formatMoney(kpis.totalExpense)}
            delta={kpis.expenseChange}
            upIsGood={false}
            spark={monthly.map((m) => m.expense)}
            sparkColor={SERIES.expense}
            to="/expenses"
          />
          <KpiCard
            label="Net Balance"
            tone="green"
            value={formatMoney(kpis.netBalance)}
            delta={kpis.netChange}
            spark={monthly.map((m) => m.income - m.expense)}
            sparkColor="#059669"
          />
          <KpiCard
            label="Outstanding"
            tone="amber"
            value={formatMoney(kpis.outstanding)}
            footer={(
              <span className="fd-kpi-sub">
                <FileClock size={14} /> {kpis.outstandingCount || 0} open invoice{kpis.outstandingCount === 1 ? '' : 's'}
              </span>
            )}
            to="/invoices"
          />
        </section>

        {canManage && (
          <section className="fd-quick" aria-label="Quick actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.to} className="fd-quick-btn">
                  <span className={`fd-quick-icon is-${action.tone}`}><Icon size={18} /></span>
                  {action.label}
                </Link>
              );
            })}
          </section>
        )}

        <section className="fd-grid fd-grid-charts">
          <div className="fd-card">
            <div className="fd-card-head">
              <div>
                <h2>Income vs Expenses</h2>
                <p>Last 6 months</p>
              </div>
              <div className="fd-legend">
                <span><i style={{ background: SERIES.income }} />Income</span>
                <span><i style={{ background: SERIES.expense }} />Expenses</span>
              </div>
            </div>
            <IncomeExpenseBars data={monthly} />
          </div>

          <div className="fd-card">
            <div className="fd-card-head">
              <div>
                <h2>Expense Breakdown</h2>
                <p>By category, selected period</p>
              </div>
            </div>
            <ExpenseDonut data={expenseBreakdown} />
          </div>
        </section>

        <section className="fd-grid fd-grid-lists">
          <div className="fd-card">
            <div className="fd-card-head">
              <div>
                <h2>Recent Transactions</h2>
                <p>Payments received and made</p>
              </div>
              <Link to="/journal-entries" className="fd-link">View ledger</Link>
            </div>
            {recent.length === 0 ? (
              <p className="fd-empty">No payments or entries recorded yet.</p>
            ) : (
              <div className="fd-table-wrap">
                <table className="fd-table">
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Type</th><th className="is-num">Amount</th></tr>
                  </thead>
                  <tbody>
                    {recent.map((t) => (
                      <tr key={t.id}>
                        <td className="is-date">{formatDate(t.date)}</td>
                        <td className="is-desc">{t.description}</td>
                        <td><span className={`fd-pill is-${t.type}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span></td>
                        <td className={`is-num is-${t.type}`}>
                          {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="fd-card">
            <div className="fd-card-head">
              <div>
                <h2>Upcoming Invoices</h2>
                <p>Unpaid, soonest due first</p>
              </div>
              <Link to="/invoices" className="fd-link">View all</Link>
            </div>
            {upcomingInvoices.length === 0 ? (
              <p className="fd-empty">Nothing outstanding — every invoice is paid.</p>
            ) : (
              <ul className="fd-invoices">
                {upcomingInvoices.map((inv) => {
                  const due = dueLabel(inv.dueInDays);
                  return (
                    <li key={inv.id}>
                      <Link to={`/invoices/${inv.id}`}>
                        <span className="fd-inv-icon"><FileText size={17} /></span>
                        <span className="fd-inv-main">
                          <strong>{inv.customer || 'Walk-in customer'}</strong>
                          <small>{inv.invoiceNumber}</small>
                        </span>
                        <span className="fd-inv-side">
                          <strong>{formatMoney(inv.balance)}</strong>
                          <small className={`is-${due.tone}`}>{due.text}</small>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Dashboard;
