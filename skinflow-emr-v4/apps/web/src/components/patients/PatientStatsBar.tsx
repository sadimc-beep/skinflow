"use client";

import { CalendarCheck, Receipt, TrendingUp, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PatientStats {
    totalAppointments: number;
    outstandingBalance: number;
    lifetimeSpend: number;
    lastVisitDate: string | null;
}

interface PatientStatsBarProps {
    stats: PatientStats;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount);

export function PatientStatsBar({ stats }: PatientStatsBarProps) {
    const statItems = [
        {
            label: 'Total Visits',
            value: stats.totalAppointments.toString(),
            icon: CalendarCheck,
            color: 'text-[#1C1917]',
            bg: 'bg-[#F7F3ED]',
        },
        {
            label: 'Lifetime Spend',
            value: formatCurrency(stats.lifetimeSpend),
            icon: TrendingUp,
            color: 'text-[#7A9E8A]',
            bg: 'bg-[#7A9E8A]/10',
        },
        {
            label: 'Outstanding Balance',
            value: formatCurrency(stats.outstandingBalance),
            icon: Receipt,
            color: stats.outstandingBalance > 0 ? 'text-[#C4705A]' : 'text-[#78706A]',
            bg: stats.outstandingBalance > 0 ? 'bg-[#C4705A]/10' : 'bg-[#F7F3ED]',
        },
        {
            label: 'Last Visit',
            value: stats.lastVisitDate
                ? format(parseISO(stats.lastVisitDate), 'MMM d, yyyy')
                : 'No visits yet',
            icon: Clock,
            color: 'text-[#C4A882]',
            bg: 'bg-[#C4A882]/10',
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statItems.map((item) => {
                const Icon = item.icon;
                return (
                    <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-xl border border-[#E8E1D6] bg-white px-4 py-3 shadow-sm"
                    >
                        <div className={`rounded-lg p-2 ${item.bg}`}>
                            <Icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                            <p className={`text-sm font-bold truncate ${item.color}`}>{item.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
