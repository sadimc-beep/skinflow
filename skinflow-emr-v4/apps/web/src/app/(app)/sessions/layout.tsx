'use client';

import { FeatureGate } from '@/components/shell/FeatureGate';

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGate feature="procedure_sessions">
            {children}
        </FeatureGate>
    );
}
