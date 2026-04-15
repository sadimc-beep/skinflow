# Miracle Aesthetics Launch Plan

> **Target Go-Live: May 1, 2026**
> **Client:** Miracle Aesthetics (Dr. Shaheen Sultana Jolly), Dhanmondi, Dhaka
> **Users:** 9 (2 doctors, 2 therapists, 2 front desk, 1 store/accountant, 1 owner, 1 admin/Minhaz)
> **Plan:** Starter (~10 patients/day)
> **Last Updated:** April 15, 2026 (workflow fixes: walk-in consultation, treatment plan view, procedure discount, vendor bill accounting)

---

## Data Migration Strategy

- **Patients:** Start fresh. No bulk import of paper records. Patients registered as they visit.
- **Accounting:** Enter opening balances as a single journal entry on go-live day reflecting Miracle's current financial position (cash, bank, payables, receivables).
- **Inventory:** Physical stock count on go-live day. Enter as opening stock in Skinflow.

---

## Stage 1: RBAC + Core Workflow (April 13-16) — MOSTLY COMPLETE ✅

### Completed
- [x] RBAC audit — 8 fixes applied across 6 backend files
- [x] ConsultationViewSet: create/update gated to Doctor/Owner via IsDoctorOrOrgAdmin
- [x] AccountingSettingsView: added HasRolePermission('accounting')
- [x] All 5 masters ViewSets: reads=IsAuthenticated, writes=HasRolePermission('settings')
- [x] InventoryRequisition ViewSets: create allows clinical.write OR inventory.write
- [x] TreatmentPlan ViewSets: Doctor/Owner write guard
- [x] ProductCategory/UOM/StockLocation/StockItem ViewSets: reads=IsAuthenticated
- [x] BookingSettingsView: PATCH requires settings.write
- [x] ConsentFormTemplateViewSet: reads=IsAuthenticated, writes=settings
- [x] ConsultationViewSet.perform_create validates provider matches appointment provider
- [x] ConsultationViewSet.perform_update validates provider matches consultation provider
- [x] Frontend: ConsultationEditorClient shows read-only mode for non-doctors
- [x] RxTab/SkincareTab/ProceduresTab accept readOnly prop
- [x] Prescription item delete: uses HasAnyModulePermission clinical.write
- [x] ProviderViewSet: list/retrieve=IsAuthenticated, write/delete=HasRolePermission('settings')
- [x] ProductViewSet: list/retrieve=IsAuthenticated
- [x] Fee waiver approve/deny: only visible to Owner/Doctor role names

### Remaining
- [ ] Final verification as each role (full walkthrough)

### Additional (April 15, 2026)
- [x] Walk-in consultation page — `/consultations/new/page.tsx` created; patient + provider Combobox, optional chief complaint, POST without appointment FK, redirects to new consultation

---

## Stage 2: Procedure Sessions (April 13) — COMPLETE ✅

### Phase 1 — Fix Blockers
- [x] Entitlement selector on session detail page (links entitlement to session before start)
- [x] canStart guard updated to require entitlement
- [x] Generic notes section for non-specialized procedures
- [x] Fix date column (scheduled_at instead of created_at)

### Phase 2 — Session Scheduling
- [x] "Entitlements" tab on patient detail page (renamed from Packages)
- [x] Schedule Session from entitlement (modal: date/time, therapist, room)
- [x] Auto-link entitlement when session created from entitlement
- [x] "Sessions to Schedule" panel on paid invoice detail

### Phase 3 — Therapist Daily View
- [x] "My Sessions" / "All Sessions" toggle on sessions list
- [x] Default to "My Sessions" for providers
- [x] Provider filter on session list API

### Phase 4 — Smoke Test Hotfixes (April 13)
- [x] Fix photo upload 404 (CameraCapture URL: `clinical/sessions/` → `clinical/procedure-sessions/`)
- [x] Duplicate session guard (`planned_qty` field on Entitlement; frontend disables Schedule when all sessions planned)
- [x] Consent made optional for launch (removed from `canStart`; UI changed to "Recommended" framing)
- [x] `defaultProviderId` prop on `PatientEntitlements` for pre-selecting therapist in schedule dialog

### Phase 5 — Business Rule Fixes (April 13)
- [x] Entitlement consumed on COMPLETE, not START (AD-024): accidental starts no longer burn a session unit
- [x] `enforce_entitlement_for_session` counts in-flight STARTED sessions to prevent over-starting
- [x] Block session cancellation when requisitions are APPROVED/FULFILLED (AD-025)
- [x] `perform_create` guard: blocks scheduling when PLANNED+STARTED sessions already exhaust entitlement capacity
- [x] `start_session` guard: blocks start when STARTED+COMPLETED sessions exhaust capacity (airtight regardless of frontend)

