import { VendorBillsClient } from "@/components/inventory/VendorBillsClient";

export default function VendorBillsPage() {
    return (
        <div className="p-8 pb-20">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-[#1C1917] tracking-tight">Accounts Payable Ledger</h1>
                <p className="text-slate-500">Track and manage bills received from your pharmaceutical and clinical suppliers.</p>
            </div>

            <VendorBillsClient />
        </div>
    );
}
