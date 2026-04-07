'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useUsage } from '@/lib/context/UsageContext';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
    const { hasFeature, isLoading } = useUsage();

    if (isLoading) return <>{children}</>;

    if (hasFeature(feature)) return <>{children}</>;

    return (
        <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl">
            {/* Blurred background preview */}
            <div className="absolute inset-0 pointer-events-none select-none opacity-30 blur-sm">
                {children}
            </div>

            {/* Upgrade overlay */}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-8 py-12 bg-white/90 rounded-2xl shadow-lg border border-[#E8E1D6] max-w-sm">
                <div className="w-14 h-14 rounded-full bg-[#F7F3ED] flex items-center justify-center">
                    <Lock className="w-7 h-7 text-[#C4A882]" />
                </div>
                <div>
                    <p className="text-lg font-semibold text-[#1C1917] mb-1">Feature not available</p>
                    <p className="text-sm text-[#78706A]">
                        This feature is not included in your current plan. Upgrade to unlock it.
                    </p>
                </div>
                <Link
                    href="/settings/subscription"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C4A882] hover:bg-[#B8976E] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    Upgrade Plan
                </Link>
            </div>
        </div>
    );
}
