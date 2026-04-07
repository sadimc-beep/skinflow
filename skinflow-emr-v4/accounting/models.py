from django.db import models
from core.models import TimeStampedModel, Organization

class Account(TimeStampedModel):
    """
    Represents a specific ledger account in the Chart of Accounts.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='accounts')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sub_accounts')
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, help_text="e.g. 1000 for Cash")
    description = models.TextField(blank=True)
    
    class Type(models.TextChoices):
        ASSET = 'ASSET', 'Asset'                  # Cash, A/R, Inventory
        LIABILITY = 'LIABILITY', 'Liability'      # A/P, Loans
        EQUITY = 'EQUITY', 'Equity'               # Retained Earnings
        REVENUE = 'REVENUE', 'Revenue'            # Sales, Service Income
        EXPENSE = 'EXPENSE', 'Expense'            # Rent, Utilities, COGS
        
    account_type = models.CharField(max_length=20, choices=Type.choices)
    is_active = models.BooleanField(default=True)
    
    # Flags to quickly identify system-critical default accounts
    is_system_account = models.BooleanField(default=False)
    system_code = models.CharField(max_length=50, blank=True, help_text="e.g. SYS_AR, SYS_AP, SYS_REVENUE")

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else self.name

class BankAccount(TimeStampedModel):
    """
    Represents physical bank accounts, cash drawers, or holding accounts for Check/CC clearing.
    Linked directly to an Asset Account in the ledger.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='bank_accounts')
    ledger_account = models.OneToOneField(Account, on_delete=models.PROTECT, related_name='bank_details')
    
    name = models.CharField(max_length=255, help_text="e.g. Main Checking, Front Desk Cash, Check Holding")
    bank_name = models.CharField(max_length=255, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    
    class Type(models.TextChoices):
        CASH = 'CASH', 'Cash Drawer'
        BANK = 'BANK', 'Bank Account'
        HOLDING_CC = 'HOLDING_CC', 'Credit Card Holding'
        HOLDING_CHECK = 'HOLDING_CHECK', 'Check Holding'
        
    account_type = models.CharField(max_length=20, choices=Type.choices, default=Type.BANK)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class JournalEntry(TimeStampedModel):
    """
    Represents a single balanced accounting entry.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='journal_entries')
    
    date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True, help_text="e.g. INV-1001, PMT-239")
    description = models.CharField(max_length=500)
    
    # Audit trail for reversals
    reversed_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reverses_entry', help_text="The entry that reversed this one")
    
    # Generic relations to link this Entry to the business logic that created it
    # E.g. source_model='Invoice', source_id=10
    source_model = models.CharField(max_length=100, blank=True)
    source_id = models.PositiveIntegerField(null=True, blank=True)
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        POSTED = 'POSTED', 'Posted'
        CANCELLED = 'CANCELLED', 'Cancelled'
        
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    posted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"JE-{self.id} on {self.date}"

class JournalEntryLine(TimeStampedModel):
    """
    A single debit or credit line in a Journal Entry.
    """
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='journal_lines')
    
    description = models.CharField(max_length=255, blank=True)
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Reconciliation Tracking
    is_cleared = models.BooleanField(default=False)
    reconciliation = models.ForeignKey('BankReconciliation', on_delete=models.SET_NULL, null=True, blank=True, related_name='cleared_lines')

    def __str__(self):
        if self.debit > 0:
            return f"DR {self.account.name}: {self.debit}"
        return f"CR {self.account.name}: {self.credit}"

class AccountingSettings(TimeStampedModel):
    """
    Singleton settings model per organization.
    """
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='accounting_settings')
    
    # Fiscal Period Locking
    closed_books_date = models.DateField(null=True, blank=True, help_text="No journal entries can be posted on or before this date.")
    
    def __str__(self):
        return f"Accounting Settings for {self.organization.name}"

class BankReconciliation(TimeStampedModel):
    """
    Represents a monthly or periodic bank reconciliation statement.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='reconciliations')
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='reconciliations')

    statement_date = models.DateField()
    statement_ending_balance = models.DecimalField(max_digits=15, decimal_places=2)

    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.bank_account.name} Repo - {self.statement_date}"


class BankStatementLine(TimeStampedModel):
    """
    A single transaction row parsed from an imported bank statement (CSV or OFX).
    Positive amount = money into the bank account (credit).
    Negative amount = money out of the bank account (debit).
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='statement_lines')
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='statement_lines')

    # Groups all lines from a single file upload
    import_batch = models.UUIDField(db_index=True)

    date = models.DateField()
    description = models.CharField(max_length=500, blank=True)
    reference = models.CharField(max_length=255, blank=True)
    # Signed: positive = in (credit to bank), negative = out (debit from bank)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    raw_text = models.TextField(blank=True, help_text="Original CSV row for audit")

    class Status(models.TextChoices):
        UNMATCHED = 'UNMATCHED', 'Unmatched'
        MATCHED = 'MATCHED', 'Matched'
        IGNORED = 'IGNORED', 'Ignored'

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNMATCHED)

    # Set when matched to a journal entry line
    matched_journal_line = models.OneToOneField(
        JournalEntryLine,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='statement_match',
    )

    class Meta:
        ordering = ['date', 'id']

    def __str__(self):
        return f"{self.date} {self.description} {self.amount}"
