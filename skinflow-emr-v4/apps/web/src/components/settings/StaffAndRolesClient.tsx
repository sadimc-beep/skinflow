'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Plus, Pencil, Trash2, UserPlus, ShieldCheck, X, Check } from 'lucide-react';
import { settingsApi } from '@/lib/services/settings';
import toast from 'react-hot-toast';

// ─── Permission domains mapped to readable labels ─────────────────────────────
const PERMISSION_DOMAINS: Record<string, { label: string; actions: string[] }> = {
    patients: { label: 'Patients', actions: ['read', 'write', 'delete'] },
    clinical: { label: 'Clinical / EMR', actions: ['read', 'write', 'delete'] },
    billing: { label: 'Billing', actions: ['read', 'write', 'delete'] },
    inventory: { label: 'Inventory / Store', actions: ['read', 'write', 'delete'] },
    accounting: { label: 'Accounting', actions: ['read', 'write', 'delete'] },
    pos: { label: 'Point of Sale', actions: ['read', 'write'] },
    settings: { label: 'Admin & Settings', actions: ['read', 'write'] },
};

// ─── Role Form Modal ──────────────────────────────────────────────────────────
function RoleModal({ role, onClose, onSave }: { role: any; onClose: () => void; onSave: () => void }) {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');
    const [perms, setPerms] = useState<Record<string, string[]>>(role?.permissions || {});
    const [saving, setSaving] = useState(false);

    const toggleAction = (domain: string, action: string) => {
        setPerms(prev => {
            const current = prev[domain] || [];
            const updated = current.includes(action)
                ? current.filter(a => a !== action)
                : [...current, action];
            return { ...prev, [domain]: updated };
        });
    };

    const hasAction = (domain: string, action: string) => (perms[domain] || []).includes(action);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Role name is required'); return; }
        try {
            setSaving(true);
            if (role?.id) {
                await settingsApi.updateRole(role.id, { name, description, permissions: perms });
                toast.success('Role updated!');
            } else {
                await settingsApi.createRole({ name, description, permissions: perms });
                toast.success('Role created!');
            }
            onSave();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{role?.id ? 'Edit Role' : 'Create New Role'}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Define what this role can access across the system</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Role Name & Description */}
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Front Desk, Accountant, Doctor"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Brief description of this role's responsibilities"
                            />
                        </div>
                    </div>

                    {/* Permission Grid */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Module Permissions
                        </h3>
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 text-slate-600 font-medium">Module</th>
                                        <th className="text-center px-4 py-2.5 text-slate-600 font-medium">View</th>
                                        <th className="text-center px-4 py-2.5 text-slate-600 font-medium">Create/Edit</th>
                                        <th className="text-center px-4 py-2.5 text-slate-600 font-medium">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(PERMISSION_DOMAINS).map(([domain, meta]) => (
                                        <tr key={domain} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{meta.label}</td>
                                            {['read', 'write', 'delete'].map(action => (
                                                <td key={action} className="text-center px-4 py-3">
                                                    {meta.actions.includes(action) ? (
                                                        <button
                                                            onClick={() => toggleAction(domain, action)}
                                                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition ${hasAction(domain, action)
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                    : 'border-slate-300 text-transparent hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-200">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {role?.id ? 'Save Changes' : 'Create Role'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── User Invite Modal ────────────────────────────────────────────────────────
function InviteUserModal({ roles, onClose, onSave }: { roles: any[]; onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', role_id: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.username || !form.password) { toast.error('Username and password are required'); return; }
        try {
            setSaving(true);
            await settingsApi.createStaff({
                ...form,
                role_id: form.role_id ? parseInt(form.role_id) : null,
            });
            toast.success(`User "${form.username}" created!`);
            onSave();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Invite New User</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Create a staff account and assign a role</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="First Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Last Name" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={e => f('email', e.target.value)} className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="staff@clinic.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                        <input value={form.username} onChange={e => f('username', e.target.value)} className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="username" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                        <input type="password" value={form.password} onChange={e => f('password', e.target.value)} className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Temporary password" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Role</label>
                        <Combobox
                            options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                            value={form.role_id}
                            onChange={v => f('role_id', v)}
                            placeholder="Select a role…"
                            searchPlaceholder="Search roles…"
                        />
                    </div>
                </div>

                <div className="p-6 pt-0 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create User
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main exported tab components ────────────────────────────────────────────
export function StaffManagementTab() {
    const [staff, setStaff] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [staffRes, rolesRes]: any[] = await Promise.all([
                settingsApi.getStaff(),
                settingsApi.getRoles(),
            ]);
            setStaff(staffRes.results || staffRes);
            setRoles(rolesRes.results || rolesRes);
        } catch (err) {
            toast.error('Failed to load staff data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRoleChange = async (staffId: number, roleId: string) => {
        try {
            await settingsApi.updateStaff(staffId, { role_id: roleId ? parseInt(roleId) : null });
            toast.success('Role updated!');
            load();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update role');
        }
    };

    const handleToggleActive = async (staffId: number, current: boolean) => {
        try {
            await settingsApi.updateStaff(staffId, { is_active: !current });
            toast.success(!current ? 'User activated' : 'User deactivated');
            load();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update user');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Staff Members</CardTitle>
                            <CardDescription className="mt-1">Manage clinic staff accounts and their role assignments.</CardDescription>
                        </div>
                        <Button onClick={() => setShowInvite(true)} className="gap-2">
                            <UserPlus className="w-4 h-4" /> Invite User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {staff.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                            No staff members yet. Invite your first team member!
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {staff.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-4 py-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <span className="text-indigo-700 font-semibold text-sm">
                                            {(s.user_details?.first_name?.[0] || s.user_details?.username?.[0] || '?').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {s.user_details?.first_name} {s.user_details?.last_name}
                                            {!s.user_details?.first_name && <span>{s.user_details?.username}</span>}
                                        </p>
                                        <p className="text-xs text-slate-500">{s.user_details?.email || s.user_details?.username}</p>
                                    </div>
                                    <div className="w-52">
                                        <Select
                                            value={s.role?.toString() || ''}
                                            onValueChange={v => handleRoleChange(s.id, v)}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="No role assigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r: any) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <button
                                        onClick={() => handleToggleActive(s.id, s.is_active)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${s.is_active
                                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                                : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                                            }`}
                                    >
                                        {s.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showInvite && (
                <InviteUserModal
                    roles={roles}
                    onClose={() => setShowInvite(false)}
                    onSave={load}
                />
            )}
        </>
    );
}

export function RolesManagementTab() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editRole, setEditRole] = useState<any | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res: any = await settingsApi.getRoles();
            setRoles(res.results || res);
        } catch {
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete role "${name}"? Staff with this role will lose their permissions.`)) return;
        try {
            await settingsApi.deleteRole(id);
            toast.success('Role deleted');
            load();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete role');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Roles & Permissions</CardTitle>
                            <CardDescription className="mt-1">Define access levels for different types of staff.</CardDescription>
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="gap-2">
                            <Plus className="w-4 h-4" /> New Role
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {roles.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                            No roles defined yet. Create your first role!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {roles.map(r => {
                                const domainCount = Object.keys(r.permissions || {}).length;
                                return (
                                    <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900">{r.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {r.description || 'No description'} &nbsp;·&nbsp;
                                                <span className="text-indigo-600">{domainCount} module{domainCount !== 1 ? 's' : ''} configured</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditRole(r)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(r.id, r.name)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {(showCreate || editRole) && (
                <RoleModal
                    role={editRole}
                    onClose={() => { setShowCreate(false); setEditRole(null); }}
                    onSave={load}
                />
            )}
        </>
    );
}
