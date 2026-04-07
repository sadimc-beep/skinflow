import { billingApi } from '@/lib/services/billing';
import type { Invoice } from '@/types/models';
import { InvoiceDetailClient } from '@/components/billing/InvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let invoice: Invoice | null = null;

    try {
        invoice = await billingApi.invoices.get(id);
    } catch (error) {
        console.error('Failed to fetch invoice:', error);
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Invoice Not Found</h2>
                <p className="text-muted-foreground">The requested invoice could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="font-display text-3xl text-[#1C1917] tracking-tight">Invoice #{invoice.id}</h2>
                    <p className="text-muted-foreground">
                        {invoice.patient_details?.first_name} {invoice.patient_details?.last_name} • {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <InvoiceDetailClient initialData={invoice} />
        </div>
    );
}
