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
import { StaffManagementTab, RolesManagementTab } from './StaffAndRolesClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
                <TabsList className="h-11 rounded-full bg-[#E8E1D6] p-1 gap-1 mb-6">
                    <TabsTrigger value="ledger" className="rounded-full px-5 font-bold text-sm">Ledger Mapping</TabsTrigger>
                    <TabsTrigger value="users" className="rounded-full px-5 font-bold text-sm">Users</TabsTrigger>
                    <TabsTrigger value="roles" className="rounded-full px-5 font-bold text-sm">Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="procedures" className="rounded-full px-5 font-bold text-sm">Procedure Types</TabsTrigger>
                    <TabsTrigger value="kiosk" className="rounded-full px-5 font-bold text-sm">Kiosk Setup</TabsTrigger>
                    <TabsTrigger value="general" className="rounded-full px-5 font-bold text-sm">General Preferences</TabsTrigger>
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
                                        <Select
                                            value={settings.default_ar_account?.toString() || ""}
                                            onValueChange={v => setSettings({ ...settings, default_ar_account: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Asset Account..." /></SelectTrigger>
                                            <SelectContent>
                                                {assetAccounts.map(a => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>{a.code ? `${a.code} - ` : ''}{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Sales Revenue *</label>
                                        <div className="text-xs text-slate-500 mb-1">Credited when Invoices are finalized.</div>
                                        <Select
                                            value={settings.default_revenue_account?.toString() || ""}
                                            onValueChange={v => setSettings({ ...settings, default_revenue_account: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Revenue Account..." /></SelectTrigger>
                                            <SelectContent>
                                                {revenueAccounts.map(a => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>{a.code ? `${a.code} - ` : ''}{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold border-b pb-2">Purchasing & Payables</h3>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Accounts Payable (A/P) *</label>
                                        <div className="text-xs text-slate-500 mb-1">Credited when Vendor Bills are generated from GRNs.</div>
                                        <Select
                                            value={settings.default_ap_account?.toString() || ""}
                                            onValueChange={v => setSettings({ ...settings, default_ap_account: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Liability Account..." /></SelectTrigger>
                                            <SelectContent>
                                                {liabilityAccounts.map(a => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>{a.code ? `${a.code} - ` : ''}{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Default Inventory Asset *</label>
                                        <div className="text-xs text-slate-500 mb-1">Debited when items are received into the store.</div>
                                        <Select
                                            value={settings.default_inventory_account?.toString() || ""}
                                            onValueChange={v => setSettings({ ...settings, default_inventory_account: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Asset Account..." /></SelectTrigger>
                                            <SelectContent>
                                                {assetAccounts.map(a => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>{a.code ? `${a.code} - ` : ''}{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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

