# Data Model

> **Source:** Inferred from Django models (April 2026). Check models.py files for current schema.

## Entity Relationship Overview

```
Organization (multi-tenant root)
├── Branch
├── Role
├── ClinicStaff ──────────────────────── User (Django)
├── Provider ─────────────────────────── User (Django)
├── ClinicSettings ───────────────────── Account (accounting defaults)
│
├── Patient
│   ├── PatientAllergy
│   ├── PatientMedicalHistory
│   ├── ClinicalNote
│   ├── ClinicalPhoto
│   └── ConsentForm ──────────────────── ConsentFormTemplate
│
├── Appointment ──────────────────────── Patient, Provider
│   └── ClinicalIntake
│
├── Consultation ─────────────────────── Patient, Provider, Appointment
│   ├── ConsultationSymptom
│   ├── ConsultationDiagnosis
│   └── Prescription
│       ├── PrescriptionMedication ───── MedicineMaster
│       ├── PrescriptionProcedure ────── ProcedureType, Invoice (billed)
│       ├── PrescriptionProduct ──────── Invoice (billed)
│       └── PrescriptionLabTest ──────── LabTestMaster
│
├── TreatmentPlan ────────────────────── Patient
│   └── TreatmentPlanItem ────────────── ProcedureType
│       └── ProcedureSession ─────────── Entitlement, Room, Provider
│
├── Invoice ──────────────────────────── Patient, Appointment
│   ├── InvoiceItem ──────────────────── ProcedureType
│   │   └── Entitlement
│   └── Payment
│
├── Product ──────────────────────────── ProductCategory, UnitOfMeasure
│   └── StockItem ────────────────────── StockLocation
│
├── Vendor
│   ├── PurchaseOrder
│   │   └── PurchaseOrderLine ────────── Product
│   └── VendorBill ───────────────────── GRN
│
├── GRN ──────────────────────────────── PurchaseOrder
│   └── GRNLine ──────────────────────── Product, StockLocation
│
├── InventoryRequisition
│   └── InventoryRequisitionLine ─────── Product
│
├── StockMovement ────────────────────── Product, StockLocation
│
├── Account (Chart of Accounts)
│   └── BankAccount
│
├── JournalEntry
│   └── JournalEntryLine ─────────────── Account
│
├── BankReconciliation ───────────────── BankAccount
│
├── Campaign
│
└── (Masters)
    ├── ProcedureCategory
    ├── ProcedureType
    ├── ProcedureRoom
    ├── MedicineMaster
    └── LabTestMaster
```

---

## Core Models

### Organization
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| name | CharField(255) | Organization name |
| slug | SlugField(255) | URL-safe identifier (unique) |
| address | TextField | Physical address |
| phone | CharField(20) | Contact phone |
| email | EmailField | Contact email |
| is_active | BooleanField | SaaS activation status |
| onboarded_at | DateTimeField | Onboarding timestamp |
| created_at | DateTimeField | Auto timestamp |
| updated_at | DateTimeField | Auto timestamp |

### Branch
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| organization | FK(Organization) | Parent org |
| name | CharField(255) | Branch name |
| address | TextField | Address |
| phone | CharField(20) | Phone |
| is_active | BooleanField | Active status |
| is_headquarters | BooleanField | HQ flag |

**Unique Constraint:** (organization, name)

### Provider
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| user | OneToOne(User) | Django user |
| organization | FK(Organization) | Parent org |
| provider_type | CharField | DOCTOR, THERAPIST |
| specialization | CharField(255) | Medical specialty |
| registration_number | CharField(100) | License number |
| max_discount_percentage | Decimal(5,2) | Max allowed discount |

### Role
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| organization | FK(Organization) | Parent org |
| name | CharField(100) | Role name |
| description | TextField | Role description |
| permissions | JSONField | Permission structure |

**Unique Constraint:** (organization, name)

### ClinicStaff
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| user | OneToOne(User) | Django user |
| organization | FK(Organization) | Parent org |
| role | FK(Role) | Assigned role |
| branches | M2M(Branch) | Assigned branches |
| is_org_admin | BooleanField | Org-wide access |
| is_active | BooleanField | Active status |

