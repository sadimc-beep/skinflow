import { GRNListClient } from "@/components/inventory/GRNListClient";

export default function GRNPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Goods Received Notes (GRN)</h1>
                <p className="text-slate-500">Record incoming shipments, verify quantities against Purchase Orders, and automatically update warehouse stock levels.</p>
            </div>

            <GRNListClient />
        </div>
    );
}
