# Implementation Status

> **Source:** Inferred from codebase and PROJECT_STATUS.md (April 2026). UI verified against PDF screenshots.

## Summary

| Area | Backend | Frontend | Notes |
|------|---------|----------|-------|
| Patient Management | Complete | Complete | Full CRUD |
| Appointments | Complete | Complete | Calendar view, scheduling |
| Clinical Intake | Complete | Partial | Backend ready, UI basic |
| Consultations | Complete | Complete | Full workflow |
| Prescriptions | Complete | Complete | Medications, procedures, products |
| Procedure Sessions | Complete | Complete | Daily sessions view |
| Billing/Invoices | Complete | Complete | Partial billing, selection screen |
| Payments | Complete | Complete | Multiple methods |
| Entitlements | Complete | Partial | Auto-creation works, UI limited |
| Inventory | Complete | Complete | Full module |
| Accounting | Partial | Partial | Core models built, many features TO BUILD (see ACCOUNTING_SPEC.md) |
| SaaS Platform | Complete | Complete | Superadmin portal |
| Authentication | Complete | Complete | JWT login |
| RBAC | Substantially Complete | Substantially Complete | Enforcement in place; granular frontend permission checks remain |

---

## Detailed Status

### Complete Features

#### Backend
- Multi-tenant data isolation (Organization FK on all models)
- JWT authentication with SimpleJWT
- Patient CRUD with delete protection
- Appointment booking and status management
- Clinical intake (vitals)
- Consultation workflow (DRAFT → FINALIZED)
- Full prescription system (medications, procedures, products, lab tests)
- Procedure session management with entitlement enforcement
- Treatment plans with plan items
- Invoice generation from consultation
- Partial billing / selective item billing
- Payment processing with auto-status update
- Automatic entitlement creation on invoice PAID
- Product fulfillment on payment
- Full inventory system (products, stock, locations, movements)
- Procurement (vendors, POs, GRNs, vendor bills)
- Inventory requisitions (clinical and general)
- Basic double-entry accounting foundation (see Partial section for details)
- Campaign/discount system
- SaaS subscription management (plans, billing, add-ons)
- Audit logging
- Announcements system
- Impersonation sessions

#### Frontend
- Dashboard with stats cards (appointments today, unpaid invoices, sessions)
- Patient list with search UI structure
- Patient CRUD (create, view, edit)
- Patient photo gallery (registration photos with lightbox)
- Appointment calendar view (weekly)
- Appointment booking form
- Clinical overview page (stats, navigation)
- Consultation list with status badges
- Consultation detail/edit views
- Session list (daily view with procedure info)
- Invoice list with status filtering
- Invoice detail view
- Payment recording
- Finance overview (revenue cards, navigation)
- Accounting module basic UI (Chart of Accounts, Journals, Banking, Reports tabs - see Partial section)
- Inventory dashboard
- Product catalog
- Stock levels view
- Purchase orders management
- GRN receiving
- Vendors directory
- Point of Sale interface
- Settings (roles, staff)
- Login page with JWT handling
- Superadmin portal (organizations, plans, invoices, announcements, audit log)
- **Camera Capture Component** — WebRTC getUserMedia, SVG positioning overlays (7 angles), capture/retake/upload flow, front/rear camera toggle, permission error handling
- **Multi-Angle Capture Flow** — 5-angle face sequence (front, left, right, 3/4 left, 3/4 right), step progress indicator, per-angle skip support, integrated into session pre/post-session documentation

---

### Partially Built Features

#### Accounting Module
- Backend: Core models (Account, JournalEntry, BankAccount, BankReconciliation) built
- Backend: Basic automated journal posting (invoice, payment, GRN, vendor payment, CC settlement)
- Frontend: Chart of Accounts CRUD, Journal list, Basic reports (Trial Balance, P&L, Balance Sheet, GL)
- Added: Bank statement import (CSV/OFX), auto-matching with tolerance, manual match/ignore, Create JE + auto-match dialog, recon summary math
- Missing: Granular account sub-types, approval workflows, fiscal period management, AR/AP aging, write-offs, tax handling, scheduled reports, full audit trail
- See: `docs/ACCOUNTING_SPEC.md` for full requirements

