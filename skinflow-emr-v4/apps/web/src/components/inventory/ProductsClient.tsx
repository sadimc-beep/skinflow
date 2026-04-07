"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { inventoryApi } from "@/lib/services/inventory";
import { toast } from "sonner";

export function ProductsClient() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await inventoryApi.products.list({ search: searchTerm });
            setProducts(data.results || data);
        } catch (error) {
            toast.error("Failed to fetch product catalog");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // debounce search
        const timer = setTimeout(() => {
            fetchProducts();
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
                        placeholder="Search by product name or SKU..."
                        className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-6 rounded-xl font-bold text-sm shadow-sm">
                    <Plus className="w-5 h-5 mr-2 text-[#C4A882]" />
                    New Product
                </Button>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F7F3ED]">
                        <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Product</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Type</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Classification</TableHead>
                            <TableHead className="text-right font-bold text-[#1C1917] py-5 px-6 text-sm ">Cost Price</TableHead>
                            <TableHead className="text-right font-bold text-[#1C1917] py-5 px-6 text-sm ">Sale Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-[#78706A] font-medium text-sm">
                                    Loading products...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow className="border-b border-[#E8E1D6]">
                                <TableCell colSpan={5} className="text-center py-20 text-[#A0978D] flex flex-col items-center">
                                    <Archive className="w-12 h-12 text-[#D9D0C5] mb-4" />
                                    <span className="text-sm font-medium">No products found in catalog.</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] cursor-pointer transition-colors">
                                    <TableCell className="py-5 px-6">
                                        <div className="font-bold text-[#1C1917] text-sm">{product.name}</div>
                                        <div className="text-sm font-medium text-[#78706A] mt-1">SKU: <span className="text-[#4E4843]">{product.sku || 'N/A'}</span></div>
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        <Badge variant="outline" className="bg-[#F7F3ED] border-[#D9D0C5] text-[#1C1917] text-sm font-bold px-3 py-1 rounded-lg">
                                            {product.product_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {product.is_procedure_item && (
                                                <Badge variant="secondary" className="bg-[#EDE7DC] text-[#1C1917] hover:bg-[#D9D0C5] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#D9D0C5]">Procedure Med</Badge>
                                            )}
                                            {product.is_clinic_item && (
                                                <Badge variant="secondary" className="bg-white text-[#4E4843] hover:bg-[#F7F3ED] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#D9D0C5]">Clinic</Badge>
                                            )}
                                            {product.is_saleable && (
                                                <Badge variant="secondary" className="bg-[#7A9E8A] text-white hover:bg-[#5C7E6A] text-xs font-bold px-2.5 py-1 rounded-lg border-0 shadow-sm">Retail Saleable</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-[#78706A] text-sm py-5 px-6">
                                        ৳{Number(product.cost_price).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-[#1C1917] text-sm py-5 px-6">
                                        ৳{Number(product.sale_price).toFixed(2)}
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
