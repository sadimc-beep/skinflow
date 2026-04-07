'use client';

import { useEffect, useState } from 'react';
import { Plus, Users, GitBranch, ChevronDown, ChevronUp, Trash2, Loader2, Pencil } from 'lucide-react';
import { saasApi, Plan } from '@/lib/services/saas';
import { toast } from 'sonner';

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

const BLANK_FORM = {
    name: '',
    description: '',
    base_price_monthly: '',
    base_price_annual: '',
    included_users: 3,
    price_per_extra_user: '',
    included_branches: 1,
    price_per_extra_branch: '',
    sort_order: 0,
    is_active: true,
};

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [form, setForm] = useState(BLANK_FORM);

    useEffect(() => {
        saasApi.listPlans().then(setPlans).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const openAdd = () => { setEditingPlan(null); setForm(BLANK_FORM); setShowForm(true); };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setForm({
            name: plan.name,
            description: plan.description || '',
            base_price_monthly: plan.base_price_monthly,
            base_price_annual: plan.base_price_annual,
            included_users: plan.included_users,
            price_per_extra_user: plan.price_per_extra_user,
            included_branches: plan.included_branches,
            price_per_extra_branch: plan.price_per_extra_branch,
            sort_order: plan.sort_order,
            is_active: plan.is_active,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeForm = () => { setShowForm(false); setEditingPlan(null); setForm(BLANK_FORM); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.base_price_monthly) {
            toast.error('Plan name and monthly price are required.');
            return;
        }
        setSaving(true);
        try {
            if (editingPlan) {
                const updated = await saasApi.updatePlan(editingPlan.id, { ...form, features: editingPlan.features });
                setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
                toast.success(`Plan "${updated.name}" updated.`);
            } else {
                const plan = await saasApi.createPlan({ ...form, features: {} });
                setPlans(prev => [...prev, plan]);
                toast.success(`Plan "${plan.name}" created.`);
            }
            closeForm();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save plan.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return;
        try {
            await saasApi.deletePlan(id);
            setPlans(prev => prev.filter(p => p.id !== id));
            toast.success(`Plan "${name}" deleted.`);
        } catch {
            toast.error('Failed to delete. Plan may have active subscriptions.');
        }
    };

    const handleToggleActive = async (plan: Plan) => {
        try {
            const updated = await saasApi.updatePlan(plan.id, { is_active: !plan.is_active });
            setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
            toast.success(`Plan "${plan.name}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
        } catch {
            toast.error('Failed to update plan.');
        }
    };

    if (loading) return <div className="py-20 text-center text-[#A0978D] animate-pulse">Loading…</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Plans & Pricing</h1>
                    <p className="text-sm text-[#78706A] mt-1">Define subscription tiers for clinics.</p>
                </div>
                <button
                    onClick={() => showForm && !editingPlan ? closeForm() : showForm ? closeForm() : openAdd()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition"
                >
                    {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Plan'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="rounded-2xl border border-[#C4A882] bg-white p-6 shadow-md space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg text-[#1C1917]">{editingPlan ? `Editing: ${editingPlan.name}` : 'New Subscription Plan'}</h3>
                        {editingPlan && <span className="text-xs bg-[#C4A882]/15 text-[#C4A882] px-2.5 py-1 rounded-full font-bold">Editing</span>}
                    </div>
                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Name & Description */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Plan Name" required>
                                <input
                                    className={inp}
                                    placeholder="e.g. Basic, Growth, Enterprise"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                    autoFocus
                                />
                            </Field>
                            <Field label="Description">
                                <input
                                    className={inp}
                                    placeholder="Short description for clinics"
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </Field>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4 space-y-4">
                            <p className="text-xs font-bold text-[#78706A] uppercase tracking-wider">Pricing (BDT ৳)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Monthly Price" required>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#A0978D]">৳</span>
                                        <input
                                            type="number" min={0} step="0.01"
                                            className={`${inp} pl-7`}
                                            placeholder="3000"
                                            value={form.base_price_monthly}
                                            onChange={e => setForm(f => ({ ...f, base_price_monthly: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </Field>
                                <Field label="Annual Price" hint="Per year (usually discounted)">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#A0978D]">৳</span>
                                        <input
                                            type="number" min={0} step="0.01"
                                            className={`${inp} pl-7`}
                                            placeholder="30000"
                                            value={form.base_price_annual}
                                            onChange={e => setForm(f => ({ ...f, base_price_annual: e.target.value }))}
                                        />
                                    </div>
                                </Field>
                            </div>
                        </div>

                        {/* Limits */}
                        <div className="rounded-xl bg-[#F7F3ED] p-4 space-y-4">
                            <p className="text-xs font-bold text-[#78706A] uppercase tracking-wider">User & Branch Limits</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Included Users" required>
                                    <input
                                        type="number" min={1}
                                        className={inp}
                                        value={form.included_users}
                                        onChange={e => setForm(f => ({ ...f, included_users: Number(e.target.value) }))}
                                    />
                                </Field>
                                <Field label="Price per Extra User" hint="৳ per additional user/month">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#A0978D]">৳</span>
                                        <input
                                            type="number" min={0} step="0.01"
                                            className={`${inp} pl-7`}
                                            placeholder="500"
                                            value={form.price_per_extra_user}
                                            onChange={e => setForm(f => ({ ...f, price_per_extra_user: e.target.value }))}
                                        />
                                    </div>
                                </Field>
                                <Field label="Included Branches" required>
                                    <input
                                        type="number" min={1}
                                        className={inp}
                                        value={form.included_branches}
                                        onChange={e => setForm(f => ({ ...f, included_branches: Number(e.target.value) }))}
                                    />
                                </Field>
                                <Field label="Price per Extra Branch" hint="৳ per additional branch/month">
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#A0978D]">৳</span>
                                        <input
                                            type="number" min={0} step="0.01"
                                            className={`${inp} pl-7`}
                                            placeholder="1000"
                                            value={form.price_per_extra_branch}
                                            onChange={e => setForm(f => ({ ...f, price_per_extra_branch: e.target.value }))}
                                        />
                                    </div>
                                </Field>
                            </div>
                        </div>

                        <Field label="Sort Order" hint="Lower number shows first. Used for ordering plan display.">
                            <input
                                type="number" min={0}
                                className={inp}
                                value={form.sort_order}
                                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                            />
                        </Field>

                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={closeForm} className="px-5 py-2.5 border border-[#E8E1D6] text-[#78706A] rounded-full text-sm font-semibold hover:bg-[#F7F3ED] transition">Cancel</button>
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold disabled:opacity-60 transition">
                                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {saving ? 'Saving…' : editingPlan ? 'Save Changes' : 'Create Plan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map(plan => (
                    <div key={plan.id} className={`rounded-2xl border bg-white p-6 shadow-sm transition ${plan.is_active ? 'border-[#E8E1D6] hover:border-[#C4A882]' : 'border-dashed border-[#D9D0C5] opacity-70'}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-display text-xl text-[#1C1917]">{plan.name}</h3>
                                <p className="text-xs text-[#A0978D] mt-0.5">{plan.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleToggleActive(plan)} className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${plan.is_active ? 'bg-[#7A9E8A]/15 text-[#7A9E8A] hover:bg-[#7A9E8A]/25' : 'bg-[#E8E1D6] text-[#78706A] hover:bg-[#D9D0C5]'}`}>
                                    {plan.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#78706A]">Monthly</span>
                                <span className="text-lg font-display text-[#1C1917]">৳{Number(plan.base_price_monthly).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#78706A]">Annual</span>
                                <span className="text-sm font-semibold text-[#1C1917]">৳{Number(plan.base_price_annual).toLocaleString()}/yr</span>
                            </div>
                        </div>

                        <hr className="border-[#E8E1D6] mb-4" />

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[#78706A]"><Users className="w-3.5 h-3.5" /> Users</span>
                                <span className="text-[#1C1917] font-semibold">{plan.included_users} incl. · <span className="text-[#A0978D] font-normal">+৳{Number(plan.price_per_extra_user)}/extra</span></span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[#78706A]"><GitBranch className="w-3.5 h-3.5" /> Branches</span>
                                <span className="text-[#1C1917] font-semibold">{plan.included_branches} incl. · <span className="text-[#A0978D] font-normal">+৳{Number(plan.price_per_extra_branch)}/extra</span></span>
                            </div>
                        </div>

                        <button onClick={() => openEdit(plan)} className="flex items-center gap-1.5 text-[10px] text-[#78706A] hover:text-[#1C1917] transition font-semibold">
                            <Pencil className="w-3.5 h-3.5" /> Edit Plan
                        </button>
                        <button onClick={() => handleDelete(plan.id, plan.name)} className="flex items-center gap-1.5 text-[10px] text-[#C4705A] hover:text-[#A0503D] transition font-semibold">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                ))}
                {plans.length === 0 && !showForm && (
                    <div className="col-span-3 rounded-2xl border border-dashed border-[#D9D0C5] p-12 text-center">
                        <p className="text-sm text-[#A0978D] mb-3">No plans defined yet. Create your first subscription plan.</p>
                        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-[#F7F3ED] rounded-full text-sm font-semibold hover:bg-[#2E2A25] transition">
                            <Plus className="w-4 h-4" /> New Plan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
