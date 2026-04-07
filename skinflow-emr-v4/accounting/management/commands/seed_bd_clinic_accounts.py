from django.core.management.base import BaseCommand
from accounting.models import Account
from core.models import Organization

class Command(BaseCommand):
    help = 'Seeds the Chart of Accounts with standard accounts for a Skin Clinic in Bangladesh'

    def handle(self, *args, **options):
        org = Organization.objects.first()
        if not org:
            self.stdout.write(self.style.ERROR('No organization found. Please create an organization first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Seeding accounts for {org.name}...'))

        accounts_data = [
            # ASSETS
            {'name': 'Cash on Hand', 'code': '1000', 'type': Account.Type.ASSET, 'sys': 'SYS_CASH_ON_HAND', 'desc': 'Physical cash kept at the front desk or clinic'},
            {'name': 'bKash Merchant Account', 'code': '1010', 'type': Account.Type.ASSET, 'sys': 'SYS_BKASH_HOLDING', 'desc': 'Mobile financial services holding account'},
            {'name': 'Nagad Merchant Account', 'code': '1011', 'type': Account.Type.ASSET, 'sys': 'SYS_NAGAD_HOLDING', 'desc': 'Mobile financial services holding account'},
            {'name': 'City Bank Current A/C', 'code': '1020', 'type': Account.Type.ASSET, 'sys': 'SYS_BANK_MAIN', 'desc': 'Main operational bank account'},
            {'name': 'Dutch-Bangla Bank A/C', 'code': '1021', 'type': Account.Type.ASSET, 'sys': '', 'desc': 'Secondary operational bank account'},
            {'name': 'Eastern Bank Ltd (EBL) A/C', 'code': '1022', 'type': Account.Type.ASSET, 'sys': '', 'desc': 'Credit card settlement bank account'},
            {'name': 'Accounts Receivable', 'code': '1100', 'type': Account.Type.ASSET, 'sys': 'SYS_AR', 'desc': 'Money owed by patients or corporate clients'},
            {'name': 'Inventory Asset (Pharmacy & Consumables)', 'code': '1200', 'type': Account.Type.ASSET, 'sys': 'SYS_INVENTORY', 'desc': 'Stock on hand across all clinics'},
            {'name': 'Prepaid Rent', 'code': '1300', 'type': Account.Type.ASSET, 'sys': '', 'desc': 'Advance rent paid for clinic premises'},
            {'name': 'Clinical Equipment (Lasers, Devices)', 'code': '1500', 'type': Account.Type.ASSET, 'sys': '', 'desc': 'High-value medical aesthetic machines'},
            {'name': 'Accumulated Depreciation - Equipment', 'code': '1501', 'type': Account.Type.ASSET, 'sys': '', 'desc': 'Depreciation for medical devices'},

            # LIABILITIES
            {'name': 'Accounts Payable (Vendors)', 'code': '2000', 'type': Account.Type.LIABILITY, 'sys': 'SYS_AP', 'desc': 'Money owed to suppliers for medicines & consumables'},
            {'name': 'VAT Payable (Mushak 6.3)', 'code': '2100', 'type': Account.Type.LIABILITY, 'sys': 'SYS_VAT', 'desc': 'VAT collected from patients to be paid to NBR'},
            {'name': 'Tax Deducted at Source (TDS)', 'code': '2110', 'type': Account.Type.LIABILITY, 'sys': '', 'desc': 'AIT/TDS on rent, salaries to be paid to NBR'},
            {'name': 'Doctor & Consultant Fees Payable', 'code': '2200', 'type': Account.Type.LIABILITY, 'sys': '', 'desc': 'Share/fees owed to visiting doctors'},
            {'name': 'Salaries Payable', 'code': '2300', 'type': Account.Type.LIABILITY, 'sys': '', 'desc': 'Accrued staff salaries'},
            {'name': 'Bank Loan / SME Liability', 'code': '2500', 'type': Account.Type.LIABILITY, 'sys': '', 'desc': 'Long term clinic setup loans'},

            # EQUITY
            {'name': "Owner's Capital", 'code': '3000', 'type': Account.Type.EQUITY, 'sys': '', 'desc': 'Initial and ongoing investment'},
            {'name': 'Retained Earnings', 'code': '3100', 'type': Account.Type.EQUITY, 'sys': 'SYS_RETAINED_EARNINGS', 'desc': 'Historical clinic profits'},

            # REVENUE
            {'name': 'Consultation Fees Revenue', 'code': '4000', 'type': Account.Type.REVENUE, 'sys': 'SYS_REVENUE', 'desc': 'Revenue from Doctor consultations'},
            {'name': 'Laser Treatment Revenue', 'code': '4100', 'type': Account.Type.REVENUE, 'sys': '', 'desc': 'Diode, Q-Switch, CO2, etc.'},
            {'name': 'Injectables Revenue (Botox/Filler)', 'code': '4200', 'type': Account.Type.REVENUE, 'sys': '', 'desc': 'Revenue from aesthetic injections'},
            {'name': 'Skin Care & Pharmacy Sales', 'code': '4300', 'type': Account.Type.REVENUE, 'sys': '', 'desc': 'Retail sales of creams, serums, etc.'},
            {'name': 'Package Sales Revenue', 'code': '4400', 'type': Account.Type.REVENUE, 'sys': '', 'desc': 'Pre-sold multi-session packages'},

            # EXPENSES
            {'name': 'Cost of Goods Sold (COGS)', 'code': '5000', 'type': Account.Type.EXPENSE, 'sys': 'SYS_COGS', 'desc': 'Cost of products and consumables sold'},
            {'name': 'Doctor & Specialist Fees (Revenue Share)', 'code': '5100', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Direct costs: payouts to doctors'},
            {'name': 'Clinic Rent', 'code': '6000', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Monthly clinic premises rent'},
            {'name': 'Staff Salaries (Nurses, Reception)', 'code': '6100', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Payroll for clinic staff'},
            {'name': 'Utilities (DESCO, DPDC, WASA)', 'code': '6200', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Electricity, water bills'},
            {'name': 'Marketing & Facebook Ads', 'code': '6300', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Digital marketing & promos'},
            {'name': 'bKash / Credit Card Merchant Fees', 'code': '6400', 'type': Account.Type.EXPENSE, 'sys': 'SYS_MERCHANT_FEES', 'desc': 'Transaction fees deducted by gateways'},
            {'name': 'Clinic Supplies (Syringes, Gauze, PPE)', 'code': '6500', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'General medical supplies'},
            {'name': 'Equipment Maintenance (Lasers)', 'code': '6600', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Servicing and parts for medical devices'},
            {'name': 'Office Supplies & Printing (Pad, Rx)', 'code': '6700', 'type': Account.Type.EXPENSE, 'sys': '', 'desc': 'Stationery for clinic'},
        ]

        created_count = 0
        for data in accounts_data:
            acc, created = Account.objects.get_or_create(
                organization=org,
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'account_type': data['type'],
                    'description': data['desc'],
                    'is_system_account': bool(data['sys']),
                    'system_code': data['sys']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created: {acc.code} - {acc.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Exists: {acc.code} - {acc.name}"))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {created_count} accounts.'))
