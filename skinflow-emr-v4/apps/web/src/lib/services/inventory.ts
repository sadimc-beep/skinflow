import { fetchApi } from '../api';
import type { PaginatedResponse } from '@/types/models';

export interface Product {
    id: number;
    name: string;
    sku: string;
    product_type: 'MEDICINE' | 'SKINCARE' | 'CONSUMABLE' | 'DEVICE' | 'OTHER';
    cost_price: string;
    sale_price: string;
    is_saleable: boolean;
    is_stock_tracked: boolean;
    is_procedure_item: boolean;
    is_clinic_item: boolean;
    stock_quantity: number;
}

export const inventoryApi = {
    products: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<Product>>('inventory/products', { params }),
        search: (searchQuery?: string, type?: string, isSaleable?: boolean) => {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (type) params.product_type = type;
            if (isSaleable !== undefined) params.is_saleable = isSaleable;
            return fetchApi<PaginatedResponse<Product>>('inventory/products', { params });
        },
        create: (data: Partial<Product>) => fetchApi<Product>('inventory/products/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: Partial<Product>) => fetchApi<Product>(`inventory/products/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    vendors: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<any>>('inventory/vendors', { params }),
        create: (data: any) => fetchApi('inventory/vendors/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => fetchApi(`inventory/vendors/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: number) => fetchApi(`inventory/vendors/${id}/`, { method: 'DELETE' }),
    },
    purchaseOrders: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<any>>('inventory/purchase-orders', { params }),
        get: (id: number) => fetchApi(`inventory/purchase-orders/${id}/`),
        create: (data: any) => fetchApi('inventory/purchase-orders/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => fetchApi(`inventory/purchase-orders/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    stockLocations: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<any>>('inventory/locations', { params }),
    },
    grns: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<any>>('inventory/grns', { params }),
        create: (data: any) => fetchApi('inventory/grns/', { method: 'POST', body: JSON.stringify(data) }),
        confirm: (id: number) => fetchApi(`inventory/grns/${id}/confirm/`, { method: 'POST' }),
    },
    vendorBills: {
        list: (params?: Record<string, any>) => fetchApi<PaginatedResponse<any>>('inventory/vendor-bills', { params }),
        create: (data: any) => fetchApi('inventory/vendor-bills/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => fetchApi(`inventory/vendor-bills/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    }
};