### ClinicSettings
| Field | Type | Description |
|-------|------|-------------|
| organization | OneToOne(Organization) | Parent org |
| default_ar_account | FK(Account) | A/R ledger account |
| default_revenue_account | FK(Account) | Revenue account |
| default_ap_account | FK(Account) | A/P account |
| default_inventory_account | FK(Account) | Inventory account |

---

## Patient Models

### Patient
| Field | Type | Description |
|-------|------|-------------|
| id | BigAutoField | Primary key |
| organization | FK(Organization) | Parent org |
| first_name | CharField(100) | First name |
| last_name | CharField(100) | Last name |
| date_of_birth | DateField | DOB (nullable) |
| gender | CharField | MALE, FEMALE, OTHER, UNKNOWN |
| blood_group | CharField | A+, A-, B+, B-, AB+, AB-, O+, O-, UNKNOWN |
| phone_primary | CharField(20) | Primary phone |
| phone_secondary | CharField(20) | Secondary phone |
| email | EmailField | Email |
| national_id | CharField(50) | National ID |
| passport_number | CharField(50) | Passport |
| marital_status | CharField | SINGLE, MARRIED, DIVORCED, WIDOWED |
| occupation | CharField(100) | Occupation |
| address | TextField | Address |
| city | CharField(100) | City |
| state | CharField(100) | State |
| zip_code | CharField(20) | ZIP |
| country | CharField(100) | Country |
| emergency_contact_name | CharField(100) | Emergency contact |
| emergency_contact_phone | CharField(20) | Emergency phone |
| emergency_contact_relation | CharField(50) | Relationship |
| has_known_allergies | BooleanField | Allergy flag |
| has_chronic_conditions | BooleanField | Chronic condition flag |

**Unique Constraint:** (organization, phone_primary)

### PatientAllergy
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| allergen | CharField(255) | Allergen name |
| severity | CharField(50) | Severity level |

### PatientMedicalHistory
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| condition | CharField(255) | Condition name |
| diagnosed_date | DateField | Diagnosis date |
| notes | TextField | Additional notes |

---

## Clinical Models

### Appointment
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| provider | FK(Provider) | Provider |
| date_time | DateTimeField | Scheduled time |
| status | CharField | SCHEDULED, ARRIVED, READY_FOR_CONSULT, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW |
| fee | Decimal(10,2) | Appointment fee |

### ClinicalIntake
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| appointment | OneToOne(Appointment) | Linked appointment |
| blood_pressure | CharField(20) | BP reading |
| pulse | CharField(20) | Pulse |
| weight | Decimal(5,2) | Weight in kg |
| height | Decimal(5,2) | Height in cm |
| bmi | Decimal(5,2) | Calculated BMI |
| chief_complaint | TextField | Chief complaint |

### Consultation
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| provider | FK(Provider) | Provider |
| appointment | OneToOne(Appointment) | Linked appointment (nullable) |
| status | CharField | DRAFT, FINALIZED, CANCELLED |
| chief_complaint | TextField | Chief complaint |
| history_of_present_illness | TextField | HPI |
| examination_findings | TextField | Exam findings |
| assessment_and_plan | TextField | Assessment/plan |

### Prescription
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| consultation | OneToOne(Consultation) | Parent consultation |

### PrescriptionMedication
| Field | Type | Description |
|-------|------|-------------|
| prescription | FK(Prescription) | Parent prescription |
| medicine | FK(MedicineMaster) | Medicine |
| dose | CharField(100) | Dosage |
| route | CharField(100) | Route |
| frequency | CharField(100) | Frequency |
| duration | CharField(100) | Duration |
| instructions | TextField | Instructions |

### PrescriptionProcedure
| Field | Type | Description |
|-------|------|-------------|
| prescription | FK(Prescription) | Parent prescription |
| procedure_type | FK(ProcedureType) | Procedure |
| sessions_planned | PositiveInt | Number of sessions |
| base_price | Decimal(10,2) | Unit price |
| manual_discount | Decimal(10,2) | Discount amount |
| is_selected_for_billing | BooleanField | Include in billing |
| billed_invoice | FK(Invoice) | Linked invoice (prevents double-billing) |

