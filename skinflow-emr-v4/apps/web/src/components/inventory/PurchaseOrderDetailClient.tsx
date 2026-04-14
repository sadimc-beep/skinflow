"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventoryApi } from "@/lib/services/inventory";
import { formatCurrency } from "@/lib/utils/formatters";
import toast from "react-hot-toast";

function statusColor(status: string) {
    switch (status) {
        case 'DRAFT': return 'bg-[#EDE7DC] text-[#78706A] border border-[#D9D0C5]';
        case 'SENT': return 'bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]';
        case 'PARTIALLY_RECEIVED': return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
        case 'RECEIVED': return 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]';
        case 'CANCELLED': return 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]';
        default: return 'bg-[#EDE7DC] text-[#78706A] border border-[#D9D0C5]';
    }
}

export function PurchaseOrderDetailClient({ po: initialPo }: { po: any }) {
    const router = useRouter();
    const [po, setPo] = useState(initialPo);
    const [acting, setActing] = useState(false);

    const refresh = async () => {
        try {
            const updated = await inventoryApi.purchaseOrders.get(po.id);
            setPo(updated);
        } catch {
            // ignore
        }
    };

    const markSent = async () => {
        setActing(true);
        try {
            await inventoryApi.purchaseOrders.update(po.id, { status: 'SENT' });
            toast.success("Purchase order marked as Sent.");
            await refresh();
        } catch (error) {
            toast.error((error as Error).message || "Failed to update status.");
        } finally {
            setActing(false);
        }
    };

    const cancelPo = async () => {
        if (!confirm("Cancel this purchase order? This cannot be undone.")) return;
        setActing(true);
        try {
            await inventoryApi.purchaseOrders.update(po.id, { status: 'CANCELLED' });
            toast.success("Purchase order cancelled.");
            await refresh();
        } catch (error) {
            toast.error((error as Error).message || "Failed to cancel order.");
        } finally {
            setActing(false);
        }
    };

    const lines: any[] = po.lines || [];
    const isDraft = po.status === 'DRAFT';
    const isCancellable = !['CANCELLED', 'RECEIVED'].includes(po.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/inventory/purchase-orders')} className="text-[#78706A]">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#1C1917]">{po.po_number}</h1>
                            <Badge className={`text-xs font-bold px-3 py-1 rounded-lg ${statusColor(po.status)}`}>
                                {po.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <p className="text-sm text-[#78706A] mt-0.5">
                            Vendor: <span className="font-semibold text-[#1C1917]">{po.vendor_name}</span>
                            {' · '}Issued: {format(new Date(po.order_date), 'MMM d, yyyy')}
                            {po.expected_delivery_date && (
                                <>{' · '}Expected: {format(new Date(po.expected_delivery_date), 'MMM d, yyyy')}</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    {isDraft && (
                        <Button
                            onClick={markSent}
                            disabled={acting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                        >
                            <Send className="h-4 w-4" /> Mark as Sent
                        </Button>
                    )}
                    {isCancellable && (
                        <Button
                            variant="outline"
                            onClick={cancelPo}
                            disabled={acting}
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                        >
                            <XCircle className="h-4 w-4" /> Cancel PO
                        </Button>
                    )}
                </div>
            </div>

            {/* Line items */}
            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-[#F7F3ED] border-b border-[#D9D0C5]">
                    <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-[#E8E1D6] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm">Product</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-right">Ordered</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-right">Received</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-right">Unit Price</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-4 px-6 text-sm text-right">Line Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-[#A0978D] text-sm">No line items.</TableCell>
                                </TableRow>
                            ) : (
                                lines.map((line: any) => (
                                    <TableRow key={line.id} className="border-b border-[#E8E1D6] hover:bg-[#F7F3ED]">
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-[#1C1917] text-sm">{line.product_name}</div>
                                            {line.product_uom && <div className="text-xs text-[#78706A]">{line.product_uom}</div>}
                                        </TableCell>
                                        <TableCell className="text-right text-sm py-4 px-6">{line.quantity}</TableCell>
                                        <TableCell className="text-right text-sm py-4 px-6">
                                            <span className={Number(line.received_quantity) >= Number(line.quantity) ? 'text-green-600 font-semibold' : ''}>
                                                {line.received_quantity ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm py-4 px-6">{formatCurrency(Number(line.unit_price))}</TableCell>
                                        <TableCell className="text-right font-semibold text-sm py-4 px-6">
                                            {formatCurrency(Number(line.quantity) * Number(line.unit_price))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Total */}
            <div className="flex justify-end">
                <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 min-w-[220px] shadow-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#78706A] font-medium">Total Amount</span>
                        <span className="text-2xl font-bold text-[#1C1917]">{formatCurrency(Number(po.total_amount))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
