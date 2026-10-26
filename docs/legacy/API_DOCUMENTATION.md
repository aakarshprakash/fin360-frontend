# Lead Management CRM - API Documentation

> **This document is the single source of truth for both Frontend and Backend teams.**
> It describes every API endpoint the frontend is actively calling, including exact request/response shapes.
> Backend team must implement endpoints matching these contracts. Frontend falls back to demo data on failure.

---

## Table of Contents

1. [Base URL & Configuration](#base-url--configuration)
2. [Authentication & Headers](#authentication--headers)
3. [Error Response Standards](#error-response-standards)
4. [API Health Check](#api-health-check)
5. [Authentication Endpoints](#authentication-endpoints) ✅ LIVE
6. [Leads API](#leads-api) ⏳ NEEDED
7. [Lead Detail Sub-Resources](#lead-detail-sub-resources) ⏳ NEEDED
8. [Customers API](#customers-api) ⏳ NEEDED
9. [Users API (Admin)](#users-api-admin-only) ⏳ NEEDED
10. [Dashboard API](#dashboard-api) ⏳ NEEDED
11. [Lead Sources API](#lead-sources-api) ⏳ PLANNED
12. [Test Credentials](#test-credentials)
13. [Testing Guide](#testing-guide)
14. [API Conventions](#api-conventions)
15. [Frontend Integration Notes](#frontend-integration-notes)

---

## Base URL & Configuration

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://leadcrm.vpsappserverone.in/api` |
| **Local Dev** | `http://localhost:8000/api` |

### CORS
- Development: Accepts all origins (`*`)
- Production: Restrict to frontend domain in `config/cors.php`

### Rate Limiting
- **60 requests/minute** per user/IP
- Exceeding returns `429 Too Many Requests`

---

## Authentication & Headers

Uses **Laravel Sanctum** bearer token authentication.

### Headers for All Protected Routes
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

### Token Lifecycle
1. Frontend sends `POST /api/login` → receives `token`
2. Token stored in `localStorage` and attached to every request via Axios interceptor
3. On `401` response → frontend auto-clears token and redirects to `/login`
4. On logout → frontend calls `POST /api/logout` to revoke token server-side

---

## Error Response Standards

All error responses must follow these formats so the frontend can parse them correctly.

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```
> Frontend behavior: Auto-logout + redirect to `/login`

### 403 Forbidden
```json
{
  "message": "Your account is not active. Please contact administrator."
}
```
> Frontend behavior: Shows `message` to user on login screen

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```
> Frontend behavior: Displays the first error from the first field in `errors` object

### 500 Server Error
```json
{
  "message": "Server Error"
}
```

---

## API Health Check

### `GET /api`

**Auth Required:** No

**Response (200):**
```json
{
  "app": "Lead Management CRM API",
  "status": "running",
  "version": "1.0.0",
  "timestamp": "2026-03-05T12:30:00.000000Z"
}
```

---

## Authentication Endpoints

> ✅ **Status: LIVE** — These endpoints are deployed and working.

### 1. Register

**`POST /api/register`** — Auth Required: No

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "+1-555-123-4567",
  "role": "Sales Agent",
  "department": "Sales"
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "role": "Sales Agent",
    "department": "Sales",
    "status": "Active",
    "permissions": ["view_leads", "create_leads", "edit_leads"]
  },
  "token": "1|abc123xyz..."
}
```

---

### 2. Login

**`POST /api/login`** — Auth Required: No

**Frontend file:** `src/pages/Login.jsx`

**Request Body:**
```json
{
  "email": "admin@crm.com",
  "password": "password"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@crm.com",
    "phone": "+1-555-100-0001",
    "role": "Admin",
    "department": "Management",
    "status": "Active",
    "permissions": [
      "view_leads",
      "create_leads",
      "edit_leads",
      "delete_leads",
      "manage_users",
      "view_reports"
    ],
    "avatar": null
  },
  "token": "1|abc123xyz..."
}
```

**Error (422):** Standard validation error  
**Error (403):** Account inactive — frontend displays `message` on login screen

> **Frontend reads:** `response.data.token` and `response.data.user`, stores both in `localStorage`.

---

### 3. Get Current User

**`GET /api/me`** — Auth Required: Yes

**Frontend file:** `src/utils/auth.js` → `fetchCurrentUser()`

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@crm.com",
    "phone": "+1-555-100-0001",
    "role": "Admin",
    "department": "Management",
    "status": "Active",
    "permissions": ["view_leads", "create_leads", "edit_leads", "delete_leads", "manage_users", "view_reports"],
    "avatar": null,
    "last_active": "2026-03-04T10:30:00.000000Z",
    "created_at": "2026-03-04T09:15:00.000000Z"
  }
}
```

> **Frontend reads:** `response.data.user`

---

### 4. Logout

**`POST /api/logout`** — Auth Required: Yes

**Frontend file:** `src/utils/auth.js` → `apiLogout()`

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

> Frontend clears `localStorage` after this call (regardless of success/failure).

---

## Leads API

> ⏳ **Status: NEEDED** — Frontend is actively calling these endpoints and falls back to demo data on failure.

### 5. List All Leads

**`GET /api/leads`** — Auth Required: Yes

**Frontend files:** `src/pages/LeadList.jsx`, `src/components/TopNav.jsx` (search)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name, email, phone, or company |
| `page` | int | Page number (default: 1) |
| `per_page` | int | Items per page (default: 15, max: 100) |

**Success Response (200):**
```json
{
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "123-456-7890",
      "company": "ABC Corp",
      "status": "New",
      "source": "Website",
      "priority": "hot",
      "assigned_to": "Sarah Miller",
      "created_at": "2026-02-07",
      "last_follow_up": "2026-02-06",
      "next_follow_up": "2026-02-07",
      "notes": "Interested in enterprise plan"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 72
  }
}
```

> **Frontend reads:** `response.data.leads` || `response.data.data` || `response.data` (tries all three).
> Also reads `assigned_to` OR `assignedTo` for staff filter extraction.

**Lead status values used by frontend:**
- `New`, `Contacted`, `Follow-up`, `Hot`, `Qualified`, `Converted`, `Lost`

**Lead priority values used by frontend:**
- `hot`, `high`, `medium`, `normal`

**Lead source values used by frontend:**
- `Website`, `Referral`, `LinkedIn`, `Google Ads`, `Trade Show`, `Cold Call`

---

### 6. Create Lead

**`POST /api/leads`** — Auth Required: Yes

**Frontend file:** `src/pages/CreateLead.jsx`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "company": "ABC Corp",
  "status": "New",
  "source": "Website",
  "notes": "Interested in our enterprise plan"
}
```

**Validation rules (suggested):**
| Field | Rules |
|-------|-------|
| `name` | required, string |
| `email` | required, email |
| `phone` | required, string |
| `company` | optional, string |
| `status` | optional, in: New,Contacted,Qualified,Converted,Lost |
| `source` | optional, string |
| `notes` | optional, string |

**Success Response (201):**
```json
{
  "message": "Lead created successfully",
  "lead": {
    "id": 10,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "company": "ABC Corp",
    "status": "New",
    "source": "Website",
    "notes": "Interested in our enterprise plan",
    "created_at": "2026-03-05T12:00:00.000000Z"
  }
}
```

> **Frontend behavior on success:** Navigates to `/leads` page.  
> **Frontend behavior on 422:** Displays first validation error.  
> **Frontend behavior on network error:** Shows "Could not connect to server."

---

### 7. Get Lead Detail

**`GET /api/leads/{id}`** — Auth Required: Yes

**Frontend file:** `src/pages/LeadDetail.jsx`

**Success Response (200):**
```json
{
  "lead": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "ABC Corp",
    "status": "New",
    "priority": "Hot",
    "source": "Website",
    "product_interest": "Enterprise Plan",
    "budget_range": "$10,000 - $25,000",
    "expected_closure_date": "Feb 28, 2026",
    "lead_score": 85,
    "created_at": "Feb 5, 2026",
    "assigned_to": "Sarah Miller",
    "decision_maker": true,
    "purchase_timeline": "1-3 months",
    "competitor_involved": "Competitor X",
    "lead_quality": "High",
    "lost_reason": null,
    "estimated_deal_value": 15000,
    "quotation_sent": true,
    "negotiation_stage": "Proposal Sent",
    "discount_offered": "10%",
    "payment_status": "Pending",
    "lead_aging": 2,
    "first_response_time": "2 hours",
    "follow_up_compliance": 95,
    "staff_history": ["Sarah Miller", "John Smith"]
  }
}
```

> **Frontend reads:** `response.data.lead` || `response.data`

---

### 8. Update Lead

**`PUT /api/leads/{id}`** — Auth Required: Yes

> ⚠️ Frontend does NOT currently call this endpoint (status/priority changes are client-side only).
> Backend should still implement it for future use.

**Request Body:** Same fields as Create Lead (partial update supported).

**Success Response (200):**
```json
{
  "message": "Lead updated successfully",
  "lead": { /* updated lead object */ }
}
```

---

### 9. Delete Lead

**`DELETE /api/leads/{id}`** — Auth Required: Yes

> ⚠️ Frontend does NOT currently call this. Implement as soft delete.

**Success Response (200):**
```json
{
  "message": "Lead deleted successfully"
}
```

---

### 10. Convert Lead to Customer

**`POST /api/leads/{id}/convert`** — Auth Required: Yes

> ⚠️ Frontend has a convert modal in `LeadDetail.jsx` but does NOT currently call this. Implement for future use.

**Success Response (200):**
```json
{
  "message": "Lead converted to customer successfully",
  "customer": { /* customer object */ }
}
```

---

## Lead Detail Sub-Resources

> ⏳ **Status: NEEDED** — Frontend actively calls these from `src/pages/LeadDetail.jsx`.

### 11. Get Follow-Ups for a Lead

**`GET /api/leads/{id}/follow-ups`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "follow_ups": [
    {
      "id": 1,
      "date": "Feb 10, 2026",
      "time": "10:00 AM",
      "type": "call",
      "status": "pending",
      "note": "Schedule demo call to present enterprise features.",
      "outcome": null,
      "created_at": "Feb 5, 2026",
      "created_by": "Sarah Miller"
    },
    {
      "id": 2,
      "date": "Feb 7, 2026",
      "time": "02:00 PM",
      "type": "email",
      "status": "completed",
      "note": "Send pricing proposal with custom discount.",
      "outcome": "Proposal sent, awaiting response",
      "created_at": "Feb 5, 2026",
      "created_by": "Sarah Miller"
    }
  ]
}
```

> **Frontend reads:** `response.data.followups` || `response.data.follow_ups` || `response.data`

**Follow-up type values:** `call`, `email`, `meeting`, `visit`  
**Follow-up status values:** `pending`, `completed`, `overdue`

---

### 12. Get Call Logs for a Lead

**`GET /api/leads/{id}/call-logs`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "call_logs": [
    {
      "id": 1,
      "type": "call",
      "outcome": "connected",
      "duration": "15",
      "notes": "Discussed product features. Client is interested in enterprise plan.",
      "timestamp": "Feb 5, 2026 10:30 AM",
      "created_by": "Sarah Miller"
    },
    {
      "id": 2,
      "type": "whatsapp",
      "outcome": "follow_up_needed",
      "duration": "",
      "notes": "Sent product brochure and pricing details via WhatsApp.",
      "timestamp": "Feb 5, 2026 11:45 AM",
      "created_by": "Sarah Miller"
    },
    {
      "id": 3,
      "type": "status_change",
      "outcome": "info",
      "notes": "Status changed from \"New\" to \"Contacted\"",
      "timestamp": "Feb 5, 2026 10:35 AM",
      "created_by": "Sarah Miller"
    }
  ]
}
```

> **Frontend reads:** `response.data.call_logs` || `response.data.callLogs` || `response.data`

**Call log type values:** `call`, `whatsapp`, `status_change`  
**Call log outcome values:** `connected`, `not_answered`, `follow_up_needed`, `info`

---

### 13. Get Notes for a Lead

**`GET /api/leads/{id}/notes`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "notes": [
    {
      "id": 1,
      "type": "general",
      "content": "Client showed strong interest in analytics dashboard.",
      "timestamp": "Feb 5, 2026 11:00 AM",
      "created_by": "Sarah Miller"
    },
    {
      "id": 2,
      "type": "objection",
      "objection_type": "price",
      "content": "Client mentioned budget constraints. May need quarterly payment.",
      "timestamp": "Feb 5, 2026 10:45 AM",
      "created_by": "Sarah Miller"
    }
  ]
}
```

> **Frontend reads:** `response.data.notes` || `response.data`

**Note type values:** `general`, `objection`  
**Objection type values:** `price`, `feature`, `competitor`, `timing`

---

## Customers API

> ⏳ **Status: NEEDED** — Frontend actively calls this from `src/pages/CustomerList.jsx`.

### 14. List All Customers

**`GET /api/customers`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "customers": [
    {
      "id": 1,
      "name": "John Anderson",
      "phone": "+1 (555) 123-4567",
      "email": "john.anderson@company.com",
      "status": "Hot Followup",
      "created_by": "Sarah Wilson",
      "created_at": "2026-02-05T09:30:00.000000Z",
      "avatar": "JA"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 35
  }
}
```

> **Frontend reads:** `response.data.customers` || `response.data.data` || `response.data`

**Customer status values used by frontend:**
- `New Lead`, `Contacted`, `Hot Followup`, `Qualified`, `Converted`

---

### 15. Get Customer Detail

**`GET /api/customers/{id}`** — Auth Required: Yes

> ⚠️ Frontend does NOT currently call this. Implement for future use.

---

## Users API (Admin Only)

> ⏳ **Status: NEEDED** — Frontend actively calls list endpoint from `src/pages/UserList.jsx`.  
> `UserDetail.jsx` does NOT yet call the API (uses demo data with `setTimeout`).

### 16. List All Users

**`GET /api/users`** — Auth Required: Yes (Admin/Manager)

**Frontend file:** `src/pages/UserList.jsx`

**Success Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Sarah Miller",
      "email": "sarah.miller@company.com",
      "phone": "+1 (555) 123-4567",
      "avatar": null,
      "role": "Admin",
      "status": "Active",
      "department": "Sales",
      "assigned_leads": 45,
      "open_leads": 12,
      "converted_leads": 28,
      "lost_leads": 5,
      "conversion_rate": 62.2,
      "avg_response_time": "2.5 hrs",
      "last_active": "2026-02-07T14:30:00.000000Z",
      "joined_at": "2024-06-15",
      "permissions": ["view_leads", "create_leads", "edit_leads", "delete_leads", "assign_leads", "view_reports", "manage_users"]
    }
  ]
}
```

> **Frontend reads:** `response.data.users` || `response.data.data` || `response.data`

**User role values:** `Admin`, `Manager`, `Sales Agent`  
**User status values:** `Active`, `Inactive`, `Suspended`  
**Department values:** `Sales`, `Marketing`, `Support`, `Operations`

---

### 17. Get User Detail

**`GET /api/users/{id}`** — Auth Required: Yes (Admin/Manager)

**Frontend file:** `src/pages/UserDetail.jsx` (⚠️ NOT yet calling API — needs to be wired up)

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Sarah Miller",
    "email": "sarah.miller@company.com",
    "phone": "+1 (555) 123-4567",
    "avatar": null,
    "role": "Admin",
    "status": "Active",
    "department": "Sales",
    "title": "Senior Sales Manager",
    "location": "New York, NY",
    "timezone": "EST (UTC-5)",
    "joined_at": "2024-06-15",
    "last_active": "2026-02-07T14:30:00.000000Z",
    "permissions": ["view_leads", "create_leads", "edit_leads", "delete_leads", "assign_leads", "view_reports", "manage_users"],
    "performance": {
      "total_leads": 156,
      "open_leads": 12,
      "converted_leads": 98,
      "lost_leads": 46,
      "conversion_rate": 68.1,
      "avg_response_time": "2.5 hrs",
      "avg_deal_size": "$12,450",
      "total_revenue": "$1,220,100",
      "follow_up_compliance": 94,
      "overdue_follow_ups": 2
    },
    "monthly_performance": [
      { "month": "Sep", "leads": 18, "converted": 12 },
      { "month": "Oct", "leads": 22, "converted": 15 }
    ],
    "activity_log": [
      {
        "id": 1,
        "type": "login",
        "description": "Logged in from Chrome on Windows",
        "timestamp": "2026-02-07T14:30:00.000000Z",
        "ip": "192.168.1.105"
      },
      {
        "id": 2,
        "type": "lead_update",
        "description": "Updated lead \"Tech Solutions Inc\" status to Qualified",
        "timestamp": "2026-02-07T14:15:00.000000Z"
      }
    ]
  }
}
```

**Activity log type values:** `login`, `lead_create`, `lead_update`, `lead_convert`, `call`, `note`

---

### 18. Create User

**`POST /api/users`** — Auth Required: Yes (Admin)

**Frontend file:** `src/components/UserModal.jsx`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 (555) 123-4567",
  "role": "Sales Agent",
  "department": "Sales",
  "title": "Sales Representative",
  "status": "Active",
  "send_invite": true
}
```

> ⚠️ Frontend currently saves to local state only (via `UserModal`). Backend should implement this so it persists.

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": { /* user object */ }
}
```

---

### 19. Update User

**`PUT /api/users/{id}`** — Auth Required: Yes (Admin)

**Request Body:** Same fields as Create User (partial update supported).

**Success Response (200):**
```json
{
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

---

### 20. Delete User

**`DELETE /api/users/{id}`** — Auth Required: Yes (Admin)

> Implement as soft delete.

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

## Dashboard API

> ⏳ **Status: NEEDED** — Frontend actively calls all four endpoints from `src/pages/Dashboard.jsx`.

### 21. Dashboard Stats

**`GET /api/dashboard/stats`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "kpis": {
    "hotLeads": 8,
    "overdueFollowups": 3,
    "newLeadsToday": 12,
    "conversionsMonth": 24
  },
  "funnel": {
    "new": 156,
    "contacted": 234,
    "followup": 89,
    "converted": 24,
    "lost": 18
  },
  "statusBreakdown": {
    "new": 45,
    "hotFollowup": 28,
    "cold": 15,
    "converted": 12
  }
}
```

> **Frontend reads:** `response.data.kpis`, `response.data.funnel`, `response.data.statusBreakdown`
> ⚠️ **Note:** Keys use **camelCase** (not snake_case) — match frontend state variable names exactly.

---

### 22. Recent Leads

**`GET /api/dashboard/recent-leads`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "company": "ABC Corp",
      "status": "New",
      "time": "2 hours ago"
    }
  ]
}
```

> **Frontend reads:** `response.data.leads` || `response.data`

---

### 23. Pending Follow-ups / Today's Tasks

**`GET /api/dashboard/pending-followups`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "tasks": [
    {
      "id": 1,
      "type": "followup",
      "leadName": "John Doe",
      "company": "ABC Corp",
      "time": "10:00 AM",
      "priority": "high",
      "status": "pending"
    },
    {
      "id": 5,
      "type": "overdue",
      "leadName": "Mike Brown",
      "company": "StartUp Co",
      "dueDate": "Feb 3",
      "priority": "urgent",
      "status": "overdue"
    }
  ]
}
```

> **Frontend reads:** `response.data.tasks` || `response.data`

**Task type values:** `followup`, `call`, `meeting`, `overdue`  
**Task priority values:** `urgent`, `high`, `medium`, `normal`  
**Task status values:** `pending`, `overdue`, `completed`

> ⚠️ **Note:** Keys use **camelCase** (`leadName`, `dueDate`) — match frontend exactly.

---

### 24. Calendar Events

**`GET /api/dashboard/calendar-events`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "events": [
    {
      "date": 5,
      "title": "Follow up - John Doe",
      "type": "followup",
      "leadId": 1,
      "status": "Hot"
    },
    {
      "date": 12,
      "title": "Proposal deadline",
      "type": "deadline",
      "leadId": 5,
      "status": "Qualified"
    }
  ]
}
```

> **Frontend reads:** `response.data.events`
> `date` is the **day of the month** (integer), not a full date string.

**Event type values:** `followup`, `call`, `meeting`, `deadline`

---

## Lead Sources API

> 📋 **Status: PLANNED** — Frontend `src/pages/Settings.jsx` manages sources in local state only. Backend should implement for persistence.

### 25. List Lead Sources

**`GET /api/lead-sources`** — Auth Required: Yes

**Success Response (200):**
```json
{
  "sources": [
    {
      "id": 1,
      "name": "Website",
      "color": "#2563EB",
      "icon": "🌐",
      "count": 145,
      "active": true
    }
  ]
}
```

---

### 26. Create Lead Source

**`POST /api/lead-sources`** — Auth Required: Yes (Admin)

**Request Body:**
```json
{
  "name": "Website",
  "color": "#2563EB",
  "icon": "🌐"
}
```

**Success Response (201):**
```json
{
  "message": "Lead source created successfully",
  "source": { /* source object */ }
}
```

---

### 27. Update Lead Source

**`PUT /api/lead-sources/{id}`** — Auth Required: Yes (Admin)

**Request Body:** Same as create (partial update).

**Success Response (200):**
```json
{
  "message": "Lead source updated successfully",
  "source": { /* updated source object */ }
}
```

---

### 28. Delete Lead Source

**`DELETE /api/lead-sources/{id}`** — Auth Required: Yes (Admin)

**Success Response (200):**
```json
{
  "message": "Lead source deleted successfully"
}
```

---

## Test Credentials

**⚠️ For Development/Testing Only:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | password |
| Manager | sarah@crm.com | password |
| Sales Agent | john@crm.com | password |
| Sales Agent | emily@crm.com | password |

---

## Testing Guide

### cURL Examples

**Login:**
```bash
curl -X POST https://leadcrm.vpsappserverone.in/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "admin@crm.com", "password": "password"}'
```

**Get Current User:**
```bash
curl -X GET https://leadcrm.vpsappserverone.in/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**List Leads:**
```bash
curl -X GET "https://leadcrm.vpsappserverone.in/api/leads?search=john&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Create Lead:**
```bash
curl -X POST https://leadcrm.vpsappserverone.in/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "555-1234", "company": "ABC Corp", "status": "New", "source": "Website"}'
```

**Logout:**
```bash
curl -X POST https://leadcrm.vpsappserverone.in/api/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

### Postman Setup

1. **Create collection:** "Lead CRM API"
2. **Environment variables:**
   - `base_url`: `https://leadcrm.vpsappserverone.in/api`
   - `token`: _(auto-set after login)_
3. **Login request** — In Tests tab:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```
4. **All other requests** — Add header:
   - `Authorization`: `Bearer {{token}}`

---

## API Conventions

| Convention | Detail |
|------------|--------|
| **Date format** | ISO 8601: `YYYY-MM-DDTHH:mm:ss.ssssssZ` |
| **Timezone** | All timestamps in UTC |
| **Soft deletes** | Enabled on users, leads, customers |
| **Pagination default** | 15 items/page, max 100 |
| **Response format** | JSON only |
| **Key naming** | snake_case for most endpoints; camelCase for dashboard endpoints (see notes) |

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthorized (token missing/expired) |
| 403 | Forbidden (account inactive / insufficient role) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Frontend Integration Notes

> **For Backend Team:** These notes explain how the frontend consumes API responses so you can avoid breaking the integration.

### Response Parsing Strategy
The frontend uses a defensive fallback chain when reading response data. For example:
```javascript
// Leads
const data = response.data?.leads || response.data?.data || response.data || [];

// Users
const data = response.data?.users || response.data?.data || response.data || [];

// Customers
const data = response.data?.customers || response.data?.data || response.data || [];
```
**Recommendation:** Always wrap arrays in a named key (e.g., `{ "leads": [...] }`) for clarity.

### Demo Data Fallback
Every page wraps API calls in `try/catch`. On any failure (network error, 4xx, 5xx), the frontend silently falls back to hardcoded demo data. This means:
- During development, the app works without a running backend
- In production, API failures are transparent to the user (they see demo data)

### Key Naming Mismatch
The frontend handles both `camelCase` and `snake_case`:
```javascript
// LeadList.jsx
const uniqueStaff = data.map(l => l.assignedTo || l.assigned_to);

// LeadDetail.jsx follow-ups
fuRes.data?.followups || fuRes.data?.follow_ups || fuRes.data
```
**Recommendation:** Use `snake_case` consistently from the backend (Laravel default). The frontend already handles both.

### Pages NOT Yet Wired to API
| Page | Current Behavior | Backend Endpoint Needed |
|------|-----------------|------------------------|
| `UserDetail.jsx` | Loads demo data via `setTimeout` | `GET /api/users/{id}` |
| `Settings.jsx` | Local state only | `GET/POST/PUT/DELETE /api/lead-sources` |
| `UserModal.jsx` | Saves to parent component state | `POST /api/users`, `PUT /api/users/{id}` |
| Lead status/priority changes | Client-side only in `LeadDetail.jsx` | `PUT /api/leads/{id}` |
| Follow-up creation | Client-side only | `POST /api/followups` |
| Call log creation | Client-side only | `POST /api/call-logs` |
| Note creation | Client-side only | `POST /api/notes` |

---

## Endpoint Summary Table

| # | Method | Endpoint | Status | Frontend File |
|---|--------|----------|--------|---------------|
| 1 | GET | `/api` | ✅ Live | — |
| 2 | POST | `/api/register` | ✅ Live | — |
| 3 | POST | `/api/login` | ✅ Live | `Login.jsx` |
| 4 | GET | `/api/me` | ✅ Live | `auth.js` |
| 5 | POST | `/api/logout` | ✅ Live | `auth.js` |
| 6 | GET | `/api/leads` | ⏳ Build | `LeadList.jsx`, `TopNav.jsx` |
| 7 | POST | `/api/leads` | ⏳ Build | `CreateLead.jsx` |
| 8 | GET | `/api/leads/{id}` | ⏳ Build | `LeadDetail.jsx` |
| 9 | PUT | `/api/leads/{id}` | ⏳ Build | — (future) |
| 10 | DELETE | `/api/leads/{id}` | ⏳ Build | — (future) |
| 11 | POST | `/api/leads/{id}/convert` | ⏳ Build | — (future) |
| 12 | GET | `/api/leads/{id}/follow-ups` | ⏳ Build | `LeadDetail.jsx` |
| 13 | GET | `/api/leads/{id}/call-logs` | ⏳ Build | `LeadDetail.jsx` |
| 14 | GET | `/api/leads/{id}/notes` | ⏳ Build | `LeadDetail.jsx` |
| 15 | GET | `/api/customers` | ⏳ Build | `CustomerList.jsx` |
| 16 | GET | `/api/customers/{id}` | ⏳ Build | — (future) |
| 17 | GET | `/api/users` | ⏳ Build | `UserList.jsx` |
| 18 | GET | `/api/users/{id}` | ⏳ Build | `UserDetail.jsx` (not wired yet) |
| 19 | POST | `/api/users` | ⏳ Build | `UserModal.jsx` (not wired yet) |
| 20 | PUT | `/api/users/{id}` | ⏳ Build | `UserModal.jsx` (not wired yet) |
| 21 | DELETE | `/api/users/{id}` | ⏳ Build | — (future) |
| 22 | GET | `/api/dashboard/stats` | ⏳ Build | `Dashboard.jsx` |
| 23 | GET | `/api/dashboard/recent-leads` | ⏳ Build | `Dashboard.jsx` |
| 24 | GET | `/api/dashboard/pending-followups` | ⏳ Build | `Dashboard.jsx` |
| 25 | GET | `/api/dashboard/calendar-events` | ⏳ Build | `Dashboard.jsx` |
| 26 | GET | `/api/lead-sources` | 📋 Planned | `Settings.jsx` (not wired yet) |
| 27 | POST | `/api/lead-sources` | 📋 Planned | `Settings.jsx` (not wired yet) |
| 28 | PUT | `/api/lead-sources/{id}` | 📋 Planned | `Settings.jsx` (not wired yet) |
| 29 | DELETE | `/api/lead-sources/{id}` | 📋 Planned | `Settings.jsx` (not wired yet) |
| 30 | POST | `/api/followups` | 📋 Planned | — (future) |
| 31 | PUT | `/api/followups/{id}` | 📋 Planned | — (future) |
| 32 | POST | `/api/followups/{id}/complete` | 📋 Planned | — (future) |
| 33 | POST | `/api/call-logs` | 📋 Planned | — (future) |
| 34 | POST | `/api/notes` | 📋 Planned | — (future) |
| 35 | PUT | `/api/notes/{id}` | 📋 Planned | — (future) |
| 36 | DELETE | `/api/notes/{id}` | 📋 Planned | — (future) |

---

## Build Priority for Backend Team

### 🔴 Priority 1 — Frontend is actively calling (falls back to demo data)
1. `GET /api/leads` (with `?search=` support)
2. `POST /api/leads`
3. `GET /api/leads/{id}`
4. `GET /api/leads/{id}/follow-ups`
5. `GET /api/leads/{id}/call-logs`
6. `GET /api/leads/{id}/notes`
7. `GET /api/customers`
8. `GET /api/users`
9. `GET /api/dashboard/stats`
10. `GET /api/dashboard/recent-leads`
11. `GET /api/dashboard/pending-followups`
12. `GET /api/dashboard/calendar-events`

### 🟡 Priority 2 — Frontend UI exists but not yet wired to API
13. `GET /api/users/{id}`
14. `POST /api/users`
15. `PUT /api/users/{id}`
16. `PUT /api/leads/{id}`
17. `POST /api/leads/{id}/convert`
18. `GET/POST/PUT/DELETE /api/lead-sources`

### 🟢 Priority 3 — Create/mutation endpoints for sub-resources
19. `POST /api/followups`
20. `PUT /api/followups/{id}`
21. `POST /api/followups/{id}/complete`
22. `POST /api/call-logs`
23. `POST /api/notes`
24. `PUT/DELETE /api/notes/{id}`
25. `DELETE /api/leads/{id}`
26. `DELETE /api/users/{id}`

---

**API Status:** 🟢 Auth endpoints **LIVE** | ⏳ Resource endpoints **IN PROGRESS**  
**Last Updated:** March 5, 2026  
**Version:** 1.1.0

