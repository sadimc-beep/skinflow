import { fetchApi } from '../api';
import type { Provider, Appointment, AppointmentFormData, PaginatedResponse } from '@/types/models';

export const coreApi = {
    providers: {
        list: (params?: { is_active?: boolean }) =>
            fetchApi<PaginatedResponse<Provider>>('core/providers', { params }),
        get: (id: number | string) =>
            fetchApi<Provider>(`core/providers/${id}`),
    }
};

export const appointmentsApi = {
    list: (params?: { date?: string; provider?: number; status?: string }) =>
        fetchApi<PaginatedResponse<Appointment>>('clinical/appointments', { params }),

    get: (id: number | string) =>
        fetchApi<Appointment>(`clinical/appointments/${id}`),

    create: (data: AppointmentFormData) =>
        fetchApi<Appointment>('clinical/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: number | string, data: Partial<AppointmentFormData>) =>
        fetchApi<Appointment>(`clinical/appointments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    updateStatus: (id: number | string, status: string) =>
        fetchApi<Appointment>(`clinical/appointments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    checkIn: (id: number | string, fee: number) =>
        fetchApi<{ status: string; invoice_id?: number }>(`clinical/appointments/${id}/check_in`, {
            method: 'POST',
            body: JSON.stringify({ fee }),
        }),

    requestWaiver: (id: number | string, fee: number, reason: string) =>
        fetchApi<{ status: string; waiver_pending: boolean }>(`clinical/appointments/${id}/check_in`, {
            method: 'POST',
            body: JSON.stringify({ fee, fee_waiver_requested: true, fee_waiver_reason: reason }),
        }),

    approveWaiver: (id: number | string, approved: boolean) =>
        fetchApi<{ status: string }>(`clinical/appointments/${id}/approve_waiver`, {
            method: 'POST',
            body: JSON.stringify({ approved }),
        }),
};
