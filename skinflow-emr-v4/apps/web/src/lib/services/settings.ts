import { fetchApi } from '../api';

export const settingsApi = {
    // Global Clinic Settings
    getClinicSettings: () => fetchApi('core/settings/'),
    updateClinicSettings: (data: any) => fetchApi('core/settings/', { method: 'PATCH', body: JSON.stringify(data) }),

    // Staff Management
    getStaff: () => fetchApi('core/staff/'),
    createStaff: (data: any) => fetchApi('core/staff/', { method: 'POST', body: JSON.stringify(data) }),
    updateStaff: (id: number, data: any) => fetchApi(`core/staff/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Role Management
    getRoles: () => fetchApi('core/roles/'),
    createRole: (data: any) => fetchApi('core/roles/', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: number, data: any) => fetchApi(`core/roles/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRole: (id: number) => fetchApi(`core/roles/${id}/`, { method: 'DELETE' }),
};
