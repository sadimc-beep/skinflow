import { InvoicesListClient } from '@/components/billing/InvoicesListClient';

export default function InvoicesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Billing & Invoices</h2>
                <p className="text-muted-foreground hidden sm:block">Track clinic revenue and patient balances.</p>
            </div>

            <InvoicesListClient initialData={[]} />
        </div>
    )
}
