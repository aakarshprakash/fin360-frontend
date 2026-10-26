# Lead Management CRM - API Development Guide

**Document Version:** 1.0  
**Last Updated:** March 4, 2026  
**API Version:** v1  
**Base URL:** `https://api.yourcrm.com/api/v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)
8. [Database Schema](#database-schema)
9. [Implementation Guide](#implementation-guide)

---

## Overview

### Architecture
- **Type:** RESTful API
- **Protocol:** HTTPS only
- **Format:** JSON
- **Authentication:** JWT (JSON Web Tokens)
- **Versioning:** URL-based (`/api/v1/`)

### Base Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2026-03-04T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2026-03-04T10:30:00Z"
}
```

---

## Authentication

### 1. Login/Register

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "Sales Agent",
      "permissions": ["view_leads", "create_leads", "edit_leads"],
      "avatar": null
    }
  },
  "message": "Login successful"
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `422` - Validation error

---

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "phone": "+1-555-123-4567",
  "role": "Sales Agent",
  "department": "Sales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "Sales Agent",
      "createdAt": "2026-03-04T10:30:00Z"
    }
  },
  "message": "Registration successful"
}
```

---

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

#### POST /auth/logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## API Endpoints

### Leads Management

#### GET /leads
Retrieve list of leads with filtering and pagination.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 10, max: 100) |
| status | string | No | Filter by status (New, Contacted, Hot, etc.) |
| source | string | No | Filter by lead source |
| assignedTo | integer | No | Filter by assigned user ID |
| search | string | No | Search in name, email, phone, company |
| dateFrom | string | No | Filter leads created after date (ISO 8601) |
| dateTo | string | No | Filter leads created before date (ISO 8601) |
| sortBy | string | No | Sort field (createdAt, name, status) |
| sortOrder | string | No | Sort order (asc, desc) |

**Example Request:**
```
GET /leads?page=1&limit=25&status=New&search=john
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-123-4567",
        "company": "ABC Corp",
        "status": "New",
        "priority": "Hot",
        "source": "Website",
        "assignedTo": {
          "id": 2,
          "name": "Sarah Miller"
        },
        "createdAt": "2026-02-07T10:30:00Z",
        "updatedAt": "2026-02-07T10:30:00Z",
        "lastFollowUp": "2026-02-06T14:00:00Z",
        "nextFollowUp": "2026-02-08T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 250,
      "itemsPerPage": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `422` - Invalid query parameters

---

#### GET /leads/:id
Retrieve detailed information about a specific lead.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "ABC Corp",
    "status": "New",
    "priority": "Hot",
    "source": "Website",
    "productInterest": "Enterprise Plan",
    "budgetRange": "$10,000 - $25,000",
    "expectedClosureDate": "2026-02-28T00:00:00Z",
    "leadScore": 85,
    "decisionMaker": true,
    "purchaseTimeline": "1-3 months",
    "competitorInvolved": "Competitor X",
    "leadQuality": "High",
    "lostReason": null,
    "estimatedDealValue": 15000,
    "quotationSent": true,
    "negotiationStage": "Proposal Sent",
    "discountOffered": "10%",
    "paymentStatus": "Pending",
    "leadAging": 2,
    "firstResponseTime": "2 hours",
    "followUpCompliance": 95,
    "assignedTo": {
      "id": 2,
      "name": "Sarah Miller",
      "email": "sarah@company.com"
    },
    "createdBy": {
      "id": 2,
      "name": "Sarah Miller"
    },
    "staffHistory": [
      {
        "userId": 2,
        "userName": "Sarah Miller",
        "assignedAt": "2026-02-05T10:00:00Z"
      }
    ],
    "createdAt": "2026-02-05T10:30:00Z",
    "updatedAt": "2026-02-07T15:20:00Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Lead not found

---

