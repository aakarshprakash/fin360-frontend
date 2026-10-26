# Lead Management CRM — Project Overview

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Application Version:** 2.0  
**Status:** Production Ready

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Current Features](#4-current-features)
   - [Authentication](#41-authentication)
   - [Dashboard & Analytics](#42-dashboard--analytics)
   - [Lead Management](#43-lead-management)
   - [Customer Management](#44-customer-management)
   - [User Management](#45-user-management)
   - [Settings](#46-settings)
   - [Accounting Module](#47-accounting-module)
   - [UI/UX & PWA](#48-uiux--pwa)
5. [Application Flow](#5-application-flow)
   - [Authentication Flow](#51-authentication-flow)
   - [Data Flow](#52-data-flow)
   - [Routing Map](#53-routing-map)
6. [Component Architecture](#6-component-architecture)
7. [API Integration](#7-api-integration)
8. [Styling System](#8-styling-system)
9. [Enhancement Opportunities](#9-enhancement-opportunities)

---

## 1. Project Summary

**Lead Management CRM** is a Progressive Web App (PWA) built for sales teams to manage leads, track follow-ups, monitor performance, and handle complete financial accounting. It connects to a Laravel REST API backend for all data operations.

| Property | Value |
|----------|-------|
| Type | Single Page Application (SPA) + PWA |
| Frontend | React 19 + Vite |
| Backend | Laravel REST API (separate repository) |
| API Base URL | `https://leadcrm.vpsappserverone.in/api` |
| Auth | Bearer Token (Laravel Sanctum) |
| Deploy Target | Static hosting / CDN |

---

## 2. Technology Stack

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| UI Framework | React | 19.2.0 | Component rendering |
| Router | React Router DOM | 7.13.0 | Client-side navigation |
| Build Tool | Vite | 7.2.4 | Dev server & bundler |
| HTTP Client | Axios | 1.13.4 | API communication |
| PWA Plugin | vite-plugin-pwa | 1.2.0 | Service worker & manifest |
| Service Worker | workbox-window | 7.4.0 | Offline caching |
| Styling | Plain CSS | — | No framework (glassmorphism style) |
| Image Processing | sharp | 0.34.5 | Icon generation |
| Linter | ESLint | 9.39.1 | Code quality |

**Key design decisions:**
- No CSS framework (Tailwind, MUI, etc.) — all styles are custom CSS files
- No global state manager (Redux, Zustand) — React `useState` / `useEffect` per component
- No TypeScript — plain JavaScript / JSX throughout
- Auto-converts between camelCase (frontend) and snake_case (backend) via Axios interceptors

---

## 3. Project Structure

```
lead-crm/
├── public/                          # Static PWA assets
│   ├── pwa-192x192.png              # PWA icon (small)
│   ├── pwa-512x512.png              # PWA icon (large / maskable)
│   ├── vite.svg                     # Vite logo
│   └── generate-icons.html          # Icon generation helper
│
├── src/                             # All application source code
│   ├── main.jsx                     # React DOM entry point
│   ├── App.jsx                      # Root component — defines all routes
│   ├── App.css                      # Root-level styles
│   ├── index.css                    # Global/reset styles
│   │
│   ├── assets/                      # Static assets referenced in code
│   │   └── react.svg
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── Layout.jsx               # Page shell (TopNav + content + FAB + footer)
│   │   ├── TopNav.jsx               # Top navigation bar (search, calendar, notifications, user menu)
│   │   ├── Sidebar.jsx              # Left sidebar (accounting module navigation)
│   │   ├── ProtectedRoute.jsx       # Auth guard — redirects to /login if not authenticated
│   │   ├── FloatingAddButton.jsx    # FAB for quick lead creation (fixed bottom-right)
│   │   ├── PWAInstallPrompt.jsx     # Native PWA install prompt
│   │   ├── DonutChart.jsx           # SVG donut chart (lead status distribution)
│   │   ├── LineChart.jsx            # SVG line chart (leads vs conversions over time)
│   │   ├── QuickActions.jsx         # Call / WhatsApp / SMS one-click buttons
│   │   ├── FollowUpModal.jsx        # Modal for scheduling follow-ups
│   │   ├── CallLogModal.jsx         # Modal for logging communication
│   │   ├── UserModal.jsx            # Modal for creating/editing users
│   │   ├── RolePermissions.jsx      # Role-based permission display component
│   │   │
│   │   └── accounting/              # Accounting-specific components (modals & helpers)
│   │       ├── AccountingIcons.jsx  # Icon constants for accounting UI
│   │       ├── AccountModal.jsx     # Chart of Accounts create/edit modal
│   │       ├── BankAccountModal.jsx # Bank account create/edit modal
│   │       ├── BankTransactionModal.jsx  # Bank transaction entry modal
│   │       ├── CurrencyModal.jsx    # Currency create/edit modal
│   │       ├── CustomerModal.jsx    # Accounting customer create/edit modal
│   │       ├── ExpenseModal.jsx     # Expense entry modal
│   │       ├── IncomeModal.jsx      # Income entry modal
│   │       ├── InvoicePrintView.jsx # Printable invoice layout
│   │       ├── QuotationPrintView.jsx  # Printable quotation layout
│   │       ├── TaxModal.jsx         # Tax rate create/edit modal
│   │       └── VendorModal.jsx      # Vendor create/edit modal
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── Login.jsx                # Public — login with email/password
│   │   ├── Dashboard.jsx            # CRM dashboard with KPIs, charts, calendar, tasks
│   │   ├── LeadList.jsx             # Lead list with filters, search, bulk actions
│   │   ├── CreateLead.jsx           # New lead creation form
│   │   ├── LeadDetail.jsx           # Full lead profile with activity, follow-ups, call logs
│   │   ├── CustomerList.jsx         # Converted customer list
│   │   ├── UserList.jsx             # User/staff management list
│   │   ├── UserDetail.jsx           # User profile and permissions detail
│   │   ├── Settings.jsx             # CRM settings (lead sources, preferences)
│   │   │
│   │   └── accounting/              # Accounting module pages (28 pages)
│   │       ├── AccountingDashboard.jsx      # Financial overview dashboard
│   │       ├── ChartOfAccounts.jsx          # Account hierarchy management
│   │       ├── AccountingCustomers.jsx      # Customer ledger list
│   │       ├── AccountingCustomerDetail.jsx # Customer ledger & statements
│   │       ├── VendorList.jsx               # Vendor list
│   │       ├── VendorDetail.jsx             # Vendor ledger & transactions
│   │       ├── InvoiceList.jsx              # Sales invoices list
│   │       ├── CreateInvoice.jsx            # Create/edit invoice
│   │       ├── InvoiceDetail.jsx            # Invoice detail, payments, print
│   │       ├── QuotationList.jsx            # Quotation list
│   │       ├── CreateQuotation.jsx          # Create/edit quotation (reused for edit)
│   │       ├── QuotationDetail.jsx          # Quotation detail and convert-to-invoice
│   │       ├── BillList.jsx                 # Purchase bills list
│   │       ├── CreateBill.jsx               # Create/edit bill
│   │       ├── IncomeList.jsx               # Income entries list
│   │       ├── ExpenseList.jsx              # Expense entries list
│   │       ├── IncomeExpenseDashboard.jsx   # Income vs expense analysis
│   │       ├── BankingList.jsx              # Bank accounts list
│   │       ├── BankAccountDetail.jsx        # Bank account transactions
│   │       ├── JournalEntryList.jsx         # Journal entries (double-entry)
│   │       ├── CreateJournalEntry.jsx       # Create journal entry
│   │       ├── TaxManagement.jsx            # Tax rates configuration
│   │       ├── CurrencyManagement.jsx       # Multi-currency configuration
│   │       ├── ReportsHub.jsx               # Reports navigation hub
│   │       ├── ReportViewer.jsx             # Individual report viewer
│   │       ├── AccountingSettings.jsx       # Accounting-specific settings
│   │       ├── BranchList.jsx               # Multi-branch management
│   │       └── FinancialYearManagement.jsx  # Financial year setup
│   │
│   ├── styles/                      # CSS stylesheets (one per page/component)
│   │   ├── Accounting.css           # Accounting module shared styles
│   │   ├── Charts.css               # DonutChart & LineChart styles
│   │   ├── CustomerList.css         # Customer list page
│   │   ├── Dashboard.css            # Dashboard layout and widgets
│   │   ├── FloatingAddButton.css    # FAB button
│   │   ├── Form.css                 # Forms and create pages
│   │   ├── Layout.css               # Main layout shell
│   │   ├── LeadDetail.css           # Lead detail page
│   │   ├── LeadList.css             # Lead list and table
│   │   ├── Login.css                # Login page
│   │   ├── Modal.css                # All modals
│   │   ├── PWAPrompt.css            # PWA install prompt
│   │   ├── QuickActions.css         # Quick action buttons
│   │   ├── RolePermissions.css      # Role permissions component
│   │   ├── Settings.css             # Settings page
│   │   ├── Sidebar.css              # Sidebar navigation
│   │   ├── TopNav.css               # Top navigation bar
│   │   ├── UserDetail.css           # User detail page
│   │   ├── UserList.css             # User list page
│   │   └── UserModal.css            # User modal
│   │
│   └── utils/                       # Shared utilities and helpers
│       ├── api.js                   # Axios instance (auth interceptor, key transform)
│       ├── accountingApi.js         # Accounting-specific API call helpers
│       ├── auth.js                  # Auth helpers (login, logout, getToken, etc.)
│       └── useAccountingFetch.js    # Custom React hook for accounting data fetching
│
├── doc/                             # All project documentation
│   ├── PROJECT_OVERVIEW.md          # ← This file. Full project reference
│   ├── README.md                    # Project introduction and quick-start
│   ├── CURRENT_FEATURES.md          # Detailed feature specifications (v2.0)
│   ├── moduels.md                   # Module-by-module breakdown
│   ├── start.md                     # Getting started guide
│   ├── design.md                    # UI/UX design principles
│   ├── API_DOCUMENTATION.md         # API usage and conventions
│   ├── API_SPECIFICATION.md         # Full API contract specification
│   ├── API_LIST_FOR_BACKEND.md      # 184 endpoint reference list
│   ├── API_DEVELOPMENT_GUIDE.md     # Backend developer guide
│   ├── ACCOUNTING_SYSTEM_SRS.md     # Accounting module requirements
│   ├── ENTERPRISE_DESIGN_COMPLIANCE.md  # Enterprise UX standards
│   ├── DOCUMENTATION.md             # Historical project documentation
│   ├── 02_feature.md                # Top-nav & dashboard feature notes
│   ├── 03_feature.md                # Design principles reference
│   └── key_things.txt               # Development notes and reminders
│
├── index.html                       # HTML entry point (PWA meta tags)
├── vite.config.js                   # Vite + PWA plugin configuration
├── eslint.config.js                 # ESLint 9 configuration
├── package.json                     # Dependencies and scripts
├── package-lock.json                # Locked dependency tree
├── generate-icons.mjs               # Script: generate PWA icons from SVG
├── replace-colors.cjs               # Script: bulk color replacement in CSS
├── replace-emojis.mjs               # Script: emoji-to-text replacement
└── run-build.cjs                    # Script: production build runner
```

---

## 4. Current Features

### 4.1 Authentication

**Location:** `src/pages/Login.jsx`, `src/utils/auth.js`, `src/components/ProtectedRoute.jsx`

| Feature | Details |
|---------|---------|
| Login form | Email + password, with validation and error display |
| Token storage | Bearer token stored in `localStorage` |
| Session persistence | Token survives page refresh |
| Protected routes | `ProtectedRoute` wraps all authenticated pages |
| Auto-redirect | Unauthenticated users sent to `/login` |
| Auto-logout | 401 responses on non-silent paths clear token and redirect |
| API logout | `apiLogout()` revokes token on the server before clearing local storage |
| Demo credentials | `admin@crm.com` / `password` |

---

### 4.2 Dashboard & Analytics

**Location:** `src/pages/Dashboard.jsx`  
**Route:** `/dashboard`

#### KPI Cards (4 cards)
| Card | What it shows |
|------|--------------|
| 🔥 Hot Leads | Leads with follow-up scheduled for today |
| ⚠️ Overdue Follow-ups | Follow-ups past their due date |
| ✨ New Leads Today | Leads created today |
| 🎯 Monthly Conversions | Leads converted this month |

#### Analytics Widgets
| Widget | Description |
|--------|-------------|
| Lead Status Donut Chart | Visual breakdown of New / Contacted / Follow-up / Converted / Lost |
| Growth Line Chart | Leads vs Customers over 7 or 30 days (toggle switch) |
| Avg Response Time | Current average with trend indicator (↑ or ↓ vs previous period) |
| Lead Funnel Snapshot | Numeric count at each pipeline stage |
| Today's Tasks | Auto-generated from scheduled follow-ups and overdue items |
| Recent Leads | Latest leads added with timestamps |
| Follow-up Calendar | Calendar view (Today / Week / Month) linked to lead details |

---

### 4.3 Lead Management

#### Lead List (`/leads`)
**File:** `src/pages/LeadList.jsx`

| Feature | Details |
|---------|---------|
| Table view | Name, company, email, phone, status, source, assigned user, created date |
| Quick filters | All · Today's Follow-ups · Overdue · Hot Leads · New Today |
| Advanced filters | Status, Source, Staff member, Date range |
| Real-time search | Search by name, email, phone, or company |
| Bulk selection | Checkbox per row with select-all |
| Pagination | Configurable: 10 / 25 / 50 / 100 rows per page |
| Quick actions | Per-row: Call (`tel:`), WhatsApp, SMS one-click buttons |
| Loading skeleton | Shown while data loads |
| Status badges | Color-coded: New (blue), Contacted (purple), Follow-up (orange), Converted (green), Lost (gray) |

#### Create Lead (`/leads/create`)
**File:** `src/pages/CreateLead.jsx`

Fields: Name, Email, Phone, Company, Status (dropdown), Source (dropdown), Notes  
Validation: Required fields enforced; errors shown inline

#### Lead Detail (`/leads/:id`)
**File:** `src/pages/LeadDetail.jsx`

| Section | Features |
|---------|---------|
| Lead Profile | Name, email, phone, company, status, source, lead score, priority badge |
| Follow-up Management | Schedule new follow-ups (via `FollowUpModal`), mark as complete/overdue, list all past follow-ups |
| Communication Log | Full history of calls, WhatsApp, emails, meetings, SMS, video calls (via `CallLogModal`) |
| Quick Actions | One-click Call, WhatsApp, SMS with auto-prompt to log the interaction |
| Staff History | Track which staff members have been assigned |
| Convert to Customer | One-click conversion from lead to customer |
| Notes | Add and view free-text notes |

#### Follow-Up Modal (`src/components/FollowUpModal.jsx`)
Fields: Type (Call/WhatsApp/Email/Meeting/Visit), Date, Time, Notes

#### Call Log Modal (`src/components/CallLogModal.jsx`)
Fields: Type, Outcome (Connected/No Answer/Busy/Interested/Deal Closed/etc.), Duration, Notes, Timestamp

---

### 4.4 Customer Management

**Route:** `/customers`  
**File:** `src/pages/CustomerList.jsx`

| Feature | Details |
|---------|---------|
| Customer table | All converted leads/customers |
| Search & filter | Name, date range, status |
| Bulk selection | Multi-select with bulk operations |
| Pagination | Configurable rows per page |
| Status badges | Visual status indicators |
| Avatar | Initials-based customer avatar |

---

### 4.5 User Management

**Routes:** `/users`, `/users/:id`  
**Files:** `src/pages/UserList.jsx`, `src/pages/UserDetail.jsx`  
**Components:** `src/components/UserModal.jsx`, `src/components/RolePermissions.jsx`

| Feature | Details |
|---------|---------|
| User list | Table of all staff/admin users with role and status |
| User creation | Create new users via `UserModal` |
| User editing | Edit user info and role via `UserModal` |
| User detail | Full user profile: contact info, role, activity stats |
| Role display | Roles shown: Admin, Manager, Sales |
| Permissions view | `RolePermissions` component shows allowed actions per role |
| Active/Inactive | Toggle user account status |

---

### 4.6 Settings

**Route:** `/settings`  
**File:** `src/pages/Settings.jsx`

| Section | Features |
|---------|---------|
| Lead Sources | CRUD for lead sources (e.g., Website, Referral, Cold Call) |
| Source analytics | Lead count and percentage per source |
| Visual config | Assign color and emoji icon to each source |
| Active/Inactive | Toggle source visibility |
| Tab navigation | Multiple settings sections (sources, future preferences) |

---

### 4.7 Accounting Module

Added March 8, 2026. All routes are under `/accounting/` and require authentication.

#### Accounting Dashboard (`/accounting/dashboard`)
**File:** `src/pages/accounting/AccountingDashboard.jsx`

Overview of: Total Revenue, Outstanding Receivables, Total Expenses, Net Profit, recent transactions.

#### Chart of Accounts (`/accounting/chart-of-accounts`)
- Account hierarchy (Assets, Liabilities, Equity, Income, Expenses)
- Create/edit/delete accounts via `AccountModal`
- View account ledger

#### Customers & Vendors
| Page | Route | File |
|------|-------|------|
| Customer list | `/accounting/customers` | `AccountingCustomers.jsx` |
| Customer detail | `/accounting/customers/:id` | `AccountingCustomerDetail.jsx` |
| Vendor list | `/accounting/vendors` | `VendorList.jsx` |
| Vendor detail | `/accounting/vendors/:id` | `VendorDetail.jsx` |

Features: Ledger view, transaction history, account statements, create/edit via modals.

#### Invoices (Sales)
| Route | File | Purpose |
|-------|------|---------|
| `/accounting/invoices` | `InvoiceList.jsx` | All invoices with status filter |
| `/accounting/invoices/create` | `CreateInvoice.jsx` | New invoice with line items |
| `/accounting/invoices/:id` | `InvoiceDetail.jsx` | Detail, payments, print/PDF export |

Invoice statuses: Draft · Sent · Paid · Overdue  
`InvoicePrintView.jsx` renders a print-formatted invoice layout.

#### Quotations
| Route | File | Purpose |
|-------|------|---------|
| `/accounting/quotations` | `QuotationList.jsx` | All quotations |
| `/accounting/quotations/create` | `CreateQuotation.jsx` | New quotation |
| `/accounting/quotations/:id` | `QuotationDetail.jsx` | View and convert to invoice |
| `/accounting/quotations/:id/edit` | `CreateQuotation.jsx` | Edit (reuses create component) |

`QuotationPrintView.jsx` renders a print-formatted quotation layout.

#### Bills (Purchases)
| Route | File |
|-------|------|
| `/accounting/bills` | `BillList.jsx` |
| `/accounting/bills/create` | `CreateBill.jsx` |

#### Income & Expenses
| Route | File | Purpose |
|-------|------|---------|
| `/accounting/income` | `IncomeList.jsx` | Income entries |
| `/accounting/expenses` | `ExpenseList.jsx` | Expense entries |
| `/accounting/income-expenses` | `IncomeExpenseDashboard.jsx` | P&L comparison view |

Create/edit via `IncomeModal` and `ExpenseModal`.

#### Banking
| Route | File |
|-------|------|
| `/accounting/banking` | `BankingList.jsx` |
| `/accounting/banking/:id` | `BankAccountDetail.jsx` |

Manage bank accounts and log transactions via `BankTransactionModal`.

#### Journal Entries
| Route | File |
|-------|------|
| `/accounting/journal-entries` | `JournalEntryList.jsx` |
| `/accounting/journal-entries/create` | `CreateJournalEntry.jsx` |

Double-entry bookkeeping with debit/credit line items.

#### Reports
| Route | File |
|-------|------|
| `/accounting/reports` | `ReportsHub.jsx` |
| `/accounting/reports/:type` | `ReportViewer.jsx` |

Report types: Profit & Loss, Balance Sheet, Trial Balance, Cash Flow, Receivables Aging, Payables Aging.

#### Configuration
| Route | File | Purpose |
|-------|------|---------|
| `/accounting/taxes` | `TaxManagement.jsx` | Tax rate CRUD |
| `/accounting/currencies` | `CurrencyManagement.jsx` | Multi-currency setup |
| `/accounting/branches` | `BranchList.jsx` | Multi-branch management |
| `/accounting/financial-years` | `FinancialYearManagement.jsx` | Financial year periods |
| `/accounting/settings` | `AccountingSettings.jsx` | Accounting preferences |

---

### 4.8 UI/UX & PWA

#### Top Navigation Bar (`src/components/TopNav.jsx`)
| Feature | Details |
|---------|---------|
| Global Search | Search leads by name, phone, email; real-time dropdown; keyboard shortcut Ctrl+K |
| Calendar Dropdown | Today / Week / Month views of follow-up events; color-coded by type |
| Notifications | Dropdown for today's follow-ups, overdue items, newly assigned leads |
| User Profile Menu | Avatar with initials, name, role display; links to Settings and Logout |
| Module Navigation | Links to Dashboard, Leads, Customers, Accounting |

#### Floating Add Button (`src/components/FloatingAddButton.jsx`)
- Fixed bottom-right FAB for quick lead creation
- Hidden on the Create Lead page to avoid duplication

#### PWA Features (`src/components/PWAInstallPrompt.jsx`, `vite.config.js`)
| Feature | Details |
|---------|---------|
| Installable | Add to home screen on iOS and Android |
| Offline mode | Service worker caches assets and API responses |
| Auto-update | New version detected and applied via Workbox |
| Manifest | App name, icons, theme color, standalone display |
| API cache | NetworkFirst strategy, 5-minute cache |
| Font cache | Google Fonts cached with CacheFirst for 1 year |

#### Design System
- **Style:** Glassmorphism (backdrop blur, translucent cards, soft shadows)
- **Colors:** Professional blue/indigo primary; soft green/amber/red for status
- **Typography:** System font, 14px body, 16–18px headers, 22–24px page titles
- **Animations:** CSS transitions < 200ms, subtle hover effects
- **Layout:** Top nav + left sidebar + main content area, card-based widgets
- **Responsive:** Desktop-first, tablet and mobile supported

---

## 5. Application Flow

### 5.1 Authentication Flow

```
Browser loads /
       │
       ▼
Navigate to /dashboard (default redirect)
       │
       ▼
ProtectedRoute checks localStorage.token
       │
   ┌───┴───────────────────────┐
   │ Token absent              │ Token present
   ▼                           ▼
Redirect to /login        Render page component
       │
       ▼
User submits email + password
       │
       ▼
POST /api/login → { token, user }
       │
       ▼
auth.login(token, user) → saves to localStorage
       │
       ▼
Navigate to /dashboard
       │
       ▼
Axios interceptor auto-injects
Authorization: Bearer <token>
on every subsequent request
       │
       ▼
401 response on non-silent path?
       │
   ┌───┴───────────────────────┐
   │ Yes                       │ No
   ▼                           ▼
auth.logout() + redirect   Continue normally
to /login
```

### 5.2 Data Flow

```
User Action (click, form submit)
       │
       ▼
Component calls api.js function
       │
       ▼
Axios request interceptor:
  1. Injects Bearer token header
  2. Converts camelCase keys → snake_case
       │
       ▼
HTTP request to Laravel API
       │
       ▼
Axios response interceptor:
  1. Converts snake_case keys → camelCase
  2. Handles 401 (logout if non-silent path)
       │
       ▼
Component receives response data
       │
       ▼
setState() → React re-renders UI
```

### 5.3 Routing Map

All routes are client-side via React Router DOM.

```
/ ──────────────────────────────────── → redirect to /dashboard

PUBLIC
├── /login                             Login page

PROTECTED (require Bearer token)
│
├── CRM Module
│   ├── /dashboard                     KPIs, charts, tasks, calendar
│   ├── /leads                         Lead list with filters
│   ├── /leads/create                  Create new lead
│   ├── /leads/:id                     Lead detail & activity
│   ├── /customers                     Customer (converted leads) list
│   ├── /users                         Staff/user list
│   ├── /users/:id                     User profile & permissions
│   └── /settings                      Lead sources & CRM settings
│
└── Accounting Module (/accounting/*)
    ├── /accounting/dashboard           Financial overview
    ├── /accounting/chart-of-accounts   Account structure
    │
    ├── Parties
    │   ├── /accounting/customers       Customer ledger list
    │   ├── /accounting/customers/:id   Customer detail & statement
    │   ├── /accounting/vendors         Vendor list
    │   └── /accounting/vendors/:id     Vendor detail & statement
    │
    ├── Sales
    │   ├── /accounting/invoices         Invoice list
    │   ├── /accounting/invoices/create  Create invoice
    │   ├── /accounting/invoices/:id     Invoice detail & payments
    │   ├── /accounting/quotations       Quotation list
    │   ├── /accounting/quotations/create  Create quotation
    │   ├── /accounting/quotations/:id   Quotation detail
    │   └── /accounting/quotations/:id/edit  Edit quotation
    │
    ├── Purchases
    │   ├── /accounting/bills            Bill list
    │   └── /accounting/bills/create     Create bill
    │
    ├── Income & Expenses
    │   ├── /accounting/income           Income entries
    │   ├── /accounting/expenses         Expense entries
    │   └── /accounting/income-expenses  P&L dashboard
    │
    ├── Banking
    │   ├── /accounting/banking          Bank accounts
    │   └── /accounting/banking/:id      Bank account transactions
    │
    ├── Journals
    │   ├── /accounting/journal-entries  Journal entry list
    │   └── /accounting/journal-entries/create  Create journal entry
    │
    ├── Reports
    │   ├── /accounting/reports          Reports hub
    │   └── /accounting/reports/:type    Report viewer
    │
    └── Configuration
        ├── /accounting/taxes            Tax rates
        ├── /accounting/currencies       Currencies
        ├── /accounting/branches         Branches
        ├── /accounting/financial-years  Financial years
        └── /accounting/settings         Accounting settings
```

---

## 6. Component Architecture

```
App.jsx  (Router)
│
├── Login.jsx  (public)
│
└── ProtectedRoute  (wraps all authenticated pages)
    │
    ├── Dashboard.jsx
    │   ├── Layout.jsx
    │   │   ├── TopNav.jsx ──────── uses: api.js, auth.js
    │   │   ├── [page content]
    │   │   ├── FloatingAddButton.jsx
    │   │   └── <footer>
    │   ├── DonutChart.jsx
    │   └── LineChart.jsx
    │
    ├── LeadList.jsx
    │   ├── Layout.jsx
    │   └── QuickActions.jsx
    │
    ├── LeadDetail.jsx
    │   ├── Layout.jsx
    │   ├── QuickActions.jsx
    │   ├── FollowUpModal.jsx
    │   └── CallLogModal.jsx
    │
    ├── CreateLead.jsx
    │   └── Layout.jsx
    │
    ├── CustomerList.jsx
    │   └── Layout.jsx
    │
    ├── UserList.jsx
    │   ├── Layout.jsx
    │   └── UserModal.jsx
    │
    ├── UserDetail.jsx
    │   ├── Layout.jsx
    │   └── RolePermissions.jsx
    │
    ├── Settings.jsx
    │   └── Layout.jsx
    │
    └── accounting/* pages
        ├── Layout.jsx (with Sidebar.jsx for accounting nav)
        └── accounting/components/* (modals per entity)

PWAInstallPrompt.jsx  (global, rendered directly in App.jsx)
```

---

## 7. API Integration

### Base Configuration (`src/utils/api.js`)

```
Base URL:  https://leadcrm.vpsappserverone.in/api
Headers:   Content-Type: application/json
           Accept: application/json
           Authorization: Bearer <token>  (injected by interceptor)
```

### Key Behaviors

| Behavior | Details |
|----------|---------|
| Auto token injection | Every request gets `Authorization: Bearer <token>` |
| Key transformation | Request: camelCase → snake_case; Response: snake_case → camelCase |
| Auto logout on 401 | Redirects to `/login` unless URL matches a "silent 401" path |
| Silent 401 paths | `/dashboard/stats`, `/follow-ups`, `/call-logs`, `/notes`, `/accounting/*` — fall back to demo data |
| Binary data handling | `File`, `Blob`, and `FormData` objects are not key-transformed |

### Accounting API (`src/utils/accountingApi.js`)
Provides accounting-specific helper functions that call the `/api/accounting/*` endpoints.

### Custom Hook (`src/utils/useAccountingFetch.js`)
`useAccountingFetch(endpoint, options)` — a React hook that abstracts data fetching for accounting pages (loading state, error state, refetch capability).

### Auth Utilities (`src/utils/auth.js`)

| Function | Purpose |
|----------|---------|
| `isAuthenticated()` | Returns `true` if token exists in localStorage |
| `login(token, user)` | Saves token and user JSON to localStorage |
| `logout()` | Removes token and user from localStorage |
| `apiLogout()` | Calls `POST /api/logout` to revoke token, then calls `logout()` |
| `getCurrentUser()` | Returns parsed user object from localStorage |
| `getToken()` | Returns raw token string from localStorage |
| `fetchCurrentUser()` | Calls `GET /api/me`, updates localStorage user |

---

## 8. Styling System

All styles are plain CSS files in `src/styles/`. There is no CSS framework.

### Conventions
- One CSS file per page/component (e.g., `LeadList.css` for `LeadList.jsx`)
- Class names use kebab-case (e.g., `.lead-table`, `.kpi-card`)
- Glassmorphism: `backdrop-filter: blur(...)`, `rgba()` backgrounds, `box-shadow`
- CSS variables are used sparingly in `index.css` for primary colors
- No CSS Modules — global class names (scoped by naming convention)

### Key Design Tokens (approximate)
| Token | Value |
|-------|-------|
| Primary blue | `#2563EB` |
| Success green | `#16A34A` |
| Warning amber | `#D97706` |
| Error red | `#DC2626` |
| Background | `#F8FAFC` |
| Card | `#FFFFFF` |
| Border | `#E2E8F0` |
| Text primary | `#1E293B` |
| Text secondary | `#64748B` |

---

## 9. Enhancement Opportunities

The following areas have been identified for future improvement to strengthen the project:

### Structural Improvements
| Area | Current State | Recommended Enhancement |
|------|--------------|------------------------|
| State Management | Per-component `useState` | Introduce React Context or Zustand for shared auth/user state |
| TypeScript | Plain JavaScript | Migrate to TypeScript for type safety and better IDE support |
| API layer | Direct `api.js` calls inside components | Extract API calls into dedicated service modules (e.g., `leadsService.js`) |
| Error handling | Basic `try/catch` per component | Centralized error boundary + toast notification system |
| Testing | No tests present | Add React Testing Library unit tests for components; Vitest for utils |
| Code splitting | All routes bundled together | Use React lazy loading for accounting module routes |

### Feature Enhancements
| Feature | Priority | Notes |
|---------|----------|-------|
| Real-time notifications | High | WebSockets or polling for live follow-up alerts |
| Google Calendar sync | Medium | Bidirectional sync for follow-up events |
| Push notifications | Medium | Browser push API for overdue reminders |
| Email integration | Medium | Send emails directly from lead detail |
| CSV/Excel export | Medium | Export leads and reports |
| File attachments | Medium | Attach documents to leads |
| Dark mode | Low | CSS variable-based theme toggle |
| Drag-and-drop scheduling | Low | Kanban board for lead pipeline |
| Offline data sync | Low | Background sync when connectivity restored |

### Documentation Gaps
| Missing Doc | Impact |
|-------------|--------|
| Backend API setup guide (Laravel) | New backend developers cannot onboard independently |
| Environment variable reference | Unclear how to change API URL for local/staging/prod |
| Deployment guide | No instructions for building and deploying the PWA |
| Component Storybook | No isolated component documentation |

---

*Maintained by the SYSNAC Development Team*  
*For API details, see `API_DOCUMENTATION.md` and `API_LIST_FOR_BACKEND.md`*  
*For feature history, see `CURRENT_FEATURES.md`*
