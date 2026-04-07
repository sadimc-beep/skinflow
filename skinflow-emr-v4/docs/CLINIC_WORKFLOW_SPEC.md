# Clinic Workflow Specification

> **Generated from:** Product Requirements Interview (April 2026)
> 
> **Legend:**
> - [BUILT] — Already exists in codebase
> - [TO BUILD] — New feature to implement
> - [NEEDS CLARIFICATION] — Requires further discussion

---

## 1. Patient Journey

### 1.1 Patient Registration

#### New Patient WITH Appointment
1. Patient arrives with partial info (name, phone from online/phone booking)
2. Slot already booked
3. Patient completes basic registration on tablet (dedicated check-in mode) [TO BUILD]
4. Staff completes profile with medical history, allergies, etc. [BUILT - partial]
5. Clinical intake (vitals) [BUILT]
6. Proceed to consultation/session per slot

#### New Patient WALK-IN
1. Patient registers on tablet (dedicated check-in mode) [TO BUILD]
2. Staff completes profile [BUILT - partial]
3. Staff books into available slot [BUILT]
4. Patient waits for slot
5. Intake [BUILT]
6. Consultation/session

#### Returning Patient WITH Appointment
1. Check in (confirm arrival) [TO BUILD]
2. Clinical intake (vitals) [BUILT]
3. Proceed to consultation/session per slot

#### Returning Patient WALK-IN
1. Staff books into available slot [BUILT]
2. Patient waits for slot
3. Intake [BUILT]
4. Consultation/session

### 1.2 Patient Registration Form

**User Story:** As a new patient, I want to fill my basic information on a tablet so I can complete registration quickly.

| Field Category | Entry By | Status |
|----------------|----------|--------|
| Basic info (name, phone, DOB, gender) | Patient on tablet | [TO BUILD] |
| Medical history | Staff interview | [BUILT] |
| Allergies | Staff interview | [BUILT] |
| Emergency contact | Staff interview | [BUILT] |
| Medical flags | Staff interview | [BUILT] |

**Patient Check-in Mode Requirements:** [TO BUILD]
- Dedicated simplified UI
- No access to clinical data
- Only patient's own registration form
- Works on tablet

---

## 2. Appointment & Scheduling

### 2.1 Booking Channels [BUILT - partial]

| Channel | Description | Status |
|---------|-------------|--------|
| Online self-service | Patient selects provider OR service first, then sees available slots | [TO BUILD] |
| Phone booking | Staff books on behalf of patient | [BUILT] |
| Walk-in | Staff books into available slot | [BUILT] |

**Online Booking Flow:** [TO BUILD]
1. Patient selects provider OR service
2. System shows available slots for that selection
3. Auto-confirm on booking

### 2.2 Slot Configuration

| Aspect | Configuration | Status |
|--------|---------------|--------|
| Consultation duration | Fixed 30 mins | [BUILT] |
| Session duration | Varies by procedure type | [BUILT] |
| Duration settings | Configurable by SaaS admin during clinic setup | [TO BUILD] |

### 2.3 Resource Dependencies [TO BUILD]

| Appointment Type | Required Resources |
|------------------|-------------------|
| Consultation | Specific consultant |
| Procedure | Consultant OR therapist (per procedure type) + procedure room + equipment |

**Availability Logic:** System checks ALL required resources are free before slot is available.

**Configuration:** Dependencies set by SaaS admin (not hardcoded).

### 2.4 Recurring Bookings

No automatic future bookings — multi-session packages handled via entitlements. [BUILT]

---

## 3. Consultation Flow

### 3.1 Consultation Screen [BUILT - partial]

**User Story:** As a doctor, I want to see patient history and record clinical findings in one view so I can provide efficient care.

| Component | Visible | Status |
|-----------|---------|--------|
| Consultation form (main view) | Yes | [BUILT] |
| Intake data (vitals) | Yes | [BUILT] |
| Visit history | Yes | [BUILT - partial] |
| Medical history | Yes | [BUILT] |
| Allergies | Yes | [BUILT] |

### 3.2 Documentation Style [BUILT - partial]

| Field Type | Description | Status |
|------------|-------------|--------|
| Structured fields | Dropdowns with predefined options | [BUILT] |
| Common text suggestions | Like saved replies (Meta Business Suite style) | [TO BUILD] |
| Free-text notes | Open text fields | [BUILT] |

### 3.3 Consultation Outcomes [BUILT - partial]

