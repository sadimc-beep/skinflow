# SaaS Platform Specification

> **Source:** Product requirements interview (April 2026). Covers subscription management, multi-tenancy, and platform operations.

---

## Table of Contents

1. [Subscription Plans & Pricing](#1-subscription-plans--pricing)
2. [Feature Gating & Usage Limits](#2-feature-gating--usage-limits)
3. [Tenant Onboarding & Trial](#3-tenant-onboarding--trial)
4. [Tenant Lifecycle Management](#4-tenant-lifecycle-management)
5. [Super Admin Dashboard & Controls](#5-super-admin-dashboard--controls)
6. [Payment Gateway & Invoicing](#6-payment-gateway--invoicing)
7. [SaaS Notifications & Alerts](#7-saas-notifications--alerts)
8. [SaaS Metrics & Reporting](#8-saas-metrics--reporting)
9. [User Stories](#9-user-stories)

---

## 1. Subscription Plans & Pricing

### 1.1 Plan Tiers

#### Starter Plan
- **Target:** Solo practitioners, small clinics (1-2 providers)
- **Inclusions:**
  - 1 branch
  - Up to 3 users
  - Core EMR features (patients, appointments, consultations, prescriptions)
  - Basic billing
  - 5 GB storage
- **Limitations:**
  - No inventory module
  - No accounting module
  - No procedure tracking
  - No Marketing App access

#### Professional Plan
- **Target:** Growing clinics (3-10 providers)
- **Inclusions:**
  - Up to 3 branches
  - Up to 15 users
  - Full EMR features
  - Full billing with packages
  - Inventory management
  - Basic accounting
  - Procedure tracking with entitlements
  - 25 GB storage
- **Limitations:**
  - No Marketing App
  - Limited report customization

#### Enterprise Plan
- **Target:** Multi-location chains, franchises
- **Inclusions:**
  - Unlimited branches
  - Unlimited users
  - All EMR features
  - Full accounting module
  - Advanced reporting
  - 100 GB storage
  - Priority support
  - Custom integrations available
- **Add-ons available:**
  - Marketing App
  - Additional storage blocks

### 1.2 Add-On Modules

| Add-On | Description | Availability |
|--------|-------------|--------------|
| Marketing App | CRM, campaigns, AI query management, loyalty programs | Professional+ |
| Additional Storage | 10 GB blocks | All plans |
| SMS Pack | Bulk SMS credits for notifications | All plans |
| API Access | Third-party integrations | Enterprise only |
| White-Label | Custom branding, domain | Enterprise only |

**[BUILT]** Plan model with features JSON field  
**[TO BUILD]** Add-on subscription model  
**[TO BUILD]** Storage block add-on tracking

### 1.3 Pricing Structure

- **Billing Frequency:** Monthly or Annual
- **Annual Discount:** 15-20% (configurable per plan)
- **Setup Fee:** One-time onboarding fee (waived for annual prepay)
- **Currency:** BDT primary, USD for international

**[BUILT]** Basic plan pricing fields  
**[TO BUILD]** Annual discount calculation  
**[TO BUILD]** Multi-currency support

---

## 2. Feature Gating & Usage Limits

### 2.1 Feature Access Control

#### Visibility Philosophy
- **Visible but locked:** Users can see features they don't have access to
- **Upgrade prompts:** Clicking locked features shows upgrade CTA with benefits
- **No hidden features:** All platform capabilities are discoverable

#### Feature Flags per Plan

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Patient Management | Yes | Yes | Yes |
| Appointments | Yes | Yes | Yes |
| Consultations | Yes | Yes | Yes |
| Prescriptions | Yes | Yes | Yes |
| Billing (Basic) | Yes | Yes | Yes |
| Packages & Plans | No | Yes | Yes |
| Procedure Sessions | No | Yes | Yes |
| Entitlements | No | Yes | Yes |
| Inventory | No | Yes | Yes |
| Procurement | No | Yes | Yes |
| Accounting | No | Basic | Full |
| Multi-Branch | No | Yes | Yes |
| Custom Reports | No | Limited | Full |
| Marketing App | No | Add-on | Add-on |
| API Access | No | No | Yes |
| White-Label | No | No | Add-on |

**[BUILT]** Basic feature flags in plan model  
**[TO BUILD]** Frontend feature gating with upgrade prompts  
**[TO BUILD]** Granular feature permission matrix

### 2.2 Usage Limits

#### Hard Limits (Enforced)

| Limit | Starter | Professional | Enterprise |
|-------|---------|--------------|------------|
| Branches | 1 | 3 | Unlimited |
| Users | 3 | 15 | Unlimited |
| Storage | 5 GB | 25 GB | 100 GB |
| Patients | 500 | 5,000 | Unlimited |
| Monthly Appointments | 200 | 2,000 | Unlimited |

#### Soft Limits (Warning Only)

- Approaching storage limit (80% threshold)
- Approaching patient limit (90% threshold)
- High API request rate (rate limiting, not hard block)

#### Limit Enforcement

- **At limit:** Operation blocked with clear message
- **Upgrade path:** Direct link to upgrade or add-on purchase
- **Grace period:** 7 days after hitting limit before hard block (configurable)

**[BUILT]** Basic subscription limits  
**[TO BUILD]** Real-time usage tracking  
**[TO BUILD]** Limit enforcement middleware  
**[TO BUILD]** Soft limit warning system

### 2.3 Storage Management

#### Storage Allocation
- **Photos:** Primary storage consumer (face mapping, before/after)
- **Documents:** Consent forms, uploads
- **Backups:** Not counted against tenant storage

#### Storage Optimization
- Automatic image compression (quality presets)
- Multiple resolutions stored (thumbnail, display, original)
- Archive tier for old photos (>2 years)
- Purge deleted items after 30 days

**[TO BUILD]** Storage usage tracking per tenant  
**[TO BUILD]** Image optimization pipeline  
**[TO BUILD]** Archive tier implementation

---

## 3. Tenant Onboarding & Trial

### 3.1 Onboarding Model

#### Sales-Assisted Onboarding
- **No self-service signup:** All tenants onboarded by sales team
- **Rationale:** Healthcare software requires proper setup, training
- **Process:**
  1. Sales contact/demo
  2. Contract signing
  3. Setup fee payment (or annual prepay)
  4. Collaborative onboarding session
  5. Go-live

#### Demo Environment
- **Shared demo instance:** Sales team uses single demo org
- **Reset capability:** Demo data can be reset between demos
- **No individual trial accounts:** Prevents abuse, ensures quality onboarding

**[TO BUILD]** Demo org with reset capability  
**[TO BUILD]** Onboarding workflow tracking

### 3.2 Tenant Setup Process

#### Phase 1: Account Creation (SaaS Admin)
1. Create organization record
2. Create subscription with selected plan
3. Create admin user credentials
4. Configure branch(es)
5. Send welcome email with credentials

#### Phase 2: Collaborative Configuration (with client)
1. Organization settings (name, logo, contact info)
2. Branch configuration (addresses, operating hours)
3. User accounts and roles
4. Provider profiles
5. Procedure catalog (from templates or custom)
6. Pricing configuration

#### Phase 3: Data Import (if applicable)
1. Patient data import (CSV template provided)
2. Product catalog import
3. Opening balances (accounting)

#### Phase 4: Training & Go-Live
1. Role-based training sessions
2. Pilot period (optional)
3. Go-live sign-off

**[BUILT]** Organization and subscription creation  
**[TO BUILD]** Onboarding checklist tracking  
**[TO BUILD]** Data import tools  
**[TO BUILD]** Onboarding workflow dashboard

### 3.3 Procedure Templates

#### SaaS-Provided Templates
- **Source:** Inspired by Pabau, AestheticsNow
- **Categories:** Injectables, Laser, Body, Skin, Wellness
- **Contents per template:**
  - Name, description, category
  - Typical duration
  - Required consumables list
  - Pre/post care instructions
  - Consent form requirements
  - Face mapping zones (for injectables)

#### Template Application
- Clinic imports templates as starting point
- Full customization allowed after import
- Pricing set by clinic (not in template)
- Can disable unused procedures

**[TO BUILD]** Procedure template library  
**[TO BUILD]** Template import functionality  
**[TO BUILD]** Template management UI for SaaS admin

---

## 4. Tenant Lifecycle Management

### 4.1 Plan Changes

#### Upgrades
- **Timing:** Instant activation
- **Billing:** Prorated for current period
- **Features:** Immediately available
- **Limits:** Immediately increased

#### Downgrades
- **Pre-requisite check:** Must be within new plan limits
  - Reduce users to new limit
  - Reduce branches to new limit
  - Reduce storage below new limit
- **Timing:** Effective at next billing cycle
- **Features:** Locked at cycle end
- **Data:** Preserved but inaccessible (for locked features)

**[BUILT]** Basic plan change logic  
**[TO BUILD]** Prorated billing calculation  
**[TO BUILD]** Downgrade eligibility check  
**[TO BUILD]** Feature lock on downgrade

### 4.2 Subscription States

| State | Description | Access |
|-------|-------------|--------|
| ACTIVE | Paid and current | Full access |
| TRIAL | Trial period (if applicable) | Full access |
| PAST_DUE | Payment failed, grace period | Full access |
| SUSPENDED | Grace period expired | Read-only |
| CANCELLED | Subscription ended | No access |
| CHURNED | Cancelled and data archived | No access |

#### Grace Period Policy
- **Duration:** 15 days after failed payment
- **Notifications:** Day 1, Day 7, Day 14
- **Suspension:** Day 16 - read-only access
- **Cancellation:** Day 30 - account locked

**[BUILT]** Subscription status field  
**[TO BUILD]** Automated status transitions  
**[TO BUILD]** Grace period handling  
**[TO BUILD]** Read-only mode enforcement

### 4.3 Cancellation & Data Retention

#### Cancellation Process
1. Clinic admin requests cancellation
2. SaaS admin reviews (optional exit interview)
3. Subscription marked for cancellation
4. Access continues until period end
5. Account locked at period end

#### Data Retention Policy
- **Active retention:** 1 year after cancellation
- **During retention:**
  - Data preserved in database
  - No access (account locked)
  - Reactivation possible with back-payment
- **After retention:**
  - Data archived/anonymized
  - Cannot be restored
  - Compliant with data protection laws

#### Reactivation
- Within 1 year: Full data restoration
- Back-payment required for gap period
- Same plan or choose new plan

**[TO BUILD]** Cancellation request workflow  
**[TO BUILD]** Data retention automation  
**[TO BUILD]** Reactivation process

---

## 5. Super Admin Dashboard & Controls

### 5.1 Dashboard Metrics

#### Overview Cards
- Total active tenants
- MRR (Monthly Recurring Revenue)
- New signups this month
- Churn this month
- Support tickets open

#### Charts
- Revenue trend (12 months)
- Tenant growth trend
- Churn rate trend
- Plan distribution pie chart
- Feature adoption rates

**[BUILT]** Basic dashboard structure  
**[TO BUILD]** Real-time metrics calculation  
**[TO BUILD]** Charts and visualizations

### 5.2 Tenant Management

#### Tenant List View
- Search by name, slug, admin email
- Filter by plan, status, signup date
- Sort by name, MRR, created date
- Quick actions: View, Impersonate, Suspend

#### Tenant Detail View
- Organization details
- Subscription history
- Usage statistics
- User list
- Support ticket history
- Audit log (tenant-specific)

**[BUILT]** Organization list in super admin  
**[TO BUILD]** Advanced search and filtering  
**[TO BUILD]** Usage statistics per tenant  
**[TO BUILD]** Tenant-specific audit log view

### 5.3 Super Admin Roles

| Role | Permissions |
|------|-------------|
| Super Admin | Full platform access, can create other admins |
| Support Agent | View tenants, impersonate, manage tickets |
| Finance Admin | View billing, invoices, refunds |
| Sales Admin | Create tenants, manage onboarding |
| Read-Only | Dashboard and reports only |

**[BUILT]** Basic super admin check  
**[TO BUILD]** Granular super admin roles  
**[TO BUILD]** Role-based super admin permissions

### 5.4 Impersonation

#### Purpose
- Support troubleshooting
- Training assistance
- Bug reproduction

#### Controls
- Must select specific user to impersonate
- Session logged with:
  - Who impersonated
  - Which user/org
  - Start/end time
  - Actions taken (audit trail)
- Visual indicator shown to impersonator
- Cannot impersonate other super admins

#### Restrictions During Impersonation
- Cannot change passwords
- Cannot delete users
- Cannot modify billing
- Cannot export patient data

**[BUILT]** Basic impersonation model  
**[TO BUILD]** Impersonation session logging  
**[TO BUILD]** Action restrictions during impersonation  
**[TO BUILD]** Impersonation audit trail

### 5.5 Platform Configuration

#### Global Settings
- Default currency
- Tax rates
- SMS gateway credentials
- Email gateway settings
- Storage provider settings
- Payment gateway settings

#### Feature Flags (Platform-Wide)
- Maintenance mode
- Feature rollout toggles
- A/B test configurations

**[BUILT]** Basic settings model  
**[TO BUILD]** Global configuration management  
**[TO BUILD]** Feature flag system

---

## 6. Payment Gateway & Invoicing

### 6.1 Payment Gateway Integration

#### Supported Gateways
- **Primary:** SSLCommerz (Bangladesh)
- **Secondary:** Stripe (International)
- **Manual:** Bank transfer, cheque

#### Gateway Selection
- Per-tenant configuration
- Default based on region
- Multiple gateways can be enabled

**[TO BUILD]** SSLCommerz integration  
**[TO BUILD]** Stripe integration  
**[TO BUILD]** Gateway abstraction layer

### 6.2 SaaS Invoice Generation

#### Automatic Invoices
- Generated on subscription creation
- Generated on renewal date
- Generated for add-on purchases
- Generated for plan upgrades (prorated)

#### Invoice Contents
- Organization details
- Plan details and period
- Add-ons and extras
- Taxes (if applicable)
- Total and balance due
- Payment instructions

#### Invoice States
| State | Description |
|-------|-------------|
| DRAFT | Being prepared |
| SENT | Delivered to tenant |
| PAID | Payment received |
| OVERDUE | Past due date |
| VOID | Cancelled/credited |

**[BUILT]** SaaS invoice model  
**[TO BUILD]** Automatic invoice generation  
**[TO BUILD]** Invoice PDF generation  
**[TO BUILD]** Invoice delivery (email)

### 6.3 Payment Processing

#### Auto-Pay
- Card on file charged automatically
- Retry logic: Day 1, Day 3, Day 7
- Notification on each failure
- Fallback to manual after retries

#### Manual Payment
- Bank transfer with reference
- Cheque (cleared before activation)
- Payment recorded by finance admin

#### Payment Reconciliation
- Match payments to invoices
- Handle partial payments
- Handle overpayments (credit to account)

**[TO BUILD]** Auto-pay implementation  
**[TO BUILD]** Payment retry logic  
**[TO BUILD]** Payment reconciliation

### 6.4 Refunds & Credits

#### Refund Scenarios
- Plan downgrade (prorated credit)
- Cancellation mid-cycle (no refund, service till end)
- Billing error (full/partial refund)
- Service credit (goodwill)

#### Credit Balance
- Applied automatically to next invoice
- Can be used for add-ons
- Visible in tenant billing portal

**[TO BUILD]** Refund processing  
**[TO BUILD]** Credit balance system  
**[TO BUILD]** Tenant billing portal

---

## 7. SaaS Notifications & Alerts

### 7.1 Notification Channels

| Channel | SaaS Admin | Clinic Admin |
|---------|------------|--------------|
| Email | Yes | Yes |
| In-App | Yes | Yes |
| Push (Mobile) | Yes | Yes |
| SMS | No | Optional |

### 7.2 SaaS Admin Notifications

#### Critical Alerts
- Payment failure (any tenant)
- Subscription cancelled
- Support ticket escalation
- System errors/outages
- Security incidents

#### Operational Alerts
- New tenant signup
- Plan upgrade/downgrade
- Approaching usage limits (any tenant)
- Scheduled maintenance reminders

**[TO BUILD]** SaaS admin notification system  
**[TO BUILD]** Alert configuration per admin

### 7.3 Clinic Admin Notifications

#### Billing Notifications
- Invoice generated
- Payment successful
- Payment failed
- Approaching usage limits
- Plan renewal reminder (7 days before)

#### System Notifications
- New feature announcements
- Scheduled maintenance
- System updates
- Security alerts

#### Operational Notifications
- Staff account created
- Role changes
- Settings modified

**[BUILT]** Basic announcement system  
**[TO BUILD]** Billing notifications  
**[TO BUILD]** Usage limit alerts  
**[TO BUILD]** In-app notification center

### 7.4 Announcement System

#### Announcement Types
- **Platform-wide:** All tenants (maintenance, new features)
- **Plan-specific:** Targeted by plan (e.g., Enterprise features)
- **Tenant-specific:** Individual tenant (support follow-up)

#### Announcement Display
- Banner in dashboard (dismissible)
- Notification center
- Email digest (configurable)

**[BUILT]** Announcements model and admin  
**[TO BUILD]** Targeted announcement delivery  
**[TO BUILD]** Announcement display in clinic UI

---

## 8. SaaS Metrics & Reporting

### 8.1 Revenue Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| MRR | Monthly Recurring Revenue | Sum of all active monthly subscription values |
| ARR | Annual Recurring Revenue | MRR x 12 |
| ARPU | Average Revenue Per User | MRR / Active Tenants |
| Expansion MRR | Revenue from upgrades/add-ons | This month upgrades - downgrades |
| Contraction MRR | Revenue lost to downgrades | Downgrade value this month |

### 8.2 Customer Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Tenants | All organizations | Count of non-churned orgs |
| Active Tenants | Currently paying | Count where status = ACTIVE |
| New Tenants | Signed up this period | Count created in period |
| Churned Tenants | Cancelled this period | Count churned in period |
| Churn Rate | Monthly churn | Churned / Starting count x 100 |
| Net Revenue Retention | Revenue kept from existing | (Starting MRR + Expansion - Contraction - Churn) / Starting MRR |

### 8.3 Lifetime Value Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| LTV | Customer Lifetime Value | ARPU / Churn Rate |
| CAC | Customer Acquisition Cost | Sales & Marketing Spend / New Customers |
| LTV:CAC Ratio | Efficiency ratio | LTV / CAC (target: >3) |
| Payback Period | Months to recover CAC | CAC / ARPU |

### 8.4 Operational Metrics

| Metric | Description |
|--------|-------------|
| Storage Utilization | % of allocated storage used (by tier) |
| Feature Adoption | % of tenants using each feature |
| API Usage | Requests per tenant (Enterprise) |
| Support Tickets | Open/resolved per tenant |
| Login Frequency | Daily/weekly active users |

**[TO BUILD]** Metrics calculation engine  
**[TO BUILD]** Metrics dashboard for super admin  
**[TO BUILD]** Historical metrics storage  
**[TO BUILD]** Metrics export/API

### 8.5 Reporting

#### Standard Reports
- Monthly revenue report
- Tenant growth report
- Churn analysis report
- Plan distribution report
- Usage report by tenant

#### Report Delivery
- On-demand generation
- Scheduled email delivery
- Export formats: PDF, Excel, CSV

**[TO BUILD]** Report generation engine  
**[TO BUILD]** Scheduled report delivery  
**[TO BUILD]** Report builder for custom reports

---

## 9. User Stories

### 9.1 SaaS Super Admin

#### Tenant Management
- As a Super Admin, I want to view all tenants in a searchable list so that I can quickly find any organization
- As a Super Admin, I want to see each tenant's subscription status, plan, and MRR so that I can understand their value
- As a Super Admin, I want to impersonate a tenant user so that I can troubleshoot their issues firsthand
- As a Super Admin, I want all impersonation sessions logged so that we maintain audit compliance

#### Subscription Management
- As a Super Admin, I want to create a new tenant subscription so that I can onboard new customers
- As a Super Admin, I want to upgrade/downgrade a tenant's plan so that I can adjust their subscription
- As a Super Admin, I want to apply credits to a tenant account so that I can handle billing adjustments
- As a Super Admin, I want to see a tenant's billing history so that I can resolve billing inquiries

#### Platform Operations
- As a Super Admin, I want to publish announcements to all tenants so that I can communicate platform updates
- As a Super Admin, I want to toggle feature flags so that I can control feature rollouts
- As a Super Admin, I want to put the platform in maintenance mode so that I can perform updates safely
- As a Super Admin, I want to configure global settings so that I can manage platform-wide configurations

#### Metrics & Reporting
- As a Super Admin, I want to see MRR and ARR on my dashboard so that I can track revenue health
- As a Super Admin, I want to see churn rate trends so that I can identify retention issues
- As a Super Admin, I want to generate revenue reports so that I can share with stakeholders
- As a Super Admin, I want to see feature adoption rates so that I can prioritize development

### 9.2 SaaS Support Agent

- As a Support Agent, I want to search for tenants by name or admin email so that I can find them quickly
- As a Support Agent, I want to view a tenant's configuration without changing it so that I can understand their setup
- As a Support Agent, I want to impersonate a clinic user so that I can reproduce their issues
- As a Support Agent, I want to see a tenant's recent activity so that I can understand their usage patterns

### 9.3 SaaS Finance Admin

- As a Finance Admin, I want to see all pending invoices so that I can follow up on collections
- As a Finance Admin, I want to record manual payments so that I can update invoice statuses
- As a Finance Admin, I want to process refunds so that I can handle billing corrections
- As a Finance Admin, I want to generate revenue reports so that I can prepare financial statements

### 9.4 SaaS Sales Admin

- As a Sales Admin, I want to create new tenant accounts so that I can onboard signed customers
- As a Sales Admin, I want to track onboarding progress so that I can ensure successful launches
- As a Sales Admin, I want to access the demo environment so that I can show prospects the platform
- As a Sales Admin, I want to see trial conversion rates so that I can optimize the sales process

### 9.5 Clinic Admin (Tenant)

#### Subscription Management
- As a Clinic Admin, I want to view my current plan details so that I know what features I have
- As a Clinic Admin, I want to see my usage against limits so that I can plan for growth
- As a Clinic Admin, I want to request a plan upgrade so that I can access more features
- As a Clinic Admin, I want to view my billing history so that I can track expenses

#### Account Management
- As a Clinic Admin, I want to update my organization details so that they're current
- As a Clinic Admin, I want to manage branches so that I can expand my business
- As a Clinic Admin, I want to add/remove users so that I can manage staff access
- As a Clinic Admin, I want to see platform announcements so that I stay informed

#### Support
- As a Clinic Admin, I want to submit support tickets so that I can get help with issues
- As a Clinic Admin, I want to access help documentation so that I can self-serve common questions
- As a Clinic Admin, I want to see scheduled maintenance so that I can plan around downtime

---

## Appendix A: Plan Comparison Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Limits** |  |  |  |
| Branches | 1 | 3 | Unlimited |
| Users | 3 | 15 | Unlimited |
| Patients | 500 | 5,000 | Unlimited |
| Storage | 5 GB | 25 GB | 100 GB |
| **Core EMR** |  |  |  |
| Patients | Yes | Yes | Yes |
| Appointments | Yes | Yes | Yes |
| Consultations | Yes | Yes | Yes |
| Prescriptions | Yes | Yes | Yes |
| Clinical Photos | Yes | Yes | Yes |
| **Advanced Clinical** |  |  |  |
| Procedure Sessions | No | Yes | Yes |
| Entitlements | No | Yes | Yes |
| Treatment Plans | No | Yes | Yes |
| Face Mapping | No | Yes | Yes |
| **Billing** |  |  |  |
| Basic Invoicing | Yes | Yes | Yes |
| Packages & Plans | No | Yes | Yes |
| Split Payments | Yes | Yes | Yes |
| Wallet/Credit | No | Yes | Yes |
| **Inventory** |  |  |  |
| Product Catalog | No | Yes | Yes |
| Stock Management | No | Yes | Yes |
| Procurement | No | Yes | Yes |
| **Accounting** |  |  |  |
| Chart of Accounts | No | Basic | Full |
| Journal Entries | No | Auto only | Full |
| Bank Reconciliation | No | No | Yes |
| Financial Reports | No | Basic | Full |
| **Platform** |  |  |  |
| Multi-Branch | No | Yes | Yes |
| Custom Roles | Basic | Yes | Yes |
| Custom Reports | No | Limited | Full |
| API Access | No | No | Yes |
| **Add-Ons** |  |  |  |
| Marketing App | No | Available | Available |
| Extra Storage | Available | Available | Available |
| White-Label | No | No | Available |

---

## Appendix B: Status Legend

- **[BUILT]** — Feature exists in current codebase
- **[TO BUILD]** — Feature not yet implemented
- **[NEEDS CLARIFICATION]** — Requirements need further definition

---

## Appendix C: Integration Points

### External Services (TO BUILD)

| Service | Purpose | Priority |
|---------|---------|----------|
| SSLCommerz | Payment gateway (BD) | High |
| Stripe | Payment gateway (Intl) | Medium |
| SendGrid/SES | Transactional email | High |
| Twilio/Local SMS | SMS notifications | Medium |
| AWS S3 | File/photo storage | High |
| Firebase | Push notifications | Medium |

### Internal Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    SaaS Platform Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Subscription│  │   Billing   │  │   Metrics   │          │
│  │  Management │  │  & Invoicing│  │  & Reports  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Tenant Application Layer                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   EMR    │ │  Billing │ │ Inventory│ │Accounting│       │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

*Last updated: April 2026*
