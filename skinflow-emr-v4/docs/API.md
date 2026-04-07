# API Reference

> **Source:** Inferred from Django URL configs and ViewSets (April 2026). Test actual endpoints for schema accuracy.

## Base URL

- **Development**: `http://127.0.0.1:8000/api/`
- All endpoints require trailing slash
- Content-Type: `application/json`

## Authentication

### JWT Token
Most endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Login
```http
POST /api/core/auth/login/
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": 1,
    "username": "admin",
    "first_name": "John",
    "last_name": "Doe",
    "email": "admin@clinic.com"
  },
  "organization": {
    "id": 1,
    "name": "Test Clinic",
    "slug": "test-clinic"
  }
}
```

### Current User
```http
GET /api/core/auth/me/
```

---

## Core Module (`/api/core/`)

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizations/` | List organizations |
| POST | `/organizations/` | Create organization |
| GET | `/organizations/{id}/` | Get organization |
| PATCH | `/organizations/{id}/` | Update organization |
| DELETE | `/organizations/{id}/` | Delete organization |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/providers/` | List providers |
| POST | `/providers/` | Create provider |
| GET | `/providers/{id}/` | Get provider |
| PATCH | `/providers/{id}/` | Update provider |
| DELETE | `/providers/{id}/` | Delete provider |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles/` | List roles |
| POST | `/roles/` | Create role |
| GET | `/roles/{id}/` | Get role |
| PATCH | `/roles/{id}/` | Update role |
| DELETE | `/roles/{id}/` | Delete role |

### Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff/` | List clinic staff |
| POST | `/staff/` | Create staff member |
| GET | `/staff/{id}/` | Get staff member |
| PATCH | `/staff/{id}/` | Update staff member |
| DELETE | `/staff/{id}/` | Delete staff member |

### Dashboard
```http
GET /api/core/dashboard/stats/
```
Returns clinic dashboard statistics.

```http
GET /api/core/dashboard/role-stats/
```
Returns role-specific dashboard data.

### Settings
```http
GET /api/core/settings/
PATCH /api/core/settings/
```

---

## Patients Module (`/api/patients/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List patients (paginated, max 200) |
| POST | `/` | Create patient |
| GET | `/{id}/` | Get patient detail |
| PATCH | `/{id}/` | Update patient |
| DELETE | `/{id}/` | Delete patient (protected) |

**Patient Object:**
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "date_of_birth": "1990-01-15",
  "gender": "FEMALE",
  "blood_group": "O+",
  "phone_primary": "+8801234567890",
  "phone_secondary": "",
  "email": "jane@example.com",
  "national_id": "",
  "passport_number": "",
  "marital_status": "SINGLE",
  "occupation": "Engineer",
  "address": "123 Main St",
  "city": "Dhaka",
  "state": "",
  "zip_code": "1000",
  "country": "Bangladesh",
  "emergency_contact_name": "John Doe",
  "emergency_contact_phone": "+8801234567891",
  "emergency_contact_relation": "Spouse",
  "has_known_allergies": true,
  "has_chronic_conditions": false,
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-01-01T10:00:00Z"
}
```

---

## Clinical Module (`/api/clinical/`)

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appointments/` | List appointments |
| POST | `/appointments/` | Create appointment |
| GET | `/appointments/{id}/` | Get appointment |
| PATCH | `/appointments/{id}/` | Update appointment |
| DELETE | `/appointments/{id}/` | Delete appointment |

**Appointment Object:**
```json
{
  "id": 1,
  "patient": 1,
  "provider": 1,
  "date_time": "2026-03-05T14:00:00Z",
  "status": "SCHEDULED",
  "fee": "1500.00"
}
```

**Status Values:** `SCHEDULED`, `ARRIVED`, `READY_FOR_CONSULT`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`, `NO_SHOW`

### Clinical Intakes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/intakes/` | List intakes |
| POST | `/intakes/` | Create intake |
| GET | `/intakes/{id}/` | Get intake |
| PATCH | `/intakes/{id}/` | Update intake |

### Consultations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consultations/` | List consultations |
| POST | `/consultations/` | Create consultation |
| GET | `/consultations/{id}/` | Get consultation |
| PATCH | `/consultations/{id}/` | Update consultation |
| DELETE | `/consultations/{id}/` | Delete consultation |

**Consultation Object:**
```json
{
  "id": 1,
  "patient": 1,
  "provider": 1,
  "appointment": 1,
  "status": "DRAFT",
  "chief_complaint": "Skin concern",
  "history_of_present_illness": "",
  "examination_findings": "",
  "assessment_and_plan": ""
}
```

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prescriptions/` | List prescriptions |
| POST | `/prescriptions/` | Create prescription |
| GET | `/prescriptions/{id}/` | Get prescription |
| PATCH | `/prescriptions/{id}/` | Update prescription |

### Prescription Items
| Endpoint | Description |
|----------|-------------|
| `/prescription-medications/` | Medications CRUD |
| `/prescription-products/` | Products CRUD |
| `/prescription-procedures/` | Procedures CRUD |

### Procedure Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/procedure-sessions/` | List sessions |
| POST | `/procedure-sessions/` | Create session |
| GET | `/procedure-sessions/{id}/` | Get session |
| PATCH | `/procedure-sessions/{id}/` | Update session |