| Outcome | Status |
|---------|--------|
| Prescribe medications | [BUILT] |
| Order lab tests | [BUILT] |
| Prescribe procedures (with session count) | [BUILT] |
| Recommend skincare products | [BUILT] |
| Schedule follow-up consultation | [BUILT - partial] |

**What Clinic Sells:** Procedures and skincare products ONLY. Medications and lab tests are external.

### 3.4 Follow-up Consultations [TO BUILD - partial]

| Aspect | Requirement |
|--------|-------------|
| Fee | Generally free |
| Continuity | Linked to original consultation |
| Display | Past consultation + sessions performed |
| Chief complaint | Still required |
| Lab results | Front desk inputs results before follow-up |

### 3.5 Prescription Printout [TO BUILD]

Single document with all info:
- Chief complaint
- Diagnosis
- Medications
- Lab tests
- Procedures
- Products

Format: Flexible layout (no strict regulatory format).

### 3.6 Discounts [BUILT - partial]

| Discount Type | Applied By | Status |
|---------------|------------|--------|
| Consultant discount | Consultant (on procedures, within max limit) | [BUILT] |
| Marketing campaign | Auto-applied from campaign selection | [TO BUILD] |
| Membership discount | System | [TO BUILD] |
| Referral discount | System | [TO BUILD] |
| Manager override | Manager | [TO BUILD] |

---

## 4. Prescriptions

### 4.1 Medications [BUILT - partial]

**Database:** Global, maintained by SaaS admin [BUILT]

**Medication Entry Fields:**

| Field | Description | Status |
|-------|-------------|--------|
| Name | Search by generic OR brand (includes strength, e.g., "Napa 500mg") | [BUILT] |
| Dosage frequency | 1+0+1+0 (up to 4x daily) OR "every 8 hours", "once weekly", "as needed" | [TO BUILD - partial] |
| Duration | e.g., 7 days, 2 weeks, 1 month, ongoing | [BUILT] |
| Route | Oral, topical, injection, etc. (required) | [BUILT] |
| Recommendations | Before meal, after meal, with water, etc. | [BUILT - partial] |
| Quantity | Entered or auto-calculated | [TO BUILD] |
| Special instructions | Free text | [BUILT] |

**Prescription Templates:** Defined in clinic admin for common conditions [TO BUILD]

### 4.2 Lab Tests [BUILT]

**Database:** Global, maintained by SaaS admin

| Field | Description | Status |
|-------|-------------|--------|
| Test name | Selection from global catalog | [BUILT] |
| Notes | Free text | [BUILT] |

**Lab Result Entry:** Front desk inputs results before follow-up consultation [TO BUILD]
- Result fields defined by SaaS admin (global setting)

### 4.3 Procedures [BUILT]

**Database:** Clinic-specific, grouped by category

| Field | Description | Status |
|-------|-------------|--------|
| Procedure type | Includes body area (e.g., "Laser Hair Removal - Full Face") | [BUILT] |
| Number of sessions | Integer | [BUILT] |
| Price | From procedure definition | [BUILT] |
| Discount | Consultant can apply (within max limit) | [BUILT] |
| Interval between sessions | Set by consultant; common interval auto-suggested | [TO BUILD] |
| Special instructions | Free text | [BUILT] |

### 4.4 Products (Skincare) [BUILT - partial]

**Database:** Clinic-specific, pulled from store/inventory product list

| Field | Description | Status |
|-------|-------------|--------|
| Product name | From inventory | [BUILT] |
| Quantity | Integer | [BUILT] |
| Usage instructions | Free text | [TO BUILD] |

**Out of Stock:** Can still recommend with warning (no prevention) [TO BUILD]

---

## 5. Procedures & Treatment Sessions

### 5.1 Procedure Templates [TO BUILD]

**Defined by:** SaaS admin (globally)
**Based on:** Industry standards (Pabau, AestheticsNow, etc.)

| Parameter | Configurable |
|-----------|--------------|
| Who can perform | Consultant only, therapist only, either |
| Documentation fields | Procedure-specific |
| Post-procedure requirements | Observation time, immediate checkout, follow-up |
| Other parameters | Per industry standards |

### 5.2 Session Documentation [TO BUILD - partial]

| Aspect | Requirement | Status |
|--------|-------------|--------|
| Session history | Previous sessions visible with notes | [BUILT - partial] |
| Procedure-specific fields | From global template | [TO BUILD] |

