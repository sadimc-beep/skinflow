'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';

// ─── Route label map for breadcrumbs ─────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    consultations: 'Consultations',
    sessions: 'Sessions',
    billing: 'Billing',
    accounting: 'Accounting',
    inventory: 'Inventory & Store',
    pos: 'Point of Sale',
    settings: 'Admin & Settings',
    // Accounting sub-pages
    chart: 'Chart of Accounts',
    journals: 'Journal Entries',
    banking: 'Banking & Checks',
    reports: 'Financial Reports',
    // Inventory sub-pages
    products: 'Products',
    stock: 'Stock Levels',
    vendors: 'Vendors',
    'purchase-orders': 'Purchase Orders',
    grn: 'Receive Goods (GRN)',
    bills: 'Vendor Bills',
    requisitions: 'Requisitions',
    fulfillment: 'Fulfillment',
    // Actions
    new: 'New',
    edit: 'Edit',
};

function getLabel(segment: string): string {
    // If it looks like a numeric ID or UUID, show something like "Record"
    if (/^\d+$/.test(segment)) return `#${segment}`;
    return ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function Breadcrumbs() {
    const pathname = usePathname();
    const router = useRouter();

    // Split path into segments, ignore empty
    const segments = pathname.split('/').filter(Boolean);

    // Don't show breadcrumbs on the dashboard itself
    if (segments.length <= 1 && segments[0] === 'dashboard') return null;

    // Build cumulative href for each segment
    const crumbs = segments.map((seg, i) => ({
        label: getLabel(seg),
        href: '/' + segments.slice(0, i + 1).join('/'),
    }));

    const canGoBack = segments.length > 1;

    return (
        <div className="flex items-center gap-2 text-sm">
            {/* Back button — only when deeper than 1 level */}
            {canGoBack && (
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition mr-1"
                    aria-label="Go back"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                </button>
            )}

            {/* Breadcrumb trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-slate-400">
                {/* Home always first */}
                <Link href="/dashboard" className="hover:text-indigo-600 transition">
                    <Home className="w-3.5 h-3.5" />
                </Link>

                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <span key={crumb.href} className="flex items-center gap-1">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            {isLast ? (
                                <span className="text-slate-700 font-medium">{crumb.label}</span>
                            ) : (
                                <Link href={crumb.href} className="hover:text-indigo-600 transition text-slate-500">
                                    {crumb.label}
                                </Link>
                            )}
                        </span>
                    );
                })}
            </nav>
        </div>
    );
}
