'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/services/settings';
import { Loader2, Plus, Edit2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const PERMISSION_MODULES = ['patients', 'clinical', 'billing', 'accounting', 'inventory', 'pos', 'settings'];
const PERMISSION_ACTIONS = ['read', 'write', 'delete'];

type Role = {
    id: number;
    name: string;
    description: string;
    permissions: Record<string, string[]>;
    staff_count?: number;
};

export function RolesClient() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form, setForm] = useState({ name: '', description: '', permissions: {} as Record<string, string[]> });

    const fetchRoles = async () => {
        try {
            const data: any = await settingsApi.getRoles();
            setRoles(data.results || data);
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openCreate = () => {
        setEditingRole(null);
        setForm({ name: '', description: '', permissions: {} });
        setShowModal(true);
    };

    const openEdit = (role: Role) => {
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
                await settingsApi.updateRole(editingRole.id, form);
                toast.success('Role updated successfully');
            } else {
                await settingsApi.createRole(form);
                toast.success('Role created successfully');
            }
            setShowModal(false);
            fetchRoles();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save role');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingRole || !confirm('Are you sure you want to delete this role? Users assigned to this role will lose these permissions.')) return;
        setSaving(true);
        try {
            await settingsApi.deleteRole(editingRole.id);
            toast.success('Role deleted');
            setShowModal(false);
            fetchRoles();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete role');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#A0978D]" /></div>;
    }

    const inp = "w-full px-3 py-2 bg-[#F7F3ED] rounded-xl border border-[#E8E1D6] focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] outline-none transition text-sm text-[#1C1917]";

    return (
        <div>
            <div className="flex items-center justify-between p-6 border-b border-[#E8E1D6]">
                <div>
                    <h2 className="text-xl font-display font-semibold text-[#1C1917]">Roles & Permissions</h2>
                    <p className="text-sm text-[#A0978D]">Manage access scopes for your clinic staff.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold shadow-md transition">
                    <Plus className="w-4 h-4" /> Create Role
                </button>
            </div>

            {roles.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#F7F3ED] rounded-full flex items-center justify-center text-[#A0978D] mb-4">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-[#1C1917] mb-1">No roles implemented</p>
                    <p className="text-sm text-[#A0978D] max-w-sm mb-6">Create customized roles (like Doctor, Front Desk, or Accountant) to restrict access across the EMR.</p>
                    <button onClick={openCreate} className="px-4 py-2 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">
                        Add First Role
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-[#E8E1D6]">
                    {roles.map(r => (
                        <div key={r.id} onClick={() => openEdit(r)} className="flex items-center justify-between p-6 hover:bg-[#F7F3ED] transition cursor-pointer group">
                            <div>
                                <h3 className="text-base font-semibold text-[#1C1917] mb-0.5 group-hover:text-[#C4A882] transition-colors">{r.name}</h3>
                                <p className="text-sm text-[#A0978D]">{r.description || 'No description provided'}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-wrap gap-1.5 max-w-[250px] justify-end">
                                    {Object.keys(r.permissions).slice(0, 3).map(p => (
                                        <span key={p} className="text-[10px] font-bold tracking-wider uppercase bg-[#E8E1D6] text-[#78706A] px-2 py-1 rounded-md">{p}</span>
                                    ))}
                                    {Object.keys(r.permissions).length > 3 && (
                                        <span className="text-[10px] font-bold tracking-wider bg-[#E8E1D6] text-[#78706A] px-2 py-1 rounded-md">+{Object.keys(r.permissions).length - 3}</span>
                                    )}
                                </div>
                                <div className="w-px h-8 bg-[#E8E1D6]"></div>
                                <button className="text-sm font-semibold text-[#78706A] hover:text-[#1C1917] transition flex items-center gap-1.5">
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-[#E8E1D6]">
                            <h2 className="text-xl font-display font-semibold text-[#1C1917]">{editingRole ? "Edit Role" : "Create New Role"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-[#A0978D] hover:text-[#1C1917] transition text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Role Name *</label>
                                        <input className={inp} placeholder="e.g. Clinical Staff" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Description</label>
                                        <input className={inp} placeholder="Role description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Module Permissions</label>
                                    <div className="rounded-2xl border border-[#E8E1D6] overflow-hidden bg-white">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-[#F7F3ED] border-b border-[#E8E1D6]">
                                                    <th className="px-5 py-3 text-left text-xs font-bold text-[#78706A] uppercase tracking-wider">Module</th>
                                                    {PERMISSION_ACTIONS.map(a => <th key={a} className="px-5 py-3 text-center text-xs font-bold text-[#78706A] uppercase tracking-wider">{a}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E8E1D6]">
                                                {PERMISSION_MODULES.map(mod => (
                                                    <tr key={mod} className="hover:bg-[#F7F3ED]/50 transition">
                                                        <td className="px-5 py-4 font-semibold text-[#1C1917] capitalize">{mod}</td>
                                                        {PERMISSION_ACTIONS.map(action => (
                                                            <td key={action} className="px-5 py-4 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 accent-[#1C1917] cursor-pointer rounded border-[#D9D0C5]"
                                                                    checked={(form.permissions[mod] || []).includes(action)}
                                                                    onChange={() => togglePermission(mod, action)}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-[#F7F3ED] border-t border-[#E8E1D6]">
                            {editingRole ? (
                                <button type="button" onClick={handleDelete} disabled={saving} className="text-sm font-semibold text-[#C4705A] hover:bg-[#C4705A]/10 px-4 py-2 rounded-full transition">Delete Role</button>
                            ) : <div />}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-[#E8E1D6] bg-white text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#E8E1D6] transition">Cancel</button>
                                <button type="submit" form="roleForm" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition shadow-sm">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