### Session Types (Miracle)
- **LHR:** Specialized LHRForm (Fitzpatrick, machine/wavelength, fluence/pulse/spot/cooling)
- **Botox:** Specialized BotoxForm (facial schematic, zone units, lot, dilution)
- **Fillers:** Specialized FillerForm (facial schematic, ml volumes, product, lot, technique)
- **All Others:** Generic session page (start/pause/complete, notes, consumable requisition, photos)

---

## Stage 3: Billing + Inventory Hardening (April 13-14) — COMPLETE ✅

- [x] Split payments verification — works; UI supports partial amounts + multiple submissions
- [x] Payment method selection (Cash/Card/bKash/Nagad) — verified, all present in UI and model
- [x] Entitlement creation on payment — verified end-to-end; service chain confirmed correct
- [x] Product fulfillment workflow — Fulfillment Queue added (/inventory/fulfillment); store staff manually marks handover; sidebar nav entry added (AD-026)
- [ ] Invoice list with proper filtering (unpaid default ✅, date range) — date range filter deferred
- [x] PO creation workflow — verified; GRN confirm action fixed (grn.date_received → grn.receive_date, removed invalid po= arg from VendorBill.create)
- [x] GRN receiving — fixed; frontend no longer double-creates VendorBill; /api/inventory/locations/ wrong URL fixed
- [x] Stock movement tracking — IN/OUT/ADJUST all work in backend
- [x] Opening stock entry capability — Adjust Stock modal wired up on Stock Ledger page

---

## Stage 4: Accounting Readiness (April 14) — COMPLETE ✅

