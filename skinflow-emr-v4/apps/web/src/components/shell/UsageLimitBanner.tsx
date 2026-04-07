'use client';

import Link from 'next/link';
import { AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { useUsage } from '@/lib/context/UsageContext';

export function UsageLimitBanner() {
    const { usage, isLoading } = useUsage();

    if (isLoading || !usage) return null;

    const status = usage.subscription_status;

    if (status === 'CANCELLED') {
        return (
            <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-3 text-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">Subscription cancelled.</span>
                <span>All write operations are disabled.</span>
                <Link href="/settings/subscription" className="ml-auto underline font-semibold whitespace-nowrap">
                    Reactivate Plan
                </Link>
            </div>
        );
    }

    if (status === 'SUSPENDED') {
        return (
            <div className="bg-orange-600 text-white px-4 py-2 flex items-center gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">Account suspended.</span>
                <span>You can view records but cannot make changes.</span>
                <Link href="/settings/subscription" className="ml-auto underline font-semibold whitespace-nowrap">
                    Contact Support
                </Link>
            </div>
        );
    }

    if (status === 'PAST_DUE') {
        return (
            <div className="bg-yellow-500 text-white px-4 py-2 flex items-center gap-3 text-sm">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="font-medium">Payment overdue.</span>
                <span>Please update your billing to avoid service interruption.</span>
                <Link href="/settings/subscription" className="ml-auto underline font-semibold whitespace-nowrap">
                    Update Billing
                </Link>
            </div>
        );
    }

    // Check for at-limit or near-limit on any resource
    const limits = usage.limits || {};
    const atLimit = Object.entries(limits).find(([, v]) => v.at_limit);
    const nearLimit = Object.entries(limits).find(([, v]) => v.near_limit);

    if (atLimit) {
        const [type, info] = atLimit;
        return (
            <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 flex items-center gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>
                    You have reached your <span className="font-semibold">{type}</span> limit ({info.current}/{info.max}).
                    New {type} cannot be added.
                </span>
                <Link href="/settings/subscription" className="ml-auto underline font-semibold whitespace-nowrap">
                    Upgrade Plan
                </Link>
            </div>
        );
    }

    if (nearLimit) {
        const [type, info] = nearLimit;
        return (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 flex items-center gap-3 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                    Approaching <span className="font-semibold">{type}</span> limit ({info.current}/{info.max} — {info.percent}% used).
                </span>
                <Link href="/settings/subscription" className="ml-auto underline font-semibold whitespace-nowrap">
                    Upgrade Plan
                </Link>
            </div>
        );
    }

    return null;
}
