'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Tablet, Copy, Check } from 'lucide-react';
import { settingsApi } from '@/lib/services/settings';
import { accountingApi } from '@/lib/services/accounting';
import { fetchApi } from '@/lib/api';
import { mastersApi, type ProcedureType } from '@/lib/services/masters';
import { inventoryApi } from '@/lib/services/inventory';
import { StaffManagementTab, RolesManagementTab } from './StaffAndRolesClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import toast from 'react-hot-toast';

export function GlobalSettingsClient() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kioskToken, setKioskToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Ledger accounts for dropdowns
    const [assetAccounts, setAssetAccounts] = useState<any[]>([]);
    const [revenueAccounts, setRevenueAccounts] = useState<any[]>([]);
    const [liabilityAccounts, setLiabilityAccounts] = useState<any[]>([]);

    const [settings, setSettings] = useState({
        default_ar_account: '',
        default_revenue_account: '',
        default_ap_account: '',
        default_inventory_account: '',
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsRes, assetRes, revRes, liabRes, orgsRes] = await Promise.all([
                settingsApi.getClinicSettings(),
                accountingApi.getAccounts({ account_type: 'ASSET' }),
                accountingApi.getAccounts({ account_type: 'REVENUE' }),
                accountingApi.getAccounts({ account_type: 'LIABILITY' }),
                fetchApi<any>('/core/organizations/'),
            ]);

            // Kiosk token — take from first org in the list (the user's org)
            const orgs = orgsRes?.results || [];
            if (orgs.length > 0 && orgs[0].kiosk_token) {
                setKioskToken(orgs[0].kiosk_token);
            }

            if (settingsRes && typeof settingsRes === 'object') {
                setSettings({
                    default_ar_account: (settingsRes as any).default_ar_account?.toString() || '',
                    default_revenue_account: (settingsRes as any).default_revenue_account?.toString() || '',
                    default_ap_account: (settingsRes as any).default_ap_account?.toString() || '',
                    default_inventory_account: (settingsRes as any).default_inventory_account?.toString() || '',
                });
            }

            setAssetAccounts((assetRes as any).results || []);
            setRevenueAccounts((revRes as any).results || []);
            setLiabilityAccounts((liabRes as any).results || []);

        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load global settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload: any = {};
            if (settings.default_ar_account) payload.default_ar_account = parseInt(settings.default_ar_account);
            if (settings.default_revenue_account) payload.default_revenue_account = parseInt(settings.default_revenue_account);
            if (settings.default_ap_account) payload.default_ap_account = parseInt(settings.default_ap_account);
            if (settings.default_inventory_account) payload.default_inventory_account = parseInt(settings.default_inventory_account);

            await settingsApi.updateClinicSettings(payload);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#C4A882]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Global Admin Settings</h2>
                <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-full px-6 h-11 font-bold">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="ledger">
                <TabsList className="h-auto rounded-2xl bg-[#E8E1D6] p-1.5 gap-1 mb-6 flex-wrap">
                    <TabsTrigger value="ledger" className="rounded-xl px-4 font-bold text-sm">Ledger Mapping</TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl px-4 font-bold text-sm">Users</TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-xl px-4 font-bold text-sm">Roles</TabsTrigger>
                    <TabsTrigger value="procedures" className="rounded-xl px-4 font-bold text-sm">Procedure Types</TabsTrigger>
                    <TabsTrigger value="proc-categories" className="rounded-xl px-4 font-bold text-sm">Procedure Categories</TabsTrigger>
                    <TabsTrigger value="rooms" className="rounded-xl px-4 font-bold text-sm">Rooms</TabsTrigger>
                    <TabsTrigger value="medicines" className="rounded-xl px-4 font-bold text-sm">Medicines</TabsTrigger>
                    <TabsTrigger value="stock-locations" className="rounded-xl px-4 font-bold text-sm">Stock Locations</TabsTrigger>
                    <TabsTrigger value="product-categories" className="rounded-xl px-4 font-bold text-sm">Product Categories</TabsTrigger>
                    <TabsTrigger value="kiosk" className="rounded-xl px-4 font-bold text-sm">Kiosk Setup</TabsTrigger>
                    <TabsTrigger value="general" className="rounded-xl px-4 font-bold text-sm">General</TabsTrigger>
                </TabsList>

                <TabsContent value="ledger">
                    <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader>
                            <CardTitle>Automated Journal Routing</CardTitle>
                            <CardDescription>
                                Map specific system events (like finalizing an invoice or receiving inventory) to your custom Chart of Accounts.
                                These defaults are used by the double-entry accounting engine.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold border-b pb-2">Sales & Receivables</h3>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Accounts Receivable (A/R) *</label>
                                        <div className="text-xs text-[#78706A] mb-1">Debited when Invoices are finalized.</div>
                                        <Combobox
                                            options={assetAccounts.map(a => ({ value: a.id.toString(), label: a.code ? `${a.code} — ${a.name}` : a.name }))}
                                            value={settings.default_ar_account?.toString() || ""}
                                            onChange={v => setSettings({ ...settings, default_ar_account: v })}
                                            placeholder="Select Asset Account…"
                                            searchPlaceholder="Search accounts…"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Sales Revenue *</label>
                                        <div className="text-xs text-slate-500 mb-1">Credited when Invoices are finalized.</div>
                                        <Combobox
                                            options={revenueAccounts.map(a => ({ value: a.id.toString(), label: a.code ? `${a.code} — ${a.name}` : a.name }))}
                                            value={settings.default_revenue_account?.toString() || ""}
                                            onChange={v => setSettings({ ...settings, default_revenue_account: v })}
                                            placeholder="Select Revenue Account…"
                                            searchPlaceholder="Search accounts…"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold border-b pb-2">Purchasing & Payables</h3>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Accounts Payable (A/P) *</label>
                                        <div className="text-xs text-slate-500 mb-1">Credited when Vendor Bills are generated from GRNs.</div>
                                        <Combobox
                                            options={liabilityAccounts.map(a => ({ value: a.id.toString(), label: a.code ? `${a.code} — ${a.name}` : a.name }))}
                                            value={settings.default_ap_account?.toString() || ""}
                                            onChange={v => setSettings({ ...settings, default_ap_account: v })}
                                            placeholder="Select Liability Account…"
                                            searchPlaceholder="Search accounts…"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Inventory Asset *</label>
                                        <div className="text-xs text-slate-500 mb-1">Debited when items are received into the store.</div>
                                        <Combobox
                                            options={assetAccounts.map(a => ({ value: a.id.toString(), label: a.code ? `${a.code} — ${a.name}` : a.name }))}
                                            value={settings.default_inventory_account?.toString() || ""}
                                            onChange={v => setSettings({ ...settings, default_inventory_account: v })}
                                            placeholder="Select Asset Account…"
                                            searchPlaceholder="Search accounts…"
                                        />
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <StaffManagementTab />
                </TabsContent>

                <TabsContent value="roles">
                    <RolesManagementTab />
                </TabsContent>

                <TabsContent value="procedures">
                    <ProcedureTypesTab />
                </TabsContent>

                <TabsContent value="proc-categories">
                    <ProcedureCategoriesTab />
                </TabsContent>

                <TabsContent value="rooms">
                    <ProcedureRoomsTab />
                </TabsContent>

                <TabsContent value="medicines">
                    <MedicinesTab />
                </TabsContent>

                <TabsContent value="stock-locations">
                    <StockLocationsTab />
                </TabsContent>

                <TabsContent value="product-categories">
                    <ProductCategoriesTab />
                </TabsContent>

                <TabsContent value="kiosk">
                    <KioskSetupTab kioskToken={kioskToken} copied={copied} onCopy={() => {
                        if (!kioskToken) return;
                        const url = `${window.location.origin}/checkin?token=${kioskToken}`;
                        navigator.clipboard.writeText(url).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        });
                    }} />
                </TabsContent>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Preferences</CardTitle>
                            <CardDescription>
                                Coming soon: Additional clinic-wide settings such as tax configuration and default operating hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="text-center text-[#A0978D] py-12 border-2 border-dashed border-[#E8E1D6] rounded-xl bg-[#F7F3ED]/50">
                                Not officially in scope yet. Feature to be developed based on feedback!
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Kiosk Setup Tab ─────────────────────────────────────────────────────────

