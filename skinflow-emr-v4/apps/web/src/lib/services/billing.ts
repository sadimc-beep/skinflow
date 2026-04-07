import { fetchApi } from '../api';
import type { Invoice, Payment, PaginatedResponse, InvoiceItem } from '@/types/models';

const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'http://127.0.0.1:8000';

async function downloadPdfBlob(endpoint: string, filename: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('skinflow_access_token') : null;
    const headers: Record<string, string> = { Accept: 'application/pdf' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${DJANGO_BASE_URL}/api/${endpoint}`, { headers });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export const billingApi = {
    invoices: {
        list: (params?: { patient?: number; status?: string; limit?: number }) =>
            fetchApi<PaginatedResponse<Invoice>>('billing/invoices', { params }),

        get: (id: number | string) =>
            fetchApi<Invoice>(`billing/invoices/${id}`),

        generateFull: (consultationId: number) =>
            fetchApi<Invoice>('billing/invoices/generate-from-consultation', {
                method: 'POST',
                body: JSON.stringify({ consultation_id: consultationId }),
            }),

        generatePartial: (consultationId: number, procedure_ids: number[], product_ids: number[]) =>
            fetchApi<Invoice>('billing/invoices/generate-partial', {
                method: 'POST',
                body: JSON.stringify({
                    consultation_id: consultationId,
                    procedure_ids,
                    product_ids
                }),
            }),

        downloadPdf: (id: number | string) =>
            downloadPdfBlob(`billing/invoices/${id}/pdf/`, `invoice_${id}.pdf`),
    },

    payments: {
        create: (data: Partial<Payment>) =>
            fetchApi<Payment>('billing/payments', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },

    entitlements: {
        list: (params?: { patient?: number; is_active?: boolean; limit?: number }) =>
            fetchApi<PaginatedResponse<any>>('billing/entitlements', { params }), // using any for Entitlement to avoid circular cross-imports if models isn't fully robust
    },

    invoiceItems: {
        list: (params?: { invoice?: number; is_fulfilled?: string | boolean; reference_model?: string; limit?: number }) =>
            fetchApi<PaginatedResponse<InvoiceItem>>('billing/invoice-items', { params }),

        markFulfilled: (id: number | string) =>
            fetchApi<{ status: string, fulfilled_at: string }>(`billing/invoice-items/${id}/mark_fulfilled`, {
                method: 'POST',
            }),
    }
};