### PrescriptionProduct
| Field | Type | Description |
|-------|------|-------------|
| prescription | FK(Prescription) | Parent prescription |
| product_name | CharField(255) | Product name |
| quantity | PositiveInt | Quantity |
| price | Decimal(10,2) | Unit price |
| manual_discount | Decimal(10,2) | Discount |
| is_selected_for_billing | BooleanField | Include in billing |
| billed_invoice | FK(Invoice) | Linked invoice |

### ProcedureSession
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| treatment_plan_item | FK(TreatmentPlanItem) | Plan item (nullable) |
| consultation | FK(Consultation) | Consultation (nullable) |
| appointment | OneToOne(Appointment) | Appointment (nullable) |
| room | FK(ProcedureRoom) | Room (nullable) |
| provider | FK(Provider) | Provider (nullable) |
| status | CharField | PLANNED, STARTED, COMPLETED, CANCELLED, NO_SHOW |
| scheduled_at | DateTimeField | Scheduled time |
| notes | TextField | Session notes |
| specialized_data | JSONField | Procedure-specific data |
| entitlement | FK(Entitlement) | Required entitlement |
| consent_form | FK(ConsentForm) | Consent (nullable) |
| clinical_photo | FK(ClinicalPhoto) | Photo (nullable) |

---

## Billing Models

### Invoice
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| appointment | FK(Appointment) | Appointment (nullable) |
| invoice_type | CharField | CONSULTATION, TREATMENT_PLAN, PRODUCT, MIXED, OTHER |
| status | CharField | DRAFT, UNPAID, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED |
| subtotal | Decimal(12,2) | Subtotal |
| discount_total | Decimal(12,2) | Total discounts |
| tax_total | Decimal(12,2) | Total tax |
| total | Decimal(12,2) | Grand total |
| balance_due | Decimal(12,2) | Remaining balance |

### InvoiceItem
| Field | Type | Description |
|-------|------|-------------|
| invoice | FK(Invoice) | Parent invoice |
| description | CharField(255) | Line description |
| reference_id | PositiveInt | Source record ID |
| reference_model | CharField(50) | Source model name |
| procedure_type | FK(ProcedureType) | Procedure (nullable) |
| quantity | PositiveInt | Quantity |
| unit_price | Decimal(10,2) | Unit price |
| discount | Decimal(10,2) | Discount |
| net_price | Decimal(10,2) | Net price |
| is_fulfilled | BooleanField | Fulfillment status |
| fulfilled_at | DateTimeField | Fulfillment time |

### Payment
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| invoice | FK(Invoice) | Parent invoice |
| method | CharField | CASH, CARD, BKASH, NAGAD, BANK_TRANSFER, ADJUSTMENT, OTHER |
| amount | Decimal(12,2) | Payment amount |
| status | CharField | PENDING, COMPLETED, FAILED, REFUNDED |
| transaction_id | CharField(255) | Transaction reference |

### Entitlement
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| patient | FK(Patient) | Patient |
| invoice | FK(Invoice) | Source invoice |
| invoice_item | OneToOne(InvoiceItem) | Source line item |
| entitlement_type | CharField | PROCEDURE, PRODUCT |
| procedure_type | FK(ProcedureType) | Procedure (nullable) |
| total_qty | PositiveInt | Total quantity |
| used_qty | PositiveInt | Used quantity |
| remaining_qty | PositiveInt | Remaining (computed) |
| is_active | BooleanField | Active status |

---

## Inventory Models

### Product
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| category | FK(ProductCategory) | Category (nullable) |
| uom | FK(UnitOfMeasure) | Unit (nullable) |
| name | CharField(255) | Product name |
| sku | CharField(100) | SKU (unique) |
| product_type | CharField | MEDICINE, SKINCARE, CONSUMABLE, DEVICE, OTHER |
| is_stock_tracked | BooleanField | Track stock |
| is_saleable | BooleanField | Can sell |
| is_procedure_item | BooleanField | For procedures |
| is_clinic_item | BooleanField | For clinic use |
| cost_price | Decimal(10,2) | Cost |
| sale_price | Decimal(10,2) | Sale price |
| tax_rate | Decimal(5,2) | Tax rate |

### StockItem
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| product | FK(Product) | Product |
| location | FK(StockLocation) | Location |
| quantity | Decimal(10,2) | Current quantity |

