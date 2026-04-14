import { FulfillmentListClient } from '@/components/inventory/FulfillmentListClient';

export default function FulfillmentPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Fulfillment Queue</h1>
                <p className="text-slate-500">Hand over paid products to patients. Items appear here after invoice payment.</p>
            </div>

            <FulfillmentListClient />
        </div>
    );
}