function KioskSetupTab({
    kioskToken,
    copied,
    onCopy,
}: {
    kioskToken: string | null;
    copied: boolean;
    onCopy: () => void;
}) {
    const kioskUrl = kioskToken
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/checkin?token=${kioskToken}`
        : null;

    return (
        <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Tablet className="w-6 h-6 text-[#1C1917]" />
                    <CardTitle>Patient Check-in Kiosk</CardTitle>
                </div>
                <CardDescription>
                    Open this URL on the patient-facing tablet. Patients can self-register or check in for their appointment without staff involvement.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {kioskToken ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#1C1917]">Kiosk URL</label>
                            <div className="flex items-center gap-3 p-4 bg-[#F7F3ED] rounded-xl border border-[#E8E1D6]">
                                <code className="flex-1 text-sm text-[#1C1917] break-all font-mono">{kioskUrl}</code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCopy}
                                    className="shrink-0 border-[#D9D0C5] hover:bg-[#E8E1D6]"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-[#78716C] border-t border-[#E8E1D6] pt-4">
                            <p className="font-medium text-[#1C1917]">Setup Instructions</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Copy the URL above.</li>
                                <li>Open it on the patient tablet using any modern browser.</li>
                                <li>Bookmark or pin it as the home page / kiosk app.</li>
                                <li>The token in the URL authenticates the tablet to this clinic — keep it private.</li>
                            </ol>
                        </div>
                    </>
                ) : (
                    <p className="text-[#A0978D] text-center py-8">Loading kiosk token…</p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Procedure Types Tab ──────────────────────────────────────────────────────

const EMPTY_PT = { name: '', description: '', base_price: '', expected_default_sessions: 1, consultation_required: true };

function ProcedureTypesTab() {
    const [items, setItems] = useState<ProcedureType[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<ProcedureType | null>(null);
    const [form, setForm] = useState({ ...EMPTY_PT });

    const load = async () => {
        setLoading(true);
        try {
            const res = await mastersApi.procedureTypes.list();
            setItems((res as any).results || res);
        } catch {
            toast.error('Failed to load procedure types');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openNew = () => {
        setEditing(null);
        setForm({ ...EMPTY_PT });
        setDialogOpen(true);
    };

    const openEdit = (pt: ProcedureType) => {
        setEditing(pt);
        setForm({
            name: pt.name,
            description: pt.description || '',
            base_price: pt.base_price || '',
            expected_default_sessions: (pt as any).expected_default_sessions ?? 1,
            consultation_required: (pt as any).consultation_required ?? true,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required.'); return; }
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                base_price: form.base_price || '0.00',
                expected_default_sessions: form.expected_default_sessions,
                consultation_required: form.consultation_required,
            };
            if (editing) {
                await mastersApi.procedureTypes.update(editing.id, payload);
                toast.success('Procedure type updated.');
            } else {
                await mastersApi.procedureTypes.create(payload);
                toast.success('Procedure type created.');
            }
            setDialogOpen(false);
            load();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to save procedure type.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (pt: ProcedureType) => {
        if (!confirm(`Delete "${pt.name}"? This cannot be undone.`)) return;
        try {
            await mastersApi.procedureTypes.delete(pt.id);
            toast.success('Deleted.');
            load();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to delete.');
        }
    };

    return (
        <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Procedure Types</CardTitle>
                        <CardDescription>Define the treatments and procedures your clinic offers.</CardDescription>
                    </div>
                    <Button onClick={openNew} className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl font-bold text-sm h-10 px-4">
                        <Plus className="w-4 h-4 mr-2 text-[#C4A882]" />
                        New Procedure Type
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C4A882]" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center text-[#A0978D] py-16 text-sm">No procedure types defined yet.</div>
                ) : (
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Name</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Description</TableHead>
                                <TableHead className="text-right font-bold text-[#1C1917] py-4 px-6 text-sm">Base Price</TableHead>
                                <TableHead className="text-right font-bold text-[#1C1917] py-4 px-6 text-sm">Sessions</TableHead>
                                <TableHead className="py-4 px-6" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(pt => (
                                <TableRow key={pt.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="py-4 px-6 font-bold text-[#1C1917] text-sm">{pt.name}</TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#78706A] max-w-xs truncate">{pt.description || '—'}</TableCell>
                                    <TableCell className="py-4 px-6 text-right font-medium text-sm text-[#1C1917]">৳{Number(pt.base_price).toFixed(2)}</TableCell>
                                    <TableCell className="py-4 px-6 text-right text-sm text-[#78706A]">{(pt as any).expected_default_sessions ?? 1}</TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(pt)} className="h-8 w-8 p-0 text-[#78706A] hover:text-[#1C1917]">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(pt)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Procedure Type' : 'New Procedure Type'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Name *</Label>
                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Botox Treatment" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Base Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0.00" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Default Sessions</Label>
                                <Input type="number" min="1" value={form.expected_default_sessions} onChange={e => setForm(f => ({ ...f, expected_default_sessions: parseInt(e.target.value) || 1 }))} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.consultation_required} onChange={e => setForm(f => ({ ...f, consultation_required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                            Requires consultation before billing
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─── Reusable simple CRUD tab ─────────────────────────────────────────────────

type SimpleItem = { id: number; name: string; description?: string };

function SimpleCrudTab({
    title,
    description,
    loadFn,
    createFn,
    updateFn,
    deleteFn,
    extraFields,
}: {
    title: string;
    description: string;
    loadFn: () => Promise<any>;
    createFn: (data: any) => Promise<any>;
    updateFn: (id: number, data: any) => Promise<any>;
    deleteFn: (id: number) => Promise<any>;
    extraFields?: (form: any, setForm: (f: any) => void) => React.ReactNode;
}) {
    const [items, setItems] = useState<SimpleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<SimpleItem | null>(null);
    const [form, setForm] = useState<any>({ name: '', description: '' });

    const load = async () => {
        setLoading(true);
        try {
            const res = await loadFn();
            setItems((res as any).results || res);
        } catch {
            toast.error(`Failed to load ${title.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setDialogOpen(true); };
    const openEdit = (item: SimpleItem) => { setEditing(item); setForm({ name: item.name, description: item.description || '', ...(item as any) }); setDialogOpen(true); };

    const handleSave = async () => {
        if (!form.name?.trim()) { toast.error('Name is required.'); return; }
        setSaving(true);
        try {
            if (editing) {
                await updateFn(editing.id, form);
                toast.success('Updated.');
            } else {
                await createFn(form);
                toast.success('Created.');
            }
            setDialogOpen(false);
            load();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: SimpleItem) => {
        if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        try {
            await deleteFn(item.id);
            toast.success('Deleted.');
            load();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to delete.');
        }
    };

    return (
        <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Button onClick={openNew} className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl font-bold text-sm h-10 px-4">
                        <Plus className="w-4 h-4 mr-2 text-[#C4A882]" /> New {title.replace(/s$/, '')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C4A882]" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center text-[#A0978D] py-16 text-sm">No {title.toLowerCase()} defined yet.</div>
                ) : (
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Name</TableHead>
                                {extraFields && <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Details</TableHead>}
                                <TableHead className="py-4 px-6" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="py-4 px-6 font-bold text-[#1C1917] text-sm">
                                        {item.name}
                                        {item.description && <div className="text-xs font-normal text-[#78706A] mt-0.5">{item.description}</div>}
                                    </TableCell>
                                    {extraFields && <TableCell className="py-4 px-6 text-sm text-[#78706A]">{/* extra column data rendered via edit */}</TableCell>}
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-[#78706A] hover:text-[#1C1917]">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Name *</Label>
                            <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" />
                        </div>
                        {'description' in form && (
                            <div className="grid gap-1.5">
                                <Label>Description</Label>
                                <Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} />
                            </div>
                        )}
                        {extraFields && extraFields(form, setForm)}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─── Procedure Categories Tab ─────────────────────────────────────────────────

function ProcedureCategoriesTab() {
    return (
        <SimpleCrudTab
            title="Procedure Categories"
            description="Group your procedure types into categories."
            loadFn={() => mastersApi.procedureCategories.list()}
            createFn={(data) => mastersApi.procedureCategories.create(data)}
            updateFn={(id, data) => mastersApi.procedureCategories.update(id, data)}
            deleteFn={(id) => mastersApi.procedureCategories.delete(id)}
        />
    );
}

// ─── Procedure Rooms Tab ──────────────────────────────────────────────────────

function ProcedureRoomsTab() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState({ name: '', description: '', is_active: true });

    const load = async () => {
        setLoading(true);
        try {
            const res = await mastersApi.procedureRooms.list();
            setItems((res as any).results || res);
        } catch { toast.error('Failed to load rooms'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const openNew = () => { setEditing(null); setForm({ name: '', description: '', is_active: true }); setDialogOpen(true); };
    const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, description: item.description || '', is_active: item.is_active ?? true }); setDialogOpen(true); };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required.'); return; }
        setSaving(true);
        try {
            if (editing) {
                await mastersApi.procedureRooms.update(editing.id, form);
                toast.success('Room updated.');
            } else {
                await mastersApi.procedureRooms.create(form);
                toast.success('Room created.');
            }
            setDialogOpen(false);
            load();
        } catch (error) { toast.error((error as Error).message || 'Failed to save.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        try {
            await mastersApi.procedureRooms.delete(item.id);
            toast.success('Deleted.');
            load();
        } catch (error) { toast.error((error as Error).message || 'Failed to delete.'); }
    };

    return (
        <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Procedure Rooms</CardTitle>
                        <CardDescription>Treatment rooms where sessions take place.</CardDescription>
                    </div>
                    <Button onClick={openNew} className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl font-bold text-sm h-10 px-4">
                        <Plus className="w-4 h-4 mr-2 text-[#C4A882]" /> New Room
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C4A882]" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center text-[#A0978D] py-16 text-sm">No rooms defined yet.</div>
                ) : (
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Name</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Status</TableHead>
                                <TableHead className="py-4 px-6" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="py-4 px-6 font-bold text-[#1C1917] text-sm">
                                        {item.name}
                                        {item.description && <div className="text-xs font-normal text-[#78706A] mt-0.5">{item.description}</div>}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.is_active ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-[#78706A] hover:text-[#1C1917]">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Room' : 'New Room'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Name *</Label>
                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Laser Room 1" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                            Active (available for session scheduling)
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─── Medicines Tab ────────────────────────────────────────────────────────────

const MEDICINE_FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'OINTMENT', 'CREAM', 'INJECTION', 'OTHER'];
const EMPTY_MED = { generic_name: '', brand_name: '', strength: '', form: 'TABLET', pharmacology_info: '' };

function MedicinesTab() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState({ ...EMPTY_MED });

    const load = async () => {
        setLoading(true);
        try {
            const res = await mastersApi.medicines.list({ search: search || undefined, limit: 200 });
            setItems((res as any).results || res);
        } catch { toast.error('Failed to load medicines'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const openNew = () => { setEditing(null); setForm({ ...EMPTY_MED }); setDialogOpen(true); };
    const openEdit = (item: any) => {
        setEditing(item);
        setForm({ generic_name: item.generic_name || '', brand_name: item.brand_name || '', strength: item.strength || '', form: item.form || 'TABLET', pharmacology_info: item.pharmacology_info || '' });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.generic_name.trim()) { toast.error('Generic name is required.'); return; }
        setSaving(true);
        try {
            if (editing) {
                await mastersApi.medicines.update(editing.id, form);
                toast.success('Medicine updated.');
            } else {
                await mastersApi.medicines.create(form);
                toast.success('Medicine created.');
            }
            setDialogOpen(false);
            load();
        } catch (error) { toast.error((error as Error).message || 'Failed to save.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Delete "${item.brand_name || item.generic_name}"?`)) return;
        try {
            await mastersApi.medicines.delete(item.id);
            toast.success('Deleted.');
            load();
        } catch (error) { toast.error((error as Error).message || 'Failed to delete.'); }
    };

    return (
        <Card className="border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>Medicines</CardTitle>
                        <CardDescription>Clinic medicine catalog used in prescriptions.</CardDescription>
                    </div>
                    <div className="flex gap-3">
                        <Input
                            placeholder="Search medicines…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-48 h-10 text-sm border-[#D9D0C5] rounded-xl"
                        />
                        <Button onClick={openNew} className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl font-bold text-sm h-10 px-4 shrink-0">
                            <Plus className="w-4 h-4 mr-2 text-[#C4A882]" /> New Medicine
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C4A882]" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center text-[#A0978D] py-16 text-sm">No medicines found.</div>
                ) : (
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Brand Name</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Generic Name</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Strength</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Form</TableHead>
                                <TableHead className="py-4 px-6" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="py-4 px-6 font-bold text-[#1C1917] text-sm">{item.brand_name || '—'}</TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#78706A]">{item.generic_name}</TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#78706A]">{item.strength || '—'}</TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#78706A]">{item.form}</TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 w-8 p-0 text-[#78706A] hover:text-[#1C1917]">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Medicine' : 'New Medicine'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Generic Name *</Label>
                            <Input value={form.generic_name} onChange={e => setForm(f => ({ ...f, generic_name: e.target.value }))} placeholder="e.g. Paracetamol" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Brand Name</Label>
                            <Input value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} placeholder="e.g. Napa" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Strength</Label>
                                <Input value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} placeholder="e.g. 500mg" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Form</Label>
                                <Select value={form.form} onValueChange={v => setForm(f => ({ ...f, form: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {MEDICINE_FORMS.map(f => <SelectItem key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Pharmacology Info</Label>
                            <Textarea value={form.pharmacology_info} onChange={e => setForm(f => ({ ...f, pharmacology_info: e.target.value }))} rows={2} placeholder="Optional notes" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ─── Stock Locations Tab ──────────────────────────────────────────────────────

function StockLocationsTab() {
    return (
        <SimpleCrudTab
            title="Stock Locations"
            description="Define physical storage areas (e.g. Main Pharmacy, Laser Room). Required for stock adjustments and receiving."
            loadFn={() => inventoryApi.stockLocations.list({ limit: 200 })}
            createFn={(data) => inventoryApi.stockLocations.create({ name: data.name })}
            updateFn={(id, data) => inventoryApi.stockLocations.update(id, { name: data.name })}
            deleteFn={(id) => inventoryApi.stockLocations.delete(id)}
        />
    );
}

// ─── Product Categories Tab ───────────────────────────────────────────────────

function ProductCategoriesTab() {
    return (
        <SimpleCrudTab
            title="Product Categories"
            description="Organise your product catalog into categories."
            loadFn={() => inventoryApi.categories.list({ limit: 200 })}
            createFn={(data) => inventoryApi.categories.create({ name: data.name })}
            updateFn={(id, data) => inventoryApi.categories.update(id, { name: data.name })}
            deleteFn={(id) => inventoryApi.categories.delete(id)}
        />
    );
}
