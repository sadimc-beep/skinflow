from rest_framework import serializers
from .models import Account, BankAccount, JournalEntry, JournalEntryLine, AccountingSettings, BankReconciliation, BankStatementLine

class AccountSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = Account
        fields = '__all__'

class BankAccountSerializer(serializers.ModelSerializer):
    ledger_account_details = AccountSerializer(source='ledger_account', read_only=True)
    
    class Meta:
        model = BankAccount
        fields = '__all__'

class JournalEntryLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    
    class Meta:
        model = JournalEntryLine
        fields = ['id', 'account', 'account_name', 'account_code', 'description', 'debit', 'credit']

class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    lines_data = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    
    class Meta:
        model = JournalEntry
        fields = '__all__'

class AccountingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingSettings
        fields = '__all__'
        read_only_fields = ['organization']

class BankReconciliationSerializer(serializers.ModelSerializer):
    bank_account_name = serializers.CharField(source='bank_account.name', read_only=True)

    class Meta:
        model = BankReconciliation
        fields = '__all__'
        read_only_fields = ['organization', 'is_completed']


class BankStatementLineSerializer(serializers.ModelSerializer):
    matched_entry_date = serializers.SerializerMethodField()
    matched_entry_reference = serializers.SerializerMethodField()
    matched_entry_description = serializers.SerializerMethodField()

    class Meta:
        model = BankStatementLine
        fields = '__all__'
        read_only_fields = ['organization', 'bank_account', 'import_batch', 'raw_text', 'status', 'matched_journal_line']

    def get_matched_entry_date(self, obj):
        if obj.matched_journal_line:
            return obj.matched_journal_line.entry.date
        return None

    def get_matched_entry_reference(self, obj):
        if obj.matched_journal_line:
            return obj.matched_journal_line.entry.reference_number
        return None

    def get_matched_entry_description(self, obj):
        if obj.matched_journal_line:
            return obj.matched_journal_line.entry.description or obj.matched_journal_line.description
        return None
