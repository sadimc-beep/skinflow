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
import { StaffManagementTab, RolesManagementTab } from './StaffAndRolesClient';
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

