"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Package,
    ShoppingCart,
    BookOpen,
    Settings,
    LogOut,
    CreditCard,
    Shield,
} from 'lucide-react';

const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
];

const clinicalNav = [
    { name: 'Patients', href: '/patients', icon: Users, permission: 'patients.read', activePrefixes: ['/patients'] },
    { name: 'Clinical', href: '/clinical', icon: Stethoscope, permission: 'clinical.read', activePrefixes: ['/clinical', '/appointments', '/consultations', '/sessions'] },
];

const operationsNav = [
    { name: 'Finance', href: '/finance', icon: BookOpen, permission: 'accounting.read', activePrefixes: ['/finance', '/billing', '/accounting'] },
    { name: 'Inventory', href: '/store', icon: Package, permission: 'inventory.read', activePrefixes: ['/store', '/inventory'] },
    { name: 'Point of Sale', href: '/pos', icon: ShoppingCart, permission: 'pos.read', activePrefixes: ['/pos'] },
];

const adminNav = [
    { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.read' },
    { name: 'Account', href: '/account', icon: CreditCard, permission: null },
];

const navigation = [...mainNav, ...clinicalNav, ...operationsNav, ...adminNav];

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission: string | null;
    activePrefixes?: string[];
};

function renderNavGroup(items: NavItem[], pathname: string | null, hasPermission: (p: string) => boolean) {
    return items
        .filter(item => item.permission === null || hasPermission(item.permission))
        .map((item) => {
            const isActive = item.activePrefixes
                ? item.activePrefixes.some((prefix: string) => pathname?.startsWith(prefix))
                : pathname?.startsWith(item.href);
            return (
                <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive
                            ? 'bg-[#1C1917] text-[#F7F3ED]'
                            : 'text-[#78706A] hover:text-[#1C1917] hover:bg-[#D9D0C5]/60'
                    )}
                >
                    <item.icon className={clsx(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#F7F3ED]' : 'text-[#A0978D] group-hover:text-[#1C1917]'
                    )} />
                    <span className="flex-1">{item.name}</span>
                </Link>
            );
        });
}

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout, hasPermission } = useAuth();

    const visibleNav = navigation.filter(item =>
        item.permission === null || hasPermission(item.permission)
    );

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
            {/* The sidebar is the same warm cream as the background — it dissolves */}
            <div className="flex grow flex-col overflow-y-auto no-scrollbar bg-[#E8E1D6]">

                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center px-6">
                    <div className="flex items-center gap-2.5">
                        {/* Diamond mark — evocative of Radiant's geometric logo element */}
                        <div className="w-7 h-7 flex items-center justify-center">
                            <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
                                <path d="M14 3L25 14L14 25L3 14L14 3Z" fill="#1C1917" />
                                <path d="M14 8L20 14L14 20L8 14L14 8Z" fill="#EDE7DC" />
                            </svg>
                        </div>
                        <span className="text-[#1C1917] font-bold text-base tracking-tight">Skinflow</span>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex flex-1 flex-col px-3 py-2">
                    {/* Dashboard */}
                    <div className="space-y-0.5">
                        {renderNavGroup(mainNav, pathname, hasPermission)}
                    </div>

                    {/* Clinical */}
                    <div className="mt-5 mb-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0978D]">Clinical</p>
                    </div>
                    <div className="space-y-0.5">
                        {renderNavGroup(clinicalNav, pathname, hasPermission)}
                    </div>

                    {/* Operations */}
                    <div className="mt-5 mb-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0978D]">Operations</p>
                    </div>
                    <div className="space-y-0.5">
                        {renderNavGroup(operationsNav, pathname, hasPermission)}
                    </div>

                    {/* Admin */}
                    <div className="mt-5 mb-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0978D]">Admin</p>
                    </div>
                    <div className="space-y-0.5">
                        {renderNavGroup(adminNav, pathname, hasPermission)}
                    </div>
                </nav>

                {/* Divider */}
                <div className="mx-4 h-px bg-[#D9D0C5]" />

                {/* User footer */}
                <div className="shrink-0 px-3 py-4">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl group hover:bg-[#D9D0C5]/60 transition">
                        <div className="w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center text-[11px] font-bold text-[#F7F3ED] shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1C1917] truncate">{user?.name || 'User'}</p>
                            <p className="text-[11px] text-[#A0978D] truncate">{user?.role?.name || 'No Role'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="text-[#C4A882] hover:text-[#1C1917] transition shrink-0"
                            title="Log out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
