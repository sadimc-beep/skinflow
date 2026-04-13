# Skinflow EMR v4

## Instructions for Claude

- Always read CLAUDE.md at session start, nothing else
- Before reading source files, check docs/ first
- When I say "work on [feature]", read only files relevant to that feature — ask me to confirm scope if unsure
- After completing any feature, update docs/STATUS.md
- Never regenerate docs from scratch — only update changed sections
- Default to Sonnet model for daily work unless I say otherwise
- When I say "explain your plan" or "read first", always explain your approach and wait for explicit approval before writing or modifying any code. Do not proceed until I say "go ahead" or "approved".
- Never write or modify any code until I say "go ahead" or "approved" after seeing your plan.
- Never push to git without my explicit approval.
- After completing work, show a summary and ask "Ready to commit and push?" — wait for confirmation before running git commit or git push.

## Permission Policy
- Auto-approve: file reads, file writes, file edits, 
  git add, git commit, git checkout, git branch,
  npm install, pip install, mkdir, touch, cp
- Always ask permission before: rm, rmdir, DROP, 
  DELETE, TRUNCATE, database migrations that remove 
  columns or tables, overwriting .env files, 
  anything irreversible
- Never run destructive commands without explicitly 
  stating what will be deleted and waiting for 
  my confirmation
---

> **Source:** Inferred from codebase analysis (April 2026). Cross-reference with code for latest state.

## Project Overview

Skinflow EMR v4 is a multi-tenant Electronic Medical Records (EMR) system designed for aesthetic and dermatology clinics. It provides end-to-end clinical workflow management including patient records, appointments, consultations, procedure sessions, billing with entitlement tracking, inventory management, double-entry accounting, and SaaS subscription management.

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Django | 5.2.9 |
| Backend API | Django REST Framework | 3.16.x |
| Database | SQLite (dev) / PostgreSQL (prod) | - |
| Frontend | Next.js (App Router) | 16.1.6 |
| Frontend | React | 19.2.3 |
| Frontend | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | Radix UI, shadcn/ui pattern | - |
| Auth | JWT (SimpleJWT) | - |
| Icons | Lucide React | 0.575.x |

## Folder Structure

```
skinflow-emr-v4/
├── apps/web/                 # Next.js frontend
│   └── src/
│       ├── app/              # App Router pages
│       │   ├── (app)/        # Protected clinic routes
│       │   ├── (auth)/       # Login page
│       │   └── (superadmin)/ # SaaS admin routes
│       ├── components/       # React components
│       ├── lib/              # API client, utilities
│       └── types/            # TypeScript types
├── core/                     # Django: Organization, Staff, RBAC, Settings
├── patients/                 # Django: Patient management
├── clinical/                 # Django: Appointments, Consultations, Prescriptions, Sessions
├── billing/                  # Django: Invoices, Payments, Entitlements
├── inventory/                # Django: Products, Stock, PO, GRN, Vendors
├── accounting/               # Django: Chart of Accounts, Journal Entries
├── masters/                  # Django: Procedure Types, Medicines, Lab Tests
├── campaigns/                # Django: Marketing campaigns
├── saas/                     # Django: SaaS subscriptions, plans, audit logs
├── skinflow/                 # Django project settings
├── venv/                     # Python virtual environment
├── docs/                     # Project documentation
└── db.sqlite3                # SQLite database (development)
```

## Key Conventions & Patterns

### Backend (Django)
- **Multi-tenancy**: All models include `organization` FK for data isolation
- **Base Model**: Use `TimeStampedModel` for `created_at`/`updated_at`
- **API Structure**: REST endpoints via DRF ViewSets with DefaultRouter
- **Business Logic**: Service functions in `<app>/services.py` (e.g., `billing/services.py`)
- **Accounting Integration**: Double-entry via `AccountingService` hooks on billing events
- **Status Enums**: Use `models.TextChoices` for all status fields

### Frontend (Next.js)
- **App Router**: All routes in `src/app/` with route groups `(app)`, `(auth)`, `(superadmin)`
- **API Client**: `lib/api.ts` with `fetchApi<T>()` helper, JWT from localStorage
- **Components**: shadcn/ui pattern in `components/ui/`, app-specific in `components/sf/`
- **Server Components**: Default, use `'use client'` only when needed
- **API-loaded Dropdowns**: All dropdowns that load from API data (patients, providers, procedures, products, medicines, etc.) must use a searchable combobox pattern (cmdk or similar). Search must match anywhere in the string, not just the start. Use the existing cmdk dependency. This applies globally across the entire app.

### Naming Conventions
- Django models: PascalCase (e.g., `ProcedureSession`)
- API endpoints: kebab-case (e.g., `/api/clinical/procedure-sessions/`)
- Frontend routes: kebab-case (e.g., `/inventory/purchase-orders`)

## Common Commands