#### POST /leads
Create a new lead.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "company": "ABC Corp",
  "status": "New",
  "priority": "Medium",
  "source": "Website",
  "productInterest": "Enterprise Plan",
  "budgetRange": "$10,000 - $25,000",
  "expectedClosureDate": "2026-02-28",
  "notes": "Initial contact via website form",
  "assignedTo": 2
}
```

**Validation Rules:**
- `name` - Required, min 2 characters, max 100 characters
- `email` - Required, valid email format, unique
- `phone` - Required, valid phone format
- `company` - Optional, max 100 characters
- `status` - Required, enum: [New, Contacted, Qualified, Converted, Lost]
- `source` - Required, must exist in lead_sources table
- `assignedTo` - Optional, must be valid user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "New",
    "createdAt": "2026-03-04T10:30:00Z"
  },
  "message": "Lead created successfully"
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `422` - Validation error

---

#### PUT /leads/:id
Update an existing lead.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "name": "John Doe Updated",
  "status": "Contacted",
  "priority": "Hot",
  "notes": "Had a productive call",
  "assignedTo": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe Updated",
    "status": "Contacted",
    "updatedAt": "2026-03-04T11:00:00Z"
  },
  "message": "Lead updated successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `422` - Validation error

---

#### DELETE /leads/:id
Delete a lead (soft delete recommended).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not found

---

#### POST /leads/bulk-update
Bulk update multiple leads.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "leadIds": [1, 2, 3, 4, 5],
  "updates": {
    "status": "Contacted",
    "assignedTo": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 5,
    "failed": 0
  },
  "message": "Bulk update completed"
}
```

---

#### POST /leads/bulk-delete
Bulk delete multiple leads.

**Request Body:**
```json
{
  "leadIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": 5
  },
  "message": "Leads deleted successfully"
}
```

---

### Follow-ups Management

#### GET /leads/:id/followups
Get all follow-ups for a specific lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "followups": [
      {
        "id": 1,
        "leadId": 1,
        "type": "call",
        "scheduledDate": "2026-02-10T10:00:00Z",
        "status": "pending",
        "note": "Schedule demo call",
        "outcome": null,
        "createdBy": {
          "id": 2,
          "name": "Sarah Miller"
        },
        "createdAt": "2026-02-05T14:00:00Z",
        "completedAt": null
      }
    ]
  }
}
```

---

#### POST /followups
Create a new follow-up.

**Request Body:**
```json
{
  "leadId": 1,
  "type": "call",
  "scheduledDate": "2026-02-10T10:00:00Z",
  "note": "Schedule demo call"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "leadId": 1,
    "scheduledDate": "2026-02-10T10:00:00Z",
    "status": "pending"
  },
  "message": "Follow-up scheduled"
}
```

---

#### PUT /followups/:id
Update a follow-up (mark as completed, add outcome).

**Request Body:**
```json
{
  "status": "completed",
  "outcome": "Connected, scheduled next meeting",
  "completedAt": "2026-02-10T10:30:00Z"
}
```

---

### Call Logs & Activity

#### GET /leads/:id/activities
Get activity timeline for a lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "leadId": 1,
        "type": "call",
        "outcome": "connected",
        "duration": 15,
        "notes": "Discussed product features",
        "createdBy": {
          "id": 2,
          "name": "Sarah Miller"
        },
        "createdAt": "2026-02-05T10:30:00Z"
      },
      {
        "id": 2,
        "type": "status_change",
        "oldValue": "New",
        "newValue": "Contacted",
        "createdAt": "2026-02-05T10:35:00Z"
      }
    ]
  }
}
```

---

#### POST /call-logs
Log a call activity.

**Request Body:**
```json
{
  "leadId": 1,
  "type": "call",
  "outcome": "connected",
  "duration": 15,
  "notes": "Discussed pricing and features"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "leadId": 1,
    "type": "call",
    "createdAt": "2026-03-04T11:00:00Z"
  },
  "message": "Call logged successfully"
}
```

---

### Notes Management

#### GET /leads/:id/notes
Get all notes for a lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "notes": [
      {
        "id": 1,
        "leadId": 1,
        "type": "general",
        "content": "Client interested in analytics dashboard",
        "createdBy": {
          "id": 2,
          "name": "Sarah Miller"
        },
        "createdAt": "2026-02-05T11:00:00Z"
      },
      {
        "id": 2,
        "type": "objection",
        "objectionType": "price",
        "content": "Budget constraints mentioned",
        "createdAt": "2026-02-05T10:45:00Z"
      }
    ]
  }
}
```

---

#### POST /notes
Create a new note.

**Request Body:**
```json
{
  "leadId": 1,
  "type": "general",
  "content": "Follow-up needed next week",
  "objectionType": null
}
```

---

### Customer Management

#### GET /customers
Get list of converted customers.

**Query Parameters:** Similar to leads endpoint

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-123-4567",
        "company": "ABC Corp",
        "status": "Active",
        "convertedFrom": "lead",
        "originalLeadId": 123,
        "dealValue": 15000,
        "convertedAt": "2026-02-28T14:00:00Z",
        "createdBy": {
          "id": 2,
          "name": "Sarah Miller"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 120
    }
  }
}
```