### 5.3 Face Mapping (Botox, Fillers, etc.) [TO BUILD]

| Aspect | Requirement |
|--------|-------------|
| Base image | Face drawing template OR actual patient photo (from intake/registration) |
| Interaction | Consultant clicks/touches point on face |
| Auto-detection | System identifies face section/zone name |
| Data entry | Popup for procedure-specific input (dosage, units, etc.) |

### 5.4 Consent Forms [BUILT - partial]

| Aspect | Requirement | Status |
|--------|-------------|--------|
| Procedure-specific | Yes | [TO BUILD] |
| Timing | Must be accepted BEFORE session begins | [TO BUILD] |
| Signing | Digital signature on tablet | [TO BUILD] |
| Validity | Per session (no reuse) | [TO BUILD] |

### 5.5 Consumable Tracking [TO BUILD]

**Per Session Tracking:**
- For inventory deduction
- For cost tracking

**Requisition Flow:**
1. Therapist creates requisition from session screen
2. Consultant approves
3. Therapist picks up from store
4. Storekeeper issues and records

**General Requisitions:** (not linked to session)
- Created by therapist or front staff
- Approval matrix defined in clinic admin

**Inventory Deduction:** Immediate at issue; stays in WIP until session complete

**Cost Tracking:** On session completion, consumable cost added to session cost in background

**Billing:** Consumables bundled into procedure line item (NOT itemized on invoice)

---

## 6. Before & After Photos

### 6.1 Photo Capture [TO BUILD]

| When | Who | Status |
|------|-----|--------|
| Registration | Front desk | [TO BUILD] |
| Before session | Therapist | [TO BUILD] |
| After session | Therapist | [TO BUILD] |

**Capture Method:** Tablet camera directly in app
**Multiple Photos:** Supported per capture session

### 6.2 Photo Guidelines [TO BUILD]

Standard poses/angles provided (templates for consistent comparisons)

### 6.3 Photo Organization [TO BUILD]

Viewable by any category:
- Date
- Procedure type
- Body area

### 6.4 Photo Comparison [TO BUILD]

- Side-by-side comparison supported
- Select photos for comparison
- Generate progress reports

### 6.5 Photo Consent [TO BUILD]

| Consent Type | Tracked Separately |
|--------------|-------------------|
| Clinical use | Yes |
| Marketing use | Yes |

---

## 7. Consent & Forms

### 7.1 Consent Types [TO BUILD]

| Type | Status |
|------|--------|
| General treatment consent | [TO BUILD] |
| Procedure-specific consent | [TO BUILD] |
| Photo consent (clinical use) | [TO BUILD] |
| Photo consent (marketing use) | [TO BUILD] |
| Data privacy consent | Not required |

### 7.2 Signing Method [TO BUILD]

Digital signature on tablet

### 7.3 Form Management [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Creation | Clinic level (each clinic creates/customizes) |
| Procedure consent rules | Clinic decides which procedures require consent |
| Validity | Per session (patient signs fresh each time) |

---

## 8. Billing & Payments

### 8.1 Payment Timing [BUILT - partial]

| Item | When Paid | Status |
|------|-----------|--------|
| Consultation | Before consultation (always separate invoice) | [BUILT] |
| Sessions | Before session can start (creates entitlement) | [BUILT] |
| Products | Before collection from store | [BUILT] |

### 8.2 Invoicing [BUILT - partial]

| Rule | Behavior | Status |
|------|----------|--------|
| No payment without invoice | Enforced | [BUILT] |
| Consultation | Always invoiced separately first | [BUILT] |
| Sessions + Products | Can be combined into one invoice | [BUILT] |
| Adding items | New invoice if items added after previous invoice finalized/paid | [BUILT] |
| Invoice template | Select from global templates; clinic details auto-filled | [TO BUILD] |

### 8.3 Payment Methods [BUILT - partial]

| Aspect | Configuration | Status |
|--------|---------------|--------|
| Available methods | All forms available in Bangladesh | [BUILT - partial] |
| Activation | Per clinic in clinic admin | [TO BUILD] |
| Split payments | Supported across multiple methods | [BUILT] |

### 8.4 Patient Balance & Credit [TO BUILD - partial]

| Aspect | Behavior | Status |
|--------|----------|--------|
| Advance deposit | Patient can deposit into account (wallet) | [TO BUILD] |
| Credit sources | Refunds, loyalty point conversion | [TO BUILD] |
| Credit system | Clinic decides; approval configurable | [TO BUILD] |

