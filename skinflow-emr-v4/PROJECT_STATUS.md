# Skinflow EMR v4 - Project Status

## Overview
**Skinflow EMR v4** is an Electronic Medical Records (EMR) system for aesthetic/dermatology clinics. It's built as a **hybrid architecture** with:
- **Backend**: Django 5.2.9 (Python) with SQLite database
- **Frontend**: Next.js 16.1.0 (React 19, TypeScript) with Tailwind CSS 4
- **Architecture**: Multi-tenant SaaS-ready (Organization-based isolation)

---

## Backend (Django) - What's Implemented

### Core Infrastructure
- ✅ **Multi-tenancy**: Organization-based data isolation (`core.models.Organization`)
- ✅ **API Authentication**: API key-based authentication (`core.api_auth.require_api_key`)
- ✅ **Tenancy Helper**: `get_current_org()` for automatic organization resolution
- ✅ **TimeStampedModel**: Base model with `created_at`/`updated_at` timestamps

### Django Apps & Models

#### 1. **Patients App** (`patients/`)
- ✅ **Patient Model**: Complete patient master record with:
  - Identity: first_name, last_name, date_of_birth, gender, blood_group
  - Contact: phone_primary, phone_secondary, email
  - IDs: national_id, passport_number
  - Demographics: occupation, marital_status, address fields
  - Emergency contact information
  - Medical flags: has_known_allergies, has_chronic_conditions
  - Organization-scoped (multi-tenant)
- ✅ **REST API**: 
  - `GET /api/patients/` - List patients (paginated, 200 max)
  - `POST /api/patients/` - Create patient
  - `GET /api/patients/<id>/` - Get patient detail
  - `PATCH /api/patients/<id>/` - Update patient
  - `DELETE /api/patients/<id>/` - Delete patient (with protection checks)
- ✅ **Delete Protection**: Prevents deletion if patient has linked records (invoices, appointments, consultations, etc.)

#### 2. **Clinical App** (`clinical/`)
Comprehensive clinical workflow models:

- ✅ **Appointment**: Booking system with status tracking (SCHEDULED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW)
- ✅ **ClinicalIntake**: Vitals and check-in assessment (BP, pulse, weight, height, BMI, chief complaint)
- ✅ **PatientAllergy**: Structured allergy records with severity
- ✅ **PatientMedicalHistory**: Medical history tracking
- ✅ **Consultation**: Main consultation record with:
  - Status: DRAFT, FINALIZED, CANCELLED
  - Clinical notes: chief_complaint, history_of_present_illness, examination_findings, assessment_and_plan
  - Fee tracking
- ✅ **ConsultationSymptom** & **ConsultationDiagnosis**: Related symptoms and diagnoses
- ✅ **Prescription**: One-to-one with Consultation
  - **PrescriptionMedication**: Medicines with dose, route, frequency, duration
  - **PrescriptionProcedure**: Procedures with sessions_planned, pricing, discounts
  - **PrescriptionProduct**: Products with quantity, pricing, discounts
  - **PrescriptionLabTest**: Lab tests (internal/external)

- ✅ **ProcedureSession**: Individual procedure execution
  - Status: PLANNED, STARTED, COMPLETED, CANCELLED, NO_SHOW
  - Links to TreatmentPlanItem, Consultation, Appointment
  - **Entitlement enforcement**: Cannot start without paid entitlement
  - Inventory requisition tracking
- ✅ **TreatmentPlan** & **TreatmentPlanItem**: Multi-session treatment plans
- ✅ **ClinicalNote**: General clinical notes
- ✅ **ClinicalPhoto**: Photo management (intake, before/after, injection maps)
- ✅ **ConsentForm** & **ConsentFormTemplate**: Procedure consent management


#### 3. **Billing App** (`billing/`)
Complete billing and payment system:

- ✅ **Invoice Model**:
  - Types: CONSULTATION, TREATMENT_PLAN, PRODUCT, MIXED, OTHER
  - Status: DRAFT, UNPAID, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED
  - Auto-calculated totals from items
  - **Locked when PAID** (immutable)
- ✅ **InvoiceItem**: Line items for procedures, products, consultations
  - Fulfillment tracking (`is_fulfilled`, `fulfilled_at`)
  - Reference tracking (links back to PrescriptionProcedure, PrescriptionProduct, etc.)
  - **Hard validation**: Cannot add consultation-required procedures to walk-in invoices
