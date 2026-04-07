'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/services/settings';
import { Loader2, Plus, Edit2, Users as UsersIcon, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

type Role = {
    id: number;
    name: string;
};

type StaffMember = {
    id: number;
    user: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    role: Role | null;
    is_active: boolean;
    is_org_admin: boolean;
};

export function StaffClient() {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [form, setForm] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role_id: '',
        is_active: true
    });

    const fetchData = async () => {
        try {
            const [staffRes, rolesRes]: any = await Promise.all([
                settingsApi.getStaff(),
                settingsApi.getRoles(),
            ]);
            setStaffList(staffRes.results || staffRes);
            setRoles(rolesRes.results || rolesRes);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load staff data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreate = () => {
        setEditingStaff(null);
        setForm({
            username: '',
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            role_id: '',
            is_active: true
        });
        setShowModal(true);
    };

    const openEdit = (staff: StaffMember) => {
        setEditingStaff(staff);
        setForm({
            username: staff.user.username,
            first_name: staff.user.first_name,
            last_name: staff.user.last_name,
            email: staff.user.email,
            password: '', // leave empty unless resetting
            role_id: staff.role ? staff.role.id.toString() : '',
            is_active: staff.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingStaff) {
                // For updates, we usually only allow changing role and active status, unless we implement full user update in backend.
                // The partial_update in our backend handles role_id and is_active right now.
                const payload = {
                    role_id: form.role_id ? parseInt(form.role_id) : null,
                    is_active: form.is_active
                };
                await settingsApi.updateStaff(editingStaff.id, payload);
                toast.success('Staff member updated successfully');
            } else {
                if (!form.password) {
                    toast.error('Password is required for new users');
                    setSaving(false);
                    return;
                }
                const payload = {
                    ...form,
                    role_id: form.role_id ? parseInt(form.role_id) : null,
                };
                await settingsApi.createStaff(payload);
                toast.success('Staff member created successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save staff member');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#A0978D]" /></div>;
    }

    const inp = "w-full px-4 py-3 bg-white rounded-xl border border-[#E8E1D6] focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] outline-none transition text-sm text-[#1C1917] font-medium";

    return (
        <div>
            <div className="flex items-center justify-between p-6 border-b border-[#E8E1D6]">
                <div>
                    <h2 className="text-xl font-display font-semibold text-[#1C1917]">Staff Management</h2>
                    <p className="text-sm text-[#A0978D]">Manage clinic users and their role assignments.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold shadow-md transition">
                    <Plus className="w-4 h-4" /> Add Staff Member
                </button>
            </div>

            {staffList.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#F7F3ED] rounded-full flex items-center justify-center text-[#A0978D] mb-4">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-[#1C1917] mb-1">No staff members found</p>
                    <p className="text-sm text-[#A0978D] max-w-sm mb-6">Provision accounts for your clinic personnel here.</p>
                    <button onClick={openCreate} className="px-4 py-2 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">
                        Add First Staff Member
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F7F3ED] border-b border-[#E8E1D6]">
                                <th className="px-6 py-4 text-xs font-bold text-[#78706A] uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#78706A] uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#78706A] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-[#78706A] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E1D6]">
                            {staffList.map(staff => (
                                <tr key={staff.id} className="hover:bg-[#F7F3ED]/50 transition group cursor-pointer" onClick={() => openEdit(staff)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#E8E1D6] flex items-center justify-center text-[#78706A] font-bold text-sm shrink-0">
                                                {staff.user.first_name ? staff.user.first_name[0].toUpperCase() : staff.user.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#C4A882] transition-colors">
                                                    {staff.user.first_name} {staff.user.last_name}
                                                </p>
                                                <p className="text-[11px] text-[#A0978D] font-mono mt-0.5">{staff.user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {staff.role ? (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F3ED] border border-[#E8E1D6]">
                                                <Shield className="w-3.5 h-3.5 text-[#C4A882]" />
                                                <span className="text-xs font-semibold text-[#1C1917]">{staff.role.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#A0978D] italic">No Role Assigned</span>
                                        )}
                                        {staff.is_org_admin && (
                                            <span className="ml-2 text-[10px] bg-[#1C1917] text-[#F7F3ED] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${staff.is_active ? 'bg-[#7A9E8A] text-white' : 'bg-[#E8E1D6] text-[#A0978D]'}`}>
                                            {staff.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-sm font-semibold text-[#78706A] hover:text-[#1C1917] transition inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[#F7F3ED] rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-[#E8E1D6] bg-white">
                            <h2 className="text-xl font-display font-semibold text-[#1C1917]">{editingStaff ? "Edit Staff Member" : "Create New Staff Member"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-[#A0978D] hover:text-[#1C1917] transition text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <form id="staffForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">First Name</label>
                                        <input className={inp} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} disabled={!!editingStaff} placeholder="John" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Last Name</label>
                                        <input className={inp} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} disabled={!!editingStaff} placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Email <span className="text-[#C4A882]">*</span></label>
                                    <input type="email" required className={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editingStaff} placeholder="john@clinic.com" />
                                </div>
                                {!editingStaff && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Username <span className="text-[#C4A882]">*</span></label>
                                            <input required className={inp} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} placeholder="johndoe" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Initial Password <span className="text-[#C4A882]">*</span></label>
                                            <input type="password" required className={inp} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Set a temporary password" />
                                        </div>
                                    </>
                                )}

                                <div className="p-5 bg-white rounded-2xl border border-[#E8E1D6] space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#78706A] uppercase tracking-wider ml-1">Assigned Role</label>
                                        <select className={`${inp} cursor-pointer appearance-none`} value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
                                            <option value="">-- No Role (Read-only access) --</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id.toString()}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {editingStaff && editingStaff.user.username !== 'admin' && ( // Prevent deactivating main admin if applicable
                                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[#E8E1D6] bg-[#F7F3ED] hover:bg-[#E8E1D6]/50 transition">
                                            <div className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-[#7A9E8A]' : 'bg-[#C4705A]'}`}>
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                <input type="checkbox" className="sr-only" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#1C1917]">Account Active Flag</p>
                                                <p className="text-[11px] text-[#A0978D]">Suspended users cannot log in to Skinflow.</p>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 bg-white border-t border-[#E8E1D6]">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-[#E8E1D6] bg-white text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                            <button type="submit" form="staffForm" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition shadow-sm">
                                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {saving ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
