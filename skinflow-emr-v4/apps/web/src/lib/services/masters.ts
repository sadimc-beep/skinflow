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
        /** Search the local MedicineMaster catalog (21k+ entries from Kaggle) */
        search: (searchQuery?: string) =>
            fetchApi<PaginatedResponse<MedicineMaster>>('masters/medicines', {
                params: searchQuery ? { search: searchQuery } : undefined
            }),
        /** Search via the external Pharmaseed API (proxied through Django to hide the key) */
        pharmaseedSearch: (searchQuery: string) =>
            fetchApi<PharmaseedMedicine[]>('masters/medicines/pharmaseed-search', {
                params: { search: searchQuery }
            }),
    },
    procedureTypes: {
        search: (searchQuery?: string) =>
            fetchApi<PaginatedResponse<ProcedureType>>('masters/procedure-types', {
                params: searchQuery ? { search: searchQuery } : undefined
            }),
    },
    procedureRooms: {
        list: () =>
            fetchApi<PaginatedResponse<{ id: number; name: string; is_active: boolean }>>('masters/procedure-rooms'),
    },
};
