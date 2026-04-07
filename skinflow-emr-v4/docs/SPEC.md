# Feature Specification

> **Source:** Inferred from codebase and PROJECT_STATUS.md (April 2026). Items marked [VERIFY] need confirmation.

## Product Vision

Skinflow EMR v4 is a comprehensive clinic management system for aesthetic/dermatology practices, providing:
- Patient registration and medical records
- Appointment scheduling and clinical workflows
- Consultation documentation with prescriptions
- Procedure session management with entitlement enforcement
- Billing with partial payment support
- Inventory and procurement management
- Double-entry accounting integration
- Multi-tenant SaaS deployment

## User Roles & Permissions

### Clinic-Level Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Doctor** | Clinical provider, can consult and prescribe | Full clinical access, view billing |
| **Therapist** | Procedure provider, executes sessions | Procedure sessions, limited clinical |
| **Nurse** | Clinical support, intake, vitals | Intakes, assist consultations |
| **Front Desk** | Reception, scheduling, billing | Appointments, payments, patient registration |
| **Admin** | Clinic administrator | Full access, staff management, settings |

### SaaS-Level Roles

| Role | Description |
|------|-------------|
| **Owner** | Platform owner, full SaaS access |
| **Support** | Customer support agent |
| **Billing** | Subscription billing manager |
| **Viewer** | Read-only platform access |

### Permission Structure
Permissions stored in `Role.permissions` as JSON:
```json
{
  "patients": ["read", "write", "delete"],
  "billing": ["read", "write"],
  "clinical": ["read"]
}
```

## Core Features

### 1. Patient Management

**Registration**
- Required: first_name, last_name, phone_primary
- Optional: DOB, gender, blood_group, email, national_id, address fields
- Emergency contact information
- Medical flags: has_known_allergies, has_chronic_conditions

**Patient Record**
- Allergy tracking with severity
- Medical history with conditions and dates
- Clinical photos (URL-based)
- Consent forms

**Business Rules**
- Phone number unique per organization
- Cannot delete patient with linked records (invoices, appointments, consultations)

### 2. Appointment System

**Booking**
- Link to patient and provider
- Date/time scheduling
- Fee specification

**Status Flow**
```
SCHEDULED → ARRIVED → READY_FOR_CONSULT → IN_CONSULTATION → COMPLETED
    ↓           ↓              ↓                ↓
CANCELLED   (fee paid)    (vitals done)    (consultation)
    ↓
 NO_SHOW
```

**Clinical Intake**
- Recorded at READY_FOR_CONSULT status
- Fields: BP, pulse, weight, height, BMI (calculated), chief complaint

### 3. Consultation Workflow

**Consultation Record**
- Status: DRAFT → FINALIZED (→ CANCELLED)
- Clinical notes: chief_complaint, history_of_present_illness, examination_findings, assessment_and_plan
- Can be walk-in (no appointment) or linked to appointment

**Prescription Components**
| Component | Purpose |
|-----------|---------|
| PrescriptionMedication | Medicines with dose, route, frequency, duration |
| PrescriptionProcedure | Procedures with sessions, pricing, discounts |
| PrescriptionProduct | Products (skincare) with quantity, pricing |
| PrescriptionLabTest | Lab tests (internal/external) |

**Billing Control**
- `is_selected_for_billing` flag on procedures/products
- `billed_invoice` FK prevents double-billing

### 4. Procedure Sessions

**Session Management**
- Links to: TreatmentPlanItem, Consultation, Appointment, Room, Provider
- Status: PLANNED → STARTED → COMPLETED (or CANCELLED/NO_SHOW)
- Specialized charting data (JSON) for procedure-specific info
- Pre-session requirements: consent form, clinical photo

**Entitlement Enforcement**
- Sessions MUST have a valid, active entitlement to start
- Entitlement created when invoice becomes PAID
- Exception: CANCELLED/NO_SHOW status bypasses validation

### 5. Treatment Plans

**Structure**
```
TreatmentPlan (patient-level plan)
    └── TreatmentPlanItem[] (procedure type + planned sessions)
            └── ProcedureSession[] (individual sessions)
```

### 6. Billing System

