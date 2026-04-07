'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Building2, Users, CreditCard, Megaphone,
    ScrollText, LayoutDashboard, ArrowLeft, FileText
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
    { name: 'Plans & Pricing', href: '/superadmin/plans', icon: CreditCard },
    { name: 'Invoices', href: '/superadmin/invoices', icon: FileText },
    { name: 'Announcements', href: '/superadmin/announcements', icon: Megaphone },
    { name: 'Audit Log', href: '/superadmin/audit-log', icon: ScrollText },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#1C1917] flex">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 border-r border-[#2E2A25] flex flex-col">
                <div className="p-5 border-b border-[#2E2A25]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#C4A882] flex items-center justify-center">
                            <span className="text-[#1C1917] font-bold text-sm">S</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#F7F3ED]">Skinflow</p>
                            <p className="text-[10px] text-[#A0978D] uppercase tracking-widest">Super Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/superadmin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-[#C4A882]/15 text-[#C4A882]'
                                    : 'text-[#78706A] hover:text-[#F7F3ED] hover:bg-[#2E2A25]'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-[#2E2A25]">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#78706A] hover:text-[#F7F3ED] hover:bg-[#2E2A25] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Clinic
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 bg-[#F7F3ED] rounded-tl-3xl overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
