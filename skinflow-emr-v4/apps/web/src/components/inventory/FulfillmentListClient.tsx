"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { billingApi } from '@/lib/services/billing';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceItem } from '@/types/models';

export function FulfillmentListClient({ initialData }: { initialData: InvoiceItem[] }) {
    const router = useRouter();
    // Filter to only show items that are products
    const productItems = initialData.filter(item =>
        item.reference_model === 'PrescriptionProduct' ||
        item.reference_model === 'Product' ||
        item.description.toLowerCase().includes('product') // Fallback if ref model isn't set properly
    );

    const [items, setItems] = useState(productItems);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleMarkDelivered = async (item: InvoiceItem) => {
        setIsUpdating(true);
        try {
            const res = await billingApi.invoiceItems.markFulfilled(item.id);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_fulfilled: true, fulfilled_at: res.fulfilled_at } : i));
            toast.success("Product Marked as Delivered");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to mark fulfilled.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No pending products for fulfillment.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        INV-{item.invoice.toString().padStart(4, '0')}
                                    </TableCell>
                                    <TableCell>
                                        {item.description}
                                    </TableCell>
                                    <TableCell>
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell>
                                        {item.is_fulfilled ? (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                Delivered on {item.fulfilled_at ? format(parseISO(item.fulfilled_at), 'MMM dd, hh:mm a') : 'Unknown'}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                                Pending Pickup
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {!item.is_fulfilled ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                                onClick={() => handleMarkDelivered(item)}
                                                disabled={isUpdating}
                                            >
                                                <PackageCheck className="mr-2 h-4 w-4" /> Handover
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" disabled className="text-gray-400">
                                                <PackageOpen className="mr-2 h-4 w-4" /> Completed
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
