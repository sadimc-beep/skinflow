import { fetchApi } from '../api';
import type { Patient, PatientFormData, PaginatedResponse } from '@/types/models';

export const patientsApi = {
    list: (params?: { search?: string; limit?: number; offset?: number }) =>
        fetchApi<PaginatedResponse<Patient>>('patients', { params }),

    get: (id: number | string) =>
        fetchApi<Patient>(`patients/${id}`),

    create: (data: PatientFormData) =>
        fetchApi<Patient>('patients', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: number | string, data: Partial<PatientFormData>) =>
        fetchApi<Patient>(`patients/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (id: number | string) =>
        fetchApi<void>(`patients/${id}`, {
            method: 'DELETE',
        }),
};