---

#### POST /leads/:id/convert
Convert a lead to customer.

**Request Body:**
```json
{
  "dealValue": 15000,
  "conversionNotes": "Successfully closed the deal",
  "customerStatus": "Active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "leadId": 123,
    "dealValue": 15000,
    "convertedAt": "2026-03-04T12:00:00Z"
  },
  "message": "Lead converted to customer"
}
```

---

#### POST /leads/:id/mark-lost
Mark a lead as lost.

**Request Body:**
```json
{
  "lostReason": "Budget constraints",
  "notes": "Client went with competitor due to pricing"
}
```

---

### User Management

#### GET /users
Get list of all users (admin/manager only).

**Query Parameters:**
- `role` - Filter by role
- `status` - Filter by status (Active, Inactive, Suspended)
- `department` - Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Sarah Miller",
        "email": "sarah@company.com",
        "phone": "+1-555-123-4567",
        "role": "Admin",
        "department": "Sales",
        "status": "Active",
        "permissions": ["view_leads", "create_leads", "manage_users"],
        "stats": {
          "assignedLeads": 45,
          "openLeads": 12,
          "convertedLeads": 28,
          "conversionRate": 62.2
        },
        "lastActive": "2026-03-04T10:00:00Z",
        "createdAt": "2024-06-15T08:00:00Z"
      }
    ]
  }
}
```

---

#### GET /users/:id
Get user details.

---

#### POST /users
Create a new user (admin only).

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@company.com",
  "password": "securePassword123",
  "phone": "+1-555-987-6543",
  "role": "Sales Agent",
  "department": "Sales",
  "permissions": ["view_leads", "create_leads", "edit_leads"]
}
```

---

#### PUT /users/:id
Update user information.

---

#### PUT /users/:id/permissions
Update user permissions (admin only).

**Request Body:**
```json
{
  "permissions": ["view_leads", "create_leads", "edit_leads", "delete_leads"]
}
```

---

#### PUT /users/:id/status
Change user status (admin only).

**Request Body:**
```json
{
  "status": "Suspended"
}
```

---

### Dashboard & Analytics

#### GET /dashboard/kpis
Get key performance indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "hotLeads": 8,
    "overdueFollowups": 3,
    "newLeadsToday": 12,
    "conversionsMonth": 24,
    "totalLeads": 521,
    "conversionRate": 4.6,
    "avgResponseTime": "2.5 hours"
  }
}
```

---

#### GET /dashboard/funnel
Get lead funnel statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "funnel": {
      "new": 156,
      "contacted": 234,
      "followup": 89,
      "converted": 24,
      "lost": 18
    }
  }
}
```

---

#### GET /dashboard/performance
Get performance over time.

**Query Parameters:**
- `range` - Time range (7d, 30d, 90d)

**Response:**
```json
{
  "success": true,
  "data": {
    "performance": [
      {
        "date": "2026-02-01",
        "leads": 18,
        "conversions": 3
      },
      {
        "date": "2026-02-02",
        "leads": 24,
        "conversions": 5
      }
    ]
  }
}
```

---

#### GET /dashboard/tasks
Get today's tasks.

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "type": "followup",
        "leadId": 1,
        "leadName": "John Doe",
        "company": "ABC Corp",
        "scheduledTime": "2026-03-04T10:00:00Z",
        "priority": "high",
        "status": "pending"
      }
    ]
  }
}
```

---

### Settings Management

#### GET /settings/lead-sources
Get all lead sources.

**Response:**
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": 1,
        "name": "Website",
        "icon": "🌐",
        "color": "#2563EB",
        "count": 145,
        "active": true
      }
    ]
  }
}
```

---

#### POST /settings/lead-sources
Create a new lead source.

**Request Body:**
```json
{
  "name": "Facebook Ads",
  "icon": "📱",
  "color": "#3B5998",
  "active": true
}
```

---

#### PUT /settings/lead-sources/:id
Update lead source.

---

#### DELETE /settings/lead-sources/:id
Delete lead source (only if no leads associated).

---

## Data Models

