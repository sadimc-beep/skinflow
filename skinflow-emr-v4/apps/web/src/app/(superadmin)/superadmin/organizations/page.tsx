'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X, Loader2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { saasApi, SaaSOrganization } from '@/lib/services/saas';
import { toast } from 'sonner';

interface OrgForm {
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    is_active: boolean;
}

const BLANK: OrgForm = { name: '', slug: '', email: '', phone: '', address: '', is_active: true };

function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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

export default function OrganizationsPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState<SaaSOrganization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // modal state
    const [editingOrg, setEditingOrg] = useState<SaaSOrganization | null>(null); // null = add mode
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<OrgForm>(BLANK);

    useEffect(() => {
        saasApi.listOrganizations().then(setOrgs).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = orgs.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.slug.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingOrg(null);
        setForm(BLANK);
        setShowModal(true);
    };

    const openEdit = (e: React.MouseEvent, org: SaaSOrganization) => {
        e.stopPropagation();
        setEditingOrg(org);
        setForm({ name: org.name, slug: org.slug, email: org.email || '', phone: org.phone || '', address: org.address || '', is_active: org.is_active });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.slug) { toast.error('Name and slug are required.'); return; }
        setSaving(true);
        try {
            if (editingOrg) {
                const updated = await saasApi.updateOrganization(editingOrg.id, form);
                setOrgs(prev => prev.map(o => o.id === updated.id ? updated : o));
                toast.success(`"${updated.name}" updated.`);
            } else {
                const created = await saasApi.createOrganization({ ...form });
                setOrgs(prev => [created, ...prev]);
                toast.success(`"${created.name}" created.`);
            }
            setShowModal(false);
        } catch (e: any) {
            toast.error(e.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Organizations</h1>
                    <p className="text-sm text-[#78706A] mt-1">Manage all clinics on the platform.</p>
                </div>
                <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition">
                    <Plus className="w-4 h-4" /> Add Organization
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0978D]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or slug…"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E8E1D6] bg-white text-sm text-[#1C1917] placeholder:text-[#D9D0C5] focus:outline-none focus:ring-2 focus:ring-[#C4A882]/30 focus:border-[#C4A882] transition" />
            </div>

            {loading ? (
                <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>
            ) : (
                <div className="rounded-2xl border border-[#E8E1D6] bg-white shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#E8E1D6] text-left">
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Organization</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Plan</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Users</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Branches</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider">Created</th>
                                <th className="px-5 py-3 text-xs font-bold text-[#78706A] uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E1D6]">
                            {filtered.map(org => (
                                <tr key={org.id} className="hover:bg-[#F7F3ED] transition cursor-pointer group"
                                    onClick={() => router.push(`/superadmin/organizations/${org.id}`)}>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#E8E1D6] flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-[#1C1917]">{org.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#1C1917]">{org.name}</p>
                                                <p className="text-xs text-[#A0978D]">{org.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[#1C1917]">{org.plan_name || '—'}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${org.subscription_status === 'Active' ? 'bg-[#7A9E8A]/15 text-[#7A9E8A]' :
                                                org.subscription_status === 'Trial' ? 'bg-[#C4A882]/15 text-[#C4A882]' :
                                                    org.subscription_status === 'Past Due' ? 'bg-[#C4705A]/15 text-[#C4705A]' :
                                                        'bg-[#E8E1D6] text-[#78706A]'}`}>
                                            {org.subscription_status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-semibold text-[#1C1917]">{org.active_users}</td>
                                    <td className="px-5 py-4 text-sm text-[#78706A]">{org.branch_count}</td>
                                    <td className="px-5 py-4 text-xs text-[#A0978D]">{new Date(org.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={e => openEdit(e, org)}
                                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E1D6] text-xs text-[#78706A] hover:border-[#C4A882] hover:text-[#1C1917] transition"
                                        >
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#A0978D]">No organizations found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E1D6]">
                            <h2 className="font-display text-xl text-[#1C1917]">{editingOrg ? 'Edit Organization' : 'Add Organization'}</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-[#E8E1D6] hover:bg-[#D9D0C5] flex items-center justify-center transition">
                                <X className="w-4 h-4 text-[#1C1917]" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Field label="Clinic Name" required>
                                <input className={inp} placeholder="e.g. Glow Aesthetics Clinic" value={form.name}
                                    onChange={e => { const v = e.target.value; setForm(f => ({ ...f, name: v, slug: editingOrg ? f.slug : slugify(v) })); }}
                                    required autoFocus />
                            </Field>
                            <Field label="URL Slug" required hint="Lowercase, hyphens only.">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#A0978D]">skinflow.app/</span>
                                    <input className={`${inp} pl-[7.5rem]`} placeholder="glow-aesthetics" value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} required />
                                </div>
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Email">
                                    <input type="email" className={inp} placeholder="clinic@example.com" value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                </Field>
                                <Field label="Phone">
                                    <input className={inp} placeholder="+880 1XXX-XXXXXX" value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                </Field>
                            </div>
                            <Field label="Address">
                                <textarea className={`${inp} resize-none`} placeholder="Full clinic address" rows={2} value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                            </Field>
                            {editingOrg && (
                                <Field label="Account Status">
                                    <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border w-full text-left text-sm font-semibold transition ${form.is_active ? 'border-[#7A9E8A] bg-[#7A9E8A]/5 text-[#7A9E8A]' : 'border-[#C4705A] bg-[#C4705A]/5 text-[#C4705A]'}`}>
                                        {form.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        {form.is_active ? 'Active' : 'Suspended'}
                                    </button>
                                </Field>
                            )}
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saving ? 'Saving…' : editingOrg ? 'Save Changes' : 'Create Organization'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