- ✅ **Payment Model**:
  - Methods: CASH, CARD, BKASH, NAGAD, BANK_TRANSFER, ADJUSTMENT, OTHER
  - Status: PENDING, COMPLETED, FAILED, REFUNDED
  - **Auto-updates invoice status** on payment
  - **Triggers entitlement creation** when invoice becomes PAID
- ✅ **Entitlement Model**: Tracks what patient has paid for
  - Types: PROCEDURE, PRODUCT
  - Quantity tracking: `total_qty`, `used_qty`, `remaining_qty`
  - **Enforced**: Procedure sessions require valid entitlement
- ✅ **Billing Services** (`billing/services.py`):
  - `generate_invoice_from_consultation()`: Creates invoice from consultation prescription
  - `create_entitlements_for_paid_invoice()`: Auto-creates entitlements on payment
  - `enforce_entitlement_for_session()`: Validates entitlement before procedure
  - `fulfill_products_for_paid_invoice()`: Marks products as fulfilled
  - `fulfill_products_for_paid_invoice()`: Marks products as fulfilled
  - `generate_new_invoice_from_consultation_selection()`: Bills selected items only (Partial Billing)
  - ✅ **Flexible Invoicing**:
    - **Selection Screen**: Choose specific unbilled items to invoice
    - **Quotations**: Print quote for unbilled items
    - **Partial Billing**: Generate invoice for subset of prescribed items


#### 4. **Inventory App** (`inventory/`)
Stock management system:

- ✅ **Product Model**: Saleable/consumable items
  - Types: MEDICINE, SKINCARE, CONSUMABLE, DEVICE, OTHER
  - Stock tracking flags (`is_stock_tracked`, `is_saleable`)
  - Pricing: sale_price, cost_price, tax_rate
- ✅ **ProductCategory**: Product grouping
- ✅ **UnitOfMeasure**: Units (piece, bottle, tube, etc.)
- ✅ **StockLocation**: Physical storage locations
- ✅ **StockItem**: Current stock levels per location
- ✅ **StockMovement**: Audit trail of all stock movements (IN/OUT/ADJUST)
- ✅ **InventoryRequisition**: Requisition system for treatment rooms
  - Status: DRAFT, SUBMITTED, APPROVED, REJECTED, FULFILLED, CANCELLED
  - Links to ProcedureSession via `clinical_reference`
- ✅ **InventoryRequisitionLine**: Line items for requisitions

#### 5. **Campaigns App** (`campaigns/`)
Marketing campaign system:

- ✅ **Campaign Model**: Discount campaigns
  - Applies to: consultation fees, procedures, packages, products
  - Discount types: PERCENT, AMOUNT, NONE
  - Budget tracking: total_budget, budget_consumed
  - Usage limits per patient
  - Date range (start_date, end_date)

#### 6. **Core App (Staff & Settings)** (`core/`)
User and Organization management:

- ✅ **Organization Model**: Root tenant entity
- ✅ **Provider Model**: Clinical profile linked to User
  - Attributes: Specialization, Registration Number, Max Discount %
  - Distinguishes Doctors vs Therapists
- ✅ **Staff Management**:
  - Unified **User Creation** and **Role Assignment**
  - **Django Groups** for permissions: Doctor, Nurse, Front Desk, Admin
  - **Provider Profile** auto-creation logic

#### 7. **Masters App** (`masters/`)
Centralized management of clinical master data:

- ✅ **ProcedureType**: Master procedure catalog (Botox, LHR, HydraFacial, etc.)
  - Categories via `ProcedureCategory`
  - Base pricing, default sessions
  - Consent requirements
  - `consultation_required` flag
- ✅ **ProcedureRoom**: Physical procedure rooms (Blue Room, Laser Room)
  - Linked to Organization
  - Required for room-based scheduling
- ✅ **MedicineMaster**: Medicine catalog (brand/generic, strength, form)
- ✅ **LabTestMaster**: Lab test catalog

---

## Frontend (Next.js) - What's Implemented

### Tech Stack
- ✅ Next.js 16.1.0 (App Router)
- ✅ React 19.2.3
- ✅ TypeScript 5
- ✅ Tailwind CSS 4
- ✅ Radix UI components (dropdown-menu, separator, slot)
- ✅ Lucide React icons
- ✅ shadcn/ui-style components (button, card, badge, input, separator)

