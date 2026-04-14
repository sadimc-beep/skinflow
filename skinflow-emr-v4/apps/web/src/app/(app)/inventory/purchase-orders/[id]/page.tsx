import { fetchApi } from "@/lib/api";
import { PurchaseOrderDetailClient } from "@/components/inventory/PurchaseOrderDetailClient";
import { notFound } from "next/navigation";

export default async function PurchaseOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    try {
        const po = await fetchApi(`inventory/purchase-orders/${id}/`);
        return (
            <div className="p-6">
                <PurchaseOrderDetailClient po={po} />
            </div>
        );
    } catch {
        notFound();
    }
}
