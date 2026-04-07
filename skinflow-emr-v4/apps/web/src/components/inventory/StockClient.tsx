"use client";

import { useState, useEffect } from "react";
import { Search, Inbox, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/models";

export function StockClient() {
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchStock = async () => {
        setIsLoading(true);
        try {
            // Wait for inventoryApi to formally export stock, using fetchApi directly for now
            const data = await fetchApi<PaginatedResponse<any>>('inventory/stock');
            // Filter locally if API doesn't support search yet, but DRF usually does if configured
            let results = data.results || data;

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                results = (results as any[]).filter(item =>
                    item.product_name?.toLowerCase().includes(lower) ||
                    item.location_name?.toLowerCase().includes(lower)
                );
            }

            setStockItems(results as any[]);
        } catch (error) {
            toast.error("Failed to fetch stock levels");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStock();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-[#78706A]" />
                    <Input
                        type="search"
                        placeholder="Search product or location..."
                        className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="bg-white border border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] h-12 px-6 rounded-xl font-bold text-sm shadow-sm">
                    <ArrowRightLeft className="w-5 h-5 mr-2 text-[#78706A]" />
                    Adjust Stock
                </Button>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F7F3ED]">
                        <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Location</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Product</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Quantity Available</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-[#78706A] font-medium text-sm">
                                    Loading stock levels...
                                </TableCell>
                            </TableRow>
                        ) : stockItems.length === 0 ? (
                            <TableRow className="border-b border-[#E8E1D6]">
                                <TableCell colSpan={4} className="text-center py-20 text-[#A0978D] flex flex-col items-center">
                                    <Inbox className="w-12 h-12 text-[#D9D0C5] mb-4" />
                                    <span className="text-sm font-medium">No stock items found.</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            stockItems.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                    <TableCell className="font-medium text-[#78706A] text-sm py-5 px-6">
                                        {item.location_name}
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        <div className="font-bold text-[#1C1917] text-sm">{item.product_name}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-[#1C1917] text-xl py-5 px-6">
                                        {Number(item.quantity).toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-right py-5 px-6">
                                        {Number(item.quantity) <= 0 ? (
                                            <Badge variant="outline" className="border-0 bg-[#C4705A] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">Out of Stock</Badge>
                                        ) : Number(item.quantity) < 10 ? (
                                            <Badge variant="outline" className="border-0 bg-[#C4A882] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">Low Stock</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-0 bg-[#7A9E8A] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">In Stock</Badge>
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
