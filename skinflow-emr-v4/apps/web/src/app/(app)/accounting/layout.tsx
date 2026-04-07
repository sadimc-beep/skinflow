'use client';

import { FeatureGate } from '@/components/shell/FeatureGate';

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature="accounting">
            {children}
        </FeatureGate>
    );
}
