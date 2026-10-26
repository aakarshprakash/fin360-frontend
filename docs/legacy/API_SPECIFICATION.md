# 🔌 Lead CRM - Backend API Specification

**Version:** 1.0.0  
**Last Updated:** February 5, 2026  
**Status:** Frontend-First Development - API Specification for Backend Team

---

## 📋 Overview

This document outlines all the API endpoints required for the Lead CRM application. The frontend is built first with demo/mock data, and this specification serves as the contract for backend implementation.

### Base URL
```
Production: https://api.leadcrm.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All endpoints (except `/auth/*`) require authentication via JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## 🔐 Authentication APIs

### 1. User Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "admin@crm.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "name": "John Admin",
      "email": "admin@crm.com",
      "role": "admin",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  },
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Frontend Usage:** `src/pages/Login.jsx`

---

### 2. User Logout
Invalidate current JWT token.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Frontend Usage:** `src/components/TopNav.jsx`, `src/utils/auth.js`

---

### 3. Get Current User
Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Admin",
    "email": "admin@crm.com",
    "role": "admin",
    "avatar": null,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**Frontend Usage:** `src/utils/auth.js`

---

### 4. Refresh Token
Refresh JWT token before expiry.

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Frontend Usage:** `src/utils/api.js` (interceptor)

---

## 👥 Lead Management APIs

### 5. Get All Leads
Retrieve list of all leads with optional filtering and pagination.

**Endpoint:** `GET /leads`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 10 |
| search | string | Search by name, email, phone | - |
| status | string | Filter by status | - |
| source | string | Filter by source | - |
| sortBy | string | Sort field | createdAt |
| sortOrder | string | asc or desc | desc |
| startDate | date | Filter from date | - |
| endDate | date | Filter to date | - |

**Example Request:**
```
GET /leads?page=1&limit=10&status=New&sortBy=createdAt&sortOrder=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-0123",
        "company": "ABC Corp",
        "status": "New",
        "source": "Website",
        "notes": "Interested in premium plan",
        "assignedTo": {
          "id": 1,
          "name": "Sales Rep"
        },
        "createdAt": "2026-02-05T10:30:00Z",
        "updatedAt": "2026-02-05T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Frontend Usage:** `src/pages/LeadList.jsx`

---

### 6. Get Single Lead
Retrieve detailed information about a specific lead.

**Endpoint:** `GET /leads/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "company": "ABC Corp",
    "status": "New",
    "source": "Website",
    "notes": "Interested in premium plan",
    "assignedTo": {
      "id": 1,
      "name": "Sales Rep"
    },
    "followUps": [
      {
        "id": 1,
        "date": "2026-02-10T14:00:00Z",
        "note": "Schedule demo call",
        "type": "call",
        "completed": false,
        "createdAt": "2026-02-05T10:30:00Z"
      }
    ],
    "activityLog": [
      {
        "id": 1,
        "action": "created",
        "description": "Lead created",
        "user": "John Admin",
        "timestamp": "2026-02-05T10:30:00Z"
      }
    ],
    "createdAt": "2026-02-05T10:30:00Z",
    "updatedAt": "2026-02-05T10:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "LEAD_NOT_FOUND",
    "message": "Lead with ID 1 not found"
  }
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 7. Create Lead
Create a new lead entry.

**Endpoint:** `POST /leads`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-0456",
  "company": "XYZ Ltd",
  "status": "New",
  "source": "Referral",
  "notes": "Referred by John Doe"
}
```

**Validation Rules:**
| Field | Required | Validation |
|-------|----------|------------|
| name | Yes | Min 2 chars, max 100 chars |
| email | No | Valid email format |
| phone | Yes | Valid phone format |
| company | No | Max 100 chars |
| status | No | Enum: New, Contacted, Qualified, Converted, Lost |
| source | No | Must exist in lead_sources table |
| notes | No | Max 1000 chars |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1-555-0456",
    "company": "XYZ Ltd",
    "status": "New",
    "source": "Referral",
    "notes": "Referred by John Doe",
    "createdAt": "2026-02-05T11:00:00Z",
    "updatedAt": "2026-02-05T11:00:00Z"
  },
  "message": "Lead created successfully"
}
```

**Error Response (422):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "phone",
        "message": "Invalid phone format"
      }
    ]
  }
}
```

**Frontend Usage:** `src/pages/CreateLead.jsx`, `src/components/FloatingAddButton.jsx`

---

### 8. Update Lead
Update an existing lead.

**Endpoint:** `PUT /leads/:id`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.updated@example.com",
  "phone": "+1-555-0456",
  "company": "XYZ Corporation",
  "status": "Contacted",
  "source": "Referral",
  "notes": "Updated notes - Follow up scheduled"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.updated@example.com",
    "phone": "+1-555-0456",
    "company": "XYZ Corporation",
    "status": "Contacted",
    "source": "Referral",
    "notes": "Updated notes - Follow up scheduled",
    "createdAt": "2026-02-05T11:00:00Z",
    "updatedAt": "2026-02-05T12:00:00Z"
  },
  "message": "Lead updated successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 9. Delete Lead
Delete a lead (soft delete recommended).

**Endpoint:** `DELETE /leads/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`, `src/pages/LeadList.jsx`

---

### 10. Update Lead Status
Quick status update for a lead.

**Endpoint:** `PATCH /leads/:id/status`

**Request Body:**
```json
{
  "status": "Qualified"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "Qualified",
    "updatedAt": "2026-02-05T12:30:00Z"
  },
  "message": "Lead status updated"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 11. Search Leads (Global Search)
Quick search across leads for top navigation.

**Endpoint:** `GET /leads/search`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (min 2 chars) |
| limit | number | Max results (default: 5) |

**Example Request:**
```
GET /leads/search?q=john&limit=5
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "company": "ABC Corp"
    },
    {
      "id": 5,
      "name": "Johnny Smith",
      "email": "johnny@example.com",
      "phone": "+1-555-0789",
      "company": "Tech Inc"
    }
  ]
}
```

**Frontend Usage:** `src/components/TopNav.jsx` (Global Search)

---

## 📅 Follow-up APIs

### 12. Get Lead Follow-ups
Get all follow-ups for a specific lead.

**Endpoint:** `GET /leads/:id/followups`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "leadId": 1,
      "date": "2026-02-10T14:00:00Z",
      "note": "Schedule demo call",
      "type": "call",
      "completed": false,
      "createdBy": {
        "id": 1,
        "name": "John Admin"
      },
      "createdAt": "2026-02-05T10:30:00Z"
    }
  ]
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 13. Create Follow-up
Add a new follow-up for a lead.

**Endpoint:** `POST /leads/:id/followups`

**Request Body:**
```json
{
  "date": "2026-02-10T14:00:00Z",
  "note": "Schedule demo call",
  "type": "call"
}
```

**Validation Rules:**
| Field | Required | Validation |
|-------|----------|------------|
| date | Yes | Future date |
| note | Yes | Min 5 chars, max 500 chars |
| type | No | Enum: call, meeting, email, followup |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "leadId": 1,
    "date": "2026-02-10T14:00:00Z",
    "note": "Schedule demo call",
    "type": "call",
    "completed": false,
    "createdAt": "2026-02-05T10:30:00Z"
  },
  "message": "Follow-up added successfully"
}
```

**Frontend Usage:** `src/components/FollowUpModal.jsx`

---

### 14. Update Follow-up
Update an existing follow-up.

**Endpoint:** `PUT /followups/:id`

**Request Body:**
```json
{
  "date": "2026-02-12T15:00:00Z",
  "note": "Rescheduled demo call",
  "type": "meeting",
  "completed": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2026-02-12T15:00:00Z",
    "note": "Rescheduled demo call",
    "type": "meeting",
    "completed": false,
    "updatedAt": "2026-02-05T11:00:00Z"
  },
  "message": "Follow-up updated successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 15. Mark Follow-up Complete
Toggle follow-up completion status.

**Endpoint:** `PATCH /followups/:id/complete`

**Request Body:**
```json
{
  "completed": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "completed": true,
    "completedAt": "2026-02-05T14:00:00Z"
  },
  "message": "Follow-up marked as complete"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 16. Delete Follow-up
Delete a follow-up entry.

**Endpoint:** `DELETE /followups/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Follow-up deleted successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 17. Get Today's Follow-ups
Get all follow-ups scheduled for today.

**Endpoint:** `GET /followups/today`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead": {
        "id": 1,
        "name": "John Doe",
        "company": "ABC Corp"
      },
      "date": "2026-02-05T10:00:00Z",
      "note": "Morning call",
      "type": "call",
      "completed": false
    }
  ]
}
```

**Frontend Usage:** `src/components/TopNav.jsx` (Notifications)

---

### 18. Get Overdue Follow-ups
Get all overdue follow-ups.

**Endpoint:** `GET /followups/overdue`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "lead": {
        "id": 3,
        "name": "Alice Brown",
        "company": "Tech Solutions"
      },
      "date": "2026-02-03T14:00:00Z",
      "note": "Missed call",
      "type": "call",
      "daysOverdue": 2
    }
  ]
}
```

**Frontend Usage:** `src/components/TopNav.jsx` (Notifications)

---

### 19. Get Calendar Follow-ups
Get follow-ups for calendar view.

**Endpoint:** `GET /followups/calendar`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| view | string | today, week, month |
| date | date | Reference date (default: today) |

**Example Request:**
```
GET /followups/calendar?view=week&date=2026-02-05
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "view": "week",
    "startDate": "2026-02-03",
    "endDate": "2026-02-09",
    "followups": [
      {
        "id": 1,
        "lead": {
          "id": 1,
          "name": "John Doe"
        },
        "date": "2026-02-05T10:00:00Z",
        "note": "Demo call",
        "type": "call"
      },
      {
        "id": 2,
        "lead": {
          "id": 2,
          "name": "Jane Smith"
        },
        "date": "2026-02-07T14:00:00Z",
        "note": "Follow-up meeting",
        "type": "meeting"
      }
    ]
  }
}
```

**Frontend Usage:** `src/components/TopNav.jsx` (Calendar Dropdown)

---

## 📊 Dashboard & Analytics APIs

### 20. Get Dashboard Statistics
Get key metrics for dashboard.

**Endpoint:** `GET /dashboard/stats`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLeads": 156,
    "newLeads": 23,
    "contactedLeads": 45,
    "qualifiedLeads": 34,
    "convertedLeads": 28,
    "lostLeads": 26,
    "conversionRate": 17.9,
    "trends": {
      "totalLeads": {
        "value": 12,
        "percentage": 8.3,
        "direction": "up"
      },
      "newLeads": {
        "value": 5,
        "percentage": 27.8,
        "direction": "up"
      },
      "convertedLeads": {
        "value": 3,
        "percentage": 12,
        "direction": "up"
      }
    }
  }
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx`

---

### 21. Get Recent Leads
Get recently added leads for dashboard.

**Endpoint:** `GET /dashboard/recent-leads`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of leads | 5 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Mike Johnson",
      "email": "mike@example.com",
      "status": "New",
      "source": "Website",
      "createdAt": "2026-02-05T09:30:00Z"
    }
  ]
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx`

---

### 22. Get Lead Funnel
Get lead distribution across statuses.

**Endpoint:** `GET /dashboard/funnel`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "funnel": [
      { "status": "New", "count": 45, "percentage": 28.8 },
      { "status": "Contacted", "count": 38, "percentage": 24.4 },
      { "status": "Qualified", "count": 32, "percentage": 20.5 },
      { "status": "Converted", "count": 25, "percentage": 16.0 },
      { "status": "Lost", "count": 16, "percentage": 10.3 }
    ],
    "totalLeads": 156
  }
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx`

---

### 23. Get Leads by Source
Get lead distribution by source.

**Endpoint:** `GET /dashboard/leads-by-source`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "source": "Website", "count": 45, "percentage": 28.8 },
    { "source": "Referral", "count": 38, "percentage": 24.4 },
    { "source": "LinkedIn", "count": 32, "percentage": 20.5 },
    { "source": "Cold Call", "count": 25, "percentage": 16.0 },
    { "source": "Email Campaign", "count": 16, "percentage": 10.3 }
  ]
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx`

---

### 24. Get Tasks Today
Get today's task list for dashboard.

**Endpoint:** `GET /dashboard/tasks-today`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "type": "followup",
        "title": "Call John Doe",
        "time": "10:00 AM",
        "lead": {
          "id": 1,
          "name": "John Doe"
        },
        "completed": false
      },
      {
        "id": 2,
        "type": "meeting",
        "title": "Demo with Jane Smith",
        "time": "2:00 PM",
        "lead": {
          "id": 2,
          "name": "Jane Smith"
        },
        "completed": false
      }
    ],
    "summary": {
      "total": 5,
      "completed": 2,
      "pending": 3
    }
  }
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx`

---

## ⚙️ Lead Sources APIs

### 25. Get All Lead Sources
Get list of all lead sources.

**Endpoint:** `GET /lead-sources`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Website",
      "color": "#2563EB",
      "icon": "🌐",
      "count": 145,
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Referral",
      "color": "#10B981",
      "icon": "🤝",
      "count": 89,
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 26. Create Lead Source
Add a new lead source.

**Endpoint:** `POST /lead-sources`

**Request Body:**
```json
{
  "name": "Google Ads",
  "color": "#EA4335",
  "icon": "📣"
}
```

**Validation Rules:**
| Field | Required | Validation |
|-------|----------|------------|
| name | Yes | Unique, min 2 chars, max 50 chars |
| color | No | Valid hex color (default: #2563EB) |
| icon | No | Single emoji (default: 📋) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Google Ads",
    "color": "#EA4335",
    "icon": "📣",
    "count": 0,
    "active": true,
### Communication Logs Table
```sql
CREATE TABLE communication_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  type ENUM('call', 'whatsapp', 'email', 'meeting', 'sms', 'video_call') NOT NULL,
  outcome ENUM('connected', 'no_answer', 'busy', 'voicemail', 'callback_requested', 'interested', 'not_interested', 'follow_up_needed', 'deal_closed') NOT NULL,
  duration INT NULL COMMENT 'Duration in minutes for calls',
  notes TEXT NOT NULL,
  created_by INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Index for faster queries
CREATE INDEX idx_comm_lead_id ON communication_logs(lead_id);
CREATE INDEX idx_comm_type ON communication_logs(type);
CREATE INDEX idx_comm_timestamp ON communication_logs(timestamp);
```

    "createdAt": "2026-02-05T10:00:00Z"
  },
  "message": "Lead source created successfully"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 27. Update Lead Source
Update an existing lead source.

**Endpoint:** `PUT /lead-sources/:id`

**Request Body:**
```json
{
  "name": "Google Ads Campaign",
  "color": "#DB4437",
  "icon": "🎯"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Google Ads Campaign",
    "color": "#DB4437",
    "icon": "🎯",
    "count": 0,
    "active": true,
    "updatedAt": "2026-02-05T11:00:00Z"
  },
  "message": "Lead source updated successfully"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 28. Toggle Lead Source Status
Activate or deactivate a lead source.

**Endpoint:** `PATCH /lead-sources/:id/toggle`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 6,
16. ✅ Communication Log APIs (Call/WhatsApp Logging)

---

## 📞 Communication Log APIs

### 37. Get Lead Communication Logs
Get all communication logs for a specific lead.

**Endpoint:** `GET /leads/:id/communications`

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| type | string | Filter by type (call, whatsapp, email, meeting, sms, video_call) | all |
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "communications": [
      {
        "id": 1,
        "leadId": 1,
        "type": "call",
        "outcome": "connected",
        "duration": 15,
        "notes": "Discussed product features. Client is interested in enterprise plan.",
        "createdBy": {
          "id": 1,
          "name": "John Admin"
        },
        "timestamp": "2026-02-05T10:30:00Z",
        "createdAt": "2026-02-05T10:30:00Z"
      },
      {
        "id": 2,
        "leadId": 1,
        "type": "whatsapp",
        "outcome": "follow_up_needed",
        "duration": null,
        "notes": "Sent product brochure and pricing details via WhatsApp.",
        "createdBy": {
          "id": 1,
          "name": "John Admin"
        },
        "timestamp": "2026-02-05T11:45:00Z",
        "createdAt": "2026-02-05T11:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 2,
      "itemsPerPage": 20
    }
  }
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 38. Create Communication Log
Log a new communication activity (call, WhatsApp, email, etc.).

**Endpoint:** `POST /leads/:id/communications`

**Request Body:**
```json
{
  "type": "call",
  "outcome": "connected",
  "duration": 15,
  "notes": "Discussed product features. Client interested in enterprise plan."
}
```

**Validation Rules:**
| Field | Required | Validation |
|-------|----------|------------|
| type | Yes | Enum: call, whatsapp, email, meeting, sms, video_call |
| outcome | Yes | Enum: connected, no_answer, busy, voicemail, callback_requested, interested, not_interested, follow_up_needed, deal_closed |
| duration | No | Number (minutes), only for call/video_call |
| notes | Yes | Min 5 chars, max 1000 chars |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "leadId": 1,
    "type": "call",
    "outcome": "connected",
    "duration": 15,
    "notes": "Discussed product features. Client interested in enterprise plan.",
    "createdBy": {
      "id": 1,
      "name": "John Admin"
    },
    "timestamp": "2026-02-05T14:00:00Z",
    "createdAt": "2026-02-05T14:00:00Z"
  },
  "message": "Communication logged successfully"
}
```

**Frontend Usage:** `src/components/CallLogModal.jsx`

---

### 39. Update Communication Log
Update an existing communication log entry.

**Endpoint:** `PUT /communications/:id`

**Request Body:**
```json
{
  "type": "call",
  "outcome": "interested",
  "duration": 20,
  "notes": "Updated notes - Client confirmed interest in premium package."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "type": "call",
    "outcome": "interested",
    "duration": 20,
    "notes": "Updated notes - Client confirmed interest in premium package.",
    "updatedAt": "2026-02-05T15:00:00Z"
  },
  "message": "Communication log updated successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 40. Delete Communication Log
Delete a communication log entry.

**Endpoint:** `DELETE /communications/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Communication log deleted successfully"
}
```

**Frontend Usage:** `src/pages/LeadDetail.jsx`

---

### 41. Get Communication Statistics
Get communication statistics for dashboard or reports.

**Endpoint:** `GET /communications/stats`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date | Filter from date |
| endDate | date | Filter to date |
| userId | number | Filter by user |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 156,
    "byType": {
      "call": 78,
      "whatsapp": 45,
      "email": 20,
      "meeting": 8,
      "sms": 3,
      "video_call": 2
    },
    "byOutcome": {
      "connected": 65,
      "interested": 32,
      "no_answer": 28,
      "follow_up_needed": 15,
      "not_interested": 10,
      "deal_closed": 6
    },
    "averageCallDuration": 12.5,
    "totalCallMinutes": 975
  }
}
```

**Frontend Usage:** `src/pages/Dashboard.jsx` (Future enhancement)
    "active": false,
    "updatedAt": "2026-02-05T11:00:00Z"
  },
  "message": "Lead source deactivated"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 29. Delete Lead Source
Delete a lead source (only if no leads assigned).


**Success Response (200):**
```json
{
  "success": true,
  "message": "Lead source deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "SOURCE_HAS_LEADS",
    "message": "Cannot delete lead source with existing leads. Reassign leads first or deactivate instead."
  }
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

## 🔔 Notifications API

### 30. Get Notifications
Get user notifications summary.

**Endpoint:** `GET /notifications`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "todayFollowups": [
      {
        "id": 1,
        "leadName": "John Doe",
        "time": "10:00 AM",
        "type": "call",
        "status": "pending"
      }
    ],
    "overdueFollowups": [
      {
        "id": 4,
        "leadName": "Alice Williams",
        "dueDate": "2026-02-03",
        "type": "call",
        "daysOverdue": 2
      }
    ],
    "newlyAssigned": [
      {
        "id": 6,
        "leadName": "Sarah Connor",
        "assignedTime": "1 hour ago",
        "source": "Website"
      }
    ],
    "totalCount": 7
  }
}
```

**Frontend Usage:** `src/components/TopNav.jsx` (Notifications Dropdown)

---

## 👤 User & Settings APIs

### 31. Update User Profile
Update current user's profile.

**Endpoint:** `PUT /users/profile`

**Request Body:**
```json
{
  "name": "John Administrator",
  "email": "john.admin@crm.com",
  "phone": "+1-555-0100"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Administrator",
    "email": "john.admin@crm.com",
    "phone": "+1-555-0100",
    "updatedAt": "2026-02-05T10:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 32. Change Password
Change user's password.

**Endpoint:** `PUT /users/password`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 33. Get App Settings
Get application settings.

**Endpoint:** `GET /settings`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "LeadCRM Inc.",
      "industry": "technology"
    },
    "appearance": {
      "theme": "light"
    },
    "notifications": {
      "emailNewLead": true,
      "emailFollowupReminder": true,
      "emailWeeklySummary": false,
      "pushEnabled": true,
      "pushSound": false
    }
  }
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

### 34. Update App Settings
Update application settings.

**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "company": {
    "name": "LeadCRM Corporation",
    "industry": "technology"
  },
  "appearance": {
    "theme": "dark"
  },
  "notifications": {
    "emailNewLead": true,
    "emailFollowupReminder": true,
    "emailWeeklySummary": true,
    "pushEnabled": true,
    "pushSound": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

**Frontend Usage:** `src/pages/Settings.jsx`

---

## 📤 Export APIs

### 35. Export Leads to CSV
Export leads data to CSV file.

**Endpoint:** `GET /leads/export/csv`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| source | string | Filter by source |
| startDate | date | Filter from date |
| endDate | date | Filter to date |

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="leads-export-2026-02-05.csv"`

**Frontend Usage:** Future enhancement

---

### 36. Export Leads to Excel
Export leads data to Excel file.

**Endpoint:** `GET /leads/export/xlsx`

**Query Parameters:** Same as CSV export

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="leads-export-2026-02-05.xlsx"`

**Frontend Usage:** Future enhancement

---

## 📊 Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'sales') DEFAULT 'sales',
  avatar VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Leads Table
```sql
CREATE TABLE leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(100),
  status ENUM('New', 'Contacted', 'Qualified', 'Converted', 'Lost') DEFAULT 'New',
  source_id INT,
  notes TEXT,
  assigned_to INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (source_id) REFERENCES lead_sources(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Follow-ups Table
```sql
CREATE TABLE followups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  scheduled_date DATETIME NOT NULL,
  note TEXT NOT NULL,
  type ENUM('call', 'meeting', 'email', 'followup') DEFAULT 'followup',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Lead Sources Table
```sql
CREATE TABLE lead_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#2563EB',
  icon VARCHAR(10) DEFAULT '📋',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Settings Table
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  key_name VARCHAR(50) NOT NULL,
  value JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_setting (user_id, key_name)
);
```

---

## 🔧 Implementation Notes

### Authentication
- Use JWT tokens with 24-hour expiry
- Store refresh tokens for token renewal
- Hash passwords using bcrypt (min 12 rounds)

### Validation
- Validate all inputs server-side
- Sanitize data to prevent XSS/SQL injection
- Use parameterized queries

### Performance
- Add indexes on frequently queried columns
- Implement pagination for list endpoints
- Use caching for dashboard stats (Redis recommended)

### Security
- Enable CORS for frontend domain only
- Rate limiting on authentication endpoints
- Input validation and sanitization
- HTTPS required in production

### Error Handling
- Log all errors server-side
- Return user-friendly error messages
- Never expose internal error details to clients

---

## 📅 API Development Priority

### Phase 1 (MVP)
1. ✅ Authentication APIs (Login, Logout, Get User)
2. ✅ Lead CRUD APIs (Create, Read, Update, Delete)
3. ✅ Lead Sources APIs
4. ✅ Dashboard Stats API

### Phase 2
5. ✅ Follow-up APIs
6. ✅ Notifications API
7. ✅ Global Search API
8. ✅ Calendar API

### Phase 3
9. ⏳ User Profile APIs
10. ⏳ Settings APIs
11. ⏳ Export APIs

### Phase 4 (Future)
12. ⏳ Activity Log APIs
13. ⏳ Bulk Operations APIs
14. ⏳ Reports APIs
15. ⏳ Email Integration APIs

---

## 📞 Contact

For API questions or issues:
- **Backend Team Lead:** [TBD]
- **API Documentation:** This file
- **Frontend Reference:** See `src/` folder

---

**Document maintained by:** SYSNAC Development Team  
**Last Updated:** February 5, 2026

