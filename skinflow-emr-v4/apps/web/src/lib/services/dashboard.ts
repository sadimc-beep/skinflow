import { fetchApi } from '../api';

export interface DashboardStats {
    appointments_today: number;
    patients_waiting: number;
    unpaid_invoices: number;
}

export const dashboardApi = {
    getStats: () => fetchApi<DashboardStats>('core/dashboard/stats/'),
};
