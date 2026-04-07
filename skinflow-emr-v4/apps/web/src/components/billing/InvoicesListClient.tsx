"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Search, FileText } from 'lucide-react';
import type { Invoice } from '@/types/models';

const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(num);
};

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { value: 'PAID', label: 'Paid' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

function getStatusBadge(status: string) {
    switch (status) {
        case 'DRAFT': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#A0978D] border-[#D9D0C5]">Draft</Badge>;
        case 'UNPAID': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#C4705A] border-[#C4705A]/30">Unpaid</Badge>;
        case 'PARTIALLY_PAID': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#C4A882] border-[#C4A882]/30">Partial</Badge>;
        case 'PAID': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#7A9E8A] border-[#7A9E8A]/30">Paid</Badge>;
        case 'CANCELLED': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#A0978D] border-[#D9D0C5]">Cancelled</Badge>;
        case 'REFUNDED': return <Badge variant="outline" className="bg-[#F7F3ED] text-[#A0978D] border-[#D9D0C5]">Refunded</Badge>;
        default: return <Badge variant="outline" className="bg-[#F7F3ED] text-[#1C1917] border-[#D9D0C5]">{status}</Badge>;
    }
}

export function InvoicesListClient({ initialData }: { initialData: Invoice[] }) {
    const router = useRouter();
    const [invoices] = useState(initialData);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const filteredInvoices = invoices.filter(inv => {
        const term = searchTerm.toLowerCase();
        const matchesName = `${inv.patient_details?.first_name} ${inv.patient_details?.last_name}`.toLowerCase().includes(term);
        const matchesId = inv.id.toString().includes(term);
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return (matchesName || matchesId) && matchesStatus;
    });

    // Totals summary
    const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_due || '0'), 0);
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by ID or Patient Name..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-2xl border border-slate-200/60 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Total (৳)</TableHead>
                            <TableHead className="text-right">Balance (৳)</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No invoices found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => router.push(`/billing/${invoice.id}`)}>
                                    <TableCell className="font-medium whitespace-nowrap font-mono text-sm">
                                        INV-{invoice.id.toString().padStart(6, '0')}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {format(parseISO(invoice.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.patient_details ? (
                                            <span className="font-medium text-[#1C1917]">
                                                {invoice.patient_details.first_name} {invoice.patient_details.last_name}
                                            </span>
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell className="capitalize text-sm text-muted-foreground">
                                        {invoice.invoice_type.replace('_', ' ').toLowerCase()}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                                    <TableCell className={`text-right font-bold ${parseFloat(invoice.balance_due) > 0 ? 'text-[#C4705A]' : 'text-[#7A9E8A]'}`}>
                                        {formatCurrency(invoice.balance_due)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(invoice.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); router.push(`/billing/${invoice.id}`); }}
                                            className="rounded-full px-5 font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] shadow-sm min-w-[80px]"
                                        >
                                            {invoice.status === 'UNPAID' || invoice.status === 'PARTIALLY_PAID' ? 'Pay' : 'View'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Totals Summary Row */}
            {filteredInvoices.length > 0 && (
                <div className="flex justify-end gap-6 text-sm px-2 pt-1 border-t">
                    <span className="text-muted-foreground">
                        {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                    </span>
                    <span className={totalOutstanding > 0 ? 'text-[#C4705A] font-semibold' : 'text-[#7A9E8A] font-semibold'}>
                        Outstanding: {formatCurrency(totalOutstanding)}
                    </span>
                </div>
            )}
        </div>
    );
}
