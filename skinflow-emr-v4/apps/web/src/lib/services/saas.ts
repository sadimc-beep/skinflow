import { fetchApi } from '@/lib/api';

/* ─── Types ───────────────────────────────────────────────────── */
export interface Plan {
    id: number;
    name: string;
    description: string;
    base_price_monthly: string;
    base_price_annual: string;
    included_users: number;
    price_per_extra_user: string;
    included_branches: number;
    price_per_extra_branch: string;
    features: Record<string, boolean>;
    is_active: boolean;
    sort_order: number;
}

export interface SaaSOrganization {
    id: number;
    name: string;
    slug: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    onboarded_at: string | null;
    created_at: string;
    subscription_status: string;
    plan_name: string | null;
    active_users: number;
    branch_count: number;
    last_login: string | null;
}

export interface Branch {
    id: number;
    organization: number;
    name: string;
    address: string;
    phone: string;
    is_active: boolean;
    is_headquarters: boolean;
    staff_count: number;
    created_at: string;
}

export interface ClinicStaffMember {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        is_active: boolean;
        date_joined: string;
        last_login: string | null;
    };
    organization: number;
    role: number | null;
    role_name: string | null;
    branches: number[];
    branch_names: string[];
    is_org_admin: boolean;
    is_active: boolean;
    created_at: string;
}

export interface OrgRole {
    id: number;
    organization: number;
    name: string;
    description: string;
    permissions: Record<string, string[]>;
    staff_count: number;
    created_at: string;
}

export interface Subscription {
    id: number;
    organization: number;
    organization_name: string;
    plan: number;
    plan_name: string;
    billing_cycle: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    next_billing_date: string | null;
    extra_users: number;
    extra_branches: number;
    has_marketing_addon: boolean;
    monthly_amount: string;
    max_users: number;
    max_branches: number;
    current_users: number;
    current_branches: number;
}

export interface AuditLogEntry {
    id: number;
    user: number | null;
    user_display: string;
    impersonated_by: number | null;
    organization: number | null;
    organization_name: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    changes: Record<string, any>;
    ip_address: string | null;
    created_at: string;
}

export interface Announcement {
    id: number;
    title: string;
    body: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    target: 'ALL' | 'SPECIFIC';
    target_organizations: number[];
    published_at: string | null;
    expires_at: string | null;
    created_at: string;
}

/* ─── API Functions ───────────────────────────────────────────── */
export const saasApi = {
    // Plans
    listPlans: () => fetchApi<Plan[]>('/saas/plans/'),
    createPlan: (data: Partial<Plan>) => fetchApi<Plan>('/saas/plans/', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id: number, data: Partial<Plan>) => fetchApi<Plan>(`/saas/plans/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePlan: (id: number) => fetchApi(`/saas/plans/${id}/`, { method: 'DELETE' }),

    // Organizations
    listOrganizations: () => fetchApi<SaaSOrganization[]>('/saas/organizations/'),
    getOrganization: (id: number) => fetchApi<SaaSOrganization>(`/saas/organizations/${id}/`),
    createOrganization: (data: Partial<SaaSOrganization>) => fetchApi<SaaSOrganization>('/saas/organizations/', { method: 'POST', body: JSON.stringify(data) }),
    updateOrganization: (id: number, data: Partial<SaaSOrganization>) => fetchApi<SaaSOrganization>(`/saas/organizations/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Branches under org
    listBranches: (orgId: number) => fetchApi<Branch[]>(`/saas/organizations/${orgId}/branches/`),
    createBranch: (orgId: number, data: Partial<Branch>) => fetchApi<Branch>(`/saas/organizations/${orgId}/branches/`, { method: 'POST', body: JSON.stringify(data) }),
    updateBranch: (orgId: number, branchId: number, data: Partial<Branch>) => fetchApi<Branch>(`/saas/organizations/${orgId}/branches/`, { method: 'PATCH', body: JSON.stringify({ ...data, id: branchId }) }),
    deleteBranch: (orgId: number, branchId: number) => fetchApi(`/saas/organizations/${orgId}/branches/`, { method: 'DELETE', body: JSON.stringify({ id: branchId }) }),

    // Users under org
    listUsers: (orgId: number) => fetchApi<ClinicStaffMember[]>(`/saas/organizations/${orgId}/users/`),
    createUser: (orgId: number, data: any) => fetchApi<ClinicStaffMember>(`/saas/organizations/${orgId}/users/`, { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (orgId: number, userId: number, data: any) => fetchApi<ClinicStaffMember>(`/saas/organizations/${orgId}/users/`, { method: 'PATCH', body: JSON.stringify({ ...data, id: userId }) }),
    deleteUser: (orgId: number, userId: number) => fetchApi(`/saas/organizations/${orgId}/users/`, { method: 'DELETE', body: JSON.stringify({ id: userId }) }),

    // Roles under org
    listRoles: (orgId: number) => fetchApi<OrgRole[]>(`/saas/organizations/${orgId}/roles/`),
    createRole: (orgId: number, data: Partial<OrgRole>) => fetchApi<OrgRole>(`/saas/organizations/${orgId}/roles/`, { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (orgId: number, roleId: number, data: Partial<OrgRole>) => fetchApi<OrgRole>(`/saas/organizations/${orgId}/roles/`, { method: 'PATCH', body: JSON.stringify({ ...data, id: roleId }) }),
    deleteRole: (orgId: number, roleId: number) => fetchApi(`/saas/organizations/${orgId}/roles/`, { method: 'DELETE', body: JSON.stringify({ id: roleId }) }),

    // Subscription for an org
    getSubscription: (orgId: number) => fetchApi<Subscription>(`/saas/organizations/${orgId}/subscription/`),
    listSubscriptions: () => fetchApi<Subscription[]>('/saas/subscriptions/'),
    createSubscription: (data: Partial<Subscription>) => fetchApi<Subscription>('/saas/subscriptions/', { method: 'POST', body: JSON.stringify(data) }),
    updateSubscription: (id: number, data: Partial<Subscription>) => fetchApi<Subscription>(`/saas/subscriptions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Audit logs
    listAuditLogs: (params?: Record<string, string>) => fetchApi<AuditLogEntry[]>('/saas/audit-logs/', { params }),
    getOrgAuditLog: (orgId: number) => fetchApi<AuditLogEntry[]>(`/saas/organizations/${orgId}/audit_log/`),

    // Announcements
    listAnnouncements: () => fetchApi<Announcement[]>('/saas/announcements/'),
    createAnnouncement: (data: Partial<Announcement>) => fetchApi<Announcement>('/saas/announcements/', { method: 'POST', body: JSON.stringify(data) }),
    updateAnnouncement: (id: number, data: Partial<Announcement>) => fetchApi<Announcement>(`/saas/announcements/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteAnnouncement: (id: number) => fetchApi(`/saas/announcements/${id}/`, { method: 'DELETE' }),

    // Impersonation
    startImpersonation: (orgId: number, reason: string) => fetchApi<any>('/saas/impersonation/', { method: 'POST', body: JSON.stringify({ organization_id: orgId, reason }) }),
};