### Project Structure
```
apps/web/src/
├── app/
│   ├── (app)/              # Protected app routes
│   │   ├── layout.tsx      # App shell layout
│   │   ├── dashboard/      # Dashboard page (placeholder)
│   │   └── patients/       # Patient management
│   │       ├── page.tsx    # List page
│   │       ├── [id]/       # Detail page
│   │       │   ├── page.tsx
│   │       │   └── edit/   # Edit page
│   │       └── new/        # Create page
│   └── api/                # Next.js API routes (proxy to Django)
│       └── patients/
│           ├── route.ts    # GET /api/patients/
│           └── [id]/
│               └── route.ts
├── components/
│   ├── app/
│   │   ├── sidebar.tsx     # Navigation sidebar
│   │   └── top-nav.tsx     # Top navigation
│   ├── shell/
│   │   └── AppShell.tsx    # Main app shell (alternative layout)
│   ├── sf/                 # Skinflow-specific components
│   │   ├── EmptyState.tsx
│   │   ├── PageHeader.tsx
│   │   └── StatPills.tsx
│   └── ui/                 # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       └── separator.tsx
└── lib/
    ├── api.ts              # API client (server/client-aware)
    ├── django.ts            # Django helpers
    └── utils.ts             # Utility functions
```

### Implemented Features

#### 1. **Patient Management UI**
- ✅ **Patient List Page** (`/patients`):
  - Server-side data fetching from Django API
  - Client component (`PatientsListClient.tsx`) for interactivity
  - Displays: full_name, phone_primary, gender, date_of_birth
  - "New patient" button
- ✅ **Patient Detail Page** (`/patients/[id]`):
  - View patient information
- ✅ **Patient Edit Page** (`/patients/[id]/edit`):
  - Edit patient details
- ✅ **Patient Create Page** (`/patients/new`):
  - Create new patient

#### 2. **Appointments UI**
- ✅ **Appointment List Page** (`/appointments`):
  - Lists all appointments with status badges (SCHEDULED, CHECKED_IN, etc.)
  - Displays patient info, provider, time, and fee
- ✅ **Appointment Detail Page** (`/appointments/[id]`):
  - View appointment details
- ✅ **Appointment Create Page** (`/appointments/new`):
  - Create new appointment with patient search and provider selection
- ✅ **Appointment Edit Page** (`/appointments/[id]/edit`):
  - Edit appointment details

#### 3. **Billing UI**
- ✅ **Invoice List Page** (`/billing/invoices`):
  - Lists invoices with status (PAID, UNPAID, etc.)
  - Shows totals, balance due, and patient info
- ✅ **Invoice Create/Selection**:
  - Quote/Selection screen implemented (`/billing/consultation/<id>/billing/selection/`)
  - Supports partial billing and printing quotes


#### 4. **Dashboard UI**
- ✅ **Dashboard Page** (`/dashboard`):
  - Stats cards: Today's Appointments, Unpaid Invoices, Procedure Queue
  - Upcoming appointments list
  - Fetches real-time data from `/api/dashboard/stats/`

#### 5. **API Integration**
- ✅ **API Client** (`lib/api.ts`):
  - Server/client-aware base URL resolution
  - Server: calls Django directly (faster)
  - Client: uses Next.js API proxy (`/api/*`)
  - API key authentication (server-side only)
- ✅ **Next.js API Routes**:
  - Proxies requests to Django backend for Patients, Appointments, Billing, Dashboard

#### 6. **UI Components**
- ✅ **App Shell**: Sidebar navigation with working links to:
  - Dashboard
  - Patients
  - Appointments
  - Invoices (Billing)
  - Consultations (placeholder)
  - Procedure Room (placeholder)
  - Products (placeholder)
- ✅ **Design System**: Modern, clean UI with Tailwind CSS
- ✅ **Responsive Layout**: Mobile-friendly structure

---

## Key Business Logic & Rules

### Billing Rules
1. ✅ **PAID invoices are locked** - Cannot modify items, add payments, or change totals
2. ✅ **Consultation-required procedures** - Cannot be added directly to walk-in invoices (must go through Consultation workflow)
3. ✅ **Entitlement enforcement** - Procedure sessions require valid entitlement (payment)
4. ✅ **Auto-entitlement creation** - When invoice becomes PAID, entitlements are auto-created for procedure items
5. ✅ **Product fulfillment** - Products are marked fulfilled immediately on payment (no entitlements)

