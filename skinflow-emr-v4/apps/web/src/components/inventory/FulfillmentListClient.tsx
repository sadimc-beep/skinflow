"use client";

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { billingApi } from '@/lib/services/billing';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PackageCheck, Inbox } from 'lucide-react';
import { toast } from 'sonner';

export function FulfillmentListClient() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [date, setDate] = useState(today);
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fulfilling, setFulfilling] = useState<number | null>(null);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await billingApi.invoiceItems.list({
                is_fulfilled: 'false',
                invoice__status: 'PAID',
                reference_model: 'PrescriptionProduct',
                date,
                limit: 200,
            });
            setItems(res.results || []);
        } catch {
            toast.error('Failed to load fulfillment queue.');
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleFulfill = async (item: any) => {
        setFulfilling(item.id);
        try {
            await billingApi.invoiceItems.markFulfilled(item.id);
            toast.success(`${item.description} marked as handed over.`);
            setItems(prev => prev.filter(i => i.id !== item.id));
        } catch (error: any) {
            toast.error(error.message || 'Failed to fulfill item.');
        } finally {
            setFulfilling(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Date filter */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#78706A] whitespace-nowrap">Filter by date:</label>
                <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-44 h-10 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl"
                />
                {date !== today && (
                    <button
                        onClick={() => setDate(today)}
                        className="text-xs text-[#C4A882] hover:text-[#1C1917] underline underline-offset-2"
                    >
                        Reset to today
                    </button>
                )}
                <span className="ml-auto text-sm text-[#A0978D]">
                    {isLoading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''} pending`}
                </span>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F7F3ED]">
                        <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Patient</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Product</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-center">Qty</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Invoice</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Paid At</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-[#78706A] text-sm">
                                    Loading queue…
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-[#A0978D]">
                                        <Inbox className="h-10 w-10 text-[#D9D0C5]" />
                                        <p className="text-sm font-medium">No pending items for {format(parseISO(date), 'MMM d, yyyy')}.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="py-4 px-6 font-semibold text-[#1C1917] text-sm">
                                        {item.patient_name || '—'}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#1C1917]">
                                        {item.description.replace(/^Product:\s*/i, '')}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-center font-bold text-[#1C1917]">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm font-mono text-[#78706A]">
                                        INV-{String(item.invoice).padStart(6, '0')}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-[#78706A]">
                                        {item.invoice_paid_at
                                            ? format(parseISO(item.invoice_paid_at), 'h:mm a')
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <Button
                                            size="sm"
                                            className="bg-[#1C1917] hover:bg-[#3E3832] text-white rounded-xl h-9 px-4 font-bold text-xs"
                                            onClick={() => handleFulfill(item)}
                                            disabled={fulfilling === item.id}
                                        >
                                            <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                                            {fulfilling === item.id ? 'Handing over…' : 'Hand Over'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-[#A0978D]">
                Showing only product items from paid invoices on the selected date.
                After handing over, update stock manually via Inventory → Stock if needed.
            </p>
        </div>
    );
}
