import { InvoicesListClient } from '@/components/billing/InvoicesListClient';
import { billingApi } from '@/lib/services/billing';
import type { Invoice } from '@/types/models';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    let invoices: Invoice[] = [];

    try {
        const res = await billingApi.invoices.list({ limit: 100 });
        invoices = res.results || [];
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Billing & Invoices</h2>
                <p className="text-muted-foreground hidden sm:block">Track clinic revenue and patient balances.</p>
            </div>

            <InvoicesListClient initialData={invoices} />
        </div>
    )
}
