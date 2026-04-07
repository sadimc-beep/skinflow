# Architecture

> **Source:** Inferred from codebase analysis (April 2026). Verify with current implementation.

## System Overview

Skinflow EMR v4 is a **hybrid monolith** architecture:
- **Backend**: Django REST API serving all business logic
- **Frontend**: Next.js React application consuming the API
- **Database**: SQLite (development) / PostgreSQL (production)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ React Server │  │ React Client │  │    Shared    │          │
│  │  Components  │  │  Components  │  │    lib/api   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                          HTTP REST + JWT
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Django Backend (Port 8000)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  core   │ │patients │ │clinical │ │ billing │ │inventory│   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ masters │ │campaigns│ │  saas   │ │accounting│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SQLite / PostgreSQL Database                   │
└─────────────────────────────────────────────────────────────────┘
```

## Django Apps & Responsibilities

| App | Purpose |
|-----|---------|
| `core` | Organization, Branch, Provider, ClinicStaff, Role, SaaSAdmin, ClinicSettings |
| `patients` | Patient demographics and medical flags |
| `clinical` | Appointments, ClinicalIntake, Consultations, Prescriptions, ProcedureSessions, TreatmentPlans |
| `billing` | Invoices, InvoiceItems, Payments, Entitlements |
| `inventory` | Products, Stock, StockMovements, Requisitions, POs, GRNs, Vendors, VendorBills |
| `accounting` | Chart of Accounts, JournalEntries, BankAccounts, Reconciliation |
| `masters` | ProcedureTypes, ProcedureCategories, ProcedureRooms, MedicineMaster, LabTestMaster |
| `campaigns` | Marketing campaigns with discount rules |
| `saas` | Plans, Subscriptions, SubscriptionInvoices, AuditLog, Announcements, Impersonation |

## Data Flow

### Clinical Workflow
```
Appointment → ClinicalIntake (vitals) → Consultation → Prescription
                                                           │
                    ┌──────────────────────────────────────┼──────────────────────┐
                    ▼                                      ▼                      ▼
            PrescriptionProcedure              PrescriptionProduct     PrescriptionMedication
                    │                                      │
                    ▼                                      │
               Invoice ←───────────────────────────────────┘
                    │
                    ▼
               Payment
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Entitlement           Product Fulfilled
   (for procedures)
        │
        ▼
   ProcedureSession
```

### Billing Flow
1. **Consultation Finalized** → `generate_invoice_from_consultation()` or `generate_new_invoice_from_consultation_selection()` creates Invoice with InvoiceItems
2. **Payment Received** → `check_payment_completes_invoice()` updates Invoice status
3. **Invoice PAID** → `create_entitlements_for_paid_invoice()` creates Entitlements for procedures
4. **Invoice PAID** → `fulfill_products_for_paid_invoice()` marks products fulfilled
5. **Session Started** → `enforce_entitlement_for_session()` validates entitlement exists

### Accounting Integration
- **Invoice Created** → `AccountingService.post_invoice_revenue()` (DR: A/R, CR: Revenue)
- **Payment Received** → `AccountingService.post_patient_payment()` (DR: Cash/Bank, CR: A/R)
- **GRN Confirmed** → `AccountingService.post_grn_receipt()` (DR: Inventory, CR: A/P)
- **Vendor Paid** → `AccountingService.post_vendor_payment()` (DR: A/P, CR: Bank)

## Multi-Tenancy Model

```
Organization (Tenant Root)
    │
    ├── Branch[] (physical locations)
    ├── ClinicStaff[] (users with roles)
    ├── Role[] (RBAC permissions)
    ├── Provider[] (doctors/therapists)
    ├── ClinicSettings (accounting mappings)
    │
    └── All domain models (Patient, Appointment, Invoice, etc.)
```

- Every model has `organization` FK
- `get_current_org()` helper resolves tenant from request
- SaaS admin can impersonate organizations via `X-Impersonate-Org` header

## Authentication & Authorization

### JWT Authentication (SimpleJWT)
- Access token: 1 day lifetime
- Refresh token: 7 days, rotates on use
- Frontend stores in `localStorage` as `skinflow_access_token`

### Authorization Layers
1. **JWT Required**: Most endpoints require valid JWT
2. **Organization Scoping**: All queries filtered by user's organization
3. **Role-Based (RBAC)**: `Role.permissions` JSON defines granular access
4. **SaaS Admin**: Separate `SaaSAdmin` model for platform operators

### Login Flow
```
POST /api/core/auth/login/
Body: { username, password }
Response: { access, refresh, user: {...}, organization: {...} }
```

## External Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| SSLCommerz | Planned | SaaS subscription payments (Bangladesh) |
| PharmaSeed API | Planned | Medicine database sync (`PHARMASEED_API_KEY`) |

## Infrastructure / Deployment

### Development
- Django dev server: `python manage.py runserver` (port 8000)
- Next.js dev: `npm run dev` (port 3000)
- Database: SQLite (`db.sqlite3`)

### Production (Planned)
- Database: PostgreSQL
- Django: Gunicorn + NGINX or containerized
- Next.js: Vercel or Node.js server
- Static files: Cloud storage (S3/GCS)

### Environment Configuration
All settings externalized via environment variables:
- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- `DJANGO_DB_*` for database connection
- `SKINFLOW_API_KEY` for internal API auth
- `NEXT_PUBLIC_DJANGO_BASE_URL` for frontend API base

## Key Design Decisions

1. **Hybrid Architecture**: Django handles all business logic; Next.js is a presentation layer
2. **Multi-Tenant by FK**: Simple `organization` FK on all models (not schema-per-tenant)
3. **Entitlement Model**: Procedures require paid entitlements, preventing unbilled sessions
4. **Double-Entry Accounting**: Full GL with automatic journal posting on business events
5. **SaaS Layer**: Built-in subscription management for multi-clinic deployment

---

*See also: DECISIONS.md for detailed rationale*
