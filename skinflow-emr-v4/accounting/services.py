import logging
from decimal import Decimal
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from .models import Account, BankAccount, JournalEntry, JournalEntryLine, BankStatementLine

logger = logging.getLogger(__name__)


class AccountingService:

    # ── System account resolution ─────────────────────────────────────────

    @staticmethod
    def get_system_account(organization, system_code):
        """
        Resolve a system account for the given org.

        Priority:
          1. ClinicSettings FK field (configured by the clinic owner)
          2. Account with matching system_code in the chart of accounts
          3. Return None and log a warning (never auto-create junk accounts)
        """
        from core.models import ClinicSettings

        settings, _ = ClinicSettings.objects.get_or_create(organization=organization)

        # Map system codes → ClinicSettings FK fields
        mapping = {
            'SYS_AR':                   settings.default_ar_account,
            'SYS_AP':                   settings.default_ap_account,
            'SYS_REVENUE':              settings.default_revenue_account,
            'SYS_CONSULTATION_REVENUE': settings.default_consultation_revenue_account,
            'SYS_PROCEDURE_REVENUE':    settings.default_procedure_revenue_account,
            'SYS_PRODUCT_REVENUE':      settings.default_product_revenue_account,
            'SYS_PRODUCT_COGS':         settings.default_product_cogs_account,
            'SYS_PROCEDURE_COGS':       settings.default_procedure_cogs_account,
            'SYS_CASH':                 settings.default_cash_account,
            'SYS_BANK':                 settings.default_bank_account,
            'SYS_BKASH':                settings.default_bkash_account,
            'SYS_NAGAD':                settings.default_nagad_account,
            'SYS_INVENTORY':            settings.default_inventory_account,
        }

        account = mapping.get(system_code)
        if account:
            return account

        # Fallback: look up by system_code in the chart of accounts
        account = Account.objects.filter(
            organization=organization,
            system_code=system_code,
            is_active=True,
        ).first()

        if not account:
            logger.warning(
                "AccountingService: system account '%s' not configured for org '%s' (id=%s). "
                "Journal entry skipped for this account. "
                "Configure it via Settings → Account Mapping.",
                system_code, organization.name, organization.id,
            )

        return account  # may be None — callers must guard

    # ── Internal helpers ──────────────────────────────────────────────────

    @staticmethod
    def _create_balanced_entry(organization, date, ref, desc, source_model, source_id, db_acc, cr_acc, amount):
        """Create a simple balanced 2-line journal entry. Returns None if any account is missing."""
        if not db_acc or not cr_acc:
            return None
        if amount <= 0:
            return None

        entry = JournalEntry.objects.create(
            organization=organization,
            date=date,
            reference_number=ref,
            description=desc,
            source_model=source_model,
            source_id=source_id,
            status=JournalEntry.Status.POSTED,
        )
        JournalEntryLine.objects.create(entry=entry, account=db_acc, debit=amount, credit=0)
        JournalEntryLine.objects.create(entry=entry, account=cr_acc, debit=0, credit=amount)
        return entry

    # ── Automated hooks ───────────────────────────────────────────────────

    @classmethod
    @transaction.atomic
    def post_invoice_revenue(cls, invoice):
        """
        When an Invoice is finalized.

        DR: Accounts Receivable (full invoice total)
        CR: Consultation Fee Revenue   (items linked to Appointment)
        CR: Procedure Revenue          (items linked to PrescriptionProcedure)
        CR: Product Sale Revenue       (items linked to PrescriptionProduct)

        If a clinic maps multiple revenue types to the same account, credits are
        aggregated so the JE stays tidy.  If a granular account is not configured,
        falls back to the generic SYS_REVENUE.  If nothing is configured the entry
        is skipped and a warning is logged.
        """
        ar_account = cls.get_system_account(invoice.organization, 'SYS_AR')
        if not ar_account:
            logger.warning(
                "post_invoice_revenue skipped for Invoice #%s: SYS_AR not configured.", invoice.id
            )
            return None

        if invoice.total <= 0:
            return None

        items = list(invoice.items.all())

        consultation_total = sum(
            (Decimal(str(item.net_price)) for item in items if item.reference_model == 'Appointment'),
            Decimal('0.00'),
        )
        procedure_total = sum(
            (Decimal(str(item.net_price)) for item in items if item.reference_model == 'PrescriptionProcedure'),
            Decimal('0.00'),
        )
        product_total = sum(
            (Decimal(str(item.net_price)) for item in items if item.reference_model == 'PrescriptionProduct'),
            Decimal('0.00'),
        )

        # Build credit lines: aggregate by account in case multiple types share one account
        revenue_credits = {}  # account_id -> (account_obj, amount)
        for sys_code, amount in [
            ('SYS_CONSULTATION_REVENUE', consultation_total),
            ('SYS_PROCEDURE_REVENUE',    procedure_total),
            ('SYS_PRODUCT_REVENUE',      product_total),
        ]:
            if amount <= 0:
                continue
            acc = cls.get_system_account(invoice.organization, sys_code)
            if not acc:
                # fall back to generic revenue account
                acc = cls.get_system_account(invoice.organization, 'SYS_REVENUE')
            if not acc:
                logger.warning(
                    "post_invoice_revenue Invoice #%s: no account for %s (amount ৳%s), line skipped.",
                    invoice.id, sys_code, amount,
                )
                continue
            if acc.id in revenue_credits:
                revenue_credits[acc.id] = (acc, revenue_credits[acc.id][1] + amount)
            else:
                revenue_credits[acc.id] = (acc, amount)

        if not revenue_credits:
            logger.warning(
                "post_invoice_revenue Invoice #%s: no revenue accounts configured, entry skipped.",
                invoice.id,
            )
            return None

        entry = JournalEntry.objects.create(
            organization=invoice.organization,
            date=timezone.now().date(),
            reference_number=f"INV-{invoice.id}",
            description=f"Revenue recognition for Invoice #{invoice.id}",
            source_model='Invoice',
            source_id=invoice.id,
            status=JournalEntry.Status.POSTED,
        )

        JournalEntryLine.objects.create(
            entry=entry, account=ar_account,
            debit=invoice.total, credit=Decimal('0.00'),
        )
        for acc, amount in revenue_credits.values():
            JournalEntryLine.objects.create(
                entry=entry, account=acc,
                debit=Decimal('0.00'), credit=amount,
            )

        return entry

    @classmethod
    @transaction.atomic
    def post_patient_payment(cls, payment):
        """
        When a Patient makes a Payment.

        DR: Cash / bKash / Nagad / Bank (depending on method)
        CR: Accounts Receivable
        """
        ar_account = cls.get_system_account(payment.organization, 'SYS_AR')

        method_to_sys = {
            'CASH':  'SYS_CASH',
            'CARD':  'SYS_BANK',
            'BKASH': 'SYS_BKASH',
            'NAGAD': 'SYS_NAGAD',
            # Legacy codes kept for safety
            'CC':    'SYS_BANK',
            'CHECK': 'SYS_HOLDING_CHECK',
        }
        sys_code = method_to_sys.get(payment.method, 'SYS_CASH')
        asset_acc = cls.get_system_account(payment.organization, sys_code)

        return cls._create_balanced_entry(
            organization=payment.organization,
            date=timezone.now().date(),
            ref=f"PMT-{payment.id}",
            desc=f"Patient Payment Recv ({payment.method})",
            source_model='Payment',
            source_id=payment.id,
            db_acc=asset_acc,
            cr_acc=ar_account,
            amount=payment.amount,
        )

    @classmethod
    @transaction.atomic
    def post_grn_receipt(cls, bill):
        """
        When a GRN is confirmed and a Vendor Bill is generated.

        DR: Inventory Asset
        CR: Accounts Payable
        """
        inv_account = cls.get_system_account(bill.organization, 'SYS_INVENTORY')
        ap_account  = cls.get_system_account(bill.organization, 'SYS_AP')

        return cls._create_balanced_entry(
            organization=bill.organization,
            date=bill.bill_date,
            ref=bill.bill_number,
            desc=f"Inventory Receipt from Vendor Bill #{bill.id}",
            source_model='VendorBill',
            source_id=bill.id,
            db_acc=inv_account,
            cr_acc=ap_account,
            amount=bill.amount,
        )

    @classmethod
    @transaction.atomic
    def post_vendor_payment(cls, bill, amount, payment_method):
        """
        When a Vendor Bill is paid.

        DR: Accounts Payable
        CR: Bank / Cash (depending on payment_method)
        """
        ap_account = cls.get_system_account(bill.organization, 'SYS_AP')

        if payment_method == 'CHECK':
            asset_acc = cls.get_system_account(bill.organization, 'SYS_HOLDING_CHECK')
        else:
            asset_acc = cls.get_system_account(bill.organization, 'SYS_BANK')

        return cls._create_balanced_entry(
            organization=bill.organization,
            date=timezone.now().date(),
            ref=f"VPMT-{bill.id}",
            desc=f"Vendor Payment for Bill #{bill.bill_number}",
            source_model='VendorBill',
            source_id=bill.id,
            db_acc=ap_account,
            cr_acc=asset_acc,
            amount=amount,
        )

    @classmethod
    @transaction.atomic
    def post_product_cogs(cls, organization, amount, reference_id, description):
        """
        When a Product is fulfilled from stock (handover to patient).

        DR: Product COGS
        CR: Inventory Asset
        """
        cogs_account = cls.get_system_account(organization, 'SYS_PRODUCT_COGS')
        inv_account  = cls.get_system_account(organization, 'SYS_INVENTORY')

        return cls._create_balanced_entry(
            organization=organization,
            date=timezone.now().date(),
            ref=f"COGS-PROD-{reference_id}",
            desc=description,
            source_model='InvoiceItem',
            source_id=reference_id,
            db_acc=cogs_account,
            cr_acc=inv_account,
            amount=amount,
        )

    @classmethod
    @transaction.atomic
    def post_procedure_cogs(cls, organization, amount, reference_id, description):
        """
        When consumables are issued via InventoryRequisition (procedure sessions).

        DR: Procedure / Consumables COGS
        CR: Inventory Asset
        """
        cogs_account = cls.get_system_account(organization, 'SYS_PROCEDURE_COGS')
        inv_account  = cls.get_system_account(organization, 'SYS_INVENTORY')

        return cls._create_balanced_entry(
            organization=organization,
            date=timezone.now().date(),
            ref=f"COGS-REQ-{reference_id}",
            desc=description,
            source_model='InventoryRequisition',
            source_id=reference_id,
            db_acc=cogs_account,
            cr_acc=inv_account,
            amount=amount,
        )

    @classmethod
    @transaction.atomic
    def settle_credit_card_batch(cls, organization, holding_account, destination_account, amount, fee_amount, desc):
        """
        CC Batch Settlement: Holding → Bank minus merchant fee.

        DR: Bank Account (amount - fee)
        DR: Merchant Fees Expense (fee)
        CR: CC Holding Account (amount)
        """
        fee_account = cls.get_system_account(organization, 'SYS_MERCHANT_FEES')

        entry = JournalEntry.objects.create(
            organization=organization,
            date=timezone.now().date(),
            reference_number=f"SETTLE-{timezone.now().strftime('%Y%m%d%H%M')}",
            description=desc or "Credit Card Batch Settlement",
            status=JournalEntry.Status.POSTED,
        )

        net_amount = amount - fee_amount
        JournalEntryLine.objects.create(entry=entry, account=holding_account, debit=0, credit=amount)
        JournalEntryLine.objects.create(entry=entry, account=destination_account, debit=net_amount, credit=0)
        if fee_amount > 0 and fee_account:
            JournalEntryLine.objects.create(entry=entry, account=fee_account, debit=fee_amount, credit=0)

        return entry

    @classmethod
    @transaction.atomic
    def clear_check(cls, organization, holding_account, destination_account, amount, desc):
        """
        Check Clearance: Holding → Bank.

        DR: Bank Account
        CR: Check Holding Account
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
            amount=amount,
        )


def auto_match_statement_lines(bank_account, statement_lines=None):
    """
    Auto-match BankStatementLine objects to uncleared JournalEntryLines.

    Tolerance: min(2% of abs(amount), ৳200). Date window: ±5 days.
    Only auto-matches when exactly ONE candidate found.

    Returns {'matched': N, 'unmatched': M}
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
        abs_amount = abs(stmt_line.amount)
        tolerance = min(abs_amount * Decimal('0.02'), Decimal('200'))

        lo = abs_amount - tolerance
        hi = abs_amount + tolerance

        date_from = stmt_line.date - timedelta(days=5)
        date_to   = stmt_line.date + timedelta(days=5)

        if stmt_line.amount > 0:
            candidates = JournalEntryLine.objects.filter(
                account=ledger_account,
                entry__status=JournalEntry.Status.POSTED,
                is_cleared=False,
                debit__gte=lo, debit__lte=hi,
                entry__date__gte=date_from, entry__date__lte=date_to,
            ).exclude(statement_match__isnull=False)
        else:
            candidates = JournalEntryLine.objects.filter(
                account=ledger_account,
                entry__status=JournalEntry.Status.POSTED,
                is_cleared=False,
                credit__gte=lo, credit__lte=hi,
                entry__date__gte=date_from, entry__date__lte=date_to,
            ).exclude(statement_match__isnull=False)

        if candidates.count() == 1:
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