- [x] Automated journal entries fire correctly for all 4 triggers (invoice, payment, GRN, vendor payment)
- [x] Vendor bill Mark Paid now calls `POST /mark_paid/` action (was PATCH update, bypassing accounting hook). DR: AP, CR: Bank via `AccountingService.post_vendor_payment()`
- [x] Granular account mapping: 13 ClinicSettings FK fields (Consultation/Procedure/Product Revenue, Product & Procedure COGS, Cash/Bank/bKash/Nagad, AR, AP, Inventory)
- [x] `post_invoice_revenue` splits revenue by item type into a multi-line balanced JE
- [x] `post_patient_payment` routes BKASH → bKash account, NAGAD → Nagad account
- [x] New COGS hooks: `post_product_cogs` (product fulfillment) + `post_procedure_cogs` (consumable requisitions)
- [x] `get_system_account` hardened — returns None + warning log if unconfigured (no junk account creation)
- [x] `seed_bd_clinic_accounts` management command — 35 BD clinic accounts + auto-maps all 13 fields
- [x] Account Mapping UI: "Account Mapping" button on Journals page, 5-group modal
- [x] Manual journal entry creation works (opening balances, adjustments)
- [x] Trial Balance / P&L (Income Statement) / Balance Sheet / General Ledger — all working
- [ ] Run `python manage.py seed_bd_clinic_accounts --org-id <miracle-org-id>` during Stage 5 onboarding
- [ ] Bank account setup (Miracle's actual bank accounts: City Bank, bKash merchant, cash)
- [ ] Verify Store/Accountant role has accounting module access in role permissions

---

## Stage 5: Miracle Onboarding Data Setup (April 26-27)

- [ ] Create Miracle organization (or reconfigure existing test org)
- [ ] Create all 9 user accounts with correct roles
- [ ] Create provider profiles for both doctors
- [ ] Set up procedure catalog (all Miracle procedures with pricing)
- [ ] Set up product catalog from Excel sheet
- [ ] Configure default consultation fees per doctor
- [ ] Set up stock locations
- [ ] Seed chart of accounts
- [ ] Enter opening balances journal entry
- [ ] Physical stock count → enter opening stock

---

## Stage 6: Print Templates + Polish (April 28-29)

- [ ] Prescription print template (clinic letterhead, all Rx components)
- [ ] Invoice print template
- [x] Payment receipt / money receipt template — WeasyPrint PDF via `/api/billing/payments/{id}/receipt-pdf/`; Print Receipt button per payment row + post-payment success state on invoice detail (April 14, 2026)
- [ ] Fix Print Rx button on consultation page
- [ ] Fix PDF generation (currently opens HTML print dialog)
- [ ] Test all prints on actual printer

---

## Stage 7: Final Testing + Go-Live (April 30 - May 1)

- [ ] Full end-to-end walkthrough with Miracle's real data
- [ ] Test on Miracle's actual tablet (camera, check-in)
- [ ] Test on Miracle's desktop (front desk workflow)
- [ ] Backup strategy — PostgreSQL daily dump cron
- [ ] Staff credentials distributed
- [ ] Go-live: Miracle starts using Skinflow

---

## Deferred Items (Post-Launch)

### Features
- SMS/WhatsApp appointment reminders
- Online patient booking (built, needs Miracle-specific config)
- Patient portal
- Marketing App (AI WhatsApp responder, ad management)
- CI/CD pipeline
- Automated test suite
- Mobile optimization
- User guide / documentation

### Accounting (Advanced)
- Fiscal period management
- Tax handling
- Year-end closing
- AR/AP aging reports
- Write-offs
- Scheduled reports
- Full audit trail
- Card provider reconciliation (per-provider accounts)

### Clinical
- Consultation fee waiver DURING consultation (check-in waiver covers most cases)
- ~~Procedure discount UI in consultation form~~ **FIXED April 15, 2026** — discount input rendered in ProceduresTab; capped at provider's max_discount_percentage; backend validates on create
- Consent form template management UI
- ~~Treatment plan detail view~~ **FIXED April 15, 2026** — plan cards are now click-to-expand inline in ProceduresTab
- Advanced medication frequency options (alternate days, every 6 hours, etc.)

### Billing
- SSLCommerz payment integration
- Refund workflow
- Credit note system

### UI/UX
- Design polish sprint (consultation finalize modal, procedure titles, etc.)
- PDF download (proper generation instead of HTML print dialog)
- Pagination in all list views
- Advanced search with filters
- Mobile responsiveness testing
- Breadcrumb redesign

### Infrastructure
- S3 file storage migration (currently local filesystem)
- Redis caching layer
- Elasticsearch for full-text search
- Monitoring / alerting in production

---

## Known Issues / Technical Debt

1. **Type Safety**: Some API responses typed as `any` in TypeScript
2. **Error Handling**: Every API mutation needs try/catch with toast error display (rule added but not fully audited)
3. **CRUD Gaps (resolved April 14)**: Products edit/delete, Medicines CRUD, Procedure Rooms CRUD, Procedure Categories CRUD, Stock Locations CRUD, Product Categories CRUD, PO detail page — all added. All API-loaded dropdowns converted to searchable Combobox.
3. **Loading States**: Missing or inconsistent loading indicators
4. **Form Validation**: Client-side validation incomplete in some forms
5. **Soft Delete**: Models use hard delete; consider soft delete for audit
6. **AppointmentsListClient patientView bug**: useEffect fetches by day not patient, overwriting initialData
7. **Medication frequency**: Current dropdown has 11 options, needs more
8. **Consultation finalize modal**: UI needs design polish
9. **Print Rx button**: Not working on consultation page
10. **PDF download on invoices**: Opens system dialog, needs proper PDF generation
11. ~~**Treatment plan detail view**~~: **FIXED April 15, 2026** — click-to-expand inline in ProceduresTab
12. **Appointment editing after arrival**: Should lock patient/provider/date_time after SCHEDULED
13. **Cross-doctor consultation access**: Verified and fixed (perform_create + perform_update + frontend read-only)
14. ~~**Procedure discount UI**~~: **FIXED April 15, 2026** — input rendered, capped at provider max, backend validation added
15. **Consultation fee waiver during consultation**: Deferred (check-in waiver covers most cases)
16. **Global error handling**: Not all API mutations have try/catch with toast
17. **Pagination warnings**: Multiple QuerySets missing default ordering (UnorderedObjectListWarning)
18. **Session storage**: JWT in localStorage persists across browser sessions (by design, not a bug)

---

## Test Data on Production

- **Org:** "Skinflow Aesthetics Clinic" (slug: skinflow)
- **Admin:** admin@skinflow.io / admin123 (Owner role, is_superuser)
- **Doctor 1:** drsmith / password123 (Provider: John Smith, Dermatologist, fee ৳1500)
- **Doctor 2:** doctor@skinflow.ai / password123 (Provider: Shaheen Sultana Jolly, Dermatology, fee ৳1500)
- **Front Desk:** frontdesk2@skinflow.io
- **Medicines:** 8 seeded (Paracetamol, Amoxicillin, Cetirizine, etc.)
- **Products:** 10 seeded (skincare + consumables)
- **Procedures:** 2 (Laser Hair Removal ৳5000, Chemical Peel ৳3000)
- **Roles:** Owner, Doctor, Therapist, Front Desk, Store

## Key Server Commands

```bash
# SSH
ssh -i ~/.ssh/skinflow-oracle root@172.104.61.162

# Deploy
su - skinflow -c "cd /home/skinflow/app/skinflow-emr-v4 && git stash && git pull && echo \"STATIC_ROOT = BASE_DIR / 'staticfiles'\" >> skinflow/settings.py && source venv/bin/activate && export \$(grep -v '^#' .env | xargs) && python manage.py migrate && cd apps/web && npm run build"
systemctl restart skinflow-backend
systemctl restart skinflow-frontend

# Debug mode
sed -i 's|DJANGO_DEBUG=False|DJANGO_DEBUG=True|' /home/skinflow/app/skinflow-emr-v4/.env
systemctl restart skinflow-backend

# Django admin
https://api.skinflow.app/admin/ (admin@skinflow.io)
```

---

*This document should be placed at `docs/MIRACLE_LAUNCH_PLAN.md` and committed to the repo.*