### Clinical Rules
1. ✅ **Procedure session validation** - Cannot start session without entitlement (unless CANCELLED/NO_SHOW)
2. ✅ **Prescription billing control** - `is_selected_for_billing` flag on PrescriptionProcedure/PrescriptionProduct
3. ✅ **Billing deduplication** - `billed_invoice` field prevents double-billing

### Data Integrity
1. ✅ **Multi-tenant isolation** - All models scoped to Organization
2. ✅ **Delete protection** - Patients cannot be deleted if they have linked records
3. ✅ **Reference tracking** - InvoiceItems track source (PrescriptionProcedure, PrescriptionProduct, etc.)

---

## Database Schema

### Key Relationships
- **Organization** → All models (multi-tenant root)
- **Patient** → Appointments, Consultations, Invoices, Entitlements, ProcedureSessions
- **Consultation** → Prescription (1:1)
- **Prescription** → PrescriptionProcedure, PrescriptionProduct, PrescriptionMedication, PrescriptionLabTest
- **Invoice** → InvoiceItem, Payment, Entitlement
- **InvoiceItem** → ProcedureType, Product (optional FKs)
- **Entitlement** → Invoice, InvoiceItem, ProcedureType/Product
- **ProcedureSession** → Entitlement (required for non-cancelled sessions)
- **Product** → StockItem, InvoiceItem, PrescriptionProduct

---

## Configuration

### Environment Variables
- `SKINFLOW_API_KEY`: API key for Django API authentication
- `DJANGO_BASE_URL`: Django backend URL (default: `http://127.0.0.1:8000`)

### Django Settings
- Database: SQLite (`db.sqlite3`)
- Timezone: `Asia/Dhaka`
- Debug: `True` (development)

---

## What's NOT Implemented Yet

### Frontend
- ✅ **Consultations UI**: Complete (Create, Edit, Finalize, Prescription, Lab Tests)
- ✅ **Invoice Creation/Details**: UI implemented (Flexible Selection, Partial Billing)
- ✅ **Procedure Room UI**: Dashboard and Session Scheduling implemented
- ❌ **Inventory/Products UI**: Complete module missing

- ❌ **Search/filter functionality**: Patient/Appointment lists have basic structure but no advanced filtering
- ❌ **Pagination UI**: API supports it, but UI currently loads all or fixed set

### Backend
- ✅ **User authentication**: Staff management login and role assignment
- ✅ **Role-based permissions**: "Doctor", "Nurse", "Front Desk", "Admin" groups implemented
- ❌ Reporting/analytics
- ❌ Email/SMS notifications
- ❌ File upload handling (ClinicalPhoto model exists but upload not implemented)
- ❌ Print templates (prescriptions, invoices)
- ❌ Advanced search/filtering APIs

### Integration
- ❌ Production database setup (PostgreSQL)
- ❌ Deployment configuration
- ❌ CI/CD pipeline
- ❌ Testing suite

---

## Next Steps (Recommended)

## Next Steps (Recommended)

1. **Frontend Integration**: Build the full React/Next.js frontend using the completed APIs.
2. **Reporting**: Implement financial and clinical reports.
3. **Notifications**: Add Email/SMS alerts.
4. **Testing**: Add comprehensive unit and integration tests.
5. **Deployment**: Configure for production (PostgreSQL, Docker, Gunicorn).

---

## Technical Notes

- **API Architecture**: Next.js acts as a proxy for client-side requests, but server components call Django directly
- **Multi-tenancy**: Currently uses dev fallback (first organization). Production should use subdomain/header-based org resolution
- **State Management**: Currently using React Server Components + Client Components. No global state library yet
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Type Safety**: TypeScript throughout, but some API responses are typed as `any` (could be improved)

---

## File Count Summary
- **Django Models**: ~30+ models across 6 apps
- **Django Migrations**: ~20+ migration files
- **Next.js Pages**: 8+ pages (Dashboard, Patients, Appointments, Invoices)
- **React Components**: 15+ components
- **API Endpoints**: Comprehensive coverage for Patients, Clinical, and Billing

---

*Last Updated: Jan 01, 2026*
*Project: Skinflow EMR v3*
*Architecture: Django + Next.js hybrid*

