'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, Shield, FileText, CalendarCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/context/AuthContext';

const navItems = [
    { name: 'Global Settings', href: '/settings', icon: Settings, exact: true, permission: 'settings.read' },
    { name: 'Staff Management', href: '/settings/staff', icon: Users, exact: false, permission: 'settings.write' },
    { name: 'Roles & Permissions', href: '/settings/roles', icon: Shield, exact: false, permission: 'settings.write' },
    { name: 'Consent Templates', href: '/settings/consent-templates', icon: FileText, exact: false, permission: 'clinical.write' },
    { name: 'Online Booking', href: '/settings/booking', icon: CalendarCheck, exact: false, permission: 'settings.write' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { hasPermission } = useAuth();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-display font-bold text-[#1C1917]">Clinic Settings</h1>
                <p className="text-[#78706A]">Manage global configuration, staff access, and security policies.</p>
            </div>

            <div className="flex gap-2 border-b border-[#E8E1D6] pb-px">
                {navItems.filter(item => hasPermission(item.permission)).map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all',
                                isActive
                                    ? 'border-[#C4A882] text-[#1C1917]'
                                    : 'border-transparent text-[#78706A] hover:text-[#1C1917] hover:border-[#D9D0C5]'
                            )}
                        >
                            <item.icon className={clsx('w-4 h-4', isActive ? 'text-[#C4A882]' : 'text-[#A0978D]')} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-[#E8E1D6] overflow-hidden min-h-[500px]">
                {children}
            </div>
        </div>
    );
}
