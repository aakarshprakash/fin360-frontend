// Single navigation map for the sidebar, mobile drawer and top-bar page search.
// `anyOf` mirrors the guard on the matching route in App.jsx so users only see
// links they can open.
import {
  LayoutDashboard, FileText, ScrollText, FileCheck, UserRound,
  Receipt, Wallet, Truck, TrendingUp, Landmark, ArrowLeftRight,
  BookOpen, Layers, Repeat, Package, ChartColumn, Settings,
  Percent, Coins, Building2, CalendarRange, Users, Bell,
  Briefcase, ShieldCheck, Network, Hash, FileSpreadsheet, CreditCard,
  UserRound as ProfileIcon, Lock, Landmark as BusinessIcon,
} from 'lucide-react';

const VIEW = ['view_accounting', 'manage_accounting'];
const SETUP = ['accounting_settings'];
const ORG = ['view_settings', 'manage_settings'];

export const NAV_GROUPS = [
  {
    id: 'overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, anyOf: ['view_accounting'] },
    ],
  },
  {
    id: 'sales',
    title: 'Sales',
    items: [
      { label: 'Invoices', path: '/invoices', icon: FileText, anyOf: ['view_invoices', 'manage_accounting'], badgeKey: 'pendingInvoices' },
      { label: 'Quotations', path: '/quotations', icon: ScrollText, anyOf: ['view_quotations', 'manage_accounting'] },
      { label: 'Proforma Invoices', path: '/proforma-invoices', icon: FileCheck, anyOf: ['view_quotations', 'manage_accounting'] },
      { label: 'Customers', path: '/customers', icon: UserRound, anyOf: VIEW },
    ],
  },
  {
    id: 'purchases',
    title: 'Purchases',
    items: [
      { label: 'Bills', path: '/bills', icon: Receipt, anyOf: VIEW, badgeKey: 'overdueBills', badgeTone: 'danger' },
      { label: 'Expenses', path: '/expenses', icon: Wallet, anyOf: ['view_expenses', 'manage_accounting'] },
      { label: 'Vendors', path: '/vendors', icon: Truck, anyOf: VIEW },
    ],
  },
  {
    id: 'money',
    title: 'Money',
    items: [
      { label: 'Income', path: '/income', icon: TrendingUp, anyOf: VIEW },
      { label: 'Banking', path: '/banking', icon: Landmark, anyOf: VIEW },
      { label: 'Cash Flow', path: '/income-expenses', icon: ArrowLeftRight, anyOf: VIEW },
    ],
  },
  {
    id: 'accounting',
    title: 'Accounting',
    items: [
      { label: 'Journal Entries', path: '/journal-entries', icon: BookOpen, anyOf: VIEW },
      { label: 'Chart of Accounts', path: '/chart-of-accounts', icon: Layers, anyOf: VIEW },
      { label: 'Recurring', path: '/recurring', icon: Repeat, anyOf: VIEW },
      { label: 'Products', path: '/products', icon: Package, anyOf: VIEW },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    items: [
      { label: 'Reports & GST', path: '/reports', icon: ChartColumn, anyOf: ['view_reports', 'view_accounting'] },
    ],
  },
];

// Settings area — every master/configuration screen lives here, grouped the
// way admins think about them. An empty `anyOf` means any signed-in user.
export const SETTINGS_GROUPS = [
  {
    id: 'organization',
    title: 'Organization',
    items: [
      { label: 'Company Profile', path: '/settings/company', icon: Building2, anyOf: ORG, hint: 'Name, logo and contact details shown across Fin360' },
      { label: 'Business & Tax Details', path: '/settings/business', icon: BusinessIcon, anyOf: SETUP, hint: 'Legal name, GSTIN, PAN and the address printed on documents' },
      { label: 'Branches', path: '/settings/branches', icon: Network, anyOf: SETUP, hint: 'Locations that issue invoices and record transactions' },
      { label: 'Financial Years', path: '/settings/financial-years', icon: CalendarRange, anyOf: SETUP, hint: 'Open, close and lock accounting periods' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance Masters',
    items: [
      { label: 'Accounting Preferences', path: '/settings/accounting', icon: Settings, anyOf: SETUP, hint: 'Base currency, fiscal start and posting defaults' },
      { label: 'Tax Rates', path: '/settings/taxes', icon: Percent, anyOf: SETUP, hint: 'GST slabs and other tax rates' },
      { label: 'Currencies', path: '/settings/currencies', icon: Coins, anyOf: SETUP, hint: 'Currencies and exchange rates' },
      { label: 'Payment Methods', path: '/settings/payment-methods', icon: CreditCard, anyOf: SETUP, hint: 'Bank, UPI and cash methods shown on invoices' },
      { label: 'Document Numbering', path: '/settings/numbering', icon: Hash, anyOf: SETUP, hint: 'Prefixes and sequences for invoices, bills and quotes' },
      { label: 'Invoice Template', path: '/settings/invoice-template', icon: FileText, anyOf: SETUP, hint: 'Terms, footer and layout for invoices' },
      { label: 'Quotation Template', path: '/settings/quotation-template', icon: FileSpreadsheet, anyOf: SETUP, hint: 'Terms and layout for quotations' },
    ],
  },
  {
    id: 'team',
    title: 'Team & Access',
    items: [
      { label: 'Users', path: '/settings/users', icon: Users, anyOf: ['view_users', 'manage_users'], hint: 'Invite people and manage their accounts' },
      { label: 'Roles & Permissions', path: '/settings/roles', icon: ShieldCheck, anyOf: ['manage_roles'], hint: 'Control who can see and change what' },
      { label: 'Departments', path: '/settings/departments', icon: Building2, anyOf: [...ORG, 'view_departments', 'manage_departments'], hint: 'Organise your team' },
      { label: 'Job Titles', path: '/settings/job-titles', icon: Briefcase, anyOf: [...ORG, 'view_job_titles', 'manage_job_titles'], hint: 'Titles used on user profiles' },
    ],
  },
  {
    id: 'personal',
    title: 'Personal',
    items: [
      { label: 'My Profile', path: '/settings/profile', icon: ProfileIcon, anyOf: [], hint: 'Your name, email and phone' },
      { label: 'Security', path: '/settings/security', icon: Lock, anyOf: [], hint: 'Password and active sessions' },
      { label: 'Notifications', path: '/settings/notifications', icon: Bell, anyOf: [], hint: 'Which alerts you receive' },
    ],
  },
];

export const firstSettingsPath = (can) => {
  const item = SETTINGS_GROUPS.flatMap((g) => g.items).find((i) => can(i.anyOf));
  return item ? item.path : '/settings/profile';
};

// Extra destinations that are searchable but live outside the sidebar.
export const EXTRA_DESTINATIONS = [
  ...SETTINGS_GROUPS.flatMap((g) => g.items),
  { label: 'Notifications Inbox', path: '/notifications', icon: Bell, anyOf: ['view_notifications'] },
  { label: 'Create Invoice', path: '/invoices/create', icon: FileText, anyOf: ['manage_accounting'] },
  { label: 'Create Quotation', path: '/quotations/create', icon: ScrollText, anyOf: ['manage_accounting'] },
  { label: 'Record Bill', path: '/bills/create', icon: Receipt, anyOf: ['manage_accounting'] },
  { label: 'New Journal Entry', path: '/journal-entries/create', icon: BookOpen, anyOf: ['manage_accounting'] },
];

export const isPathActive = (current, path) =>
  current === path || current.startsWith(path + '/');