#### Clinical Intake UI
- Backend: Complete
- Frontend: Basic structure exists but limited UI polish

#### Entitlement Management UI
- Backend: Complete (auto-created, enforced)
- Frontend: No dedicated management screen; shown contextually

#### Role-Based Access Control
- Backend: Role model with JSON permissions exists
- Frontend: Permission checks not fully implemented
- Gap: Need middleware/decorator enforcement on both ends

#### Search & Filtering
- Backend: Basic support via DRF filtering
- Frontend: Search inputs present but limited functionality

#### Pagination
- Backend: DRF pagination configured
- Frontend: Not fully implemented (loads all or fixed sets)

---

### Missing / Not Implemented

#### Backend
- Advanced search/filtering APIs
- Reporting/analytics endpoints
- Email/SMS notifications
- ~~File upload handling (photos, documents)~~ **DONE** (Sprint 1)
- ~~Print templates (prescriptions, invoices)~~ **DONE** (Sprint 2)
- SSLCommerz payment integration
- PharmaSeed medicine database sync

#### Frontend
- Pagination UI components
- Advanced search with filters
- Reporting dashboard
- ~~Print layouts~~ **DONE** (Sprint 2)
- ~~File upload for photos~~ **DONE** (Sprint 1)
- ~~Consent form signing UI~~ **DONE** (Sprint 2)
- Treatment plan creation wizard
- Bulk operations (batch status updates)

#### Infrastructure
- ~~Production database setup (PostgreSQL)~~ **DONE** — Linode Singapore VPS, PostgreSQL on same server
- ~~Deployment configuration~~ **DONE** — Gunicorn (3 workers) + Nginx reverse proxy, systemd service, Cloudflare HTTPS
- CI/CD pipeline
- Testing suite (unit, integration, e2e)
- Monitoring/logging in production

---

## Known Issues / Technical Debt

1. **Type Safety**: Some API responses typed as `any` in TypeScript
2. **Error Handling**: Inconsistent error display across UI
3. **Loading States**: Missing or inconsistent loading indicators
4. **Form Validation**: Client-side validation incomplete in some forms
5. **Mobile Responsiveness**: Structure exists but not fully tested
6. **Soft Delete**: Models use hard delete; consider soft delete for audit
7. **Photo Storage**: URL-based, no actual file handling
8. ~~**Multi-Tenancy Fallback**~~: Resolved — `get_current_org()` now raises `AuthenticationFailed` instead of falling back to first org; all core views require `IsAuthenticated`; global DRF default changed to `IsAuthenticated`

---

## Suggested Priority Order

### Phase 1: Core Stability
1. Complete RBAC enforcement (backend + frontend)
2. Add proper error handling and loading states
3. Implement pagination in all list views
4. Add basic search/filter functionality

### Phase 2: Feature Completion
1. Reporting dashboard (basic financial reports)
2. Print templates (invoice, prescription)
3. Entitlement management UI
4. Treatment plan wizard

### Phase 3: Production Readiness
1. PostgreSQL migration and configuration
2. Docker containerization
3. CI/CD pipeline setup
4. Basic test coverage

### Phase 4: Advanced Features
1. Email/SMS notifications
2. File upload for photos
3. SSLCommerz integration
4. Mobile optimization

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| v4 | Feb 2026 | Current version, Django 5.2 + Next.js 16 |
| v3 | Jan 2026 | Previous iteration (referenced in PROJECT_STATUS.md) |

---

## Development Roadmap

### Sprint 1 — Infrastructure (Current Sprint)

Unblocks all other features. Must complete before Sprint 2.

