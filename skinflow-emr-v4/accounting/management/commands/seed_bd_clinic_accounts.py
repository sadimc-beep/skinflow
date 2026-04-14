"""
Management command: seed_bd_clinic_accounts

Creates a standard Bangladesh aesthetic-clinic Chart of Accounts for a given
organisation and auto-maps all ClinicSettings account FK fields.

Usage:
    python manage.py seed_bd_clinic_accounts
    python manage.py seed_bd_clinic_accounts --org-id 3
    python manage.py seed_bd_clinic_accounts --dry-run
"""
from django.core.management.base import BaseCommand
from accounting.models import Account
from core.models import Organization, ClinicSettings


class Command(BaseCommand):
    help = 'Seed Chart of Accounts for a BD aesthetic clinic and auto-map ClinicSettings account fields'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id', type=int, default=None,
            help='Organisation ID to seed. Defaults to the first organisation.',
        )
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Print what would be created without writing to the database.',
        )

    def handle(self, *args, **options):
        org_id = options.get('org_id')
        dry_run = options.get('dry_run', False)

        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Organisation id={org_id} not found.'))
                return
        else:
            org = Organization.objects.first()
            if not org:
                self.stdout.write(self.style.ERROR('No organisation found. Create one first.'))
                return

        self.stdout.write(self.style.SUCCESS(f'Seeding accounts for: {org.name} (id={org.id})'))
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — nothing will be written.'))

        # ── Account definitions ──────────────────────────────────────────
        # Each tuple: (code, name, account_type, system_code, description)
        A = Account.Type.ASSET
        L = Account.Type.LIABILITY
        E = Account.Type.EQUITY
        R = Account.Type.REVENUE
        X = Account.Type.EXPENSE

        accounts_data = [
            # ── ASSETS ───────────────────────────────────────────────────
            ('1000', 'Cash on Hand',                      A, 'SYS_CASH',       'Physical cash at front desk / clinic safe'),
            ('1010', 'bKash Merchant Account',             A, 'SYS_BKASH',      'bKash MFS merchant wallet'),
            ('1011', 'Nagad Merchant Account',             A, 'SYS_NAGAD',      'Nagad MFS merchant wallet'),
            ('1020', 'Bank Account (Main)',                A, 'SYS_BANK',       'Primary operational bank account (card settlements, transfers)'),
            ('1021', 'Bank Account (Secondary)',           A, '',               'Secondary bank account'),
            ('1100', 'Accounts Receivable',               A, 'SYS_AR',         'Money owed by patients or corporate clients'),
            ('1200', 'Inventory Asset',                   A, 'SYS_INVENTORY',  'Stock on hand: medicines, consumables, retail products'),
            ('1300', 'Prepaid Expenses',                  A, '',               'Advance rent, advance insurance, etc.'),
            ('1500', 'Clinical Equipment',                A, '',               'Lasers, RF devices, aesthetic machines'),
            ('1501', 'Accumulated Depreciation',          A, '',               'Contra asset — accumulated equipment depreciation'),

            # ── LIABILITIES ───────────────────────────────────────────────
            ('2000', 'Accounts Payable',                  L, 'SYS_AP',         'Money owed to product / consumable vendors'),
            ('2100', 'VAT Payable',                       L, '',               'VAT collected from patients, payable to NBR'),
            ('2110', 'Tax Deducted at Source (TDS/AIT)',  L, '',               'TDS on rent / professional fees payable to NBR'),
            ('2200', 'Doctor & Consultant Fees Payable',  L, '',               'Revenue-share owed to visiting doctors'),
            ('2300', 'Salaries Payable',                  L, '',               'Accrued staff salaries'),
            ('2500', 'Bank Loan / SME Liability',         L, '',               'Long-term clinic setup loans'),

            # ── EQUITY ────────────────────────────────────────────────────
            ('3000', "Owner's Capital",                   E, '',               'Initial and subsequent owner investment'),
            ('3100', 'Retained Earnings',                 E, 'SYS_RETAINED_EARNINGS', 'Accumulated clinic profits / losses'),

            # ── REVENUE ───────────────────────────────────────────────────
            ('4000', 'Consultation Fee Revenue',          R, 'SYS_CONSULTATION_REVENUE', 'Doctor consultation charges'),
            ('4100', 'Procedure Revenue',                 R, 'SYS_PROCEDURE_REVENUE',    'Laser, injectables, facials, and all billed procedures'),
            ('4200', 'Product & Pharmacy Sales',          R, 'SYS_PRODUCT_REVENUE',      'Retail sales of creams, serums, medicines'),
            ('4300', 'Package Sales Revenue',             R, '',               'Pre-sold multi-session packages (use sub-accounts if needed)'),

            # ── COST OF GOODS SOLD ────────────────────────────────────────
            ('5000', 'Product Cost of Goods Sold',        X, 'SYS_PRODUCT_COGS',    'Cost of products handed over to patients from stock'),
            ('5010', 'Procedure Consumables Cost',        X, 'SYS_PROCEDURE_COGS',  'Cost of consumables issued via clinical requisitions'),
            ('5100', 'Doctor & Specialist Revenue Share', X, '',               'Direct payout to doctors as % of revenue'),

            # ── OPERATING EXPENSES ────────────────────────────────────────
            ('6000', 'Clinic Rent',                       X, '',               'Monthly premises rent'),
            ('6100', 'Staff Salaries',                    X, '',               'Payroll for nurses, reception, store staff'),
            ('6200', 'Utilities (DESCO / WASA)',          X, '',               'Electricity and water bills'),
            ('6300', 'Marketing & Advertising',           X, '',               'Facebook Ads, Google Ads, promotional material'),
            ('6400', 'Merchant & Payment Fees',           X, 'SYS_MERCHANT_FEES', 'bKash / card gateway transaction fees'),
            ('6500', 'Clinic Supplies (PPE / Syringes)',  X, '',               'General consumable medical supplies'),
            ('6600', 'Equipment Maintenance',             X, '',               'Laser and device servicing'),
            ('6700', 'Office Supplies & Printing',        X, '',               'Stationery, prescription pads'),
            ('6800', 'Depreciation Expense',              X, '',               'Periodic write-down of clinical equipment'),
        ]

        # ── Create / update accounts ─────────────────────────────────────
        created_count = 0
        code_to_account = {}

        for code, name, acc_type, sys_code, desc in accounts_data:
            if dry_run:
                self.stdout.write(f"  [DRY RUN] {code} - {name} ({acc_type})")
                continue

            acc, created = Account.objects.get_or_create(
                organization=org,
                code=code,
                defaults={
                    'name':             name,
                    'account_type':     acc_type,
                    'description':      desc,
                    'is_system_account': bool(sys_code),
                    'system_code':      sys_code,
                },
            )

            # Update system_code if the account already exists but lacks it
            if not created and sys_code and not acc.system_code:
                acc.system_code = sys_code
                acc.is_system_account = True
                acc.save(update_fields=['system_code', 'is_system_account'])

            code_to_account[code] = acc
            status_label = self.style.SUCCESS('CREATED') if created else self.style.WARNING('EXISTS ')
            self.stdout.write(f"  {status_label}  {acc.code} - {acc.name}")
            if created:
                created_count += 1

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDry run complete — database unchanged.'))
            return

        self.stdout.write(self.style.SUCCESS(f'\n{created_count} accounts created.'))

        # ── Auto-map ClinicSettings ──────────────────────────────────────
        self.stdout.write('\nAuto-mapping ClinicSettings account fields...')
        settings, _ = ClinicSettings.objects.get_or_create(organization=org)

        mapping = {
            'default_ar_account':                   '1100',
            'default_ap_account':                   '2000',
            'default_revenue_account':               '4000',  # generic fallback
            'default_consultation_revenue_account':  '4000',
            'default_procedure_revenue_account':     '4100',
            'default_product_revenue_account':       '4200',
            'default_product_cogs_account':          '5000',
            'default_procedure_cogs_account':        '5010',
            'default_cash_account':                  '1000',
            'default_bank_account':                  '1020',
            'default_bkash_account':                 '1010',
            'default_nagad_account':                 '1011',
            'default_inventory_account':             '1200',
        }

        updated_fields = []
        for field, code in mapping.items():
            acc = code_to_account.get(code)
            if acc:
                setattr(settings, field, acc)
                updated_fields.append(field)
                self.stdout.write(f"  {field} → {acc.code} ({acc.name})")

        if updated_fields:
            settings.save(update_fields=updated_fields)
            self.stdout.write(self.style.SUCCESS(f'\n{len(updated_fields)} ClinicSettings fields mapped.'))
        else:
            self.stdout.write(self.style.WARNING('No ClinicSettings fields updated (accounts not found).'))

        self.stdout.write(self.style.SUCCESS('\nDone. Chart of accounts seeded and account mapping configured.'))