### Treatment Plans
| Endpoint | Description |
|----------|-------------|
| `/treatment-plans/` | Treatment plans CRUD |
| `/treatment-plan-items/` | Plan items CRUD |

---

## Billing Module (`/api/billing/`)

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices/` | List invoices |
| POST | `/invoices/` | Create invoice |
| GET | `/invoices/{id}/` | Get invoice |
| PATCH | `/invoices/{id}/` | Update invoice |

**Invoice Object:**
```json
{
  "id": 1,
  "patient": 1,
  "appointment": 1,
  "invoice_type": "CONSULTATION",
  "status": "UNPAID",
  "subtotal": "5000.00",
  "discount_total": "500.00",
  "tax_total": "0.00",
  "total": "4500.00",
  "balance_due": "4500.00",
  "items": [],
  "payments": []
}
```

### Invoice Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoice-items/` | List items |
| POST | `/invoice-items/` | Create item |
| GET | `/invoice-items/{id}/` | Get item |
| PATCH | `/invoice-items/{id}/` | Update item |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments/` | List payments |
| POST | `/payments/` | Create payment |
| GET | `/payments/{id}/` | Get payment |
| PATCH | `/payments/{id}/` | Update payment |

**Payment Object:**
```json
{
  "id": 1,
  "invoice": 1,
  "method": "CASH",
  "amount": "2000.00",
  "status": "COMPLETED",
  "transaction_id": ""
}
```

### Entitlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/entitlements/` | List entitlements |
| GET | `/entitlements/{id}/` | Get entitlement |

---

## Inventory Module (`/api/inventory/`)

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/` | List products |
| POST | `/products/` | Create product |
| GET | `/products/{id}/` | Get product |
| PATCH | `/products/{id}/` | Update product |
| DELETE | `/products/{id}/` | Delete product |

### Categories & UOM
| Endpoint | Description |
|----------|-------------|
| `/categories/` | Product categories CRUD |
| `/uom/` | Units of measure CRUD |

### Stock
| Endpoint | Description |
|----------|-------------|
| `/locations/` | Stock locations CRUD |
| `/stock/` | Stock items CRUD |
| `/movements/` | Stock movements (read/create) |

### Requisitions
| Endpoint | Description |
|----------|-------------|
| `/requisitions/` | Inventory requisitions CRUD |
| `/requisition-lines/` | Requisition lines CRUD |

### Procurement
| Endpoint | Description |
|----------|-------------|
| `/vendors/` | Vendors CRUD |
| `/purchase-orders/` | Purchase orders CRUD |
| `/purchase-order-lines/` | PO lines CRUD |
| `/grns/` | Goods received notes CRUD |
| `/grn-lines/` | GRN lines CRUD |
| `/vendor-bills/` | Vendor bills CRUD |

---

## Accounting Module (`/api/accounting/`)

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts/` | List chart of accounts |
| POST | `/accounts/` | Create account |
| GET | `/accounts/{id}/` | Get account |
| PATCH | `/accounts/{id}/` | Update account |
| DELETE | `/accounts/{id}/` | Delete account |

### Bank Accounts
| Endpoint | Description |
|----------|-------------|
| `/banks/` | Bank accounts CRUD |

### Journal Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journals/` | List journal entries |
| POST | `/journals/` | Create journal entry |
| GET | `/journals/{id}/` | Get journal entry |
| PATCH | `/journals/{id}/` | Update journal entry |

### Reconciliation
| Endpoint | Description |
|----------|-------------|
| `/reconciliations/` | Bank reconciliations CRUD |

### Settings
```http
GET /api/accounting/settings/
PATCH /api/accounting/settings/
```

---

## Masters Module (`/api/masters/`)

| Endpoint | Description |
|----------|-------------|
| `/procedure-categories/` | Procedure categories CRUD |
| `/procedure-types/` | Procedure types CRUD |
| `/procedure-rooms/` | Procedure rooms CRUD |
| `/medicines/` | Medicine master CRUD |
| `/lab-tests/` | Lab test master CRUD |

---

## SaaS Module (`/api/saas/`)

### Plans
| Endpoint | Description |
|----------|-------------|
| `/plans/` | Subscription plans CRUD |

### Subscriptions
| Endpoint | Description |
|----------|-------------|
| `/subscriptions/` | Organization subscriptions CRUD |

### Organizations (SaaS View)
| Endpoint | Description |
|----------|-------------|
| `/organizations/` | SaaS-level org management |

### Audit Log
| Endpoint | Description |
|----------|-------------|
| `/audit-logs/` | Platform audit logs (read-only) |

### Announcements
| Endpoint | Description |
|----------|-------------|
| `/announcements/` | Platform announcements CRUD |

### Impersonation
| Endpoint | Description |
|----------|-------------|
| `/impersonation/` | Impersonation sessions CRUD |

---

## Error Responses

**400 Bad Request:**
```json
{
  "field_name": ["Error message"]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

---

## Pagination

List endpoints return paginated results:
```json
{
  "count": 100,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

Default page size varies by endpoint (typically 20-200).

---

*Note: For exact request/response schemas, inspect Django serializers or test endpoints directly.*