### Lead Model
```typescript
interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  priority: 'Hot' | 'Warm' | 'Cold';
  source: string;
  productInterest?: string;
  budgetRange?: string;
  expectedClosureDate?: Date;
  leadScore: number; // 0-100
  decisionMaker: boolean;
  purchaseTimeline?: string;
  competitorInvolved?: string;
  leadQuality: 'High' | 'Medium' | 'Low';
  lostReason?: string;
  estimatedDealValue?: number;
  quotationSent: boolean;
  negotiationStage?: string;
  discountOffered?: string;
  paymentStatus?: string;
  leadAging: number; // days
  firstResponseTime?: string;
  followUpCompliance: number; // percentage
  assignedToId?: number;
  assignedTo?: User;
  createdById: number;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### User Model
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Sales Agent';
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions: string[];
  avatar?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### FollowUp Model
```typescript
interface FollowUp {
  id: number;
  leadId: number;
  lead?: Lead;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'sms';
  scheduledDate: Date;
  status: 'pending' | 'completed' | 'cancelled';
  note?: string;
  outcome?: string;
  createdById: number;
  createdBy: User;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### CallLog Model
```typescript
interface CallLog {
  id: number;
  leadId: number;
  lead?: Lead;
  type: 'call' | 'whatsapp' | 'sms' | 'email';
  outcome: 'connected' | 'not_answered' | 'wrong_number' | 'follow_up_needed';
  duration?: number; // minutes
  notes?: string;
  createdById: number;
  createdBy: User;
  createdAt: Date;
}
```

### Note Model
```typescript
interface Note {
  id: number;
  leadId: number;
  lead?: Lead;
  type: 'general' | 'objection' | 'important';
  objectionType?: 'price' | 'features' | 'competitor' | 'timeline';
  content: string;
  createdById: number;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### Customer Model
```typescript
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: 'Active' | 'Inactive' | 'Churned';
  convertedFrom: 'lead';
  originalLeadId: number;
  dealValue: number;
  convertedAt: Date;
  createdById: number;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### LeadSource Model
```typescript
interface LeadSource {
  id: number;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Handling

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Response Examples

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Email must be valid"],
      "phone": ["Phone number format is invalid"]
    }
  },
  "timestamp": "2026-03-04T10:30:00Z"
}
```

**Authorization Error:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  },
  "timestamp": "2026-03-04T10:30:00Z"
}
```

---

## Rate Limiting

### Rate Limit Configuration
- **Default:** 100 requests per minute per IP
- **Authenticated users:** 300 requests per minute per user
- **Bulk operations:** 10 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1646389800
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Webhooks

### Supported Events
- `lead.created`
- `lead.updated`
- `lead.deleted`
- `lead.converted`
- `lead.lost`
- `followup.completed`
- `user.created`

### Webhook Payload
```json
{
  "event": "lead.created",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-03-04T10:30:00Z"
  },
  "timestamp": "2026-03-04T10:30:00Z"
}
```

### Webhook Configuration Endpoints

#### POST /webhooks
Register a webhook endpoint.

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/crm",
  "events": ["lead.created", "lead.converted"],
  "secret": "webhook_secret_key"
}
```

---

## Database Schema

### Recommended Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active',
  permissions JSONB,
  avatar TEXT,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### leads
```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(20),
  source VARCHAR(50),
  product_interest TEXT,
  budget_range VARCHAR(50),
  expected_closure_date DATE,
  lead_score INTEGER DEFAULT 0,
  decision_maker BOOLEAN DEFAULT false,
  purchase_timeline VARCHAR(50),
  competitor_involved VARCHAR(100),
  lead_quality VARCHAR(20),
  lost_reason TEXT,
  estimated_deal_value DECIMAL(10,2),
  quotation_sent BOOLEAN DEFAULT false,
  negotiation_stage VARCHAR(50),
  discount_offered VARCHAR(20),
  payment_status VARCHAR(50),
  assigned_to_id INTEGER REFERENCES users(id),
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

#### followups
```sql
CREATE TABLE followups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  note TEXT,
  outcome TEXT,
  created_by_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_followups_lead_id ON followups(lead_id);
