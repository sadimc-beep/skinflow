# Accounting Module Specification

> **Source:** Product requirements interview (April 2026). Covers double-entry accounting, financial reporting, and compliance.

---

## Table of Contents

1. [Chart of Accounts](#1-chart-of-accounts)
2. [Journal Entries & Transactions](#2-journal-entries--transactions)
3. [Fiscal Periods & Closing](#3-fiscal-periods--closing)
4. [Bank & Cash Management](#4-bank--cash-management)
5. [Accounts Payable](#5-accounts-payable)
6. [Accounts Receivable](#6-accounts-receivable)
7. [Financial Reports](#7-financial-reports)
8. [Tax Handling](#8-tax-handling)
9. [Automated Journal Entries](#9-automated-journal-entries)
10. [Audit & Compliance](#10-audit--compliance)
11. [User Stories](#11-user-stories)

---

## 1. Chart of Accounts

### 1.1 Account Types & Sub-Types

#### Primary Types
| Type | Description |
|------|-------------|
| ASSET | Resources owned by the clinic |
| LIABILITY | Obligations owed to others |
| EQUITY | Owner's stake in the business |
| REVENUE | Income from services and products |
| EXPENSE | Costs incurred in operations |

#### Sub-Types (Granular Classification)

**Assets:**
| Sub-Type | Examples |
|----------|----------|
| CURRENT_ASSET | Cash, Accounts Receivable, Inventory |
| FIXED_ASSET | Equipment, Furniture, Leasehold Improvements |
| OTHER_ASSET | Deposits, Prepaid Expenses |

**Liabilities:**
| Sub-Type | Examples |
|----------|----------|
| CURRENT_LIABILITY | Accounts Payable, Accrued Expenses, Tax Payable |
| LONG_TERM_LIABILITY | Loans, Lease Obligations |

**Equity:**
| Sub-Type | Examples |
|----------|----------|
| OWNER_EQUITY | Capital, Owner's Draw |
| RETAINED_EARNINGS | Accumulated profits |

**Revenue:**
| Sub-Type | Examples |
|----------|----------|
| SERVICE_REVENUE | Consultation fees, Procedure fees |
| PRODUCT_REVENUE | Product sales |
| OTHER_REVENUE | Discounts received, Interest income |

**Expenses:**
| Sub-Type | Examples |
|----------|----------|
| COGS | Cost of Goods Sold (products, consumables) |
| OPERATING_EXPENSE | Rent, Utilities, Salaries |
| ADMINISTRATIVE_EXPENSE | Office supplies, Professional fees |
| OTHER_EXPENSE | Bank charges, Depreciation |

**[BUILT]** Basic 5-type classification  
**[TO BUILD]** Granular sub-type classification

### 1.2 Hierarchical Structure

- Accounts support **parent/child relationships** for grouping
- Multiple levels of nesting allowed (e.g., Assets → Current Assets → Cash → Petty Cash)
- Parent accounts aggregate balances from children
- Reports can show collapsed (parents only) or expanded (all levels) view

**Structure Example:**
```
1000 - Assets (Parent)
├── 1100 - Current Assets (Parent)
│   ├── 1110 - Cash (Parent)
│   │   ├── 1111 - Main Bank Account
│   │   ├── 1112 - Petty Cash - Branch A
│   │   └── 1113 - Petty Cash - Branch B
│   ├── 1120 - Accounts Receivable
│   └── 1130 - Inventory
└── 1200 - Fixed Assets (Parent)
    ├── 1210 - Equipment
    └── 1220 - Furniture
```

**[BUILT]** Parent FK on Account model  
**[TO BUILD]** Multi-level hierarchy support  
**[TO BUILD]** Balance aggregation for parent accounts  
**[TO BUILD]** Hierarchical display in UI

### 1.3 Account Management

#### Access Control
- Account creation/modification controlled by roles
- Configurable at SaaS Admin level or Clinic Admin level
- Permissions: Create, Edit, Deactivate, Delete

#### Restrictions
| Restriction | Behavior |
|-------------|----------|
| Has transactions | Cannot delete, can only deactivate |
| Is system account | Cannot delete or change type |
| Is parent account | Cannot delete if has children |
| Has sub-accounts | Must reassign children before delete |

#### Audit Trail
- All account changes logged:
  - Created by, created at
  - Modified by, modified at, previous values
  - Deactivated by, deactivated at, reason
- Full history viewable in audit log

**[BUILT]** Basic CRUD with system account protection  
**[TO BUILD]** Full restriction enforcement  
**[TO BUILD]** Audit trail on account changes

---

## 2. Journal Entries & Transactions

### 2.1 Entry Types

| Type | Source | Approval |
|------|--------|----------|
| AUTOMATIC | System-generated from billing/inventory | Auto-posted |
| MANUAL | User-created | Requires approval (role-based) |
| ADJUSTMENT | Corrections, write-offs | Requires approval |
| CLOSING | Year-end closing entries | Admin only |

### 2.2 Manual Journal Entries

#### Creation Workflow
1. User creates entry with date, description, lines
2. Entry saved as DRAFT
3. Approver reviews and posts (or rejects)
4. Posted entries update account balances

#### Entry Structure
```
Journal Entry:
- Date
- Reference Number (auto or manual)
- Description
- Source (manual, system reference)
- Status (DRAFT, PENDING_APPROVAL, POSTED, REJECTED, CANCELLED)
- Lines:
  - Account
  - Description (line-level)
  - Debit amount
  - Credit amount
```

#### Validation Rules
- Total debits must equal total credits
- At least 2 lines required
- Date cannot be in locked period (unless admin override)
- All accounts must be active
- Amounts must be positive

**[BUILT]** Basic journal entry model and creation  
**[TO BUILD]** PENDING_APPROVAL status and workflow  
**[TO BUILD]** Role-based approval routing

### 2.3 Reversal & Deletion

#### Reversal
- Creates offsetting entry with opposite debits/credits
- Links reversal to original entry
- Both entries remain in ledger (audit trail)
- Requires approval (role-based)
- Original entry marked as "Reversed"

#### Deletion (Void)
- Only allowed for DRAFT entries without approval
- Posted entries cannot be deleted, only reversed
- Requires approval for any deletion
- Audit log captures deletion with reason

**[BUILT]** Basic reversal link on model  
**[TO BUILD]** Reversal workflow with approval  
**[TO BUILD]** Deletion restrictions and approval

---

## 3. Fiscal Periods & Closing

### 3.1 Period Management

#### Period Structure
- Fiscal year with configurable start month
- Monthly periods within fiscal year
- Each period has status: OPEN, CLOSED

#### Period Locking
| Lock Type | Behavior |
|-----------|----------|
| Soft Lock | N/A - Not implemented per requirements |
| Hard Lock | All transactions blocked for period |
| Admin Override | Only designated admin can unlock |

**Lock Enforcement:**
- Journal entries in locked period: BLOCKED
- Invoice creation with date in locked period: BLOCKED
- Payment recording in locked period: BLOCKED
- Applies globally across all modules

**[BUILT]** closed_books_date field on AccountingSettings  
**[TO BUILD]** Period model with monthly tracking  
**[TO BUILD]** Hard lock enforcement across all modules  
**[TO BUILD]** Admin override workflow

### 3.2 Year-End Closing

#### Closing Process
1. Ensure all transactions posted for fiscal year
2. Run closing wizard:
   - Calculate net income (Revenue - Expenses)
   - Create closing entry: Debit all Revenue, Credit all Expenses
   - Transfer net income to Retained Earnings
3. Lock all periods for closed year
4. Create opening balances for new year (Balance Sheet accounts)

#### Closing Entry Example
```
Closing Entry for FY 2025:
  DR  Service Revenue         500,000
  DR  Product Revenue         100,000
  CR  Salaries Expense                 300,000
  CR  Rent Expense                     100,000
  CR  Supplies Expense                  50,000
  CR  Retained Earnings                150,000  (Net Income)
```

**[TO BUILD]** Year-end closing wizard  
**[TO BUILD]** Automated closing entry generation  
**[TO BUILD]** Opening balance creation for new year

### 3.3 Previous Date Restrictions

- **Global setting**: Block backdated transactions
- When enabled:
  - Invoices cannot be created with past dates
  - Payments cannot be recorded with past dates
  - Journal entries cannot be posted to past dates
- Exception: Admin override with reason logged

**[TO BUILD]** Global backdating restriction setting  
**[TO BUILD]** Enforcement in billing and accounting modules

---

## 4. Bank & Cash Management

### 4.1 Account Structure

#### Cash Drawers (Per Branch)
- Each branch has dedicated cash drawer account
- Used for POS transactions
- Linked to branch in system

#### Bank Accounts (Global)
- Clinic-wide bank accounts
- Not branch-specific
- Used for settlements, vendor payments

#### Holding Accounts
- Credit Card Holding: Holds CC payments until settled
- MFS Holding: Holds bKash/Nagad until settled
- Check Holding: Holds checks until cleared

**[BUILT]** BankAccount model with types  
**[TO BUILD]** Per-branch cash drawer linking  
**[TO BUILD]** Holding account workflow

### 4.2 Card/MFS Settlement Workflow

#### Payment Collection
1. Patient pays via Card/bKash/Nagad
2. Payment recorded:
   - DR Holding Account (CC/MFS)
   - CR Accounts Receivable

#### Settlement to Bank
1. Payment processor settles to bank (daily/weekly)
2. Bank feed imported or manual entry
3. Settlement recorded:
   - DR Bank Account (net amount)
   - DR Merchant Fees Expense (fee amount)
   - CR Holding Account (gross amount)

#### Reconciliation
- Match holding account balance to processor statement
- Clear individual transactions as they settle
- Flag discrepancies for review

**[BUILT]** Settlement service method (settle_credit_card_batch)  
**[TO BUILD]** Settlement UI workflow  
**[TO BUILD]** Holding account reconciliation

### 4.3 Bank Feed Import

#### Supported Formats
- OFX (Open Financial Exchange)
- CSV (configurable column mapping)

#### Import Workflow
1. Upload bank statement file
2. System parses transactions
3. Auto-match to existing entries where possible
4. Manual review of unmatched items
5. Create journal entries for new transactions
6. Mark matched items as reconciled

**[TO BUILD]** Bank feed file parser (OFX, CSV)  
**[TO BUILD]** Auto-matching algorithm  
**[TO BUILD]** Import UI with review screen

### 4.4 Bank Reconciliation

#### Reconciliation Process
1. Select bank account and statement date
2. Enter statement ending balance
3. System shows:
   - Book balance
   - Outstanding deposits (in system, not on statement)
   - Outstanding payments (in system, not on statement)
   - Unrecorded transactions (on statement, not in system)
4. Check off cleared items
5. Adjusted book balance should match statement balance
6. Save reconciliation

**[BUILT]** BankReconciliation model  
**[TO BUILD]** Reconciliation wizard UI  
**[TO BUILD]** Outstanding item tracking

---

## 5. Accounts Payable

### 5.1 Vendor Bill Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Purchase   │───▶│    GRN      │───▶│   Vendor    │
│    Order    │    │  (Receive)  │    │   Invoice   │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
                   ┌─────────────┐          │
                   │   Schedule  │◀─────────┘
                   │   Payment   │
                   └─────────────┘
                          │
                   ┌─────────────┐
                   │     Pay     │
                   └─────────────┘
```

#### Statuses
| Status | Description |
|--------|-------------|
| DRAFT | Bill created, not approved |
| PENDING_APPROVAL | Awaiting match/approval |
| APPROVED | Matched to PO/GRN, ready for payment |
| PARTIALLY_PAID | Some payment made |
| PAID | Fully paid |
| CANCELLED | Voided |

### 5.2 Three-Way Matching

Before approval, system validates:
1. **PO Match**: Bill quantities/prices match PO
2. **GRN Match**: Bill quantities match received quantities
3. **Price Variance**: Flag if unit price differs from PO

Discrepancies require manual review and approval.

**[BUILT]** VendorBill model linked to GRN  
**[TO BUILD]** Three-way matching validation  
**[TO BUILD]** Variance flagging and approval

### 5.3 Payment Scheduling

#### Due Date Tracking
- Each bill has due date
- AP aging based on due date
- Dashboard shows upcoming payments

#### Payment Terms (No Discounts)
- Net 15, Net 30, Net 60, etc.
- Due date calculated from bill date
- No early payment discount configuration

**[TO BUILD]** Payment terms on vendor/bill  
**[TO BUILD]** Due date calculation  
**[TO BUILD]** AP aging dashboard

### 5.4 Partial Payments

- Bills can be paid in multiple installments
- Each payment linked to bill
- Remaining balance tracked
- Status updates: PARTIALLY_PAID → PAID

**[TO BUILD]** Partial payment recording  
**[TO BUILD]** Balance tracking per bill

### 5.5 Recurring Bills

#### Template Structure
```
Recurring Bill Template:
- Vendor
- Description
- Amount
- Account allocations (lines)
- Frequency (Monthly, Quarterly, Annually)
- Start date
- End date (optional)
- Next generation date
- Auto-approve (yes/no)
```

#### Generation Workflow
1. Scheduled job checks for due recurring bills
2. Creates new bill from template
3. If auto-approve: posts immediately
4. If not: creates as DRAFT for review
5. Updates next generation date

**[TO BUILD]** RecurringBillTemplate model  
**[TO BUILD]** Scheduled bill generation  
**[TO BUILD]** Auto-approve option

---

## 6. Accounts Receivable

### 6.1 Patient Balance Tracking

- Balances tracked via Invoice model (existing)
- Outstanding = Total - Paid
- Balance aggregated per patient

**[BUILT]** Invoice balance tracking

### 6.2 AR Aging Report

#### Aging Buckets
| Bucket | Days Past Due |
|--------|---------------|
| Current | Not yet due |
| 1-30 | 1-30 days overdue |
| 31-60 | 31-60 days overdue |
| 61-90 | 61-90 days overdue |
| 90+ | Over 90 days overdue |

#### Report Contents
- Patient name
- Invoice details
- Amount in each bucket
- Total outstanding
- Subtotals by bucket
- Grand total

**[TO BUILD]** AR aging calculation  
**[TO BUILD]** AR aging report UI

### 6.3 Outstanding Balance Warning

When booking appointment for patient with outstanding balance:
- System shows warning banner
- Displays total amount owed
- Lists overdue invoices
- Does NOT block booking (warning only)

**[TO BUILD]** Outstanding balance check on booking  
**[TO BUILD]** Warning UI component

### 6.4 Write-Offs

#### Write-Off Workflow
1. Select invoice(s) or specific amount
2. Enter reason for write-off
3. Submit for approval
4. Approver reviews and approves/rejects
5. On approval:
   - Journal entry created:
     - DR Bad Debt Expense
     - CR Accounts Receivable
   - Invoice marked as written off

#### Approval Control
- Write-off requires role permission
- Typically Clinic Owner or Admin
- Configurable per role

**[TO BUILD]** Write-off request model  
**[TO BUILD]** Write-off approval workflow  
**[TO BUILD]** Write-off journal entry automation

---

## 7. Financial Reports

### 7.1 Standard Reports

#### Trial Balance
- All accounts with debit/credit totals
- As of selected date
- Totals must balance

#### Income Statement (P&L)
- Revenue accounts with balances
- Expense accounts with balances
- Net Income calculation
- For selected date range

#### Balance Sheet
- Assets, Liabilities, Equity
- As of selected date
- Assets = Liabilities + Equity

#### General Ledger
- All transactions for selected account
- Running balance
- Date range filter

#### Cash Flow Statement
- Operating activities
- Investing activities
- Financing activities
- Net change in cash

**[BUILT]** Trial Balance, Income Statement, Balance Sheet, General Ledger  
**[TO BUILD]** Cash Flow Statement

### 7.2 Additional Reports

| Report | Description |
|--------|-------------|
| AR Aging | Patient receivables by age bucket |
| AP Aging | Vendor payables by age bucket |
| Bank Reconciliation | Reconciliation status by account |
| Journal Entry Register | All entries for period |
| Account Activity | Detailed transactions per account |

**[TO BUILD]** AR Aging report  
**[TO BUILD]** AP Aging report  
**[TO BUILD]** Additional report types

### 7.3 Report Configuration (SaaS Admin)

SaaS Admin defines:
- Which reports are available per plan
- Default report templates
- Custom report builder access
- Scheduled report options

**[TO BUILD]** Report configuration in SaaS admin  
**[TO BUILD]** Plan-based report access

### 7.4 Filtering & Parameters

All reports support:
- **Date Range**: Start date, end date, or as-of date
- **Branch Filter**: All or specific branch
- **Account Filter**: Specific accounts or types
- **Comparison**: Prior period, prior year

**[BUILT]** Basic date filtering  
**[TO BUILD]** Branch filtering  
**[TO BUILD]** Comparison periods

### 7.5 Export & Scheduling

#### Export Formats
- PDF (formatted for printing)
- Excel (data with formulas preserved)

#### Export Access
- Controlled by role permissions
- Some roles may view but not export

#### Scheduled Reports
1. SaaS Admin enables scheduling for report types
2. Clinic Admin configures schedules:
   - Report type
   - Frequency (daily, weekly, monthly)
   - Recipients (email)
   - Parameters (date range relative to run date)
3. System generates and emails on schedule

**[TO BUILD]** PDF export  
**[TO BUILD]** Excel export  
**[TO BUILD]** Role-based export permissions  
**[TO BUILD]** Report scheduling system

---

## 8. Tax Handling

### 8.1 Tax Configuration

#### SaaS Admin Setup (Per Clinic)
- Tax name (e.g., VAT, GST)
- Tax rate(s)
- Tax accounts (output tax liability, input tax asset)
- Applicable to services, products, or both

#### Tax Settings
```
Tax Configuration:
- Name: VAT
- Rate: 15%
- Output Account: 2100 - VAT Payable
- Input Account: 1140 - VAT Receivable
- Apply to: Services, Products
```

**[TO BUILD]** Tax configuration model  
**[TO BUILD]** SaaS admin tax setup UI

### 8.2 Output Tax (Collected)

When invoice is created:
- Tax calculated on taxable items
- Tax amount added to invoice total
- Journal entry includes:
  - DR Accounts Receivable (total including tax)
  - CR Revenue (net amount)
  - CR VAT Payable (tax amount)

**[TO BUILD]** Tax calculation on invoices  
**[TO BUILD]** Tax line on invoice model  
**[TO BUILD]** Tax posting in journal entry

### 8.3 Input Tax (Paid)

When vendor bill is recorded:
- Tax amount identified on bill
- Journal entry includes:
  - DR Expense/Inventory (net amount)
  - DR VAT Receivable (tax amount)
  - CR Accounts Payable (total including tax)

**[TO BUILD]** Tax tracking on vendor bills  
**[TO BUILD]** Input tax journal posting

### 8.4 Tax Reporting

- Output tax collected (period)
- Input tax paid (period)
- Net tax payable/refundable
- Detail by transaction

**[TO BUILD]** Tax summary report  
**[TO BUILD]** Tax detail report

---

## 9. Automated Journal Entries

### 9.1 Existing Automations

| Event | Journal Entry |
|-------|---------------|
| Invoice Created | DR A/R, CR Revenue |
| Payment Received | DR Cash/Holding, CR A/R |
| GRN Confirmed | DR Inventory, CR A/P |
| Vendor Bill Paid | DR A/P, CR Cash/Bank |
| CC Settlement | DR Bank, DR Fees, CR CC Holding |
| Check Cleared | DR Bank, CR Check Holding |

**[BUILT]** All above automations in AccountingService

### 9.2 New Automation: Inventory Consumption

When procedure session consumes inventory:
- Triggered when session completed
- For each consumable used:
  - DR Cost of Goods Sold (COGS)
  - CR Inventory Asset
  - Amount = unit cost × quantity consumed

**[TO BUILD]** Consumption journal entry trigger  
**[TO BUILD]** COGS posting service method

### 9.3 New Automation: Write-Off

When write-off approved:
- DR Bad Debt Expense
- CR Accounts Receivable

**[TO BUILD]** Write-off journal entry automation

---

## 10. Audit & Compliance

### 10.1 Audit Trail

#### Tracked Actions
| Entity | Actions Tracked |
|--------|-----------------|
| Account | Create, Update, Deactivate, Delete attempt |
| Journal Entry | Create, Submit, Approve, Reject, Post, Reverse |
| Vendor Bill | Create, Update, Approve, Pay, Cancel |
| Settings | Any change to accounting settings |
| Period | Lock, Unlock, Close |

#### Log Entry Structure
```
Audit Log Entry:
- Timestamp
- User
- Action (CREATE, UPDATE, DELETE, etc.)
- Entity type
- Entity ID
- Previous values (JSON)
- New values (JSON)
- IP address
- Reason (if required)
```

**[BUILT]** Basic audit log model (in SaaS module)  
**[TO BUILD]** Accounting-specific audit logging  
**[TO BUILD]** Previous/new value capture

### 10.2 Audit Log Viewer

UI for viewing audit trail:
- Filter by entity type
- Filter by user
- Filter by date range
- Filter by action type
- Search by entity ID or description
- Export to CSV

**[TO BUILD]** Audit log viewer UI in accounting module

### 10.3 Data Export for Auditors

#### Export Options
| Export | Contents |
|--------|----------|
| Full Journal Dump | All journal entries for period with lines |
| Trial Balance | As of any historical date |
| Account History | All transactions for specific account |
| Chart of Accounts | Full account list with hierarchy |

#### Export Format
- CSV with all fields
- Includes audit metadata (created by, posted at)

**[TO BUILD]** Auditor export functionality  
**[TO BUILD]** Historical trial balance (point-in-time)

---

## 11. User Stories

### 11.1 Clinic Accountant

#### Daily Operations
- As an Accountant, I want to view today's automatically posted entries so I can verify billing transactions
- As an Accountant, I want to create manual journal entries for adjustments so I can record transactions not captured automatically
- As an Accountant, I want to record bank deposits so I can match cash/card collections to bank statements

#### Reconciliation
- As an Accountant, I want to import bank statements so I can reconcile accounts efficiently
- As an Accountant, I want to match transactions to bank entries so I can identify discrepancies
- As an Accountant, I want to record CC/MFS settlements so I can clear holding accounts when funds arrive

#### Reporting
- As an Accountant, I want to generate trial balance so I can verify books are balanced
- As an Accountant, I want to run P&L report so I can see revenue and expenses for the period
- As an Accountant, I want to export reports to Excel so I can perform additional analysis

### 11.2 Clinic Finance Manager

#### Payables
- As a Finance Manager, I want to review pending vendor bills so I can approve them for payment
- As a Finance Manager, I want to see AP aging so I can prioritize vendor payments
- As a Finance Manager, I want to schedule payments so I can manage cash flow

#### Receivables
- As a Finance Manager, I want to see AR aging so I can follow up on overdue accounts
- As a Finance Manager, I want to approve write-off requests so I can clear uncollectible balances
- As a Finance Manager, I want to see outstanding balance alerts so I can address collection issues

#### Period Management
- As a Finance Manager, I want to close monthly periods so I can prevent changes to finalized data
- As a Finance Manager, I want to run month-end reports so I can review financial performance

### 11.3 Clinic Owner/Admin

#### Oversight
- As a Clinic Owner, I want to see financial dashboard so I can monitor business health
- As a Clinic Owner, I want to view balance sheet so I can understand assets and liabilities
- As a Clinic Owner, I want scheduled P&L reports emailed so I can stay informed without logging in

#### Year-End
- As a Clinic Owner, I want to run year-end closing so I can finalize the fiscal year
- As a Clinic Owner, I want to export data for auditors so I can comply with audit requests

#### Control
- As a Clinic Owner, I want to approve high-value adjustments so I can maintain financial control
- As a Clinic Owner, I want to view audit log so I can see who made changes

### 11.4 SaaS Admin

#### Configuration
- As a SaaS Admin, I want to configure tax settings per clinic so I can support regional requirements
- As a SaaS Admin, I want to define available reports per plan so I can differentiate plan features
- As a SaaS Admin, I want to seed chart of accounts templates so I can speed up clinic onboarding

---

## Appendix A: Account Code Structure

Recommended account numbering:

| Range | Type |
|-------|------|
| 1000-1999 | Assets |
| 2000-2999 | Liabilities |
| 3000-3999 | Equity |
| 4000-4999 | Revenue |
| 5000-5999 | Cost of Goods Sold |
| 6000-6999 | Operating Expenses |
| 7000-7999 | Other Income/Expense |

**[BUILT]** Seed command with BD clinic chart of accounts

---

## Appendix B: System Accounts

Required system accounts (auto-created):

| System Code | Name | Type |
|-------------|------|------|
| SYS_AR | Accounts Receivable | Asset |
| SYS_AP | Accounts Payable | Liability |
| SYS_REVENUE | Service Revenue | Revenue |
| SYS_PRODUCT_REVENUE | Product Revenue | Revenue |
| SYS_INVENTORY | Inventory Asset | Asset |
| SYS_COGS | Cost of Goods Sold | Expense |
| SYS_CASH | Cash on Hand | Asset |
| SYS_BANK | Main Bank Account | Asset |
| SYS_HOLDING_CC | Credit Card Holding | Asset |
| SYS_HOLDING_MFS | MFS Holding (bKash/Nagad) | Asset |
| SYS_HOLDING_CHECK | Check Holding | Asset |
| SYS_MERCHANT_FEES | Merchant Processing Fees | Expense |
| SYS_BAD_DEBT | Bad Debt Expense | Expense |
| SYS_VAT_PAYABLE | VAT Payable | Liability |
| SYS_VAT_RECEIVABLE | VAT Receivable | Asset |
| SYS_RETAINED_EARNINGS | Retained Earnings | Equity |

**[BUILT]** Partial system accounts  
**[TO BUILD]** Complete system account seeding

---

## Appendix C: Status Legend

- **[BUILT]** — Feature exists in current codebase
- **[TO BUILD]** — Feature not yet implemented
- **[NEEDS CLARIFICATION]** — Requirements need further definition

---

*Last updated: April 2026*