### 8.5 Discounts [BUILT - partial]

| Type | Applied By | Status |
|------|------------|--------|
| Consultant discount | Consultant (within max limit) | [BUILT] |
| Campaign discount | Auto-applied from marketing app | [TO BUILD] |
| Membership discount | System | [TO BUILD] |
| Referral discount | System | [TO BUILD] |
| Manager override | Manager | [TO BUILD] |

### 8.6 Refunds & Waivers [TO BUILD]

| Aspect | Behavior |
|--------|----------|
| Unused entitlements | Clinic decides: credit OR refund |
| Consultation fee waiver | Consultant can waive; refunded or applied to another product |
| Free campaigns | Invoice generated but fee waived |

### 8.7 Invoice/Payment Edge Cases [BUILT - partial]

| Scenario | Behavior | Status |
|----------|----------|--------|
| Edit invoice after partial payment | Not allowed | [BUILT] |
| Cancel invoice after payment | Not allowed | [BUILT] |
| Split payment across multiple invoices | Allowed | [TO BUILD] |
| Book with outstanding balance | Allowed (staff notified) | [TO BUILD] |
| Start session with outstanding balance | Allowed if valid entitlement | [BUILT] |
| Credit limit | None | N/A |
| Pay later | Approval required | [TO BUILD] |

---

## 9. Packages & Entitlements

### 9.1 Package Types [TO BUILD]

All types supported (defined in marketing app):
- Session bundles (e.g., 6 sessions of Laser)
- Combo packages (procedures + products)
- Membership packages (subscription with benefits)

### 9.2 Package Configuration [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Pricing | Defined during package creation |
| Approval cycle | Required; workflow per clinic |
| Expiry | Can have expiry date or period |
| Partial payment | Not allowed (must be fully paid) |
| Item substitution | Not allowed |
| Product issuance | At purchase |

### 9.3 Entitlements [BUILT - partial]

| Aspect | Behavior | Status |
|--------|----------|--------|
| Purpose | Accounting for sessions paid vs completed | [BUILT] |
| Creation | Immediately upon payment | [BUILT] |
| Consumption | As each session is completed | [BUILT] |
| Transfer | Not allowed | [BUILT] |
| FIFO | Not required (can choose which to use) | [BUILT] |
| Partial use | Not allowed (full session or nothing) | [BUILT] |

### 9.4 Entitlement Lifecycle [BUILT - partial]

| State | When | Status |
|-------|------|--------|
| Created | Procedure/package fully paid | [BUILT] |
| Blocked | Session started | [TO BUILD] |
| Consumed | Session completed | [BUILT] |
| Restored | Scheduled session cancelled (before start) | [TO BUILD] |
| Restored with approval | Started session cancelled | [TO BUILD] |

### 9.5 Expired Entitlements [TO BUILD]

| Option | Requires |
|--------|----------|
| Automatic forfeiture | Configuration |
| Extension | Approval |
| Conversion to credit | Approval |

---

## 10. Inventory & Products

### 10.1 Item Types [BUILT - partial]

| Type | Tracked | Usage | Status |
|------|---------|-------|--------|
| Skincare / Retail products | Yes | Sold to customers only | [BUILT] |
| Consumables | Yes | Used in sessions only | [BUILT] |
| Medicines | No | Not stocked | N/A |
| Equipment | No | Fixed asset | [TO BUILD] |

### 10.2 Product Definition [BUILT - partial]

| Field | Status |
|-------|--------|
| Name | [BUILT] |
| SKU | [BUILT] |
| Brand | [TO BUILD] |
| Category | [BUILT] |
| Cost price | [BUILT] |
| Selling price | [BUILT] |
| Tax rate | [BUILT] |
| Unit of measure | [BUILT] |
| Batch/expiry tracking | [TO BUILD] |
| Variants | Separate products | [BUILT] |
| Retail vs Consumable | [BUILT - partial] |

**Valuation:** FIFO [TO BUILD]

**Creation:** No approval needed; data entry restricted to assigned role [TO BUILD]

### 10.3 Procedure Definition [BUILT - partial]

| Field | Status |
|-------|--------|
| Name (includes body area) | [BUILT] |
| Category | [BUILT] |
| Base price | [BUILT] |
| Duration | [BUILT] |
| Who can perform | [TO BUILD] |
| Required equipment | [TO BUILD] |
| Required room type | [TO BUILD] |
| Consent form required | [TO BUILD] |

