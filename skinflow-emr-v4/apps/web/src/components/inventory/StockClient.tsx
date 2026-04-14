"use client";

import { useState, useEffect } from "react";
import { Search, Inbox, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";
import { inventoryApi } from "@/lib/services/inventory";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/models";

export function StockClient() {
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Adjust stock modal
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [adjustForm, setAdjustForm] = useState({
        product: '',
        location: '',
        quantity: '',
        movement_type: 'IN',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStock = async () => {
        setIsLoading(true);
        try {
            const data = await fetchApi<PaginatedResponse<any>>('inventory/stock');
            let results = data.results || data;

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                results = (results as any[]).filter(item =>
                    item.product_name?.toLowerCase().includes(lower) ||
                    item.location_name?.toLowerCase().includes(lower)
                );
            }

            setStockItems(results as any[]);
        } catch {
            toast.error("Failed to fetch stock levels");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchStock(); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpenAdjust = async () => {
        try {
            const [prodRes, locRes] = await Promise.all([
                inventoryApi.products.list({ limit: 200 }),
                inventoryApi.stockLocations.list(),
            ]);
            setProducts(prodRes.results || []);
            setLocations(locRes.results || []);
            setAdjustForm({ product: '', location: '', quantity: '', movement_type: 'IN', notes: '' });
            setAdjustOpen(true);
        } catch {
            toast.error("Failed to load products or locations.");
        }
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustForm.product || !adjustForm.location || !adjustForm.quantity) {
            toast.error("Please fill in all required fields.");
            return;
        }
        const qty = parseFloat(adjustForm.quantity);
        if (isNaN(qty) || qty === 0) {
            toast.error("Quantity must be a non-zero number.");
            return;
        }
        setIsSubmitting(true);
        try {
            await fetchApi('inventory/stock-movements/', {
                method: 'POST',
                body: JSON.stringify({
                    product: parseInt(adjustForm.product),
                    location: parseInt(adjustForm.location),
                    movement_type: adjustForm.movement_type,
                    quantity: Math.abs(qty),
                    notes: adjustForm.notes || `Manual ${adjustForm.movement_type} adjustment`,
                }),
            });
            toast.success("Stock updated successfully.");
            setAdjustOpen(false);
            fetchStock();
        } catch (error: any) {
            toast.error(error.message || "Failed to update stock.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <Button
                    className="bg-white border border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] h-12 px-6 rounded-xl font-bold text-sm shadow-sm"
                    onClick={handleOpenAdjust}
                >
                    <ArrowRightLeft className="w-5 h-5 mr-2 text-[#78706A]" />
                    Adjust Stock
                </Button>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F7F3ED]">
                        <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm">Location</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm">Product</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm text-right">Quantity Available</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm text-right">Status</TableHead>
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
                                <TableCell colSpan={4} className="text-center py-20 text-[#A0978D]">
                                    <div className="flex flex-col items-center gap-3">
                                        <Inbox className="w-12 h-12 text-[#D9D0C5]" />
                                        <span className="text-sm font-medium">No stock items found.</span>
                                    </div>
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

            {/* Adjust Stock Modal */}
            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adjust Stock</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Add opening stock, correct quantities, or record manual movements.
                        </p>
                    </DialogHeader>
                    <form onSubmit={handleAdjustSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Movement Type</Label>
                            <Select value={adjustForm.movement_type} onValueChange={(v) => setAdjustForm(f => ({ ...f, movement_type: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN">Stock In (add)</SelectItem>
                                    <SelectItem value="OUT">Stock Out (remove)</SelectItem>
                                    <SelectItem value="ADJUST">Adjustment (delta)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Product <span className="text-red-500">*</span></Label>
                            <Select value={adjustForm.product} onValueChange={(v) => setAdjustForm(f => ({ ...f, product: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Location <span className="text-red-500">*</span></Label>
                            <Select value={adjustForm.location} onValueChange={(v) => setAdjustForm(f => ({ ...f, location: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((l) => (
                                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Quantity <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="e.g. 50"
                                value={adjustForm.quantity}
                                onChange={(e) => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Always positive — direction is set by movement type above.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Input
                                placeholder="e.g. Opening stock entry, May 1 2026"
                                value={adjustForm.notes}
                                onChange={(e) => setAdjustForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)} className="rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#1C1917] hover:bg-[#3E3832]">
                                {isSubmitting ? 'Saving…' : 'Save Movement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
