import { fetchApi } from '@/lib/api';

/* ─── Types ───────────────────────────────────────────────────── */
export interface AccountOverview {
    organization: {
        id: number;
        name: string;
        slug: string;
    };
    subscription: {
        plan_name: string;
        status: string;
        billing_cycle: string;
        current_period_end: string;
        next_billing_date: string | null;
        monthly_amount: string;
        max_users: number;
        current_users: number;
        max_branches: number;
        current_branches: number;
        has_marketing_addon: boolean;
        extra_users: number;
        extra_branches: number;
    } | null;
    invoices: AccountInvoice[];
}

export interface AccountInvoice {
    id: number;
    invoice_number: string;
    period_start: string;
    period_end: string;
    total: string;
    status: string;
    due_date: string;
    paid_at: string | null;
}

/* ─── API Functions ───────────────────────────────────────────── */
export const accountApi = {
    getOverview: () => fetchApi<AccountOverview>('/saas/account/overview/'),
    getInvoices: () => fetchApi<AccountInvoice[]>('/saas/account/invoices/'),
    initiatePayment: (invoiceId: number) => fetchApi<{ redirect_url: string }>(`/saas/account/pay/${invoiceId}/`, { method: 'POST' }),
};
