// Main App component - sets up routing for the entire application
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import UserList from './pages/UserList';
import UserDetail from './pages/UserDetail';
import Notifications from './pages/Notifications';
import Unauthorized from './pages/Unauthorized';
import ErrorPage from './pages/ErrorPage';
import ProtectedRoute from './components/ProtectedRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { firstSettingsPath } from './components/shell/navConfig';
import { hasAnyPermission } from './utils/permissions';

// Finance modules
import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import Products from './pages/accounting/Products';
import AccountingCustomers from './pages/accounting/AccountingCustomers';
import AccountingCustomerDetail from './pages/accounting/AccountingCustomerDetail';
import VendorList from './pages/accounting/VendorList';
import VendorDetail from './pages/accounting/VendorDetail';
import InvoiceList from './pages/accounting/InvoiceList';
import CreateInvoice from './pages/accounting/CreateInvoice';
import InvoiceDetail from './pages/accounting/InvoiceDetail';
import BillList from './pages/accounting/BillList';
import CreateBill from './pages/accounting/CreateBill';
import BillDetail from './pages/accounting/BillDetail';
import RecurringTransactionList from './pages/accounting/RecurringTransactionList';
import CreateRecurringTransaction from './pages/accounting/CreateRecurringTransaction';
import IncomeList from './pages/accounting/IncomeList';
import ExpenseList from './pages/accounting/ExpenseList';
import IncomeExpenseDashboard from './pages/accounting/IncomeExpenseDashboard';
import BankingList from './pages/accounting/BankingList';
import BankAccountDetail from './pages/accounting/BankAccountDetail';
import JournalEntryList from './pages/accounting/JournalEntryList';
import CreateJournalEntry from './pages/accounting/CreateJournalEntry';
import TaxManagement from './pages/accounting/TaxManagement';
import CurrencyManagement from './pages/accounting/CurrencyManagement';
import ReportsHub from './pages/accounting/ReportsHub';
import ReportViewer from './pages/accounting/ReportViewer';
import AccountingSettings from './pages/accounting/AccountingSettings';
import BranchList from './pages/accounting/BranchList';
import FinancialYearManagement from './pages/accounting/FinancialYearManagement';
import QuotationList from './pages/accounting/QuotationList';
import CreateQuotation from './pages/accounting/CreateQuotation';
import QuotationDetail from './pages/accounting/QuotationDetail';
import ProformaInvoiceList from './pages/accounting/ProformaInvoiceList';
import CreateProformaInvoice from './pages/accounting/CreateProformaInvoice';
import ProformaInvoiceDetail from './pages/accounting/ProformaInvoiceDetail';

import './App.css';

// Shorthand helper — keeps route declarations concise
const Guard = ({ perm, anyOf, allOf, children }) => (
  <ProtectedRoute permission={perm} anyOf={anyOf} allOf={allOf}>
    {children}
  </ProtectedRoute>
);

const VIEW = ['view_accounting', 'manage_accounting'];

// Old bookmarks used /accounting/<page>; everything now lives at the top level.
function LegacyAccountingRedirect() {
  const { pathname, search } = useLocation();
  const rest = pathname.replace(/^\/accounting/, '') || '/dashboard';
  const target = rest === '/settings' || rest === '/invoice-settings' ? '/settings/accounting' : rest;
  return <Navigate to={`${target}${search}`} replace />;
}

// /settings → first section this user may open; also honours old ?tab= links
function SettingsIndex() {
  const { search } = useLocation();
  const tab = new URLSearchParams(search).get('tab');
  if (tab) return <Navigate to={`/settings/${tab === 'titles' ? 'job-titles' : tab}`} replace />;
  return <Navigate to={firstSettingsPath(hasAnyPermission)} replace />;
}

// Old top-level master URLs now live under /settings
function ToSettings({ section }) {
  const { id } = useParams();
  return <Navigate to={`/settings/${section}${id ? `/${id}` : ''}`} replace />;
}