**Unique Constraint:** (product, location)

### StockMovement
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| product | FK(Product) | Product |
| location | FK(StockLocation) | Location |
| movement_type | CharField | IN, OUT, ADJUST |
| quantity | Decimal(10,2) | Quantity moved |
| reference_id | CharField(255) | Reference |

### PurchaseOrder
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| vendor | FK(Vendor) | Vendor |
| po_number | CharField(100) | PO number (unique) |
| order_date | DateField | Order date |
| expected_delivery_date | DateField | Expected delivery |
| status | CharField | DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| total_amount | Decimal(12,2) | Total |

### GRN (Goods Received Note)
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| po | FK(PurchaseOrder) | Purchase order |
| grn_number | CharField(100) | GRN number (unique) |
| receive_date | DateField | Receive date |
| received_by | CharField(255) | Receiver |
| status | CharField | DRAFT, CONFIRMED |

---

## Accounting Models

### Account
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| parent | FK(self) | Parent account (nullable) |
| name | CharField(255) | Account name |
| code | CharField(50) | Account code |
| description | TextField | Description |
| account_type | CharField | ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE |
| is_active | BooleanField | Active |
| is_system_account | BooleanField | System account |
| system_code | CharField(50) | System identifier |

### JournalEntry
| Field | Type | Description |
|-------|------|-------------|
| organization | FK(Organization) | Parent org |
| date | DateField | Entry date |
| reference_number | CharField(100) | Reference |
| description | CharField(500) | Description |
| reversed_by | FK(self) | Reversal entry |
| source_model | CharField(100) | Source model |
| source_id | PositiveInt | Source ID |
| status | CharField | DRAFT, POSTED, CANCELLED |
| posted_at | DateTimeField | Post timestamp |

### JournalEntryLine
| Field | Type | Description |
|-------|------|-------------|
| entry | FK(JournalEntry) | Parent entry |
| account | FK(Account) | Account |
| description | CharField(255) | Line description |
| debit | Decimal(15,2) | Debit amount |
| credit | Decimal(15,2) | Credit amount |
| is_cleared | BooleanField | Cleared status |
| reconciliation | FK(BankReconciliation) | Reconciliation |

---

## SaaS Models

### Plan
| Field | Type | Description |
|-------|------|-------------|
| name | CharField(100) | Plan name |
| description | TextField | Description |
| base_price_monthly | Decimal(10,2) | Monthly price |
| base_price_annual | Decimal(10,2) | Annual price |
| included_users | PositiveInt | Included users |
| price_per_extra_user | Decimal(10,2) | User overage price |
| included_branches | PositiveInt | Included branches |
| price_per_extra_branch | Decimal(10,2) | Branch overage price |
| features | JSONField | Feature flags |
| is_active | BooleanField | Active |
| sort_order | PositiveInt | Display order |

### Subscription
| Field | Type | Description |
|-------|------|-------------|
| organization | OneToOne(Organization) | Organization |
| plan | FK(Plan) | Subscription plan |
| billing_cycle | CharField | MONTHLY, ANNUAL |
| status | CharField | TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED |
| current_period_start | DateField | Period start |
| current_period_end | DateField | Period end |
| next_billing_date | DateField | Next billing |
| extra_users | PositiveInt | Extra users |
| extra_branches | PositiveInt | Extra branches |
| has_marketing_addon | BooleanField | Marketing add-on |
| monthly_amount | Decimal(10,2) | Computed monthly |

### AuditLog
| Field | Type | Description |
|-------|------|-------------|
| user | FK(User) | Actor |
| impersonated_by | FK(User) | Impersonating admin |
| organization | FK(Organization) | Organization |
| action | CharField(100) | Action type |
| resource_type | CharField(50) | Resource type |
| resource_id | CharField(50) | Resource ID |
| changes | JSONField | Change details |
| ip_address | GenericIPAddress | IP address |
| user_agent | TextField | User agent |

---

## Indexes

Key indexes identified:
- `AuditLog`: (organization, -created_at), (user, -created_at), (action)
- All models with `organization` FK benefit from index on that field
- `unique_together` constraints create composite indexes

---

*For exact field constraints and validators, see Django model files directly.*
