# Lead Management CRM - Current Features Documentation

**Document Version:** 2.0  
**Last Updated:** March 8, 2026  
**Project Status:** Production Ready  
**Application Type:** Progressive Web App (PWA)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [User Authentication](#user-authentication)
4. [Dashboard & Analytics](#dashboard--analytics)
5. [Lead Management](#lead-management)
6. [Customer Management](#customer-management)
7. [User Management](#user-management)
8. [Settings & Configuration](#settings--configuration)
9. [UI/UX Features](#uiux-features)
10. [PWA Capabilities](#pwa-capabilities)
11. [Technical Architecture](#technical-architecture)
12. [Accounting Module](#accounting-module-new---march-8-2026)

---

## Overview

### Project Description
A modern, enterprise-grade Lead Management CRM system built with React and Vite. The application is designed specifically for sales teams to efficiently manage leads, track follow-ups, monitor performance metrics, and collaborate with team members.

### Key Characteristics
- **Technology Stack:** React 19.2.0, Vite 7.2.4, React Router 7.13.0
- **Architecture:** SPA (Single Page Application) with PWA support
- **Design Philosophy:** Clean, professional, sales-focused interface
- **Deployment:** Ready for production deployment
- **Offline Support:** Full PWA with service worker implementation

---

## Core Features

### 1. User Authentication

#### Login System
- **Location:** `/login`
- **Component:** `src/pages/Login.jsx`
- **Features:**
  - Clean, professional login interface
  - Email and password authentication
  - Form validation
  - Error handling and display
  - Loading states during authentication
  - Demo credentials provided for testing

**Demo Credentials:**
```
Email: admin@crm.com
Password: password
```

#### Authentication Flow
- Token-based authentication using localStorage
- Protected routes requiring authentication
- Automatic redirect to login for unauthenticated users
- Session persistence across browser refreshes
- Logout functionality available in all pages

**Implementation Files:**
- `src/utils/auth.js` - Authentication utilities
- `src/components/ProtectedRoute.jsx` - Route protection wrapper

---

### 2. Dashboard & Analytics

#### Main Dashboard
- **Location:** `/dashboard`
- **Component:** `src/pages/Dashboard.jsx`

#### Key Performance Indicators (KPIs)
Four primary KPI cards displayed prominently:
1. **Hot Leads** - Count of high-priority leads requiring immediate attention
2. **Overdue Follow-ups** - Number of follow-ups past due date
3. **New Leads Today** - Today's lead acquisition count
4. **Conversions (Month)** - Monthly conversion statistics

#### Visual Analytics

##### 1. Lead Status Distribution (Donut Chart)
- **Component:** `src/components/DonutChart.jsx`
- **Data Visualized:**
  - New leads
  - Contacted leads
  - Follow-up stage leads
  - Converted leads
  - Lost leads
- **Features:**
  - Color-coded segments
  - Percentage display
  - Interactive tooltips
  - Legend with counts

##### 2. Performance Over Time (Line Chart)
- **Component:** `src/components/LineChart.jsx`
- **Time Ranges:**
  - 7 Days view (daily breakdown)
  - 30 Days view (weekly breakdown)
- **Metrics Tracked:**
  - Total leads acquired
  - Conversion numbers
  - Dual-line comparison
- **Features:**
  - Smooth line rendering
  - Data point highlights
  - Responsive scaling

#### Calendar Integration
- **Monthly calendar view** with event markers
- **Event Types:**
  - Follow-up reminders (📝)
  - Call scheduled (📞)
  - Meetings (👥)
  - Deadlines (⚠️)
- **Features:**
  - Current day highlighting
  - Date selection
  - Event count indicators
  - Event details on selection
  - Month navigation (previous/next)

#### Task Management Section
- **Today's Tasks List** with priorities:
  - Call tasks
  - Meeting reminders
  - Follow-up actions
  - Overdue items (highlighted in red)
- **Task Details:**
  - Lead name and company
  - Scheduled time
  - Priority level (urgent/high/medium)
  - Status indicators
  - Quick action buttons

#### Recent Leads Widget
- Last 4 leads created
- Quick status overview
- Time stamps (relative time)
- Click to view details

#### Activity Overview
Status breakdown statistics showing distribution across:
- New leads
- Hot follow-up
- Cold leads
- Converted leads

---

### 3. Lead Management

#### Lead List View
- **Location:** `/leads`
- **Component:** `src/pages/LeadList.jsx`

#### Quick Filter Tabs
- **All Leads** - Complete lead database
- **Today** - Leads created today
- **Follow-ups Due** - Leads requiring follow-up
- **Hot Leads** - High-priority leads
- **Overdue** - Past due follow-ups

#### Advanced Filtering System

##### Search Functionality
- Real-time search across:
  - Lead name
  - Email address
  - Phone number
  - Company name

##### Filter Options
1. **Status Filter:**
   - New
   - Follow-up
   - Hot
   - Contacted
   - Converted
   - Lost

2. **Source Filter:**
   - Website
   - Referral
   - LinkedIn
   - Google Ads
   - Trade Show
   - Cold Call

3. **Staff Filter:**
   - Filter by assigned sales representative
   - All staff members listed

4. **Date Range Filter:**
   - Last 7 days
   - Last 30 days
   - Last 3 months
   - Custom date range (with date picker)

#### Lead Table Display

**Columns:**
- Checkbox (bulk selection)
- Lead Name & Email
- Phone Number
- Source
- Status (color-coded badge)
- Created Date
- Last Follow-up Date
- Next Follow-up Date (with overdue highlighting)
- Assigned Staff
- Quick Actions (Edit, Delete, View)

**Features:**
- Sortable columns
- Responsive design
- Loading skeleton during data fetch
- Empty state display
- Row hover effects

#### Pagination
- Configurable rows per page (10, 25, 50, 100)
- Page navigation controls
- Total count display
- Current page indicator
- Jump to page functionality

#### Bulk Operations
- Multi-select with checkboxes
- Select all on current page
- Bulk status change
- Bulk assignment
- Bulk delete (with confirmation)
- Bulk export

#### Lead Creation
- **Location:** `/leads/create`
- **Component:** `src/pages/CreateLead.jsx`

**Form Sections:**
1. **Contact Information:**
   - Full Name (required)
   - Email (required)
   - Phone (required)
   - Company

2. **Lead Details:**
   - Status (dropdown)
   - Lead Source
   - Notes/Comments (textarea)

**Features:**
- Form validation
- Required field indicators
- Error message display
- Success confirmation
- Cancel with confirmation

#### Lead Detail View
- **Location:** `/leads/:id`
- **Component:** `src/pages/LeadDetail.jsx`

##### Information Sections

**1. Lead Overview Card**
- Lead name and company
- Contact information (email, phone)
- Status badge (editable)
- Priority indicator (editable)
- Lead score (0-100)
- Assigned staff member

**2. Lead Details Tab**
- Source information
- Product interest
- Budget range
- Expected closure date
- Decision maker status
- Purchase timeline
- Competitor involvement
- Lead quality rating
- Lead aging (days open)
- First response time
- Follow-up compliance rate

**3. Financial Information**
- Estimated deal value
- Quotation status
- Negotiation stage
- Discount offered
- Payment status

**4. Follow-up Management**
- **Component:** `src/components/FollowUpModal.jsx`
- Schedule new follow-ups
- View upcoming follow-ups
- Mark follow-ups as completed
- Add outcomes and notes
- Follow-up types:
  - Phone call
  - Email
  - Meeting
  - WhatsApp
  - SMS

**5. Call Log & Activity History**
- **Component:** `src/components/CallLogModal.jsx`
- Log call activities
- Record outcomes:
  - Connected
  - Not answered
  - Wrong number
  - Follow-up needed
- Call duration tracking
- Detailed notes
- Activity timeline with timestamps
- Status change history

**6. Notes & Comments**
- General notes
- Objection tracking:
  - Price objections
  - Feature objections
  - Competitor comparison
  - Timeline concerns
- Timestamp and author tracking

**7. Quick Actions**
- Schedule follow-up
- Log call
- Send WhatsApp
- Send email
- Change status
- Change priority
- Convert to customer
- Mark as lost

**8. Conversion Modal**
- Convert lead to customer
- Lost reason selection
- Deal value entry
- Conversion notes

---

### 4. Customer Management

#### Customer List
- **Location:** `/customers`
- **Component:** `src/pages/CustomerList.jsx`

#### Features
- Converted leads display
- Customer profiles with avatars (auto-generated initials)
- Contact information
- Creation date and creator
- Status tracking
- Search functionality
- Date range filtering
- Status filtering
- Bulk selection and operations

#### Customer Table Columns
- Avatar with initials
- Name
- Phone number
- Email address
- Status (color-coded)
- Created by (staff member)
- Created date & time
- Actions (View, Edit, Delete)

#### Filtering Options
- Overall view
- Last 30 days
- Custom date range
- Status filters:
  - Hot Follow-up
  - New Lead
  - Contacted
  - Qualified
  - Converted

---

### 5. User Management

#### User List
- **Location:** `/users`
- **Component:** `src/pages/UserList.jsx`

#### Staff Management Features

##### User Cards Display
Each staff member card shows:
- Profile avatar (initials-based)
- Name and email
- Phone number
- Role (Admin, Manager, Sales Agent)
- Department
- Status (Active, Inactive, Suspended)
- Last active timestamp

##### Performance Metrics
Per-user statistics:
- Total assigned leads
- Open leads count
- Converted leads count
- Lost leads count
- Conversion rate (%)
- Average response time

##### Role-Based Access Control
**Component:** `src/components/RolePermissions.jsx`

**User Roles:**
1. **Admin**
   - Full system access
   - User management
   - Settings configuration
   - All lead operations

2. **Manager**
   - Lead management
   - Staff assignment
   - Report access
   - No user administration

3. **Sales Agent**
   - View and edit assigned leads
   - Create new leads
   - Limited access

**Permission Categories:**

1. **Leads Permissions:**
   - View leads
   - Create leads
   - Edit leads
   - Delete leads
   - Assign leads

2. **Reports Permissions:**
   - View reports
   - Export reports

3. **Administration Permissions:**
   - Manage users
   - Manage settings
   - Manage integrations

##### User Operations
- **Component:** `src/components/UserModal.jsx`
- Add new users
- Edit user information
- Change user roles
- Modify permissions
- Toggle user status (Active/Inactive/Suspended)
- View user details
- Delete users

#### User Detail View
- **Location:** `/users/:id`
- **Component:** `src/pages/UserDetail.jsx`
- Complete user profile
- Performance analytics
- Activity history
- Lead assignment history
- Permission management

---

### 6. Settings & Configuration

#### Settings Page
- **Location:** `/settings`
- **Component:** `src/pages/Settings.jsx`

#### Tab Navigation
Three main settings categories:
1. Lead Sources
2. General Settings
3. Notifications

#### Lead Sources Management

##### Statistics Dashboard
- Total sources count
- Active sources count
- Total leads from all sources

##### Source Configuration
Each lead source includes:
- **Name** - Source identifier
- **Icon** - Visual emoji/icon
- **Color** - Brand color (hex code)
- **Lead Count** - Number of leads from source
- **Status** - Active/Inactive toggle

**Default Sources:**
- Website (🌐)
- Referral (🤝)
- LinkedIn (💼)
- Cold Call (📞)
- Email Campaign (📧)
- Trade Show (🎪)
- Social Media (📱)

##### Source Operations
- **Add New Source:**
  - Modal-based creation
  - Name input
  - Icon selection (16 available icons)
  - Color picker (10 preset colors)
  
- **Edit Source:**
  - Modify name, icon, color
  - Update status
  
- **Delete Source:**
  - Confirmation dialog
  - Permanent removal

- **Toggle Active/Inactive:**
  - Quick enable/disable
  - Maintains lead history

##### Icon Library
Available icons for sources:
🌐 🤝 💼 📞 📧 🎪 📱 📋 🎯 💡 🏢 📊 🔗 📣 🎁 ⭐

##### Color Palette
Preset colors for sources:
- Blue (#2563EB)
- Green (#10B981)
- Amber (#F59E0B)
- Red (#EF4444)
- Purple (#8B5CF6)
- Pink (#EC4899)
- Cyan (#06B6D4)
- LinkedIn Blue (#0077B5)
- Dark Green (#14532D)
- Violet (#7C3AED)

---

### 7. UI/UX Features

#### Navigation System

##### Sidebar Navigation
- **Component:** `src/components/Sidebar.jsx`
- Collapsible sidebar
- Icon-based navigation
- Active route highlighting
- Navigation items:
  - Dashboard
  - Leads
  - Customers
  - Users
  - Settings

##### Top Navigation Bar
- **Component:** `src/components/TopNav.jsx`
- Application logo
- Page title
- User profile dropdown
- Notifications (bell icon)
- Logout button
- Breadcrumb navigation

#### Quick Actions
- **Component:** `src/components/QuickActions.jsx`
- Floating action button on list pages
- Quick access to common actions:
  - Add new lead
  - Schedule follow-up
  - Log call
  - Send message

#### Loading States
- **Component:** `LoadingSkeleton` (in LeadList.jsx)
- Skeleton screens during data loading
- Smooth content appearance
- No jarring layout shifts

#### Empty States
- Informative empty state displays
- Action prompts
- Icon-based visual feedback

#### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop layout
- Breakpoint-based adjustments
- Touch-friendly interactions

#### Color Scheme
**Status Colors:**
- New: Light Blue (#93C5FD)
- Contacted: Blue (#60A5FA)
- Follow-up: Yellow (#FBBF24)
- Qualified: Purple (#A78BFA)
- Converted: Green (#34D399)
- Lost: Gray (#D1D5DB)

**Priority Colors:**
- Hot: Red gradient
- High: Orange
- Medium: Yellow
- Normal/Cold: Gray/Blue

#### Typography
- Clean, professional fonts
- Hierarchical text sizing
- Proper contrast ratios
- Readable line heights

---

### 8. PWA Capabilities

#### Progressive Web App Features
- **Config File:** `vite.config.js`
- **Service Worker:** Auto-generated by Vite PWA plugin
- **Manifest:** Configured in vite.config.js

#### PWA Manifest Configuration
```javascript
{
  name: 'Lead Management CRM',
  short_name: 'Lead CRM',
  description: 'A comprehensive Lead Management CRM application',
  theme_color: '#667eea',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait'
}
```

#### Icons
- 192x192 PNG icon
- 512x512 PNG icon
- Maskable icon support
- Apple touch icon

#### Install Prompt
- **Component:** `src/components/PWAInstallPrompt.jsx`
- Custom install button
- Detects install capability
- Handles install event
- User choice tracking
- Hides when already installed

#### Offline Capabilities
- Service worker registration
- Cache-first strategy for assets
- Runtime caching for API calls
- Offline page support
- Background sync (ready for implementation)

#### Cache Strategy
**Workbox Configuration:**
- Google Fonts: Cache-first (1 year)
- Static assets: Pre-cached
- API calls: Network-first with fallback
- Images: Cache-first with expiration

#### App Behavior
- Standalone display mode
- No browser chrome
- Native app feel
- Add to home screen support
- Splash screen on launch

---

### 9. Technical Architecture

#### Project Structure
```
lead-crm/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-based page components
│   ├── styles/         # CSS modules per component
│   ├── utils/          # Helper functions & utilities
│   ├── assets/         # Images, icons
│   ├── App.jsx         # Main app component & routing
│   └── main.jsx        # Entry point & PWA registration
├── public/             # Static assets
├── doc/               # Documentation
└── package.json       # Dependencies
```

#### Component Architecture

**Layout Components:**
- `Layout.jsx` - Main layout wrapper
- `Sidebar.jsx` - Navigation sidebar
- `TopNav.jsx` - Top navigation bar

**Feature Components:**
- `ProtectedRoute.jsx` - Authentication guard
- `UserModal.jsx` - User creation/editing
- `FollowUpModal.jsx` - Follow-up scheduling
- `CallLogModal.jsx` - Call logging
- `RolePermissions.jsx` - Permission management

**Widget Components:**
- `DonutChart.jsx` - Donut chart visualization
- `LineChart.jsx` - Line chart visualization
- `QuickActions.jsx` - Floating action button
- `FloatingAddButton.jsx` - Add button overlay
- `PWAInstallPrompt.jsx` - PWA install UI

#### Routing Structure
```
/ → /dashboard (redirect)
/login → Public route
/dashboard → Protected route
/leads → Protected route
/leads/create → Protected route
/leads/:id → Protected route
/customers → Protected route
/users → Protected route
/users/:id → Protected route
/settings → Protected route
```

#### State Management
- React hooks (useState, useEffect, useCallback, useMemo)
- Local component state
- No external state management library
- Ready for Redux/Context API integration

#### API Integration
- **Utility:** `src/utils/api.js`
- Axios instance configured
- Base URL setup (localhost:5000/api)
- Authorization header injection
- Token management
- Error interceptors

#### Authentication System
- **Utility:** `src/utils/auth.js`
- LocalStorage-based session
- Token storage
- User data persistence
- Login/logout functions
- Authentication check helper

#### Data Flow
1. User actions trigger events
2. Component state updates
3. API calls made (currently demo data)
4. Response updates component state
5. UI re-renders with new data

---

### 10. Performance Optimizations

#### Code Splitting
- Route-based code splitting via React Router
- Lazy loading ready for implementation

#### Memoization
- `useMemo` for expensive computations
- `useCallback` for function references
- Prevents unnecessary re-renders

#### Virtual Scrolling
- Ready for large dataset handling
- Pagination implementation

#### Asset Optimization
- Vite's built-in optimization
- Tree shaking
- Minification
- Image optimization support

---

## Future Enhancement Opportunities

### Backend Integration
- Replace demo data with API calls
- Real-time updates via WebSocket
- Database persistence

### Advanced Features
- Email integration
- WhatsApp Business API
- Calendar sync (Google, Outlook)
- SMS notifications
- Export to Excel/PDF
- Advanced reporting
- Lead scoring AI
- Pipeline visualization
- Deal forecasting

### User Experience
- Dark mode
- Customizable themes
- Multi-language support
- Voice notes
- File attachments
- In-app chat

### Mobile Enhancements
- Native mobile app (React Native)
- Push notifications
- Biometric authentication
- Offline editing

---

## Development Guidelines

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
- Node.js 18+ required
- Modern browser with ES6+ support
- PWA requires HTTPS in production

### Code Standards
- React functional components
- Hooks-based architecture
- Clean, commented code
- Component-scoped CSS
- Semantic HTML

### Testing Recommendations
- Unit tests for utilities
- Integration tests for components
- E2E tests for critical flows
- Accessibility testing

---

## Browser Support

### Desktop
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+
- ✅ Samsung Internet 14+

### PWA Support
- ✅ Chrome (Android & Desktop)
- ✅ Edge (Desktop)
- ⚠️ Safari (Limited PWA features)
- ⚠️ Firefox (Limited PWA features)

---

## Security Considerations

### Current Implementation
- Client-side token storage (localStorage)
- Basic authentication flow
- Protected routes

### Production Recommendations
- Implement JWT with refresh tokens
- HTTP-only cookies for sensitive data
- HTTPS mandatory
- CORS configuration
- Rate limiting
- Input sanitization
- XSS protection
- CSRF tokens

---

## Deployment Readiness

### Production Checklist
- [x] Build process configured
- [x] PWA manifest ready
- [x] Service worker implemented
- [x] Error boundaries (recommended to add)
- [x] Loading states
- [x] Responsive design
- [x] Browser compatibility
- [ ] Environment variables setup
- [ ] API endpoint configuration
- [ ] Analytics integration
- [ ] Error monitoring

### Deployment Platforms
Optimized for:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages

---

## Accounting Module (NEW - March 8, 2026)

### Overview
A comprehensive accounting system integrated into the CRM, providing double-entry bookkeeping, GST tax management, multi-currency support, and financial reporting capabilities.

### Module Structure
- **Pages:** 23 pages in `src/pages/accounting/`
- **Components:** 9 modals in `src/components/accounting/`
- **API Layer:** `src/utils/accountingApi.js` (100+ endpoint functions)
- **Styles:** `src/styles/Accounting.css` (shared module styles)

### Features

#### Accounting Dashboard (`/accounting/dashboard`)
- KPI cards: Revenue, Expenses, Net Profit, Outstanding Invoices, Bank Balance
- Monthly revenue trend chart
- Expense breakdown chart
- Quick action cards
- Recent transactions table

#### Chart of Accounts (`/accounting/chart-of-accounts`)
- Hierarchical tree view grouped by type (Assets, Liabilities, Equity, Income, Expenses)
- Account code support
- Summary cards per account type
- Create/Edit/Delete accounts via modal
- Search and type filter

#### Customers (`/accounting/customers`, `/accounting/customers/:id`)
- Customer list with search
- KPI cards: Total customers, Total receivable, Credit limit
- Customer detail page with ledger view (debit/credit/balance history)
- Create/Edit/Delete customers via modal
- GST number, currency preference, credit limit fields

#### Vendors / Suppliers (`/accounting/vendors`, `/accounting/vendors/:id`)
- Vendor list with search
- Vendor detail page with ledger view
- Payment terms management
- Create/Edit/Delete via modal

#### Sales / Invoicing (`/accounting/invoices`, `/accounting/invoices/create`, `/accounting/invoices/:id`)
- Invoice list with status filter (Paid, Pending, Overdue, Draft)
- KPI cards per status
- Create invoice with line items editor
- Multi-currency support with exchange rate
- Tax selection per line item
- Discount percentage per item
- Auto-generated accounting entry preview (Debit: A/R, Credit: Sales + GST)
- Invoice detail page with items and entry preview

#### Purchases / Bills (`/accounting/bills`, `/accounting/bills/create`)
- Bill list with status filter
- Create bill with line items
- Auto-generated accounting entry (Debit: Expense, Credit: A/P)

#### Income Manager (`/accounting/income`)
- Track service income, cash sales, commissions, interest
- Category-based organization
- Payment method tracking
- Auto accounting entry preview in modal
- Multi-currency support

#### Expense Manager (`/accounting/expenses`)
- Track rent, salaries, utilities, marketing, travel, subscriptions
- Category-based organization
- Vendor association
- Auto accounting entry preview in modal

#### Income & Expense Dashboard (`/accounting/income-expenses`)
- Daily/Monthly/Yearly toggle
- Income vs Expense trend chart (bar chart)
- Expense breakdown by category (progress bars)
- Profit margin calculation
- Quick links to income, expenses, and P&L report

#### Banking (`/accounting/banking`, `/accounting/banking/:id`)
- Bank account card grid view (Savings, Current, FD, Cash)
- Create/Edit/Delete bank accounts
- Bank account detail with transaction history
- Record deposits, withdrawals, and internal transfers
- Transaction type filter
- KPI: Current balance, total deposits, total withdrawals

#### Journal Entries (`/accounting/journal-entries`, `/accounting/journal-entries/create`)
- Journal entry list with search
- Manual double-entry form with multi-line debit/credit rows
- **Real-time balance validation** (debit total must equal credit total)
- Visual balance indicator (green ✓ or red ✗ with difference amount)
- Account selector dropdown
- Post entry only when balanced

#### Tax Management (`/accounting/taxes`)
- GST tax rates: CGST, SGST, IGST
- KPI cards per tax type
- Create/Edit/Delete tax rates via modal
- Color-coded type badges

#### Currency Management (`/accounting/currencies`)
- Multi-currency list with exchange rates
- Base currency indicator (INR)
- Create/Edit/Delete currencies via modal
- Protection against deleting base currency

#### Financial Reports (`/accounting/reports`, `/accounting/reports/:type`)
- Report hub with 8 report types:
  - Balance Sheet
  - Profit & Loss
  - Trial Balance
  - General Ledger
  - Cash Flow Statement
  - Income Report
  - Expense Report
  - GST Summary Report
- Date range filter
- Print support
- Section-based layout with totals
- Trial balance with debit/credit columns

#### Accounting Settings (`/accounting/settings`)
- **Company tab:** Company name, address, GST, PAN, financial year, base currency
- **Accounting tab:** Fiscal year, accounting method (Cash/Accrual), decimal precision, default accounts
- **Numbering tab:** Auto-numbering prefix and next number for invoices, bills, journal entries with live preview

### Navigation Integration
- Desktop: Accounting dropdown menu in top navigation bar
- Mobile: Dedicated "Accounting" section in side panel with icon links
- All pages wrapped in `ProtectedRoute` for authentication

### API Layer
All API endpoints defined in `src/utils/accountingApi.js`:
- Chart of Accounts CRUD
- Customers CRUD + Ledger
- Vendors CRUD + Ledger
- Invoices CRUD
- Bills CRUD
- Income CRUD
- Expenses CRUD
- Bank Accounts CRUD + Transactions
- Journal Entries CRUD
- Taxes CRUD
- Currencies CRUD
- Dashboard data
- Report generation
- Accounting settings
- Recurring transactions

### Design Patterns
- Consistent with existing CRM design language
- Demo fallback data for offline/development mode
- Shared CSS component library (`Accounting.css`)
- Responsive design (desktop + mobile)
- Loading states and empty states
- Modal-based CRUD operations

---

## Conclusion

This Lead Management CRM is a fully-featured, production-ready application with a comprehensive suite of tools for managing leads, tracking sales activities, and monitoring team performance. The clean, professional UI combined with powerful features makes it suitable for small to medium-sized sales teams.

The application is built with modern web technologies, follows best practices, and is ready for backend integration and further enhancement based on specific business requirements.

---

**Document Maintained By:** Development Team  
**For Questions/Support:** Refer to additional documentation in `/doc` folder  
**License:** Proprietary

