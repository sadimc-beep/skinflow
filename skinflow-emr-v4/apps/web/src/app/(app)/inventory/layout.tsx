'use client';

import { FeatureGate } from '@/components/shell/FeatureGate';

export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FeatureGate feature="inventory">
            <div className="p-6 sm:p-8 max-w-[1600px] mx-auto">
                <div className="bg-transparent rounded-xl">
                    {children}
                </div>
            </div>
        </FeatureGate>
    );
}
