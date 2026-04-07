import { billingApi } from '@/lib/services/billing';
import { FulfillmentListClient } from '@/components/inventory/FulfillmentListClient';

export const dynamic = 'force-dynamic';

export default async function FulfillmentPage() {
    // In a real application, we might filter by is_fulfilled=False directly in the query.
    // We'll fetch the recent items that belong to products.
    // reference_model='PrescriptionProduct' or 'Product' depending on how it's saved.
    const res = await billingApi.invoiceItems.list({ limit: 100 });

    // For MVP, we filter on the client or server. We'll pass all and let the client tab it.
    const items = res.results || [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Store Fulfillment</h2>
                <div className="flex items-center space-x-2">
                    {/* Add any extra actions here */}
                </div>
            </div>

            <FulfillmentListClient initialData={items} />
        </div>
    );
}