**Pricing:** Fixed per procedure [BUILT]
**Creation:** Clinic or SaaS admin; no approval needed [BUILT]

### 10.4 Purchasing Workflow [TO BUILD]

| Step | Who |
|------|-----|
| Create PO | Storekeeper (or assigned role), based on stock levels |
| Approve PO | Assigned manager |
| Vendor selection | Approved vendors OR comparison (rules in clinic admin) |
| Receive goods (GRN) | Storekeeper (or assigned role) |
| Verification | Three-way match: PO vs GRN vs Vendor Invoice |

### 10.5 Vendor Management [BUILT - partial]

**Vendor List:** Clinic-specific (not global)

### 10.6 Stock Locations [BUILT - partial]

| Aspect | Configuration | Status |
|--------|---------------|--------|
| Multiple locations | Per branch (clinic creates) | [BUILT] |
| Transfers | Approval required | [TO BUILD] |
| Request workflows | General + from session page | [TO BUILD] |

### 10.7 Stock Management [BUILT - partial]

| Aspect | Behavior | Status |
|--------|----------|--------|
| Deduction | Automatic when sold or used | [BUILT - partial] |
| Low stock alerts | Required | [TO BUILD] |

---

## 11. Staff & Roles

### 11.1 Role Management [BUILT - partial]

| Aspect | Configuration | Status |
|--------|---------------|--------|
| Role creation | Per clinic (custom roles) | [BUILT] |
| Who creates | Clinic admin OR SaaS admin | [BUILT] |
| Permissions | Custom per role | [BUILT - partial] |
| Roles per user | One | [BUILT] |

### 11.2 Permissions [TO BUILD]

| Aspect | Scope |
|--------|-------|
| Module permissions | All apps and all functions |
| Special permissions | Max discount approval, refund authority, sensitive data access, void invoices, etc. |

### 11.3 User Management [BUILT - partial]

| Aspect | Configuration | Status |
|--------|---------------|--------|
| Account creation | Clinic admin or SaaS admin | [BUILT] |
| Password reset | Staff requests, admin performs | [TO BUILD] |
| 2FA | Not needed now | N/A |
| Deactivation | Supported | [BUILT] |
| Audit trail | Required | [TO BUILD] |

---

## 12. Branch Management

### 12.1 Data Sharing [BUILT - partial]

| Data Type | Shared/Isolated | Status |
|-----------|-----------------|--------|
| Patient records | Shared (complete history visible) | [BUILT] |
| Staff accounts | Isolated (one branch per account) | [BUILT] |
| Inventory/stock | Isolated (separate per branch) | [BUILT] |
| Pricing | Shared (same across branches) | [BUILT] |
| Tax rates | Global | [BUILT] |

### 12.2 Entitlements [TO BUILD]

**Cross-branch usage:** Configurable per clinic

### 12.3 Branch-Level Settings [TO BUILD - partial]

- Operating hours / working days
- Appointment slot configuration
- Available services / procedures
- Procedure rooms / equipment availability
- Payment methods accepted
- Stock locations
- Contact details, address
- Invoice numbering sequence

### 12.4 Reporting Access [TO BUILD]

**Multi-branch visibility:** Defined per user during user creation

---

## 13. Reporting & Analytics

### 13.1 Report Builder [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Who builds reports | SaaS admin only |
| Report creation | Fully custom builder with all data fields |
| Field selection | Named and tagged for easy understanding |
| Data sources | All areas (financial, clinical, inventory, patient, staff) |

### 13.2 Report Management [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Standard reports | Selected by SaaS admin during setup |
| Custom reports | Built by SaaS admin |
| Report requests | Manual to SaaS admin |
| Scheduling | Controlled by SaaS admin |

### 13.3 Output Options [TO BUILD]

- On-screen view
- PDF export
- Excel export
- Print
- Email

---

## 14. Patient Communication & Marketing App

### 14.1 Marketing App Overview [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Nature | Premium feature with own tiered subscription |
| Control | SaaS admin configures per clinic |

### 14.2 Communication Channels [TO BUILD]

| Channel | Integration |
|---------|-------------|
| WhatsApp | Required |
| SMS | Local provider |
| Social media | Meta, TikTok, Google Ads |

### 14.3 Automated Messaging [TO BUILD]

