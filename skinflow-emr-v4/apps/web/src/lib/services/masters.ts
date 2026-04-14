import { fetchApi } from '../api';
import type { PaginatedResponse } from '@/types/models';

export interface MedicineMaster {
    id: number;
    generic_name: string;
    brand_name: string;
    formulation: string;
    strength: string;
    pharmacology_info?: string;
    pharmaseed_id?: string;
}

/** Shape returned by the Pharmaseed RapidAPI via our proxy endpoint */
export interface PharmaseedMedicine {
    pharmaseed_id: string;
    brand_name: string;
    generic_name: string;
    strength: string;
    form?: string;
    manufacturer?: string;
    pharmacology_info?: string;
}

export interface ProcedureType {
    id: number;
    name: string;
    category?: number;
    description: string;
    duration_minutes: number;
    base_price: string;
}

export const mastersApi = {
    medicines: {
        list: (params?: Record<string, any>) =>
            fetchApi<PaginatedResponse<MedicineMaster>>('masters/medicines', { params }),
        /** Search the local MedicineMaster catalog */
        search: (searchQuery?: string) =>
            fetchApi<PaginatedResponse<MedicineMaster>>('masters/medicines', {
                params: searchQuery ? { search: searchQuery } : undefined
            }),
        /** Search via the external Pharmaseed API (proxied through Django to hide the key) */
        pharmaseedSearch: (searchQuery: string) =>
            fetchApi<PharmaseedMedicine[]>('masters/medicines/pharmaseed-search', {
                params: { search: searchQuery }
            }),
        create: (data: any) =>
            fetchApi<MedicineMaster>('masters/medicines/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) =>
            fetchApi<MedicineMaster>(`masters/medicines/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: number) =>
            fetchApi(`masters/medicines/${id}/`, { method: 'DELETE' }),
    },
    procedureCategories: {
        list: (params?: Record<string, any>) =>
            fetchApi<PaginatedResponse<{ id: number; name: string; description: string }>>('masters/procedure-categories', { params }),
        create: (data: any) =>
            fetchApi('masters/procedure-categories/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) =>
            fetchApi(`masters/procedure-categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: number) =>
            fetchApi(`masters/procedure-categories/${id}/`, { method: 'DELETE' }),
    },
    procedureTypes: {
        search: (searchQuery?: string) =>
            fetchApi<PaginatedResponse<ProcedureType>>('masters/procedure-types', {
                params: searchQuery ? { search: searchQuery } : undefined
            }),
        list: (params?: Record<string, any>) =>
            fetchApi<PaginatedResponse<ProcedureType>>('masters/procedure-types', { params }),
        create: (data: Partial<ProcedureType>) =>
            fetchApi<ProcedureType>('masters/procedure-types/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: Partial<ProcedureType>) =>
            fetchApi<ProcedureType>(`masters/procedure-types/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: number) =>
            fetchApi(`masters/procedure-types/${id}/`, { method: 'DELETE' }),
    },
    procedureRooms: {
        list: (params?: Record<string, any>) =>
            fetchApi<PaginatedResponse<{ id: number; name: string; description: string; is_active: boolean }>>('masters/procedure-rooms', { params }),
        create: (data: any) =>
            fetchApi('masters/procedure-rooms/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) =>
            fetchApi(`masters/procedure-rooms/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: number) =>
            fetchApi(`masters/procedure-rooms/${id}/`, { method: 'DELETE' }),
    },
};
