'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { settingsApi } from '@/lib/services/settings';
import toast from 'react-hot-toast';

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: string;
}

interface AccountMappingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
}

interface MappingField {
    key: string;
    label: string;
    hint: string;
}

const MAPPING_GROUPS: { title: string; fields: MappingField[] }[] = [
    {
        title: 'Receivables & Payables',
        fields: [
            { key: 'default_ar_account', label: 'Accounts Receivable', hint: 'DR on invoice creation, CR on payment received' },
            { key: 'default_ap_account', label: 'Accounts Payable', hint: 'CR on GRN confirmation, DR on vendor payment' },
        ],
    },
    {
        title: 'Revenue Accounts',
        fields: [
            { key: 'default_consultation_revenue_account', label: 'Consultation Fee Revenue', hint: 'CR when consultation fees are invoiced' },
            { key: 'default_procedure_revenue_account', label: 'Procedure Revenue', hint: 'CR when procedures are invoiced' },
            { key: 'default_product_revenue_account', label: 'Product / Pharmacy Revenue', hint: 'CR when products are invoiced' },
        ],
    },
    {
        title: 'Cost of Goods Sold',
        fields: [
            { key: 'default_product_cogs_account', label: 'Product COGS', hint: 'DR when products are handed over from stock' },
            { key: 'default_procedure_cogs_account', label: 'Procedure / Consumables COGS', hint: 'DR when consumables are issued via clinical requisition' },
        ],
    },
    {
        title: 'Payment Method Accounts',
        fields: [
            { key: 'default_cash_account', label: 'Cash Account', hint: 'DR when Cash payments are received' },
            { key: 'default_bank_account', label: 'Bank / Card Account', hint: 'DR when Card or bank transfer payments are received' },
            { key: 'default_bkash_account', label: 'bKash Account', hint: 'DR when bKash payments are received' },
            { key: 'default_nagad_account', label: 'Nagad Account', hint: 'DR when Nagad payments are received' },
        ],
    },
    {
        title: 'Inventory',
        fields: [
            { key: 'default_inventory_account', label: 'Inventory Asset', hint: 'DR on GRN receipt; CR when stock is consumed (COGS)' },
        ],
    },
];

const NONE_VALUE = '__none__';

export function AccountMappingModal({ open, onOpenChange, accounts }: AccountMappingModalProps) {
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        settingsApi.getClinicSettings()
            .then((data: any) => {
                const initial: Record<string, string> = {};
                MAPPING_GROUPS.forEach(group => {
                    group.fields.forEach(field => {
                        const val = data[field.key];
                        initial[field.key] = val ? String(val) : NONE_VALUE;
                    });
                });
                setMapping(initial);
            })
            .catch(() => toast.error('Failed to load current account mapping.'))
            .finally(() => setLoading(false));
    }, [open]);

    const handleSave = async () => {
        setSaving(true);
        const payload: Record<string, number | null> = {};
        MAPPING_GROUPS.forEach(group => {
            group.fields.forEach(field => {
                const val = mapping[field.key];
                payload[field.key] = val && val !== NONE_VALUE ? parseInt(val) : null;
            });
        });
        try {
            await settingsApi.updateClinicSettings(payload);
            toast.success('Account mapping saved.');
            onOpenChange(false);
        } catch (error: any) {
            toast.error((error as Error).message || 'Failed to save account mapping.');
        } finally {
            setSaving(false);
        }
    };

    const accountLabel = (acc: Account) =>
        acc.code ? `${acc.code} — ${acc.name}` : acc.name;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">Account Mapping</DialogTitle>
                    <DialogDescription className="text-sm text-[#78706A]">
                        Map each transaction type to a ledger account. Automated journal entries will use these accounts.
                        If a granular revenue account is not set, the system falls back to the generic revenue account.
                        Leave a field blank to skip journal posting for that transaction type.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#C4A882]" />
                    </div>
                ) : (
                    <div className="space-y-7">
                        {MAPPING_GROUPS.map(group => (
                            <div key={group.title}>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A0978D] mb-3 border-b border-[#E8E1D6] pb-2">
                                    {group.title}
                                </h3>
                                <div className="space-y-3">
                                    {group.fields.map(field => (
                                        <div key={field.key} className="grid grid-cols-[180px_1fr] items-start gap-4">
                                            <div className="pt-2">
                                                <p className="text-sm font-semibold text-[#1C1917] leading-tight">{field.label}</p>
                                                <p className="text-xs text-[#A0978D] mt-0.5 leading-snug">{field.hint}</p>
                                            </div>
                                            <Select
                                                value={mapping[field.key] ?? NONE_VALUE}
                                                onValueChange={val => setMapping(prev => ({ ...prev, [field.key]: val }))}
                                            >
                                                <SelectTrigger className="h-11 bg-[#F7F3ED] border-[#D9D0C5] focus:ring-[#C4A882] rounded-xl text-sm text-[#1C1917]">
                                                    <SelectValue placeholder="— not mapped —" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px] border-[#D9D0C5] rounded-xl shadow-md">
                                                    <SelectItem value={NONE_VALUE} className="text-[#A0978D] italic focus:bg-[#EDE7DC]">
                                                        — not mapped —
                                                    </SelectItem>
                                                    {accounts.map(acc => (
                                                        <SelectItem
                                                            key={acc.id}
                                                            value={String(acc.id)}
                                                            className="focus:bg-[#EDE7DC] focus:text-[#1C1917] text-sm"
                                                        >
                                                            {accountLabel(acc)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter className="mt-8 gap-3 sm:gap-0 space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832] disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Mapping
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