CREATE INDEX idx_followups_scheduled_date ON followups(scheduled_date);
CREATE INDEX idx_followups_status ON followups(status);
```

#### call_logs
```sql
CREATE TABLE call_logs (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  outcome VARCHAR(50),
  duration INTEGER,
  notes TEXT,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
```

#### notes
```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  objection_type VARCHAR(50),
  content TEXT NOT NULL,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_lead_id ON notes(lead_id);
```

#### customers
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  converted_from VARCHAR(20) DEFAULT 'lead',
  original_lead_id INTEGER REFERENCES leads(id),
  deal_value DECIMAL(10,2),
  converted_at TIMESTAMP,
  created_by_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
```

#### lead_sources
```sql
CREATE TABLE lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(7),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Guide

### Technology Stack Recommendations

**Backend Framework Options:**
1. **Node.js + Express.js**
   - Fast, lightweight
   - Large ecosystem
   - JavaScript/TypeScript
   
2. **Python + FastAPI**
   - Modern, fast
   - Automatic API documentation
   - Type hints
   
3. **Ruby on Rails**
   - Convention over configuration
   - Rapid development
   - Built-in features

**Database:**
- PostgreSQL (recommended) - Advanced features, JSONB support
- MySQL - Reliable, widely supported
- MongoDB - If document-based approach preferred

**Authentication:**
- JWT (JSON Web Tokens) - Stateless authentication
- Passport.js (Node.js) or equivalent
- bcrypt for password hashing

**Additional Services:**
- Redis - Caching, session management
- Bull/Bee-Queue - Background job processing
- Socket.io - Real-time features
- AWS S3 - File storage
- SendGrid/Mailgun - Email notifications

### Security Best Practices

1. **Authentication & Authorization**
   - Use JWT with short expiration (15-30 minutes)
   - Implement refresh tokens
   - Hash passwords with bcrypt (10+ rounds)
   - Implement role-based access control (RBAC)

2. **Input Validation**
   - Validate all input data
   - Sanitize user input
   - Use parameterized queries (prevent SQL injection)
   - Implement request size limits

3. **API Security**
   - Use HTTPS only
   - Implement CORS properly
   - Add rate limiting
   - Use security headers (helmet.js)
   - Implement API key authentication for webhooks

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use secure session management
   - Implement data backup strategy
   - Log security events

### Performance Optimization

1. **Database**
   - Create proper indexes
   - Use database connection pooling
   - Implement query optimization
   - Use database caching (Redis)

2. **API**
   - Implement response caching
   - Use pagination for list endpoints
   - Implement field selection (sparse fieldsets)
   - Use compression (gzip)

3. **Monitoring**
   - Log all API requests
   - Monitor response times
   - Track error rates
   - Set up alerts

### Testing Strategy

1. **Unit Tests**
   - Test individual functions
   - Mock external dependencies
   - Aim for 80%+ code coverage

2. **Integration Tests**
   - Test API endpoints
   - Test database operations
   - Test authentication flow

3. **End-to-End Tests**
   - Test complete user workflows
   - Test critical business logic

### Deployment Checklist

- [ ] Set up environment variables
- [ ] Configure database connection
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS settings
- [ ] Set up logging service
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Set up backup strategy
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Configure health check endpoints
- [ ] Set up load balancer (if needed)
- [ ] Configure caching layer
- [ ] Set up monitoring and alerts

---

## API Client Integration

### Frontend Integration Example (Axios)

**Update `src/utils/api.js`:**

```javascript
import axios from 'axios';
import { getToken, logout } from './auth';

const API_BASE_URL = process.env.VITE_API_URL || 'https://api.yourcrm.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

### API Service Functions

**Create `src/services/leadService.js`:**

```javascript
import api from '../utils/api';

export const leadService = {
  // Get all leads
  getLeads: (params) => api.get('/leads', { params }),
  
  // Get single lead
  getLead: (id) => api.get(`/leads/${id}`),
  
  // Create lead
  createLead: (data) => api.post('/leads', data),
  
  // Update lead
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  
  // Delete lead
  deleteLead: (id) => api.delete(`/leads/${id}`),
  
  // Bulk operations
  bulkUpdate: (leadIds, updates) => 
    api.post('/leads/bulk-update', { leadIds, updates }),
  
  bulkDelete: (leadIds) => 
    api.post('/leads/bulk-delete', { leadIds }),
  
  // Convert lead
  convertLead: (id, data) => 
    api.post(`/leads/${id}/convert`, data),
};
```

---

## Postman Collection

A Postman collection is recommended for API testing. Key collections:
- Authentication (Login, Register, Refresh Token)
- Leads CRUD operations
- Follow-ups management
- User management
- Dashboard endpoints
- Settings management

---

## Conclusion

This API specification provides a complete foundation for building the backend for the Lead Management CRM. The design focuses on:

- **RESTful principles** for consistency
- **Security best practices** for protection
- **Scalability** for growth
- **Developer experience** for easy integration
- **Performance** for fast response times

Follow this guide to implement a production-ready API that integrates seamlessly with the existing frontend application.

---

**Document Maintained By:** Development Team  
**For API Support:** api-support@yourcrm.com  
**API Status:** https://status.yourcrm.com

