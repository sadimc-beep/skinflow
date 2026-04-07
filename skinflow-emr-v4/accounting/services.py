from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Account, BankAccount, JournalEntry, JournalEntryLine, BankStatementLine

class AccountingService:
    @staticmethod
    def get_system_account(organization, system_code):
        """Helper to fetch a system account, checking ClinicSettings first, then fallback."""
        from core.models import ClinicSettings
        settings, _ = ClinicSettings.objects.get_or_create(organization=organization)
        
        # Map system codes to ClinicSettings fields
        mapping = {
            'SYS_AR': settings.default_ar_account,
            'SYS_REVENUE': settings.default_revenue_account,
            'SYS_AP': settings.default_ap_account,
            'SYS_INVENTORY': settings.default_inventory_account,
        }
        
        account = mapping.get(system_code)
        if account:
            return account

        # Fallback to old behavior if setting is null or not in mapping
        account = Account.objects.filter(organization=organization, system_code=system_code).first()
        if not account:
            # Create emergency fallback if seed hasn't run
            account = Account.objects.create(
                organization=organization,
                name=f"System: {system_code}",
                system_code=system_code,
                is_system_account=True,
                account_type=Account.Type.ASSET # Fallback, should be seeded properly
            )
        return account

    @staticmethod
    def _create_balanced_entry(organization, date, ref, desc, source_model, source_id, db_acc, cr_acc, amount):
        """Internal helper to create a simple balanced 2-line journal entry."""
        if amount <= 0:
            return None
            
        entry = JournalEntry.objects.create(
            organization=organization,
            date=date,
            reference_number=ref,
            description=desc,
            source_model=source_model,
            source_id=source_id,
            status=JournalEntry.Status.POSTED
        )
        
        JournalEntryLine.objects.create(
            entry=entry,
            account=db_acc,
            debit=amount,
            credit=0
        )
        
        JournalEntryLine.objects.create(
            entry=entry,
            account=cr_acc,
            debit=0,
            credit=amount
        )
        return entry

    @classmethod
    @transaction.atomic
    def post_invoice_revenue(cls, invoice):
        """
        When an Invoice is finalized.
        Debit: Accounts Receivable
        Credit: Sales Revenue
        """
        ar_account = cls.get_system_account(invoice.organization, 'SYS_AR')
        rev_account = cls.get_system_account(invoice.organization, 'SYS_REVENUE')
        
        return cls._create_balanced_entry(
            organization=invoice.organization,
            date=timezone.now().date(),
            ref=f"INV-{invoice.id}",
            desc=f"Revenue recognition for Invoice #{invoice.id}",
            source_model='Invoice',
            source_id=invoice.id,
            db_acc=ar_account,
            cr_acc=rev_account,
            amount=invoice.total
        )

    @classmethod
    @transaction.atomic
    def post_patient_payment(cls, payment):
        """
        When a Patient makes a Payment.
        Debit: Cash / CC Holding / Check Holding (Depending on method)
        Credit: Accounts Receivable
        """
        ar_account = cls.get_system_account(payment.organization, 'SYS_AR')
        
        # Route to correct asset account based on payment method
        if payment.method in ['CARD', 'CC']:
            asset_acc = cls.get_system_account(payment.organization, 'SYS_HOLDING_CC')
        elif payment.method == 'CHECK':
            asset_acc = cls.get_system_account(payment.organization, 'SYS_HOLDING_CHECK')
        else:
            asset_acc = cls.get_system_account(payment.organization, 'SYS_CASH')
            
        return cls._create_balanced_entry(
            organization=payment.organization,
            date=timezone.now().date(),
            ref=f"PMT-{payment.id}",
            desc=f"Patient Payment Recv ({payment.method})",
            source_model='Payment',
            source_id=payment.id,
            db_acc=asset_acc,
            cr_acc=ar_account,
            amount=payment.amount
        )

    @classmethod
    @transaction.atomic
    def post_grn_receipt(cls, bill):
        """
        When a GRN is confirmed and a Vendor Bill is generated.
        Debit: Inventory Asset
        Credit: Accounts Payable
        """
        inv_account = cls.get_system_account(bill.organization, 'SYS_INVENTORY')
        ap_account = cls.get_system_account(bill.organization, 'SYS_AP')
        
        return cls._create_balanced_entry(
            organization=bill.organization,
            date=bill.bill_date,
            ref=bill.bill_number,
            desc=f"Inventory Receipt from Vendor Bill #{bill.id}",
            source_model='VendorBill',
            source_id=bill.id,
            db_acc=inv_account,
            cr_acc=ap_account,
            amount=bill.amount
        )

    @classmethod
    @transaction.atomic
    def post_vendor_payment(cls, bill, amount, payment_method):
        """
        When a Vendor Bill is paid out.
        Debit: Accounts Payable
        Credit: Cash/Bank OR Check Holding
        """
        ap_account = cls.get_system_account(bill.organization, 'SYS_AP')
        
        if payment_method == 'CHECK':
            asset_acc = cls.get_system_account(bill.organization, 'SYS_HOLDING_CHECK')
        else:
            asset_acc = cls.get_system_account(bill.organization, 'SYS_BANK')
            
        desc = f"Vendor Payment for Bill #{bill.bill_number}"
        
        return cls._create_balanced_entry(
            organization=bill.organization,
            date=timezone.now().date(),
            ref=f"VPMT-{bill.id}",
            desc=desc,
            source_model='VendorBill',
            source_id=bill.id,
            db_acc=ap_account,
            cr_acc=asset_acc,
            amount=amount
        )

    @classmethod
    @transaction.atomic
    def settle_credit_card_batch(cls, organization, holding_account, destination_account, amount, fee_amount, desc):
        """
        When a CC Batch is settled from a holding account to the main bank.
        Debit: Bank Account (amount - fee)
        Debit: Merchant Fees Expense (fee)
        Credit: CC Holding Account (amount)
        """
        fee_account = cls.get_system_account(organization, 'SYS_MERCHANT_FEES')
        
        entry = JournalEntry.objects.create(
            organization=organization,
            date=timezone.now().date(),
            reference_number=f"SETTLE-{timezone.now().strftime('%Y%m%d%H%M')}",
            description=desc or "Credit Card Batch Settlement",
            status=JournalEntry.Status.POSTED
        )
        
        net_amount = amount - fee_amount

        # Credit Holding Account full amount
        JournalEntryLine.objects.create(entry=entry, account=holding_account, debit=0, credit=amount)
        # Debit Bank Account net amount
        JournalEntryLine.objects.create(entry=entry, account=destination_account, debit=net_amount, credit=0)
        # Debit Fees
        if fee_amount > 0:
            JournalEntryLine.objects.create(entry=entry, account=fee_account, debit=fee_amount, credit=0)
            
        return entry

    @classmethod
    @transaction.atomic
    def clear_check(cls, organization, holding_account, destination_account, amount, desc):
        """
        When a Check clears from holding to the main bank.
        Debit: Bank Account
        Credit: Check Holding Account
        """
        return cls._create_balanced_entry(
            organization=organization,
            date=timezone.now().date(),
            ref=f"CHKCLR-{timezone.now().strftime('%Y%m%d%H%M')}",
            desc=desc or "Check Clearance",
            source_model='BankAccount',
            source_id=holding_account.id, 
            db_acc=destination_account,
            cr_acc=holding_account,
            amount=amount
        )