### Backend (Django)
```bash
# From project root
source venv/bin/activate
python manage.py runserver                 # Start dev server (port 8000)
python manage.py migrate                   # Apply migrations
python manage.py makemigrations            # Create migrations
python manage.py shell                     # Django shell
python manage.py createsuperuser           # Create admin user
```

### Frontend (Next.js)
```bash
# From apps/web/
npm run dev                                # Start dev server (port 3000)
npm run build                              # Production build
npm run lint                               # ESLint
```

### Both
```bash
# Terminal 1: Backend
cd skinflow-emr-v4 && source venv/bin/activate && python manage.py runserver

# Terminal 2: Frontend
cd skinflow-emr-v4/apps/web && npm run dev
```

### Deploy (Production — Linode Singapore)
```bash
# On the server: pull latest, restart services
git pull
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart skinflow-backend

# Frontend rebuild
cd apps/web
npm install
npm run build
sudo systemctl restart skinflow-frontend
```

## Environment Variables

### Backend (.env)
```
DJANGO_SECRET_KEY=<secret>
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
SKINFLOW_API_KEY=<api-key>
```

### Frontend (apps/web/.env.local)
```
NEXT_PUBLIC_DJANGO_BASE_URL=http://127.0.0.1:8000
```

## Current Focus

### Product Vision

Skinflow EMR v4 is a multi-tenant SaaS platform for aesthetic and dermatology clinics in Bangladesh, covering the complete patient journey from tablet-based self-registration through consultations, procedure sessions with face mapping and consumable tracking, to billing with entitlement-based session management. The platform includes full inventory/procurement with FIFO valuation, double-entry accounting with automated journal posting, and a premium Marketing App add-on featuring AI-powered social media query handling and conversational IVR. Three subscription tiers (Starter/Professional/Enterprise) provide feature gating, with sales-assisted onboarding and per-clinic tax configuration managed by SaaS admins.

### Critical Gaps (Must Resolve First)

These blockers prevent other features from being built correctly:

1. **RBAC Enforcement** — Role model exists but permissions not enforced. Backend needs middleware/decorators; frontend needs permission checks on UI elements. Blocks: all role-restricted features, approval workflows, audit compliance.

2. **File Upload & Storage Infrastructure** — Currently URL-based placeholders only. Need S3/cloud storage integration with image optimization pipeline. Blocks: patient photos, before/after capture, consent form signing, face mapping, document uploads.

3. **Multi-Tenancy Production Resolution** — Dev environment uses first org fallback. Production needs proper org resolution from authenticated user context. Blocks: safe multi-tenant deployment.

### Top 10 Features to Build Next

| Priority | Feature | Spec Reference | Why Now |
|----------|---------|----------------|---------|
| 1 | **RBAC Enforcement** | CLINIC_WORKFLOW_SPEC §11.2 | Blocker — enables all permission-based features |
| 2 | **File Upload & Photo Storage** | CLINIC_WORKFLOW_SPEC §6 | Blocker — enables photos, consent, face mapping |
| 3 | **Patient Check-in Mode** | CLINIC_WORKFLOW_SPEC §1.1 | Core workflow — 70% of patients are walk-ins |
| 4 | **Consent Forms & Digital Signature** | CLINIC_WORKFLOW_SPEC §7 | Required before any procedure can start |
| 5 | **Face Mapping for Injectables** | CLINIC_WORKFLOW_SPEC §5.3 | Critical for Botox/filler documentation |
| 6 | **Consumable Requisition Workflow** | CLINIC_WORKFLOW_SPEC §5.5 | Tracks consumables per session, cost accounting |
| 7 | **Accounting: Bank Feed Import & Reconciliation** | ACCOUNTING_SPEC §4.3-4.4 | Card/MFS settlement workflow, bank matching |
| 8 | **Print Templates (Prescription, Invoice)** | CLINIC_WORKFLOW_SPEC §3.5, §8.2 | High clinic need, required for patient handoff |
| 9 | **Online Appointment Booking** | CLINIC_WORKFLOW_SPEC §2.1 | Patient self-service, reduces front desk load |
| 10 | **SaaS Usage Limit Enforcement** | SAAS_SPEC §2.2 | Enables plan differentiation, prevents abuse |

### What's Already Built

Core EMR workflow is functional: patients, appointments, consultations, prescriptions, procedure sessions, basic billing with entitlements, inventory with PO/GRN, basic accounting (chart of accounts, automated journal posting, standard reports), and SaaS super admin portal. Camera capture with WebRTC (7 overlay types, multi-angle 5-shot sequence) is live on the session detail and patient pages. The app is deployed to production on Linode Singapore (Gunicorn + Nginx + Cloudflare). See `docs/STATUS.md` for detailed breakdown.

---

*See `docs/` for detailed documentation: ARCHITECTURE.md, SPEC.md, API.md, DATA_MODEL.md, STATUS.md, DECISIONS.md, CLINIC_WORKFLOW_SPEC.md, SAAS_SPEC.md, ACCOUNTING_SPEC.md*
