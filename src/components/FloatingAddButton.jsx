// Floating Action Button (FAB) for quick creation — context-aware based on
// the current section (each section gets its own "+ New X" target; anywhere
// else it defaults to a new invoice).
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/FloatingAddButton.css';

const CONTEXT_TARGETS = [
  { match: /^\/bills/, target: '/bills/create', label: 'Add New Bill' },
  { match: /^\/quotations/, target: '/quotations/create', label: 'Add New Quotation' },
  { match: /^\/proforma-invoices/, target: '/proforma-invoices/create', label: 'Add New Proforma Invoice' },
  { match: /^\/journal-entries/, target: '/journal-entries/create', label: 'Add New Journal Entry' },
  { match: /^\/recurring/, target: '/recurring/create', label: 'Add New Recurring Transaction' },
];

const DEFAULT_TARGET = { target: '/invoices/create', label: 'Create Invoice' };

function FloatingAddButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on create/edit pages (the FAB shouldn't float over its own destination),
  // on the dashboard (it has its own Create Invoice action) and in Settings
  if (/\/create$/.test(location.pathname) || /\/edit$/.test(location.pathname)
    || location.pathname === '/dashboard' || location.pathname.startsWith('/settings')) {
    return null;
  }

  const context = CONTEXT_TARGETS.find(c => c.match.test(location.pathname)) || DEFAULT_TARGET;

  const handleClick = () => {
    navigate(context.target);
  };

  return (
    <button
      className="floating-add-button"
      onClick={handleClick}
      title={context.label}
      aria-label={context.label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

export default FloatingAddButton;