1. ~~Multi-Tenancy Production Resolution~~ **DONE**
2. ~~RBAC Enforcement~~ **DONE**
3. ~~File Upload & Storage~~ **DONE**

### Sprint 2 — Core Clinical UX

Highest daily value for clinic staff.

4. ~~Patient Check-in Mode (tablet)~~ **DONE**
5. ~~Consent Forms & Digital Signature~~ **DONE**
6. ~~Face Mapping for Injectables~~ **DONE**
7. ~~Print Templates (Prescription, Invoice)~~ **DONE**

### Sprint 3 — Operations ✅ Complete (April 7, 2026)

8. ~~Consumable Requisition Workflow~~ **DONE**
9. ~~Accounting: Bank Feed Import & Reconciliation~~ **DONE**

### Sprint 4 — Growth ✅ Complete (April 7, 2026)

10. ~~Online Appointment Booking~~ **DONE**
11. ~~SaaS Usage Limit Enforcement~~ **DONE**

---

*Last reviewed: April 8, 2026*

---

## Pre-Production Review (April 7, 2026)

A full codebase review was conducted prior to production deployment. The following issues were identified and fixed:

### Critical fixes applied
- **CASCADE → SET_NULL on financial records** (`billing/models.py`): `Invoice.patient`, `Payment.invoice`, `Entitlement.patient` — deleting a patient or invoice no longer wipes financial records
- **CASCADE → SET_NULL on clinical records** (`clinical/models.py`): `Appointment.patient/provider`, `Consultation.patient/provider` — deleting a provider or patient no longer wipes clinical history
- **DB-level unique constraint on appointment slots** (`clinical/models.py`): Added `unique_together = [['organization', 'provider', 'date_time']]` to `Appointment.Meta`; `PublicBookView` wrapped in `select_for_update()` + `transaction.atomic()` to prevent race conditions
- **DEBUG defaults to False** (`skinflow/settings.py`): Changed default from `'True'` to `'False'`; must be explicitly set in dev environments

### Important fixes applied
- **Patient delete guard** (`patients/views.py`): `perform_destroy()` now checks all 9 reverse relations (appointments, consultations, invoices, entitlements, allergies, medical history, clinical notes, photos, consent forms) and returns a clear error listing blocking record types
- **Silent fee conversion failure** (`clinical/views.py`): `check_in()` now validates fee *before* mutating appointment status; bad input returns HTTP 400 instead of silently skipping billing
- **Posted journal entries protected from deletion** (`accounting/views.py`): `JournalEntryViewSet.perform_destroy()` blocks deletion of POSTED entries with HTTP 403
- **Phone-key name collision on re-booking** (`clinical/public_views.py`): `PublicBookView` no longer silently uses a mismatched name; booking succeeds with the stored name and a `notice` field is included in the response
- **Public lookup endpoint throttled** (`clinical/public_views.py`, `skinflow/settings.py`): `PublicLookupPatientView` now applies `PublicLookupThrottle` at 20/hour to prevent phone number enumeration

---

## v0.4.0 — All Planned Sprints Complete

As of April 7, 2026, all four planned development sprints are complete. Sprint 1 delivered the infrastructure foundations: multi-tenancy production resolution, full RBAC enforcement, and file upload/storage. Sprint 2 built out the core clinical UX layer: tablet-based patient check-in, consent forms with digital signature, face mapping for injectable documentation, and print templates for prescriptions and invoices. Sprint 3 completed the operations module: consumable requisition workflow with per-session tracking and the accounting bank feed import and reconciliation system. Sprint 4 delivered the growth features: a public-facing online appointment booking flow (3-step wizard, clinic-configurable schedule, `BK-XXXXXX` booking references) and end-to-end SaaS usage limit enforcement (plan limits on patients/users/branches, HTTP 402 hard blocks, subscription status gating on all write operations, frontend usage banners, feature flag gates on Inventory/Accounting/Procedure Sessions, and super admin suspend/reinstate controls).
