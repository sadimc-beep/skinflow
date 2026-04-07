'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

const CLINICAL_TABS = [
    { name: 'Overview', href: '/clinical' },
    { name: 'Appointments', href: '/appointments' },
    { name: 'Consultations', href: '/consultations' },
    { name: 'Sessions', href: '/sessions' },
];

const FINANCE_TABS = [
    { name: 'Overview', href: '/finance' },
    { name: 'Billing', href: '/billing' },
    { name: 'Chart of Accounts', href: '/accounting/chart' },
    { name: 'Journals', href: '/accounting/journals' },
    { name: 'Banking', href: '/accounting/banking' },
    { name: 'Reports', href: '/accounting/reports' },
];

const STORE_TABS = [
    { name: 'Overview', href: '/store' },
    { name: 'Catalog', href: '/inventory/products' },
    { name: 'Stock Levels', href: '/inventory/stock' },
    { name: 'Purchase Orders', href: '/inventory/purchase-orders' },
    { name: 'Receive (GRN)', href: '/inventory/grn' },
    { name: 'Vendors', href: '/inventory/vendors' },
];

function getSubNav(pathname: string) {
    if (pathname.startsWith('/clinical') || pathname.startsWith('/appointments') || pathname.startsWith('/consultations') || pathname.startsWith('/sessions')) return CLINICAL_TABS;
    if (pathname.startsWith('/finance') || pathname.startsWith('/billing') || pathname.startsWith('/accounting')) return FINANCE_TABS;
    if (pathname.startsWith('/store') || pathname.startsWith('/inventory')) return STORE_TABS;
    return [];
}

export function TopNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    const tabs = getSubNav(pathname);

    return (
        <header className="sticky top-0 z-30 bg-[#F7F3ED]/90 backdrop-blur-md border-b border-[#E8E1D6] flex h-14 shrink-0 items-center justify-between px-6 lg:px-8 gap-4 rounded-t-[1.75rem]">
            {/* Left: Back Button */}
            <div className="flex-1 min-w-0 flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 rounded-full text-[#1C1917] hover:bg-[#E8E1D6]"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Center: Sub-navigation tabs — pill style matching Radiant */}
            {tabs.length > 0 && (
                <nav className="hidden lg:flex items-center gap-1 bg-[#E8E1D6] p-1 rounded-full overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = tab.href === '/store' || tab.href === '/inventory'
                            ? pathname === tab.href
                            : pathname.startsWith(tab.href);

                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={clsx(
                                    'px-4 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap',
                                    isActive
                                        ? 'bg-[#1C1917] text-[#F7F3ED] font-semibold shadow-sm'
                                        : 'text-[#78706A] hover:text-[#1C1917] font-medium'
                                )}
                            >
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            )}

            {/* Right: Clinic context + avatar */}
            <div className="flex flex-1 justify-end items-center gap-3 shrink-0">
                <span className="hidden sm:block text-xs font-semibold text-[#78706A] bg-[#E8E1D6] px-3 py-1.5 rounded-full border border-[#D9D0C5]">
                    {user?.organization_name || 'Superadmin'}
                </span>
                <div className="h-8 w-8 rounded-full bg-[#1C1917] flex items-center justify-center text-xs font-bold text-[#F7F3ED] cursor-pointer ring-2 ring-[#C4A882]/30">
                    {initials}
                </div>
            </div>
        </header>
    );
}