**Invoice Types**
- CONSULTATION: Single consultation billing
- TREATMENT_PLAN: Treatment plan billing
- PRODUCT: Product-only sale
- MIXED: Combination of above
- OTHER: Miscellaneous

**Invoice Status Flow**
```
DRAFT → UNPAID → PARTIALLY_PAID → PAID
                        ↓
                   CANCELLED
                        ↓
                   REFUNDED
```

**Invoice Items**
- Generic reference tracking (reference_model, reference_id)
- Fulfillment tracking (is_fulfilled, fulfilled_at)
- Optional FK to procedure_type for procedure items

**Payment Methods**
- CASH, CARD, BKASH, NAGAD, BANK_TRANSFER, ADJUSTMENT, OTHER

**Entitlements**
- Created automatically when invoice becomes PAID
- Types: PROCEDURE, PRODUCT
- Quantity tracking: total_qty, used_qty, remaining_qty
- Deactivated when remaining_qty reaches 0

**Business Rules**
1. PAID invoices are immutable (locked)
2. Consultation-required procedures cannot be added to walk-in invoices
3. Entitlements required for procedure sessions
4. Products fulfilled immediately on payment (no entitlement)

### 7. Inventory Management

**Product Catalog**
- Types: MEDICINE, SKINCARE, CONSUMABLE, DEVICE, OTHER
- Classification: is_procedure_item, is_clinic_item
- Pricing: cost_price, sale_price, tax_rate
- Stock tracking toggle

**Stock Management**
- Multiple locations (StockLocation)
- Stock items per product per location
- Movement types: IN, OUT, ADJUST
- Full audit trail

**Requisitions**
- Types: CLINICAL (procedure-linked), GENERAL (clinic supplies)
- Status: DRAFT → SUBMITTED → APPROVED → FULFILLED (or REJECTED/CANCELLED)

**Procurement**
- Vendor management
- Purchase Orders with lines
- Goods Received Notes (GRN)
- Vendor Bills with payment tracking

### 8. Accounting Module

**Chart of Accounts**
- Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Hierarchical (parent-child accounts)
- System accounts for automated posting

**Journal Entries**
- Double-entry enforcement (debits = credits)
- Status: DRAFT → POSTED (→ CANCELLED)
- Source tracking for business event linking

**Bank Accounts**
- Types: CASH, BANK, HOLDING_CC, HOLDING_CHECK
- Linked to ledger account

**Automated Posting**
- Invoice creation: DR A/R, CR Revenue
- Payment receipt: DR Cash/Bank, CR A/R
- GRN receipt: DR Inventory, CR A/P
- Vendor payment: DR A/P, CR Cash/Bank
- CC batch settlement with fee handling

**Bank Reconciliation**
- Statement-based reconciliation
- Line-level clearing

### 9. Marketing Campaigns

**Campaign Structure**
- Target: FEE, PROCEDURE, PACKAGE, PRODUCT
- Discount types: PERCENT, AMOUNT, NONE
- Budget tracking (total_budget, budget_consumed)
- Usage limits per patient
- Date range activation

### 10. SaaS Platform

**Subscription Plans**
- Tiered pricing (Starter, Professional, Enterprise)
- Monthly/Annual billing cycles
- User and branch limits with overage pricing
- Feature flags JSON

**Subscriptions**
- Status: TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED
- Add-ons: extra_users, extra_branches, has_marketing_addon

**Platform Features**
- SaaS-level invoicing (SubscriptionInvoice)
- Payment tracking (SSLCommerz planned)
- Impersonation sessions for support
- Audit logging
- Announcements with targeting

## Known Constraints

1. **Single Organization per User**: Users belong to one organization (no cross-org access except SaaS admin)
2. **Sequential Workflow**: Appointments → Consultations → Billing (cannot skip steps)
3. **Entitlement Requirement**: Cannot execute procedure sessions without paid entitlement
4. **Photo Storage**: Currently URL-based, not actual file storage
5. **Reports**: Not yet implemented

## Future Considerations [VERIFY]

- Email/SMS notifications
- Print templates (prescriptions, invoices)
- Advanced search/filtering
- Mobile app
- Integration with lab systems
- Insurance billing

---

*See also: STATUS.md for implementation progress*
