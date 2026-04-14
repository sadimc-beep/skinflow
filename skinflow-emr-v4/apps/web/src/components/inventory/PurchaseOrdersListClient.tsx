"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/services/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileText, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PurchaseOrdersListClient() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const params: any = { search: searchTerm };
            if (statusFilter !== "all") params.status = statusFilter;
            const res = await inventoryApi.purchaseOrders.list(params);
            setOrders(res.results || []);
        } catch (error) {
            toast.error("Failed to fetch purchase orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchOrders, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-[#EDE7DC] text-[#78706A] border border-[#D9D0C5] shadow-sm';
            case 'SENT': return 'bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE] shadow-sm';
            case 'PARTIALLY_RECEIVED': return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-sm';
            case 'RECEIVED': return 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] shadow-sm';
            case 'CANCELLED': return 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] shadow-sm';
            default: return 'bg-[#EDE7DC] text-[#78706A] border border-[#D9D0C5] shadow-sm';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full max-w-2xl">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-[#78706A]" />
                        <Input
                            placeholder="Search PO number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-[#D9D0C5] rounded-xl shadow-sm text-sm text-[#1C1917] font-medium">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="border-[#D9D0C5] shadow-md rounded-xl">
                            <SelectItem value="all" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">All Statuses</SelectItem>
                            <SelectItem value="DRAFT" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Draft</SelectItem>
                            <SelectItem value="SENT" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Sent</SelectItem>
                            <SelectItem value="PARTIALLY_RECEIVED" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Partially Received</SelectItem>
                            <SelectItem value="RECEIVED" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Received</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/inventory/purchase-orders/new">
                    <Button className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-6 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto">
                        <Plus className="mr-2 h-5 w-5 text-[#C4A882]" /> Draft PO
                    </Button>
                </Link>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">PO Number</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Vendor</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Date Issued</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Status</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Total Amount</TableHead>
                                <TableHead className="w-[50px] py-5 px-6"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-[#78706A] font-medium text-sm">Loading orders...</TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={6} className="h-32 text-center text-[#A0978D] font-medium text-sm">
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] group cursor-pointer transition-colors" onClick={() => router.push(`/inventory/purchase-orders/${order.id}`)}>
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#F7F3ED] p-2 rounded-lg border border-[#D9D0C5]">
                                                    <FileText className="h-4 w-4 text-[#1C1917]" />
                                                </div>
                                                <span className="font-bold text-[#1C1917] text-sm">{order.po_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="font-bold text-[#1C1917] text-sm">{order.vendor_name}</div>
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm font-medium py-5 px-6">
                                            {format(new Date(order.order_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <Badge className={`text-xs font-bold px-3 py-1 rounded-lg ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-[#1C1917] text-xl py-5 px-6">
                                            {formatCurrency(Number(order.total_amount))}
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <ChevronRight className="h-5 w-5 text-[#A0978D] group-hover:text-[#1C1917] transition-colors" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
