"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/lib/services/inventory";
import { toast } from "sonner";

const PRODUCT_TYPES = [
    { value: "MEDICINE", label: "Medicine" },
    { value: "SKINCARE", label: "Skincare" },
    { value: "CONSUMABLE", label: "Consumable" },
    { value: "DEVICE", label: "Device" },
    { value: "OTHER", label: "Other" },
];

const EMPTY_FORM = {
    name: "",
    sku: "",
    product_type: "CONSUMABLE",
    cost_price: "",
    sale_price: "",
    is_saleable: false,
    is_stock_tracked: true,
    is_procedure_item: false,
    is_clinic_item: false,
};

export function ProductsClient() {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

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
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const openNew = () => {
        setForm({ ...EMPTY_FORM });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error("Product name is required."); return; }
        if (!form.product_type) { toast.error("Product type is required."); return; }
        setSaving(true);
        try {
            await inventoryApi.products.create({
                ...form,
                cost_price: form.cost_price as any,
                sale_price: form.sale_price as any,
            });
            toast.success("Product created successfully.");
            setDialogOpen(false);
            fetchProducts();
        } catch (error) {
            toast.error((error as Error).message || "Failed to create product.");
        } finally {
            setSaving(false);
        }
    };

    const field = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }));

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
                <Button
                    onClick={openNew}
                    className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-6 rounded-xl font-bold text-sm shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2 text-[#C4A882]" />
                    New Product
                </Button>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F7F3ED]">
                        <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm">Product</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm">Type</TableHead>
                            <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm">Classification</TableHead>
                            <TableHead className="text-right font-bold text-[#1C1917] py-5 px-6 text-sm">Cost Price</TableHead>
                            <TableHead className="text-right font-bold text-[#1C1917] py-5 px-6 text-sm">Sale Price</TableHead>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Name *</Label>
                            <Input value={form.name} onChange={e => field("name", e.target.value)} placeholder="e.g. Botox 100U Vial" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>SKU</Label>
                                <Input value={form.sku} onChange={e => field("sku", e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Type *</Label>
                                <Select value={form.product_type} onValueChange={v => field("product_type", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PRODUCT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Cost Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={e => field("cost_price", e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Sale Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={form.sale_price} onChange={e => field("sale_price", e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-medium">Classification</Label>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { key: "is_saleable" as const, label: "Retail Saleable" },
                                    { key: "is_stock_tracked" as const, label: "Track Stock" },
                                    { key: "is_procedure_item" as const, label: "Procedure Item" },
                                    { key: "is_clinic_item" as const, label: "Clinic Item" },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form[key] as boolean}
                                            onChange={e => field(key, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {saving ? "Saving…" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
