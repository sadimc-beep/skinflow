"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/services/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Receipt, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VendorBillsClient() {
    const [bills, setBills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const params: any = { search: searchTerm };
            if (statusFilter !== "all") params.status = statusFilter;
            const res = await inventoryApi.vendorBills.list(params);
            setBills(res.results || []);
        } catch (error) {
            toast.error("Failed to fetch vendor bills");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchBills, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, statusFilter]);

    const handleMarkPaid = async (billId: number) => {
        try {
            await inventoryApi.vendorBills.update(billId, { status: 'PAID' });
            toast.success("Bill marked as paid");
            fetchBills();
        } catch (error) {
            toast.error("Failed to update bill status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'UNPAID': return 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] shadow-sm';
            case 'PARTIALLY_PAID': return 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-sm';
            case 'PAID': return 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] shadow-sm';
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
                            placeholder="Search bill number..."
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
                            <SelectItem value="UNPAID" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Unpaid</SelectItem>
                            <SelectItem value="PARTIALLY_PAID" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Partially Paid</SelectItem>
                            <SelectItem value="PAID" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Bill Number</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Vendor</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Linked GRN</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Date Issued</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Status</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Amount Due</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-[#78706A] font-medium text-sm">Loading bills...</TableCell>
                                </TableRow>
                            ) : bills.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={7} className="h-32 text-center text-[#A0978D] font-medium text-sm">
                                        No vendor bills found. Bills are auto-generated when you receive GRNs.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills.map((bill) => (
                                    <TableRow key={bill.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-[#F7F3ED] p-2 rounded-lg border border-[#D9D0C5]">
                                                    <Receipt className="h-4 w-4 text-[#1C1917]" />
                                                </div>
                                                <span className="font-bold text-[#1C1917] text-sm">{bill.bill_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="font-bold text-[#1C1917] text-sm">{bill.vendor_name}</div>
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm font-medium py-5 px-6">
                                            {bill.grn_number || '-'}
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm font-medium py-5 px-6">
                                            {format(new Date(bill.bill_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <Badge className={`text-xs font-bold px-3 py-1 rounded-lg ${getStatusColor(bill.status)}`}>
                                                {bill.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-[#1C1917] text-xl py-5 px-6">
                                            {formatCurrency(Number(bill.amount))}
                                        </TableCell>
                                        <TableCell className="text-right py-5 px-6">
                                            {bill.status !== 'PAID' ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleMarkPaid(bill.id)}
                                                    className="bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] text-sm font-bold h-10 px-4 rounded-lg shadow-sm"
                                                >
                                                    <CreditCard className="mr-2 h-4 w-4 text-[#A0978D]" /> Mark Paid
                                                </Button>
                                            ) : (
                                                <span className="text-sm font-bold text-[#A0978D] italic px-3">Settled</span>
                                            )}
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
