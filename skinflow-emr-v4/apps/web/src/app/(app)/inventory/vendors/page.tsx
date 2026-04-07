import { VendorsClient } from "@/components/inventory/VendorsClient";

export default function VendorsPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Vendors Directory</h1>
                <p className="text-slate-500">Manage pharmaceutical suppliers, clinical distributors, and service providers.</p>
            </div>

            <VendorsClient />
        </div>
    );
}
