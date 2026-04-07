'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Users, GitBranch, CreditCard, ScrollText,
    Plus, Shield, Building2, Mail, Phone, MapPin, X, Loader2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { saasApi, SaaSOrganization, ClinicStaffMember, Branch, OrgRole, AuditLogEntry, Plan, Subscription } from '@/lib/services/saas';
import { toast } from 'sonner';

type Tab = 'users' | 'branches' | 'roles' | 'subscription' | 'audit';

/* ─── Reusable field wrapper ─────────────────────────────────── */
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#78706A] uppercase tracking-wider">
                {label}{required && <span className="text-[#C4705A] ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-[10px] text-[#A0978D]">{hint}</p>}
        </div>
    );
}
const inp = "w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D6] bg-white text-sm text-[#1C1917] placeholder:text-[#D9D0C5] focus:outline-none focus:ring-2 focus:ring-[#C4A882]/30 focus:border-[#C4A882] transition";

/* ─── Modal shell ────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E1D6]">
                    <h2 className="font-display text-xl text-[#1C1917]">{title}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#E8E1D6] hover:bg-[#D9D0C5] flex items-center justify-center transition">
                        <X className="w-4 h-4 text-[#1C1917]" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function OrgDetailPage() {
    const { id } = useParams();
    const orgId = Number(id);

    const [org, setOrg] = useState<SaaSOrganization | null>(null);
    const [users, setUsers] = useState<ClinicStaffMember[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [roles, setRoles] = useState<OrgRole[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [loading, setLoading] = useState(true);

    const [showEditOrgModal, setShowEditOrgModal] = useState(false);
    const [savingOrg, setSavingOrg] = useState(false);
    const [orgForm, setOrgForm] = useState({ name: '', slug: '', email: '', phone: '', address: '', is_active: true });

    const openEditOrg = () => {
        if (!org) return;
        setOrgForm({
            name: org.name, slug: org.slug, email: org.email || '', phone: org.phone || '', address: org.address || '', is_active: org.is_active
        });
        setShowEditOrgModal(true);
    };

    const handleEditOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingOrg(true);
        try {
            await saasApi.updateOrganization(orgId, orgForm);
            toast.success('Organization updated successfully.');
            setShowEditOrgModal(false);
            reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update organization.');
        } finally {
            setSavingOrg(false);
        }
    };

    const reload = useCallback(async () => {
        try {
            const [o, u, b, r, a, p] = await Promise.all([
                saasApi.getOrganization(orgId),
                saasApi.listUsers(orgId),
                saasApi.listBranches(orgId),
                saasApi.listRoles(orgId),
                saasApi.getOrgAuditLog(orgId),
                saasApi.listPlans(),
            ]);
            setOrg(o); setUsers(u); setBranches(b); setRoles(r); setAuditLogs(a); setPlans(p);
            saasApi.getSubscription(orgId).then(setSubscription).catch(() => setSubscription(null));
        } catch {
            toast.error('Failed to load organization data.');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { reload(); }, [reload]);

    if (loading || !org) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    const tabs = [
        { key: 'users' as Tab, label: 'Users', icon: Users, count: users.length },
        { key: 'branches' as Tab, label: 'Branches', icon: GitBranch, count: branches.length },
        { key: 'roles' as Tab, label: 'Roles', icon: Shield, count: roles.length },
        { key: 'subscription' as Tab, label: 'Subscription', icon: CreditCard },
        { key: 'audit' as Tab, label: 'Audit Log', icon: ScrollText },
    ];

    return (
        <div className="space-y-6">
            <Link href="/superadmin/organizations" className="inline-flex items-center gap-1.5 text-sm text-[#A0978D] hover:text-[#1C1917] transition">
                <ArrowLeft className="w-4 h-4" /> Back to Organizations
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#E8E1D6] flex items-center justify-center">
                        <span className="text-xl font-bold text-[#1C1917]">{org.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="font-display text-2xl text-[#1C1917] tracking-tight">{org.name}</h1>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#A0978D]">
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {org.slug}</span>
                            {org.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {org.email}</span>}
                            {org.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {org.phone}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${org.is_active ? 'bg-[#7A9E8A]/15 text-[#7A9E8A]' : 'bg-[#C4705A]/15 text-[#C4705A]'}`}>
                        {org.is_active ? 'Active' : 'Suspended'}
                    </span>
                    <button onClick={openEditOrg} className="px-4 py-2 border border-[#E8E1D6] rounded-full text-sm font-semibold text-[#78706A] hover:text-[#1C1917] hover:border-[#D9D0C5] transition shadow-sm bg-white">Edit Details</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#E8E1D6] p-1 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === tab.key ? 'bg-white text-[#1C1917] shadow-sm' : 'text-[#78706A] hover:text-[#1C1917]'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== undefined && <span className="text-[10px] bg-[#E8E1D6] px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                {activeTab === 'users' && <UsersTab orgId={orgId} users={users} roles={roles} branches={branches} onRefresh={reload} subscription={subscription} />}
                {activeTab === 'branches' && <BranchesTab orgId={orgId} branches={branches} onRefresh={reload} />}
                {activeTab === 'roles' && <RolesTab orgId={orgId} roles={roles} onRefresh={reload} />}
                {activeTab === 'subscription' && <SubscriptionTab org={org} plans={plans} subscription={subscription} onRefresh={reload} />}
                {activeTab === 'audit' && <AuditTab logs={auditLogs} />}
            </div>

            {/* Edit Org Modal */}
            {showEditOrgModal && (
                <Modal title="Edit Organization" onClose={() => setShowEditOrgModal(false)}>
                    <form onSubmit={handleEditOrg} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Clinic Name" required>
                                <input className={inp} value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} required />
                            </Field>
                            <Field label="System Slug / Subdomain (Cannot Edit)" required hint="Contact support to change.">
                                <input className={`${inp} bg-[#E8E1D6] text-[#A0978D] cursor-not-allowed`} value={orgForm.slug} disabled />
                            </Field>
                        </div>
                        <Field label="Email Address">
                            <input type="email" className={inp} value={orgForm.email} onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))} />
                        </Field>
                        <Field label="Phone Number">
                            <input className={inp} value={orgForm.phone} onChange={e => setOrgForm(f => ({ ...f, phone: e.target.value }))} />
                        </Field>
                        <Field label="Address">
                            <input className={inp} value={orgForm.address} onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))} />
                        </Field>
                        <Field label="Organization Status">
                            <select className={inp} value={orgForm.is_active ? 'true' : 'false'} onChange={e => setOrgForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                                <option value="true">Active ✅</option>
                                <option value="false">Suspended ⛔️</option>
                            </select>
                        </Field>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E1D6]">
                            <button type="button" onClick={() => setShowEditOrgModal(false)} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                            <button type="submit" disabled={savingOrg} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                {savingOrg && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {savingOrg ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

/* ─── Users Tab ──────────────────────────────────────────────── */
function UsersTab({ orgId, users, roles, branches, onRefresh, subscription }: {
    orgId: number; users: ClinicStaffMember[]; roles: OrgRole[]; branches: Branch[]; onRefresh: () => void; subscription: Subscription | null;
}) {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<ClinicStaffMember | null>(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role_id: '', branch_ids: [] as number[], is_org_admin: false, is_active: true });

    const openCreate = () => {
        if (subscription && users.filter(u => u.is_active).length >= subscription.max_users) {
            toast.error('User limit reached. Increase subscription quota first.');
            return;
        }
        setEditingUser(null);
        setForm({ first_name: '', last_name: '', email: '', password: '', role_id: '', branch_ids: [], is_org_admin: false, is_active: true });
        setShowModal(true);
    };

    const openEdit = (staff: ClinicStaffMember) => {
        setEditingUser(staff);
        setForm({
            first_name: staff.user.first_name || '',
            last_name: staff.user.last_name || '',
            email: staff.user.email,
            password: '', // Leave blank unless they want to reset it
            role_id: staff.role ? staff.role.toString() : '',
            branch_ids: staff.branches,
            is_org_admin: staff.is_org_admin,
            is_active: staff.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                role_id: form.role_id ? Number(form.role_id) : null,
                branch_ids: form.branch_ids,
                is_org_admin: form.is_org_admin,
                is_active: form.is_active,
                ...(form.password ? { password: form.password } : {})
            };

            if (editingUser) {
                await saasApi.updateUser(orgId, editingUser.id, payload);
                toast.success('User updated successfully.');
            } else {
                await saasApi.createUser(orgId, { ...payload, password: form.password });
                toast.success('User created and added to organization.');
            }
            setShowModal(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save user.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E1D6]">
                <div>
                    <h3 className="font-semibold text-[#1C1917]">Staff Members</h3>
                    {subscription && (
                        <p className="text-xs text-[#A0978D] mt-0.5">{users.filter(u => u.is_active).length} / {subscription.max_users} users used</p>
                    )}
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-xs font-semibold transition"
                >
                    <Plus className="w-3.5 h-3.5" /> Add User
                </button>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="bg-[#F7F3ED] text-left">
                        <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Email</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Role</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Branches</th>
                        <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D6]">
                    {users.map(staff => (
                        <tr key={staff.id} onClick={() => openEdit(staff)} className="hover:bg-[#F7F3ED] transition cursor-pointer group">
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#E8E1D6] flex items-center justify-center text-xs font-bold text-[#1C1917]">
                                        {staff.user.first_name?.charAt(0) || staff.user.username.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#C4A882] transition-colors">
                                            {staff.user.first_name} {staff.user.last_name}
                                            {staff.is_org_admin && <span className="ml-1.5 text-[10px] bg-[#C4A882]/15 text-[#C4A882] px-1.5 py-0.5 rounded-full font-bold">Admin</span>}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-[#78706A]">{staff.user.email}</td>
                            <td className="px-5 py-4 text-sm text-[#1C1917]">{staff.role_name || '—'}</td>
                            <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {staff.branch_names.length > 0 ? staff.branch_names.map(b => (
                                        <span key={b} className="text-[10px] bg-[#E8E1D6] text-[#78706A] px-2 py-0.5 rounded-full">{b}</span>
                                    )) : <span className="text-xs text-[#D9D0C5]">All branches</span>}
                                </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <span className="text-xs font-semibold text-[#1C1917] opacity-0 group-hover:opacity-100 transition">Edit</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${staff.is_active ? 'bg-[#7A9E8A]/15 text-[#7A9E8A]' : 'bg-[#C4705A]/15 text-[#C4705A]'}`}>
                                        {staff.is_active ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#A0978D]">No users provisioned yet.</td></tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <Modal title={editingUser ? "Edit User" : "Add User"} onClose={() => setShowModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="First Name" required>
                                <input className={inp} placeholder="Rahim" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required autoFocus />
                            </Field>
                            <Field label="Last Name" required>
                                <input className={inp} placeholder="Uddin" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                            </Field>
                        </div>
                        <Field label="Email (Login)" required>
                            <input type="email" className={inp} placeholder="rahim@clinic.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                        </Field>
                        <Field label={editingUser ? "Reset Password" : "Temporary Password"} required={!editingUser} hint={editingUser ? "Leave blank to keep current password." : "User should change this after first login."}>
                            <input type="password" className={inp} placeholder="Min 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editingUser} minLength={8} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Role">
                                <select className={inp} value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
                                    <option value="">— No Role —</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Account Status">
                                <select className={inp} value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                                    <option value="true">Active ✅</option>
                                    <option value="false">Suspended ⛔</option>
                                </select>
                            </Field>
                        </div>
                        {branches.length > 0 && (
                            <Field label="Assign to Branches" hint="Leave empty to allow access to all branches.">
                                <div className="flex flex-wrap gap-2">
                                    {branches.map(b => (
                                        <label key={b.id} className="flex items-center gap-2 cursor-pointer bg-[#F7F3ED] px-3 py-1.5 rounded-xl border border-[#E8E1D6]">
                                            <input
                                                type="checkbox"
                                                className="accent-[#1C1917]"
                                                checked={form.branch_ids.includes(b.id)}
                                                onChange={e => setForm(f => ({ ...f, branch_ids: e.target.checked ? [...f.branch_ids, b.id] : f.branch_ids.filter(id => id !== b.id) }))}
                                            />
                                            <span className="text-sm text-[#1C1917]">{b.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </Field>
                        )}
                        <label className="flex items-center gap-3 cursor-pointer py-2">
                            <input type="checkbox" className="accent-[#1C1917] w-4 h-4" checked={form.is_org_admin} onChange={e => setForm(f => ({ ...f, is_org_admin: e.target.checked }))} />
                            <div>
                                <span className="block text-sm font-semibold text-[#1C1917]">Organization Admin</span>
                                <span className="block text-xs text-[#A0978D]">Overrides normal role permissions</span>
                            </div>
                        </label>
                        <div className="flex gap-3 justify-end pt-4 border-t border-[#E8E1D6]">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

/* ─── Branches Tab ───────────────────────────────────────────── */
function BranchesTab({ orgId, branches, onRefresh }: { orgId: number; branches: Branch[]; onRefresh: () => void; }) {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [form, setForm] = useState({ name: '', address: '', phone: '', is_headquarters: false });

    const openCreate = () => {
        setEditingBranch(null);
        setForm({ name: '', address: '', phone: '', is_headquarters: false });
        setShowModal(true);
    };

    const openEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setForm({ name: branch.name, address: branch.address || '', phone: branch.phone || '', is_headquarters: branch.is_headquarters });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingBranch) {
                await saasApi.updateBranch(orgId, editingBranch.id, form);
                toast.success('Branch updated successfully.');
            } else {
                await saasApi.createBranch(orgId, { ...form, organization: orgId, is_active: true });
                toast.success('Branch created successfully.');
            }
            setShowModal(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save branch.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingBranch || !confirm('Are you sure you want to deactivate this branch?')) return;
        setSaving(true);
        try {
            await saasApi.deleteBranch(orgId, editingBranch.id);
            toast.success('Branch deactivated.');
            setShowModal(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete branch.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E1D6]">
                <h3 className="font-semibold text-[#1C1917]">Branch Locations</h3>
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-xs font-semibold transition">
                    <Plus className="w-3.5 h-3.5" /> Add Branch
                </button>
            </div>
            {branches.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#A0978D]"><GitBranch className="w-8 h-8 mx-auto mb-2 text-[#D9D0C5]" />No branches yet. Add the first location.</div>
            ) : (
                <div className="divide-y divide-[#E8E1D6]">
                    {branches.map(b => (
                        <div key={b.id} onClick={() => openEdit(b)} className="flex items-center justify-between px-5 py-4 hover:bg-[#F7F3ED] transition cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#E8E1D6] flex items-center justify-center group-hover:bg-[#D9D0C5] transition-colors"><MapPin className="w-4 h-4 text-[#78706A]" /></div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#C4A882] transition-colors">{b.name}
                                        {b.is_headquarters && <span className="ml-1.5 text-[10px] bg-[#C4A882]/15 text-[#C4A882] px-1.5 py-0.5 rounded-full font-bold">HQ</span>}
                                        {!b.is_active && <span className="ml-1.5 text-[10px] bg-[#C4705A]/15 text-[#C4705A] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Closed</span>}
                                    </p>
                                    <p className="text-xs text-[#A0978D]">{b.address || 'No address'}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-[#1C1917]">{b.staff_count} staff</p>
                                    <p className="text-xs text-[#A0978D]">{b.phone || '—'}</p>
                                </div>
                                <span className="text-xs font-semibold text-[#1C1917] opacity-0 group-hover:opacity-100 transition pl-4 border-l border-[#E8E1D6]">Edit</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <Modal title={editingBranch ? "Edit Branch" : "Add Branch"} onClose={() => setShowModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Branch Name" required>
                            <input className={inp} placeholder="e.g. Gulshan Branch" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                        </Field>
                        <Field label="Full Address">
                            <textarea className={`${inp} resize-none`} rows={2} placeholder="House, Road, Area, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                        </Field>
                        <Field label="Phone Number">
                            <input className={inp} placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </Field>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="accent-[#1C1917]" checked={form.is_headquarters} onChange={e => setForm(f => ({ ...f, is_headquarters: e.target.checked }))} />
                            <span className="text-sm font-semibold text-[#1C1917]">Set as Headquarters</span>
                        </label>
                        <div className="flex items-center justify-between pt-4 border-t border-[#E8E1D6]">
                            {editingBranch && editingBranch.is_active ? (
                                <button type="button" onClick={handleDelete} disabled={saving} className="text-xs font-semibold text-[#C4705A] hover:bg-[#C4705A]/10 px-3 py-1.5 rounded-full transition">Deactivate Branch</button>
                            ) : <div />}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Saving…' : editingBranch ? 'Save Changes' : 'Create Branch'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

/* ─── Roles Tab ──────────────────────────────────────────────── */
const PERMISSION_MODULES = ['patients', 'clinical', 'billing', 'accounting', 'inventory', 'pos', 'settings'];
const PERMISSION_ACTIONS = ['read', 'write', 'delete'];

function RolesTab({ orgId, roles, onRefresh }: { orgId: number; roles: OrgRole[]; onRefresh: () => void; }) {
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRole, setEditingRole] = useState<OrgRole | null>(null);
    const [form, setForm] = useState({ name: '', description: '', permissions: {} as Record<string, string[]> });

    const openCreate = () => {
        setEditingRole(null);
        setForm({ name: '', description: '', permissions: {} });
        setShowModal(true);
    };

    const openEdit = (role: OrgRole) => {
        setEditingRole(role);
        setForm({ name: role.name, description: role.description || '', permissions: role.permissions || {} });
        setShowModal(true);
    };

    const togglePermission = (module: string, action: string) => {
        setForm(f => {
            const current = f.permissions[module] || [];
            const updated = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
            return { ...f, permissions: { ...f.permissions, [module]: updated } };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingRole) {
                await saasApi.updateRole(orgId, editingRole.id, { name: form.name, description: form.description, permissions: form.permissions });
                toast.success('Role updated successfully.');
            } else {
                await saasApi.createRole(orgId, { name: form.name, description: form.description, permissions: form.permissions, organization: orgId });
                toast.success('Role created successfully.');
            }
            setShowModal(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save role.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingRole || !confirm('Are you sure you want to delete this role? Users assigned to this role will lose these permissions.')) return;
        setSaving(true);
        try {
            await saasApi.deleteRole(orgId, editingRole.id);
            toast.success('Role deleted.');
            setShowModal(false);
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete role.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between p-5 border-b border-[#E8E1D6]">
                <h3 className="font-semibold text-[#1C1917]">Roles & Permissions</h3>
                <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-xs font-semibold transition">
                    <Plus className="w-3.5 h-3.5" /> Add Role
                </button>
            </div>
            {roles.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#A0978D]">No roles defined. Create the first one.</div>
            ) : (
                <div className="divide-y divide-[#E8E1D6]">
                    {roles.map(r => (
                        <div key={r.id} onClick={() => openEdit(r)} className="flex items-center justify-between px-5 py-4 hover:bg-[#F7F3ED] transition cursor-pointer group">
                            <div>
                                <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#C4A882] transition-colors">{r.name}</p>
                                <p className="text-xs text-[#A0978D]">{r.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-wrap gap-1">
                                    {Object.keys(r.permissions).slice(0, 4).map(p => <span key={p} className="text-[10px] bg-[#E8E1D6] text-[#78706A] px-2 py-0.5 rounded-full capitalize">{p}</span>)}
                                    {Object.keys(r.permissions).length > 4 && <span className="text-[10px] text-[#A0978D]">+{Object.keys(r.permissions).length - 4}</span>}
                                </div>
                                <span className="text-sm font-semibold text-[#1C1917] pr-4 border-r border-[#E8E1D6]">{r.staff_count} users</span>
                                <span className="text-xs font-semibold text-[#1C1917] opacity-0 group-hover:opacity-100 transition">Edit</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showModal && (
                <Modal title={editingRole ? "Edit Role" : "Add Role"} onClose={() => setShowModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Role Name" required>
                            <input className={inp} placeholder="e.g. Front Desk, Doctor, Therapist" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                        </Field>
                        <Field label="Description">
                            <input className={inp} placeholder="What does this role do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </Field>
                        <Field label="Permissions">
                            <div className="rounded-xl border border-[#E8E1D6] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#F7F3ED]">
                                            <th className="px-3 py-2 text-left text-xs font-bold text-[#78706A] uppercase tracking-wider">Module</th>
                                            {PERMISSION_ACTIONS.map(a => <th key={a} className="px-3 py-2 text-center text-xs font-bold text-[#78706A] uppercase tracking-wider capitalize">{a}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E8E1D6]">
                                        {PERMISSION_MODULES.map(mod => (
                                            <tr key={mod} className="hover:bg-[#F7F3ED]">
                                                <td className="px-3 py-2 font-semibold text-[#1C1917] capitalize">{mod}</td>
                                                {PERMISSION_ACTIONS.map(action => (
                                                    <td key={action} className="px-3 py-2 text-center">
                                                        <input type="checkbox" className="accent-[#1C1917] cursor-pointer" checked={(form.permissions[mod] || []).includes(action)} onChange={() => togglePermission(mod, action)} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Field>
                        <div className="flex items-center justify-between pt-4 border-t border-[#E8E1D6]">
                            {editingRole ? (
                                <button type="button" onClick={handleDelete} disabled={saving} className="text-xs font-semibold text-[#C4705A] hover:bg-[#C4705A]/10 px-3 py-1.5 rounded-full transition">Delete Role</button>
                            ) : <div />}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Create Role'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

/* ─── Subscription Tab ───────────────────────────────────────── */
function SubscriptionTab({ org, plans, subscription, onRefresh }: { org: SaaSOrganization; plans: Plan[]; subscription: Subscription | null; onRefresh: () => void; }) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        plan_id: subscription?.plan?.toString() || '',
        billing_cycle: subscription?.billing_cycle || 'MONTHLY',
        extra_users: subscription?.extra_users || 0,
        extra_branches: subscription?.extra_branches || 0,
        has_marketing_addon: subscription?.has_marketing_addon || false,
        status: subscription?.status || 'TRIAL',
        current_period_start: subscription?.current_period_start ? String(subscription.current_period_start).split('T')[0] : new Date().toISOString().split('T')[0],
        next_billing_date: subscription?.next_billing_date ? String(subscription.next_billing_date).split('T')[0] : '',
    });

    const selectedPlan = plans.find(p => p.id === Number(form.plan_id));
    const baseMonthly = selectedPlan ? Number(selectedPlan.base_price_monthly) : 0;
    const annualMonthly = selectedPlan ? Number(selectedPlan.base_price_annual) : 0;
    const extraUserCost = selectedPlan ? Number(selectedPlan.price_per_extra_user) : 0;
    const extraBranchCost = selectedPlan ? Number(selectedPlan.price_per_extra_branch) : 0;
    const estimated = form.billing_cycle === 'MONTHLY'
        ? baseMonthly + (form.extra_users * extraUserCost) + (form.extra_branches * extraBranchCost)
        : annualMonthly + (form.extra_users * extraUserCost * 12) + (form.extra_branches * extraBranchCost * 12);

    const handleSave = async () => {
        if (!form.plan_id) { toast.error('Please select a plan.'); return; }
        setSaving(true);
        const today = form.current_period_start || new Date().toISOString().split('T')[0];
        const periodEnd = new Date(today);
        periodEnd.setMonth(periodEnd.getMonth() + (form.billing_cycle === 'MONTHLY' ? 1 : 12));

        try {
            const payload = {
                plan: Number(form.plan_id),
                billing_cycle: form.billing_cycle,
                extra_users: form.extra_users,
                extra_branches: form.extra_branches,
                has_marketing_addon: form.has_marketing_addon,
                status: form.status,
                current_period_start: form.current_period_start,
                current_period_end: periodEnd.toISOString().split('T')[0],
                next_billing_date: form.next_billing_date || periodEnd.toISOString().split('T')[0],
            };

            if (subscription) {
                await saasApi.updateSubscription(subscription.id, payload);
                toast.success('Subscription updated.');
            } else {
                await saasApi.createSubscription({ ...payload, organization: org.id });
                toast.success('Subscription created.');
            }
            onRefresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save subscription.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Subscription Plan" required>
                    <select className={inp} value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
                        <option value="">— Select a Plan —</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ৳{Number(p.base_price_monthly).toLocaleString()}/mo</option>)}
                    </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Billing Cycle">
                        <select className={inp} value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}>
                            <option value="MONTHLY">Monthly</option>
                            <option value="ANNUAL">Annual</option>
                        </select>
                    </Field>
                    <Field label="Status">
                        <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="TRIAL">Trial</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAST_DUE">Past Due</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </Field>
                </div>
                <Field label="Extra Users" hint={`৳${extraUserCost}/user/month`}>
                    <input type="number" min={0} className={inp} value={form.extra_users} onChange={e => setForm(f => ({ ...f, extra_users: Number(e.target.value) }))} />
                </Field>
                <Field label="Extra Branches" hint={`৳${extraBranchCost}/branch/month`}>
                    <input type="number" min={0} className={inp} value={form.extra_branches} onChange={e => setForm(f => ({ ...f, extra_branches: Number(e.target.value) }))} />
                </Field>

                <Field label="Current Period Start" hint="Override the start date of the current cycle.">
                    <input type="date" className={inp} value={form.current_period_start} onChange={e => setForm(f => ({ ...f, current_period_start: e.target.value }))} />
                </Field>
                <Field label="Next Billing Date" hint="Override the next billing date. Leave empty for automatic calculation.">
                    <input type="date" className={inp} value={form.next_billing_date} onChange={e => setForm(f => ({ ...f, next_billing_date: e.target.value }))} />
                </Field>

                <Field label="Marketing Module Add-on" className="md:col-span-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, has_marketing_addon: !f.has_marketing_addon }))} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-full text-left text-sm font-semibold transition ${form.has_marketing_addon ? 'border-[#7A9E8A] bg-[#7A9E8A]/5 text-[#7A9E8A]' : 'border-[#E8E1D6] text-[#78706A]'}`}>
                        {form.has_marketing_addon ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {form.has_marketing_addon ? 'Enabled' : 'Disabled'}
                    </button>
                </Field>
            </div>

            {/* Cost Preview */}
            {selectedPlan && (
                <div className="rounded-xl bg-[#F7F3ED] p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#A0978D] uppercase font-bold tracking-wider">Estimated {form.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual'} Charge</p>
                        <p className="text-2xl font-display text-[#1C1917] mt-1">৳{estimated.toLocaleString()}</p>
                        <p className="text-xs text-[#A0978D] mt-0.5">
                            {selectedPlan.included_users + form.extra_users} users · {selectedPlan.included_branches + form.extra_branches} branches
                            {form.has_marketing_addon && ' · Marketing add-on'}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {saving ? 'Saving…' : subscription ? 'Update Subscription' : 'Create Subscription'}
                </button>
            </div>
        </div>
    );
}

/* ─── Audit Log Tab ──────────────────────────────────────────── */
function AuditTab({ logs }: { logs: AuditLogEntry[] }) {
    return (
        <div>
            <div className="p-5 border-b border-[#E8E1D6]"><h3 className="font-semibold text-[#1C1917]">Audit Trail</h3></div>
            {logs.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#A0978D]">No audit entries yet.</div>
            ) : (
                <div className="divide-y divide-[#E8E1D6] max-h-[500px] overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className="px-5 py-3 hover:bg-[#F7F3ED] transition">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#C4A882] bg-[#C4A882]/10 px-2 py-0.5 rounded-full">{log.action}</span>
                                    <span className="text-xs text-[#78706A]">{log.resource_type} #{log.resource_id}</span>
                                </div>
                                <span className="text-[10px] text-[#A0978D]">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-[#A0978D] mt-1">by {log.user_display}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
