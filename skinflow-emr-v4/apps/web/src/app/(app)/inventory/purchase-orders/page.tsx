import { PurchaseOrdersListClient } from "@/components/inventory/PurchaseOrdersListClient";

export default function PurchaseOrdersPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Purchase Orders</h1>
                <p className="text-slate-500">Manage supply orders sent to your vendors.</p>
            </div>

            <PurchaseOrdersListClient />
        </div>
    );
}