const ORG = ['view_settings', 'manage_settings'];

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/unauthorized"    element={<Unauthorized />} />

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <Route path="/dashboard" element={<Guard perm="view_accounting"><Dashboard /></Guard>} />
        <Route path="/income-expenses" element={<Guard anyOf={VIEW}><IncomeExpenseDashboard /></Guard>} />

        {/* ── Sales ─────────────────────────────────────────────────────── */}
        <Route path="/invoices" element={<Guard anyOf={['view_invoices', 'manage_accounting']}><InvoiceList /></Guard>} />
        <Route path="/invoices/create" element={<Guard perm="manage_accounting"><CreateInvoice /></Guard>} />
        <Route path="/invoices/:id" element={<Guard anyOf={['view_invoices', 'manage_accounting']}><InvoiceDetail /></Guard>} />
        <Route path="/invoices/:id/edit" element={<Guard perm="manage_accounting"><CreateInvoice /></Guard>} />

        <Route path="/quotations" element={<Guard anyOf={['view_quotations', 'manage_accounting']}><QuotationList /></Guard>} />
        <Route path="/quotations/create" element={<Guard perm="manage_accounting"><CreateQuotation /></Guard>} />
        <Route path="/quotations/:id" element={<Guard anyOf={['view_quotations', 'manage_accounting']}><QuotationDetail /></Guard>} />
        <Route path="/quotations/:id/edit" element={<Guard perm="manage_accounting"><CreateQuotation /></Guard>} />

        <Route path="/proforma-invoices" element={<Guard anyOf={['view_quotations', 'manage_accounting']}><ProformaInvoiceList /></Guard>} />
        <Route path="/proforma-invoices/create" element={<Guard perm="manage_accounting"><CreateProformaInvoice /></Guard>} />
        <Route path="/proforma-invoices/:id" element={<Guard anyOf={['view_quotations', 'manage_accounting']}><ProformaInvoiceDetail /></Guard>} />
        <Route path="/proforma-invoices/:id/edit" element={<Guard perm="manage_accounting"><CreateProformaInvoice /></Guard>} />

        <Route path="/customers" element={<Guard anyOf={VIEW}><AccountingCustomers /></Guard>} />
        <Route path="/customers/:id" element={<Guard anyOf={VIEW}><AccountingCustomerDetail /></Guard>} />

        {/* ── Purchases ─────────────────────────────────────────────────── */}
        <Route path="/bills" element={<Guard anyOf={VIEW}><BillList /></Guard>} />
        <Route path="/bills/create" element={<Guard perm="manage_accounting"><CreateBill /></Guard>} />
        <Route path="/bills/:id" element={<Guard anyOf={VIEW}><BillDetail /></Guard>} />
        <Route path="/bills/:id/edit" element={<Guard perm="manage_accounting"><CreateBill /></Guard>} />

        <Route path="/expenses" element={<Guard anyOf={['view_expenses', 'manage_accounting']}><ExpenseList /></Guard>} />

        <Route path="/vendors" element={<Guard anyOf={VIEW}><VendorList /></Guard>} />
        <Route path="/vendors/:id" element={<Guard anyOf={VIEW}><VendorDetail /></Guard>} />

        {/* ── Money ─────────────────────────────────────────────────────── */}
        <Route path="/income" element={<Guard anyOf={VIEW}><IncomeList /></Guard>} />
        <Route path="/banking" element={<Guard anyOf={VIEW}><BankingList /></Guard>} />
        <Route path="/banking/:id" element={<Guard anyOf={VIEW}><BankAccountDetail /></Guard>} />

        {/* ── Accounting ────────────────────────────────────────────────── */}
        <Route path="/journal-entries" element={<Guard anyOf={VIEW}><JournalEntryList /></Guard>} />
        <Route path="/journal-entries/create" element={<Guard perm="manage_accounting"><CreateJournalEntry /></Guard>} />
        <Route path="/chart-of-accounts" element={<Guard anyOf={VIEW}><ChartOfAccounts /></Guard>} />
        <Route path="/recurring" element={<Guard anyOf={VIEW}><RecurringTransactionList /></Guard>} />
        <Route path="/recurring/create" element={<Guard perm="manage_accounting"><CreateRecurringTransaction /></Guard>} />
        <Route path="/products" element={<Guard anyOf={VIEW}><Products /></Guard>} />

        {/* ── Reports ───────────────────────────────────────────────────── */}
        <Route path="/reports" element={<Guard anyOf={['view_reports', 'view_accounting']}><ReportsHub /></Guard>} />
        <Route path="/reports/:type" element={<Guard anyOf={['view_reports', 'view_accounting']}><ReportViewer /></Guard>} />

        {/* ── Settings: organization, finance masters, team, personal ──── */}
        <Route path="/settings" element={<Guard><SettingsIndex /></Guard>} />
        <Route path="/settings/company" element={<Guard anyOf={ORG}><Settings /></Guard>} />
        <Route path="/settings/branches" element={<Guard perm="accounting_settings"><BranchList /></Guard>} />
        <Route path="/settings/financial-years" element={<Guard perm="accounting_settings"><FinancialYearManagement /></Guard>} />
        <Route path="/settings/taxes" element={<Guard perm="accounting_settings"><TaxManagement /></Guard>} />
        <Route path="/settings/currencies" element={<Guard perm="accounting_settings"><CurrencyManagement /></Guard>} />

        <Route path="/settings/users" element={<Guard anyOf={['view_users', 'manage_users']}><UserList /></Guard>} />
        <Route path="/settings/users/:id" element={<Guard anyOf={['view_users', 'manage_users']}><UserDetail /></Guard>} />
        <Route path="/settings/users/:id/edit" element={<Guard perm="manage_users"><UserDetail /></Guard>} />
        <Route path="/settings/roles" element={<Guard perm="manage_roles"><Settings /></Guard>} />
        <Route path="/settings/departments" element={<Guard anyOf={[...ORG, 'view_departments', 'manage_departments']}><Settings /></Guard>} />
        <Route path="/settings/job-titles" element={<Guard anyOf={[...ORG, 'view_job_titles', 'manage_job_titles']}><Settings /></Guard>} />
        <Route path="/settings/profile" element={<Guard><Settings /></Guard>} />
        <Route path="/settings/security" element={<Guard><Settings /></Guard>} />
        <Route path="/settings/notifications" element={<Guard><Settings /></Guard>} />

        {['business', 'accounting', 'numbering', 'invoice-template', 'quotation-template', 'payment-methods'].map((s) => (
          <Route key={s} path={`/settings/${s}`} element={<Guard perm="accounting_settings"><AccountingSettings /></Guard>} />
        ))}

        <Route path="/taxes" element={<ToSettings section="taxes" />} />
        <Route path="/currencies" element={<ToSettings section="currencies" />} />
        <Route path="/branches" element={<ToSettings section="branches" />} />
        <Route path="/financial-years" element={<ToSettings section="financial-years" />} />
        <Route path="/users" element={<ToSettings section="users" />} />
        <Route path="/users/:id" element={<ToSettings section="users" />} />

        <Route path="/notifications" element={<Guard perm="view_notifications"><Notifications /></Guard>} />

        {/* ── Redirects ─────────────────────────────────────────────────── */}
        <Route path="/accounting/*" element={<LegacyAccountingRedirect />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ── Error Handling ────────────────────────────────────────────── */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </Router>
  );
}

export default App;
