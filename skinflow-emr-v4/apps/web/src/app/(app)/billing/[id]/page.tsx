'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { billingApi } from '@/lib/services/billing';
import type { Invoice } from '@/types/models';
import { InvoiceDetailClient } from '@/components/billing/InvoiceDetailClient';

export default function InvoicePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        billingApi.invoices.get(id)
            .then(setInvoice)
            .catch(() => setNotFound(true))
            .finally(() => setIsLoading(false));
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading invoice…
            </div>
        );
    }

    if (notFound || !invoice) {
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
