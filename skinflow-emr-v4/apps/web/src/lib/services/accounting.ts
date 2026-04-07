import { fetchApi } from '../api';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

async function uploadStatementFile(bankId: string | number, file: File) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('skinflow_access_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${DJANGO_BASE_URL}/api/accounting/banks/${bankId}/import_statement/`, {
        method: 'POST',
        headers,
        body: form,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${res.status})`);
    }
    return res.json();
}

export const accountingApi = {
    // Settings
    getSettings: () => fetchApi('accounting/settings/'),
    updateSettings: (data: any) => fetchApi('accounting/settings/', { method: 'PATCH', body: JSON.stringify(data) }),

    // Accounts (Chart of Accounts)
    getAccounts: (params?: any) => fetchApi('accounting/accounts/', { params }),
    getAccount: (id: string | number) => fetchApi(`accounting/accounts/${id}/`),
    createAccount: (data: any) => fetchApi('accounting/accounts/', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (id: string | number, data: any) => fetchApi(`accounting/accounts/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteAccount: (id: string | number) => fetchApi(`accounting/accounts/${id}/`, { method: 'DELETE' }),

    // Bank Accounts
    getBankAccounts: (params?: any) => fetchApi('accounting/banks/', { params }),
    createBankAccount: (data: any) => fetchApi('accounting/banks/', { method: 'POST', body: JSON.stringify(data) }),
    updateBankAccount: (id: string | number, data: any) => fetchApi(`accounting/banks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    clearCheck: (id: string | number, data: any) => fetchApi(`accounting/banks/${id}/clear_check/`, { method: 'POST', body: JSON.stringify(data) }),
    settleCc: (id: string | number, data: any) => fetchApi(`accounting/banks/${id}/settle_cc/`, { method: 'POST', body: JSON.stringify(data) }),

    // Journal Entries
    getJournals: (params?: any) => fetchApi('accounting/journals/', { params }),
    createJournal: (data: any) => fetchApi('accounting/journals/', { method: 'POST', body: JSON.stringify(data) }),
    reverseJournal: (id: string | number) => fetchApi(`accounting/journals/${id}/reverse/`, { method: 'POST' }),

    // Bank Reconciliations
    getReconciliations: (params?: any) => fetchApi('accounting/reconciliations/', { params }),
    getReconciliation: (id: string | number) => fetchApi(`accounting/reconciliations/${id}/`),
    createReconciliation: (data: any) => fetchApi('accounting/reconciliations/', { method: 'POST', body: JSON.stringify(data) }),
    getUnclearedLines: (bankId: string | number) => fetchApi(`accounting/reconciliations/uncleared_lines/?bank_account=${bankId}`),
    clearReconciliationLines: (id: string | number, data: any) => fetchApi(`accounting/reconciliations/${id}/clear_lines/`, { method: 'POST', body: JSON.stringify(data) }),
    completeReconciliation: (id: string | number) => fetchApi(`accounting/reconciliations/${id}/complete/`, { method: 'POST' }),

    // Financial Reports
    getGeneralLedger: (accountId: string | number) => fetchApi(`accounting/accounts/${accountId}/general_ledger/`),
    getTrialBalance: () => fetchApi('accounting/accounts/trial_balance/'),
    getIncomeStatement: () => fetchApi('accounting/accounts/income_statement/'),
    getBalanceSheet: () => fetchApi('accounting/accounts/balance_sheet/'),

    // Bank Statement Lines
    getStatementLines: (bankId: string | number, params?: any) =>
        fetchApi('accounting/statement-lines/', { params: { bank_account: bankId, ...params } }),
    matchStatementLine: (id: string | number, data: { journal_line_id: number }) =>
        fetchApi(`accounting/statement-lines/${id}/match/`, { method: 'POST', body: JSON.stringify(data) }),
    unmatchStatementLine: (id: string | number) =>
        fetchApi(`accounting/statement-lines/${id}/unmatch/`, { method: 'POST' }),
    ignoreStatementLine: (id: string | number) =>
        fetchApi(`accounting/statement-lines/${id}/ignore/`, { method: 'POST' }),
    uploadStatement: uploadStatementFile,

    // Recon Summary
    getReconSummary: (bankId: string | number) => fetchApi(`accounting/banks/${bankId}/recon_summary/`),
};
