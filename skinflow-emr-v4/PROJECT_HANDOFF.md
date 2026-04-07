# Project Handoff: Skinflow EMR v4
**Date:** March 06, 2026

## 🚀 Project Overview
**Skinflow EMR v4** is a premium, multi-tenant Electronic Medical Records (EMR) and Practice Management system tailored for aesthetic and dermatology clinics. The platform is designed for international scalability with a focus on visual excellence (**Radiant Theme**) and robust multi-tenant data isolation.

## 🛠 Tech Stack
- **Frontend:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Backend:** Django 5.x, Django REST Framework (DRF), SQLite (Development).
- **Authentication:** JWT (SimpleJWT) with `Bearer` token flow.
- **UI Architecture:** custom "Radiant" theme (Cream/Gold/Charcoal palette) using DM Serif Display and Plus Jakarta Sans.

---

## 🏗 Core Architecture
### 1. Multi-Tenancy & Data Isolation
- **Organization Scoping:** Every data point (Patient, Invoice, Appointment) is linked to an `Organization`.
- **Context Resolution:** Handled via `core/api_auth.py:get_current_org(request)`.
- **Current Org Logic:** 
  1. Checks `X-Impersonate-Org` header (Superadmins only).
  2. Falls back to `request.user.staff_profile.organization`.
  3. Final fallback is `Organization.objects.first()` (to be removed in production).
- **IsAuthenticated Enforcement:** Recently updated all ViewSets (`patients`, `clinical`, `billing`, `accounting`, `inventory`, `masters`) to remove authentication bypasses. All requests now require a valid JWT.

### 2. RBAC (Role-Based Access Control)
- **Permissions:** Stored as JSON in `Role.permissions` (e.g., `{"clinical": ["read", "write"]}`).
- **Backend Guard:** `core.permissions.HasRolePermission` checks these JSON strings against the request.
- **Frontend Guard:** `RouteGuard.tsx` wraps the app and checks permissions before rendering modules.

### 3. Superadmin vs. Clinic Logic
- **Superadmin:** Logged in via `SaaSAdmin` profile or `is_superuser=True`. Can manage the entire platform via `/superadmin`.
- **Clinic Staff:** Linked to an `Organization` via `ClinicStaff`. Limited to their tenant's data.

---

## 📦 Major Modules & Features
### ✅ SaaS Admin (`/superadmin`)
- **Organization Management:** full CRUD, status toggling, details editing.
- **Subscription Management:** Plan tiers, user limits, manual billing cycle overrides.
- **User/Role Provisioning:** Superadmins can provision clinic admins/staff directly.
- **Audit Logs:** Global trail of actions (created, updated, deleted) with IP and User Agent tracking.
- **Announcements:** Broadcast system with severity levels (INFO, WARNING, CRITICAL).
- **Impersonation:** Superadmins can impersonate any clinic via header injection.

### ✅ Clinical Workflow
- **Patient 360:** Comprehensive dashboard for patients with Timeline, Appointments, Consultations, and Invoices.
- **Radiant UI:** Modern "lifestyle card" aesthetic for clinical dashboards.
- **Specialized Forms:** Interactive mapping for Botox, Fillers, and LHR using SVG schematics.
- **Procedure Sessions:** Entitlement-backed session execution (prevents treating without payment).

### ✅ Billing & Accounting
- **Flexible Invoicing:** Supports partial billing, quotations, and mixed item types.
- **Enterprise Accounting:** Double-entry bookkeeping system with Chart of Accounts, Journal Entries, and Bank Reconciliation.
- **Automatic Ledgers:** GRNs, Sales, and Payments automatically trigger balanced journal entries in the background.

---

## 🔴 Current State & Known Issues
### 1. "Miracle Clinic" Add User Bug (In Progress)
- **Symptom:** The "Add User" button in the Superadmin dashboard works for the original clinic but reportedly fails for the new "Miracle Aesthetics" clinic.
- **Investigation:** 
    - Underlying API `saasApi.createUser` accepts the payload correctly in backend tests.
    - Subscription checks confirm Miracle has 10 max users and only 5 used.
    - Possible frontend state blockage or silent API failure when roles/branches are empty.
- **Next Step:** Verify if the frontend "Add User" modal is failing to open or failing on submit in the specific Miracle organization context.

### 2. Multi-Tenant Transition
- We have recently moved from "API Key" security to "JWT" security.
- Some legacy code might still reference `X-Api-Key`, but the core standard is now `Bearer` tokens.

---

## ⌨️ Development Setup
### Backend (Django)
```bash
# Environment
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=skinflow.settings

# Run Server
python manage.py runserver
```
- **DB:** `db.sqlite3` in root.
- **Key Files:** `core/models.py`, `core/api_auth.py`, `saas/views.py`.

### Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
- **Base URL:** Defined in `apps/web/.env.local` as `DJANGO_BASE_URL`.
- **API Wrapper:** `apps/web/src/lib/api.ts` manages headers for JWT and Impersonation.

---

## 📜 Repository Guidelines
1. **The Radiant Standard:** All new UI must follow the cream `#EDE7DC` / charcoal `#1C1917` / gold `#C4A882` aesthetic.
2. **Scoping First:** Never query a model directly without filtering by `organization=org`.
3. **Audit Everything:** Use the `log_action` helper in `saas/views.py` for significant state changes.

---
*End of Document. Pick up from "Miracle Clinic" user provisioning investigation.*