def auto_match_statement_lines(bank_account, statement_lines=None):
    """
    Auto-match BankStatementLine objects to uncleared JournalEntryLines.

    Tolerance rule: whichever is smaller — 2% of the statement amount OR ৳200 absolute.
    Date window: ±5 days.
    Only auto-matches when exactly ONE candidate is found.

    Args:
        bank_account: BankAccount instance
        statement_lines: queryset/list of BankStatementLine to process.
                         Defaults to all UNMATCHED lines for the bank.

    Returns:
        {'matched': N, 'unmatched': M}
    """
    from .models import BankStatementLine, JournalEntryLine

    if statement_lines is None:
        statement_lines = BankStatementLine.objects.filter(
            bank_account=bank_account,
            status=BankStatementLine.Status.UNMATCHED,
        )

    ledger_account = bank_account.ledger_account
    matched_count = 0
    unmatched_count = 0

    for stmt_line in statement_lines:
        # Compute tolerance: min(2% of abs(amount), ৳200)
        abs_amount = abs(stmt_line.amount)
        tolerance = min(abs_amount * Decimal('0.02'), Decimal('200'))

        lo = abs_amount - tolerance
        hi = abs_amount + tolerance

        date_from = stmt_line.date - timedelta(days=5)
        date_to = stmt_line.date + timedelta(days=5)

        # For a positive statement line (money in), the JE line is a DEBIT to the bank account.
        # For a negative statement line (money out), the JE line is a CREDIT to the bank account.
        if stmt_line.amount > 0:
            candidates = JournalEntryLine.objects.filter(
                account=ledger_account,
                entry__status=JournalEntry.Status.POSTED,
                is_cleared=False,
                debit__gte=lo,
                debit__lte=hi,
                entry__date__gte=date_from,
                entry__date__lte=date_to,
            ).exclude(statement_match__isnull=False)
        else:
            candidates = JournalEntryLine.objects.filter(
                account=ledger_account,
                entry__status=JournalEntry.Status.POSTED,
                is_cleared=False,
                credit__gte=lo,
                credit__lte=hi,
                entry__date__gte=date_from,
                entry__date__lte=date_to,
            ).exclude(statement_match__isnull=False)

        count = candidates.count()
        if count == 1:
            je_line = candidates.first()
            with transaction.atomic():
                stmt_line.matched_journal_line = je_line
                stmt_line.status = BankStatementLine.Status.MATCHED
                stmt_line.save(update_fields=['matched_journal_line', 'status'])
                je_line.is_cleared = True
                je_line.save(update_fields=['is_cleared'])
            matched_count += 1
        else:
            unmatched_count += 1

    return {'matched': matched_count, 'unmatched': unmatched_count}
