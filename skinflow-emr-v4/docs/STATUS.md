# Implementation Status

> **Source:** Inferred from codebase and PROJECT_STATUS.md (April 2026). UI verified against PDF screenshots.
> **Last reviewed:** April 14, 2026

## Summary

| Area | Backend | Frontend | Notes |
|------|---------|----------|-------|
| Patient Management | Complete | Complete | Full CRUD |
| Appointments | Complete | Complete | Calendar view, scheduling |
| Clinical Intake | Complete | Partial | Backend ready, UI basic |
| Consultations | Complete | Complete | Full workflow |
| Prescriptions | Complete | Complete | Medications, procedures, products |
| Procedure Sessions | Complete | Complete | Full workflow; entitlement consumed on completion (AD-024); cancellation blocked when consumables issued (AD-025) |
| Billing/Invoices | Complete | Complete | Partial billing, selection screen |
| Payments | Complete | Complete | Multiple methods incl. split payments |
| Entitlements | Complete | Complete | Auto-creation works; Schedule Session flow on patient page |
| Inventory | Complete | Complete | Full module; GRN confirm bugs fixed (AD-026); Adjust Stock UI added |
| Fulfillment Queue | Complete | Complete | Manual handover queue; auto-deducts stock on Hand Over when product FK is set (AD-026) |
| Accounting | Substantially Complete | Substantially Complete | Stage 4 hardening done: granular account mapping, COGS hooks, hardened JE posting (April 14, 2026) |
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
- Product fulfillment queue: manual handover workflow via /inventory/fulfillment (AD-026)
- Full inventory system (products, stock, locations, movements)
- Procurement (vendors, POs, GRNs, vendor bills) — GRN confirm action fixed
- Opening stock entry via Adjust Stock modal on Stock Ledger page
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

#### Accounting Module (Stage 4 complete — April 14, 2026)
- Backend: Core models (Account, JournalEntry, BankAccount, BankReconciliation)
- Backend: All 4 automated journal hooks fire correctly (invoice → payment → GRN → vendor payment)
- Backend: Granular account mapping — 13 FK fields on ClinicSettings (AR, AP, Consultation/Procedure/Product Revenue, Product COGS, Procedure COGS, Cash, Bank, bKash, Nagad, Inventory)
- Backend: `post_invoice_revenue` now posts per-item-type revenue (multi-line JE); falls back to generic revenue account if granular not configured
- Backend: `post_patient_payment` routes BKASH → bKash account, NAGAD → Nagad account
- Backend: New `post_product_cogs` hook fires on product fulfillment handover (billing/views.py)
- Backend: New `post_procedure_cogs` hook fires on consumable requisition fulfillment (inventory/views.py)
- Backend: `get_system_account` no longer auto-creates junk accounts — returns None + warning log if unconfigured
- Backend: `seed_bd_clinic_accounts` management command — creates full 35-account BD clinic CoA and auto-maps all 13 ClinicSettings fields
- Frontend: Manual Journal Entry creation works (balanced, multi-line, validates balance before posting)
- Frontend: Account Mapping modal (Journal Entries page → "Account Mapping" button) — 5 groups, all 13 fields
- Frontend: Trial Balance, P&L, Balance Sheet, General Ledger — all working
- Frontend: Bank account setup, statement import, auto-match, manual match/ignore, reconciliation
- Missing (post-launch): fiscal period management, AR/AP aging, write-offs, tax handling, scheduled reports, full audit trail
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
9. ~~**Duplicate patient phone error**~~: Resolved — `PatientViewSet.perform_create` now catches `IntegrityError` on `(organization, phone_primary)` and returns HTTP 400 with `"A patient with this phone number already exists."`
10. **AppointmentsListClient patientView bug**: When used inside patient detail page with `patientView=true`, the `useEffect` fetches all appointments by selected day instead of filtering by patient, overwriting the patient-specific `initialData`. Needs a `patientId` prop wired similarly to `InvoicesListClient`.
18. **Sessions without `scheduled_at` hidden from daily list**: Sessions created directly via the API or Django admin without setting `scheduled_at` will not appear in the daily sessions list (which filters by `scheduled_at__date`). This is intentional per AD-022 but may surprise operators who create sessions manually.
19. **`patient_details` missing `has_known_allergies`/`has_chronic_conditions` in session list**: The serializer now returns these fields, but they were previously typed as `any` on `patient_details` in `SessionDetailClient`. The type is now corrected; the allergy/condition banners will now render correctly for sessions created from entitlements (where patient is resolved via `entitlement.patient`).
11. **Medication frequency options**: Current dropdown has 11 options. Needs more combinations — "twice daily morning & night", "alternate days", "every 6 hours", etc. Low priority.
12. **Consultation finalize modal**: UI needs design polish. Defer to design sprint.
13. **Print Rx button**: Not working on consultation page. Needs investigation.
14. **PDF download on invoices**: Not working. Print opens system dialog with HTML page. Needs proper PDF generation.
15. **Treatment plan detail view**: Plans can be created but no way to view plan contents. Needs detail expansion or modal.
16. **Appointment editing after arrival**: Appointment form allows changing patient, doctor, and time even after status is ARRIVED or beyond. Should lock critical fields once status passes SCHEDULED. Fields to lock: patient, provider, date_time. Fee is handled separately via waiver flow.
17. **Cross-doctor consultation access**: Need to verify that Doctor A cannot start a consultation for Doctor B's appointment. If not enforced, add validation.
20. **Entitlements & Sessions title**: UI rendering glitch on the section header in `PatientEntitlements` component.

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

*Last reviewed: April 13, 2026 — Stage 2 complete + business rule fixes: entitlement consumed on completion (AD-024), 3-layer capacity enforcement (perform_create/start_session/perform_update), cancellation blocked when consumables issued (AD-025), photo upload URL fixed, planned_qty duplicate guard, consent optional*

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
