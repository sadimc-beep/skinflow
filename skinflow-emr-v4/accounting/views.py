from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils.decorators import method_decorator
from .models import Account, BankAccount, JournalEntry, JournalEntryLine, AccountingSettings, BankReconciliation, BankStatementLine
from .serializers import AccountSerializer, BankAccountSerializer, JournalEntrySerializer, AccountingSettingsSerializer, BankReconciliationSerializer, BankStatementLineSerializer
from rest_framework.views import APIView
from django.db.models import Sum, Value
from django.db.models.functions import Coalesce
import django_filters.rest_framework as filters
import django_filters.rest_framework as status_filters
from rest_framework import filters as drf_filters
from core.api_auth import get_current_org
from core.permissions import HasRolePermission
from patients.views import StandardResultsSetPagination

class AccountingBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRolePermission]
    permission_module = 'accounting'
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        org = get_current_org(self.request)
        return self.queryset.filter(organization=org)

    def perform_create(self, serializer):
        org = get_current_org(self.request)
        serializer.save(organization=org)
class AccountViewSet(AccountingBaseViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [filters.DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = ['account_type', 'is_active', 'is_system_account']
    search_fields = ['name', 'code', 'description']

    def _get_balances(self, queryset):
        """Helper to annotate accounts with their current balance based on account type."""
        # Calculate sum of debits and credits for each account
        annotated = queryset.annotate(
            total_debit=Coalesce(Sum('journal_lines__debit', filter=models.Q(journal_lines__entry__status=JournalEntry.Status.POSTED)), Value(0.0)),
            total_credit=Coalesce(Sum('journal_lines__credit', filter=models.Q(journal_lines__entry__status=JournalEntry.Status.POSTED)), Value(0.0))
        )
        
        results = []
        for account in annotated:
            # Asset & Expense: Normal Debit Balance
            if account.account_type in [Account.Type.ASSET, Account.Type.EXPENSE]:
                balance = account.total_debit - account.total_credit
            # Liability, Equity, Revenue: Normal Credit Balance
            else:
                balance = account.total_credit - account.total_debit
                
            results.append({
                'id': account.id,
                'name': account.name,
                'code': account.code,
                'type': account.account_type,
                'total_debit': account.total_debit,
                'total_credit': account.total_credit,
                'balance': balance
            })
        return results

    @action(detail=False, methods=['get'])
    def trial_balance(self, request):
        accounts = self._get_balances(self.get_queryset())
        
        total_dr = sum(acc['total_debit'] for acc in accounts)
        total_cr = sum(acc['total_credit'] for acc in accounts)
        
        return Response({
            'accounts': accounts,
            'total_debit': total_dr,
            'total_credit': total_cr,
            'is_balanced': total_dr == total_cr
        })

    @action(detail=False, methods=['get'])
    def income_statement(self, request):
        accounts = self._get_balances(self.get_queryset().filter(
            account_type__in=[Account.Type.REVENUE, Account.Type.EXPENSE]
        ))
        
        revenue = [a for a in accounts if a['type'] == Account.Type.REVENUE]
        expenses = [a for a in accounts if a['type'] == Account.Type.EXPENSE]
        
        total_rev = sum(a['balance'] for a in revenue)
        total_exp = sum(a['balance'] for a in expenses)
        
        return Response({
            'revenue': revenue,
            'total_revenue': total_rev,
            'expenses': expenses,
            'total_expenses': total_exp,
            'net_income': total_rev - total_exp
        })

    @action(detail=False, methods=['get'])
    def balance_sheet(self, request):
        accounts = self._get_balances(self.get_queryset().filter(
            account_type__in=[Account.Type.ASSET, Account.Type.LIABILITY, Account.Type.EQUITY]
        ))
        
        assets = [a for a in accounts if a['type'] == Account.Type.ASSET]
        liabilities = [a for a in accounts if a['type'] == Account.Type.LIABILITY]
        equity = [a for a in accounts if a['type'] == Account.Type.EQUITY]
        
        total_assets = sum(a['balance'] for a in assets)
        total_liabilities = sum(a['balance'] for a in liabilities)
        total_equity = sum(a['balance'] for a in equity)
        
        return Response({
            'assets': assets,
            'total_assets': total_assets,
            'liabilities': liabilities,
            'total_liabilities': total_liabilities,
            'equity': equity,
            'total_equity': total_equity,
            'is_balanced': total_assets == (total_liabilities + total_equity)
        })

    @action(detail=True, methods=['get'])
    def general_ledger(self, request, pk=None):
        account = self.get_object()
        lines = account.journal_lines.filter(entry__status=JournalEntry.Status.POSTED).select_related('entry').order_by('entry__date', 'id')
        
        ledger_entries = []
        running_balance = 0.0
        
        for line in lines:
            if account.account_type in [Account.Type.ASSET, Account.Type.EXPENSE]:
                running_balance += (float(line.debit) - float(line.credit))
            else:
                running_balance += (float(line.credit) - float(line.debit))
                
            ledger_entries.append({
                'date': line.entry.date,
                'reference': line.entry.reference_number,
                'description': line.entry.description or line.description,
                'debit': line.debit,
                'credit': line.credit,
                'balance': running_balance
            })
            
        return Response({
            'account': AccountSerializer(account).data,
            'entries': ledger_entries,
            'current_balance': running_balance
        })

class BankAccountViewSet(AccountingBaseViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    filter_backends = [filters.DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = ['account_type', 'is_active']
    search_fields = ['name', 'bank_name', 'account_number']

    @action(detail=True, methods=['post'])
    def settle_cc(self, request, pk=None):
        from .services import AccountingService
        from decimal import Decimal
        holding_bank = self.get_object()
        
        if holding_bank.account_type != BankAccount.Type.HOLDING_CC:
            return Response({'detail': 'Not a CC Holding Account'}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data
        destination_bank_id = data.get('destination_bank_id')
        amount = Decimal(str(data.get('amount', '0')))
        fee_amount = Decimal(str(data.get('fee_amount', '0')))
        desc = data.get('description', '')
        
        if not destination_bank_id or amount <= 0:
            return Response({'detail': 'Destination bank and amount > 0 are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        destination_bank = BankAccount.objects.filter(id=destination_bank_id, organization=holding_bank.organization).first()
        if not destination_bank:
            return Response({'detail': 'Invalid destination bank'}, status=status.HTTP_400_BAD_REQUEST)
            
        AccountingService.settle_credit_card_batch(
            holding_bank.organization,
            holding_bank.ledger_account,
            destination_bank.ledger_account,
            amount,
            fee_amount,
            desc
        )
        return Response({'status': 'settled'})

    @action(detail=True, methods=['post'])
    def clear_check(self, request, pk=None):
        from .services import AccountingService
        from decimal import Decimal
        holding_bank = self.get_object()
        
        if holding_bank.account_type != BankAccount.Type.HOLDING_CHECK:
            return Response({'detail': 'Not a Check Holding Account'}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data
        destination_bank_id = data.get('destination_bank_id')
        amount = Decimal(str(data.get('amount', '0')))
        desc = data.get('description', '')
        
        if not destination_bank_id or amount <= 0:
            return Response({'detail': 'Destination bank and amount > 0 are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        destination_bank = BankAccount.objects.filter(id=destination_bank_id, organization=holding_bank.organization).first()
        if not destination_bank:
            return Response({'detail': 'Invalid destination bank'}, status=status.HTTP_400_BAD_REQUEST)
            
        AccountingService.clear_check(
            holding_bank.organization,
            holding_bank.ledger_account,
            destination_bank.ledger_account,
            amount,
            desc
        )
        return Response({'status': 'cleared'})

    @action(detail=True, methods=['post'], url_path='import_statement', parser_classes=None)
    @transaction.atomic
    def import_statement(self, request, pk=None):
        """
        Upload a CSV or OFX bank statement file.
        Parses transactions, deduplicates against existing lines, runs auto-match.
        Returns import summary including batch UUID.
        """
        import uuid as uuid_mod
        from .parsers import parse_csv, parse_ofx
        from .services import auto_match_statement_lines
        from .models import BankStatementLine

        bank = self.get_object()
        org = bank.organization

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'detail': 'No file uploaded. Use multipart field "file".'}, status=status.HTTP_400_BAD_REQUEST)

        filename = uploaded_file.name.lower()
        try:
            if filename.endswith('.csv'):
                rows = parse_csv(uploaded_file)
            elif filename.endswith('.ofx') or filename.endswith('.qfx'):
                rows = parse_ofx(uploaded_file)
            else:
                return Response(
                    {'detail': 'Unsupported file type. Upload a .csv or .ofx file.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return Response({'detail': 'No transactions found in the uploaded file.'}, status=status.HTTP_400_BAD_REQUEST)

        import_batch = uuid_mod.uuid4()
        created_lines = []
        duplicate_count = 0

        for row in rows:
            # Duplicate guard: same bank_account + date + amount + reference across all batches
            exists = BankStatementLine.objects.filter(
                bank_account=bank,
                date=row['date'],
                amount=row['amount'],
                reference=row['reference'],
            ).exists()
            if exists:
                duplicate_count += 1
                continue

            line = BankStatementLine.objects.create(
                organization=org,
                bank_account=bank,
                import_batch=import_batch,
                date=row['date'],
                description=row['description'],
                reference=row['reference'],
                amount=row['amount'],
                raw_text=row['raw_text'],
            )
            created_lines.append(line)

        match_result = auto_match_statement_lines(bank, created_lines)

        return Response({
            'import_batch': str(import_batch),
            'total_parsed': len(rows),
            'imported': len(created_lines),
            'duplicates_skipped': duplicate_count,
            'auto_matched': match_result['matched'],
            'unmatched': match_result['unmatched'],
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='recon_summary')
    def recon_summary(self, request, pk=None):
        """
        Returns reconciliation math for a bank account:
        - book_balance: net balance of all POSTED JE lines on the ledger account
        - cleared_balance: net balance of only cleared lines
        - outstanding_deposits: uncleared debit lines (money expected but not on statement yet)
        - outstanding_payments: uncleared credit lines (payments not yet on statement)
        - adjusted_book_balance: cleared_balance (what statement should show)
        """
        from django.db.models import Sum
        from decimal import Decimal

        bank = self.get_object()
        ledger = bank.ledger_account

        posted_lines = JournalEntryLine.objects.filter(
            account=ledger,
            entry__status=JournalEntry.Status.POSTED,
        )

        def net(qs):
            agg = qs.aggregate(dr=Sum('debit'), cr=Sum('credit'))
            return (agg['dr'] or Decimal('0')) - (agg['cr'] or Decimal('0'))

        book_balance = net(posted_lines)
        cleared_balance = net(posted_lines.filter(is_cleared=True))

        uncleared = posted_lines.filter(is_cleared=False)
        outstanding_deposits = (uncleared.aggregate(s=Sum('debit'))['s'] or Decimal('0'))
        outstanding_payments = (uncleared.aggregate(s=Sum('credit'))['s'] or Decimal('0'))

        return Response({
            'book_balance': book_balance,
            'cleared_balance': cleared_balance,
            'outstanding_deposits': outstanding_deposits,
            'outstanding_payments': outstanding_payments,
            'adjusted_book_balance': cleared_balance,
        })

class JournalEntryViewSet(AccountingBaseViewSet):
    queryset = JournalEntry.objects.all().prefetch_related('lines__account')
    serializer_class = JournalEntrySerializer
    filter_backends = [filters.DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_fields = ['status', 'source_model']
    search_fields = ['reference_number', 'description']

    def get_queryset(self):
        return super().get_queryset().order_by('-date', '-created_at')

    def perform_destroy(self, instance):
        if instance.status == 'POSTED':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Posted journal entries cannot be deleted. Create a reversing entry instead."
            )
        instance.delete()

    @transaction.atomic
    def perform_create(self, serializer):
        from .models import JournalEntryLine, AccountingSettings
        from decimal import Decimal
        from rest_framework import serializers

        org = get_current_org(self.request)
        
        settings = AccountingSettings.objects.filter(organization=org).first()
        entry_date = serializer.validated_data.get('date')
        if settings and settings.closed_books_date and entry_date <= settings.closed_books_date:
            raise serializers.ValidationError({"date": ["Cannot post journal entries on or before the closed books date."]})

        lines_data = serializer.validated_data.pop('lines_data', [])
        
        total_debit = Decimal('0.00')
        total_credit = Decimal('0.00')
        
        for line in lines_data:
            total_debit += Decimal(str(line.get('debit', '0')))
            total_credit += Decimal(str(line.get('credit', '0')))
            
        if not lines_data or total_debit != total_credit or total_debit == 0:
            raise serializers.ValidationError({"non_field_errors": ["Journal entry must have balanced, non-zero lines. Total Debits must equal Total Credits."]})
            
        # Hardcode manual entries to POSTED
        entry = serializer.save(organization=org, status='POSTED')
        
        for line in lines_data:
            JournalEntryLine.objects.create(
                entry=entry,
                account_id=line.get('account'),
                description=line.get('description', ''),
                debit=Decimal(str(line.get('debit', '0'))),
                credit=Decimal(str(line.get('credit', '0')))
            )

    @action(detail=True, methods=['post'])
    def reverse(self, request, pk=None):
        from .models import JournalEntryLine, AccountingSettings
        from decimal import Decimal
        from django.utils import timezone
        
        entry = self.get_object()
        
        if entry.status != JournalEntry.Status.POSTED:
            return Response({'detail': 'Can only reverse posted entries.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if entry.reversed_by:
            return Response({'detail': 'Entry has already been reversed.'}, status=status.HTTP_400_BAD_REQUEST)
            
        settings = AccountingSettings.objects.filter(organization=entry.organization).first()
        today = timezone.now().date()
        if settings and settings.closed_books_date and today <= settings.closed_books_date:
            return Response({'detail': 'Cannot post reversal in a closed period.'}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            reversal = JournalEntry.objects.create(
                organization=entry.organization,
                date=today,
                reference_number=f"REV-{entry.reference_number or entry.id}",
                description=f"Reversal of {entry.reference_number or entry.id}",
                status=JournalEntry.Status.POSTED,
                source_model=entry.source_model,
                source_id=entry.source_id
            )
            
            for line in entry.lines.all():
                JournalEntryLine.objects.create(
                    entry=reversal,
                    account=line.account,
                    description=line.description,
                    debit=line.credit,   # Swap debit/credit
                    credit=line.debit
                )
                
            entry.reversed_by = reversal
            entry.save(update_fields=['reversed_by'])
            
        return Response({'status': 'reversed', 'reversal_id': reversal.id})

class BankReconciliationViewSet(AccountingBaseViewSet):
    """
    Manages bank reconciliation statements and clearing of journal lines.
    """
    queryset = BankReconciliation.objects.all()
    serializer_class = BankReconciliationSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['bank_account', 'is_completed']

    @action(detail=False, methods=['get'])
    def uncleared_lines(self, request):
        """Fetch all uncleared journal lines for a specific bank account."""
        bank_id = request.query_params.get('bank_account')
        if not bank_id:
            return Response({'detail': 'bank_account parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            bank = BankAccount.objects.get(id=bank_id, organization=get_current_org(request))
        except BankAccount.DoesNotExist:
            return Response({'detail': 'Bank account not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Lines attached to this bank's ledger account that are POSTED and not cleared
        lines = bank.ledger_account.journal_lines.filter(
            entry__status=JournalEntry.Status.POSTED,
            is_cleared=False
        ).select_related('entry').order_by('entry__date')
        
        data = []
        for line in lines:
            data.append({
                'id': line.id,
                'date': line.entry.date,
                'reference': line.entry.reference_number,
                'description': line.entry.description or line.description,
                'debit': line.debit,
                'credit': line.credit
            })
            
        return Response(data)

    @action(detail=True, methods=['post'])
    def clear_lines(self, request, pk=None):
        """Mark a list of line IDs as cleared against this reconciliation."""
        recon = self.get_object()
        if recon.is_completed:
            return Response({'detail': 'Cannot modify a completed reconciliation.'}, status=status.HTTP_400_BAD_REQUEST)
            
        line_ids = request.data.get('line_ids', [])
        if not isinstance(line_ids, list):
            return Response({'detail': 'line_ids must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db import transaction
        with transaction.atomic():
            lines = JournalEntryLine.objects.filter(
                id__in=line_ids,
                account=recon.bank_account.ledger_account,
                is_cleared=False
            )
            updated = lines.update(is_cleared=True, reconciliation=recon)
            
        return Response({'status': 'cleared', 'updated_count': updated})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        recon = self.get_object()
        recon.is_completed = True
        recon.save()
        return Response({'status': 'completed'})

class StatementLineViewSet(AccountingBaseViewSet):
    """
    CRUD + match/unmatch/ignore for imported bank statement lines.
    """
    queryset = BankStatementLine.objects.all().select_related(
        'bank_account', 'matched_journal_line__entry',
    )
    serializer_class = BankStatementLineSerializer
    filter_backends = [drf_filters.SearchFilter, status_filters.DjangoFilterBackend]
    filterset_fields = ['bank_account', 'status', 'import_batch']
    search_fields = ['description', 'reference']

    # Statement lines are read-created by the import endpoint; disallow manual creates via this viewset
    http_method_names = ['get', 'head', 'options', 'post']

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def match(self, request, pk=None):
        """Manually match a statement line to a journal entry line."""
        stmt_line = self.get_object()
        je_line_id = request.data.get('journal_line_id')

        if stmt_line.status == BankStatementLine.Status.MATCHED:
            return Response({'detail': 'Already matched.'}, status=status.HTTP_400_BAD_REQUEST)

        if not je_line_id:
            return Response({'detail': 'journal_line_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            je_line = JournalEntryLine.objects.get(
                pk=je_line_id,
                account=stmt_line.bank_account.ledger_account,
                is_cleared=False,
            )
        except JournalEntryLine.DoesNotExist:
            return Response(
                {'detail': 'Journal entry line not found, already cleared, or belongs to a different account.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Ensure no other statement line is already matched to this JE line
        if hasattr(je_line, 'statement_match'):
            return Response({'detail': 'This journal entry line is already matched to another statement line.'}, status=status.HTTP_400_BAD_REQUEST)

        stmt_line.matched_journal_line = je_line
        stmt_line.status = BankStatementLine.Status.MATCHED
        stmt_line.save(update_fields=['matched_journal_line', 'status'])

        je_line.is_cleared = True
        je_line.save(update_fields=['is_cleared'])

        return Response(BankStatementLineSerializer(stmt_line, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def unmatch(self, request, pk=None):
        """Remove a match, restoring the journal entry line to uncleared."""
        stmt_line = self.get_object()

        if stmt_line.status != BankStatementLine.Status.MATCHED:
            return Response({'detail': 'Line is not matched.'}, status=status.HTTP_400_BAD_REQUEST)

        je_line = stmt_line.matched_journal_line
        if je_line:
            je_line.is_cleared = False
            je_line.save(update_fields=['is_cleared'])

        stmt_line.matched_journal_line = None
        stmt_line.status = BankStatementLine.Status.UNMATCHED
        stmt_line.save(update_fields=['matched_journal_line', 'status'])

        return Response(BankStatementLineSerializer(stmt_line, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def ignore(self, request, pk=None):
        """Mark a statement line as ignored (no journal entry needed)."""
        stmt_line = self.get_object()
        if stmt_line.status == BankStatementLine.Status.MATCHED:
            return Response({'detail': 'Cannot ignore a matched line — unmatch it first.'}, status=status.HTTP_400_BAD_REQUEST)
        stmt_line.status = BankStatementLine.Status.IGNORED
        stmt_line.save(update_fields=['status'])
        return Response(BankStatementLineSerializer(stmt_line, context={'request': request}).data)


class AccountingSettingsView(APIView):
    """
    Singleton API endpoint to get/update Accounting Settings.
    """
    def get(self, request):
        org = get_current_org(request)
        settings, _ = AccountingSettings.objects.get_or_create(organization=org)
        serializer = AccountingSettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        org = get_current_org(request)
        settings, _ = AccountingSettings.objects.get_or_create(organization=org)
        serializer = AccountingSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
