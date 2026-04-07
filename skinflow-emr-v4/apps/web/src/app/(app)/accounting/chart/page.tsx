import { ChartOfAccountsClient } from "@/components/accounting/ChartOfAccountsClient";

export default function ChartOfAccountsPage() {
    return (
        <div className="p-6 sm:p-8 max-w-[1600px] mx-auto space-y-6">
            <h1 className="font-display text-4xl text-[#1C1917] leading-tight tracking-tight">Chart of Accounts</h1>
            <ChartOfAccountsClient />
        </div>
    );
}