**Triggers:** Customizable by SaaS admin
- Appointments (booked, confirmed, reminder, cancelled)
- Sessions (reminder, completed)
- Payments (received, overdue)
- Birthday/anniversary
- Package expiry warning
- Post-treatment follow-up
- Re-engagement

### 14.4 CRM & Lead Management [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Lead sources | Social media platforms (Meta, TikTok, Google Ads) |
| Lead stages | Customized by SaaS admin per clinic |
| Stage progression | Automatic in background (clinic staff doesn't manage) |

### 14.5 AI-Powered Features [TO BUILD]

| Feature | Details |
|---------|---------|
| Social media query management | Automated responses; Bangla + English; in-house AI |
| Appointment booking | AI books directly from chat (FB Messenger, Instagram DM) |
| Conversational IVR | Natural language (not menu-based) |
| IVR capabilities | Book appointment, pricing, location/hours, consultant info, procedure info, campaign info, handover to human |
| Voice booking | AI books directly from voice call |

### 14.6 Conversion Tracking [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| Meta offline events | Automatic data transfer |
| Events tracked | Lead becomes patient, purchases, other conversions |

### 14.7 Membership & Loyalty Programs [TO BUILD]

| Program | Description |
|---------|-------------|
| Membership | Subscription-based (monthly benefits) |
| Loyalty | Points earned on spend, redeemed for discounts/products |
| Availability | Both can be active simultaneously |

---

## 15. Other Features

### 15.1 Device Strategy [TO BUILD]

| Location/Role | Device | App Type |
|---------------|--------|----------|
| Patient registration | Dedicated tablet | Customer-facing simplified UI |
| Front desk | Desktop with camera | Full functions |
| Therapist / Procedure room | Dedicated tablet | Sessions, photos, charting |
| Waiting room display | Dedicated screen | Queue/status |
| Manager approvals | Personal device | Native mobile app (minimal now) |

### 15.2 Patient Portal [TO BUILD]

| Feature | Included |
|---------|----------|
| View appointment history | Yes |
| Book new appointments | Yes |
| View consultation notes / prescriptions | Yes |
| View invoices / make payments | Yes |
| View entitlements / package balance | Yes |
| Update profile | Yes |
| View photos | No |

### 15.3 Referral Tracking [TO BUILD]

| Aspect | Tracked |
|--------|---------|
| Referral source | Patient name or external source |
| Referrer reward/commission | Yes |
| Referral reports | Yes |

### 15.4 Waiting Room Display [TO BUILD]

Queue / patient status display

### 15.5 POS Direct Sales [TO BUILD]

| Aspect | Configuration |
|--------|---------------|
| What can be sold | Products + procedures that don't require consultation |
| Procedure via POS | Creates entitlement, requires session scheduling |
| POS location | Front desk or separate counter (clinic decides) |
| Flow | Payment → Staff collects from store → Delivers to customer |

### 15.6 Built-in Modules

| Module | Status |
|--------|--------|
| Accounting | Built-in [BUILT] |
| HR system | Future add-on [TO BUILD] |

---

## Appendix: User Stories Summary

### Patient
- As a new patient, I want to fill my basic information on a tablet so registration is quick
- As a returning patient, I want to check in quickly and update only what's changed
- As a patient, I want to view my appointment history and book new appointments online
- As a patient, I want to see my remaining sessions and package balance
- As a patient, I want to pay for my visit using my preferred payment method

### Front Desk
- As front desk staff, I want to book walk-ins into available slots quickly
- As front desk staff, I want to see outstanding balances when a patient arrives
- As front desk staff, I want to collect payment and issue invoices efficiently
- As front desk staff, I want to input lab results before a follow-up consultation

### Consultant
- As a consultant, I want to see patient history at a glance during consultation
- As a consultant, I want to prescribe medications, procedures, and products efficiently
- As a consultant, I want to apply discounts within my authorized limit
- As a consultant, I want to waive consultation fees when appropriate

### Therapist
- As a therapist, I want to see previous session history before starting a new session
- As a therapist, I want to requisition consumables from the session screen
- As a therapist, I want to capture before/after photos with the tablet
- As a therapist, I want to document procedure-specific details (injection points, settings)

### Manager
- As a manager, I want to approve requisitions and refunds from my mobile device
- As a manager, I want to see reports across my assigned branches
- As a manager, I want to override discounts when needed

### Clinic Admin
- As a clinic admin, I want to configure roles and permissions for staff
- As a clinic admin, I want to set up procedures, products, and pricing
- As a clinic admin, I want to view billing history and subscription status
