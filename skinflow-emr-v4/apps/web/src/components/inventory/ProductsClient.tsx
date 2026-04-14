"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Combobox } from "@/components/ui/combobox";
import { inventoryApi, type Product } from "@/lib/services/inventory";
import { toast } from "sonner";

const PRODUCT_TYPES = [
    { value: "MEDICINE", label: "Medicine" },
    { value: "SKINCARE", label: "Skincare" },
    { value: "CONSUMABLE", label: "Consumable" },
    { value: "DEVICE", label: "Device" },
    { value: "OTHER", label: "Other" },
];

const EMPTY_CREATE_FORM = {
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

type EditForm = {
    name: string;
    sku: string;
    product_type: string;
    category: string;
    uom: string;
    cost_price: string;
    sale_price: string;
    tax_rate: string;
    is_saleable: boolean;
    is_stock_tracked: boolean;
    is_procedure_item: boolean;
    is_clinic_item: boolean;
};

export function ProductsClient() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [uomList, setUomList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Create dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createSaving, setCreateSaving] = useState(false);
    const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });

    // Edit sheet
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({
        name: "", sku: "", product_type: "CONSUMABLE", category: "", uom: "",
        cost_price: "", sale_price: "", tax_rate: "",
        is_saleable: false, is_stock_tracked: true, is_procedure_item: false, is_clinic_item: false,
    });
    const [editSaving, setEditSaving] = useState(false);
    const [editDeleting, setEditDeleting] = useState(false);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await inventoryApi.products.list({ search: searchTerm });
            setProducts(data.results || data);
        } catch {
            toast.error("Failed to fetch product catalog");
        } finally {
            setIsLoading(false);
        }
    };

    // Load categories and UOM once on mount for the edit sheet
    useEffect(() => {
        Promise.all([
            inventoryApi.categories.list({ limit: 200 }),
            inventoryApi.uom.list({ limit: 200 }),
        ]).then(([catRes, uomRes]) => {
            setCategories((catRes as any).results || []);
            setUomList((uomRes as any).results || []);
        }).catch(() => {/* silently ignore — not critical */});
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Create ────────────────────────────────────────────────────────────────
    const openCreate = () => {
        setCreateForm({ ...EMPTY_CREATE_FORM });
        setCreateOpen(true);
    };

    const handleCreate = async () => {
        if (!createForm.name.trim()) { toast.error("Product name is required."); return; }
        setCreateSaving(true);
        try {
            await inventoryApi.products.create({
                ...createForm,
                product_type: createForm.product_type as Product['product_type'],
                cost_price: createForm.cost_price as any,
                sale_price: createForm.sale_price as any,
            });
            toast.success("Product created.");
            setCreateOpen(false);
            fetchProducts();
        } catch (error) {
            toast.error((error as Error).message || "Failed to create product.");
        } finally {
            setCreateSaving(false);
        }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const openEdit = (product: any) => {
        setEditProduct(product);
        setEditForm({
            name: product.name || "",
            sku: product.sku || "",
            product_type: product.product_type || "CONSUMABLE",
            category: product.category ? String(product.category) : "",
            uom: product.uom ? String(product.uom) : "",
            cost_price: product.cost_price || "",
            sale_price: product.sale_price || "",
            tax_rate: product.tax_rate || "",
            is_saleable: product.is_saleable ?? false,
            is_stock_tracked: product.is_stock_tracked ?? true,
            is_procedure_item: product.is_procedure_item ?? false,
            is_clinic_item: product.is_clinic_item ?? false,
        });
    };

    const handleEditSave = async () => {
        if (!editProduct) return;
        if (!editForm.name.trim()) { toast.error("Product name is required."); return; }
        setEditSaving(true);
        try {
            await inventoryApi.products.update(editProduct.id, {
                name: editForm.name,
                sku: editForm.sku || undefined,
                product_type: editForm.product_type as Product['product_type'],
                category: editForm.category ? parseInt(editForm.category) : null,
                uom: editForm.uom ? parseInt(editForm.uom) : null,
                cost_price: editForm.cost_price as any,
                sale_price: editForm.sale_price as any,
                tax_rate: editForm.tax_rate as any || undefined,
                is_saleable: editForm.is_saleable,
                is_stock_tracked: editForm.is_stock_tracked,
                is_procedure_item: editForm.is_procedure_item,
                is_clinic_item: editForm.is_clinic_item,
            });
            toast.success("Product updated.");
            setEditProduct(null);
            fetchProducts();
        } catch (error) {
            toast.error((error as Error).message || "Failed to update product.");
        } finally {
            setEditSaving(false);
        }
    };

    const handleEditDelete = async () => {
        if (!editProduct) return;
        if (!confirm(`Delete "${editProduct.name}"? This cannot be undone and will fail if the product has stock movements.`)) return;
        setEditDeleting(true);
        try {
            await inventoryApi.products.delete(editProduct.id);
            toast.success("Product deleted.");
            setEditProduct(null);
            fetchProducts();
        } catch (error) {
            toast.error((error as Error).message || "Failed to delete product.");
        } finally {
            setEditDeleting(false);
        }
    };

    const ef = (key: keyof EditForm, value: any) => setEditForm(f => ({ ...f, [key]: value }));
    const cf = (key: keyof typeof EMPTY_CREATE_FORM, value: any) => setCreateForm(f => ({ ...f, [key]: value }));

    const categoryOptions = categories.map(c => ({ value: String(c.id), label: c.name }));
    const uomOptions = uomList.map(u => ({ value: String(u.id), label: `${u.name} (${u.abbreviation})` }));

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
                    onClick={openCreate}
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
                            <TableHead className="text-right font-bold text-[#1C1917] py-5 px-6 text-sm">Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-[#78706A] font-medium text-sm">
                                    Loading products...
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow className="border-b border-[#E8E1D6]">
                                <TableCell colSpan={6} className="text-center py-20 text-[#A0978D] flex flex-col items-center">
                                    <Archive className="w-12 h-12 text-[#D9D0C5] mb-4" />
                                    <span className="text-sm font-medium">No products found in catalog.</span>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] cursor-pointer transition-colors"
                                    onClick={() => openEdit(product)}
                                >
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
                                                <Badge variant="secondary" className="bg-[#7A9E8A] text-white hover:bg-[#5C7E6A] text-xs font-bold px-2.5 py-1 rounded-lg border-0 shadow-sm">Retail</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-[#78706A] text-sm py-5 px-6">
                                        ৳{Number(product.cost_price).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-[#1C1917] text-sm py-5 px-6">
                                        ৳{Number(product.sale_price).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-[#78706A] text-sm py-5 px-6">
                                        {product.stock_quantity ?? 0}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Create Dialog (quick create) ────────────────────────────────────── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Name *</Label>
                            <Input value={createForm.name} onChange={e => cf("name", e.target.value)} placeholder="e.g. Botox 100U Vial" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>SKU</Label>
                                <Input value={createForm.sku} onChange={e => cf("sku", e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Type *</Label>
                                <Select value={createForm.product_type} onValueChange={v => cf("product_type", v)}>
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
                                <Input type="number" min="0" step="0.01" value={createForm.cost_price} onChange={e => cf("cost_price", e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Sale Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={createForm.sale_price} onChange={e => cf("sale_price", e.target.value)} placeholder="0.00" />
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
                                            checked={createForm[key] as boolean}
                                            onChange={e => cf(key, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createSaving}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createSaving} className="bg-[#1C1917] hover:bg-[#3E3832] text-white">
                            {createSaving ? "Saving…" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Sheet (full form on row click) ─────────────────────────────── */}
            <Sheet open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
                <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-bold text-[#1C1917]">Edit Product</SheetTitle>
                        <p className="text-sm text-[#78706A]">Click Save Changes when done. Stock quantity is managed via Stock Ledger.</p>
                    </SheetHeader>

                    <div className="space-y-5">
                        {/* Name */}
                        <div className="grid gap-1.5">
                            <Label>Product Name *</Label>
                            <Input value={editForm.name} onChange={e => ef("name", e.target.value)} placeholder="e.g. Botox 100U Vial" />
                        </div>

                        {/* SKU + Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>SKU</Label>
                                <Input value={editForm.sku} onChange={e => ef("sku", e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Product Type *</Label>
                                <Select value={editForm.product_type} onValueChange={v => ef("product_type", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PRODUCT_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Category + UOM */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Category</Label>
                                <Combobox
                                    options={categoryOptions}
                                    value={editForm.category}
                                    onChange={v => ef("category", v)}
                                    placeholder="No category"
                                    searchPlaceholder="Search categories…"
                                    emptyText="No categories. Add in Settings."
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Unit of Measure</Label>
                                <Combobox
                                    options={uomOptions}
                                    value={editForm.uom}
                                    onChange={v => ef("uom", v)}
                                    placeholder="No UOM"
                                    searchPlaceholder="Search UOM…"
                                    emptyText="No UOM defined."
                                />
                            </div>
                        </div>

                        {/* Cost + Sale Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label>Cost Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={editForm.cost_price} onChange={e => ef("cost_price", e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Sale Price (৳)</Label>
                                <Input type="number" min="0" step="0.01" value={editForm.sale_price} onChange={e => ef("sale_price", e.target.value)} placeholder="0.00" />
                            </div>
                        </div>

                        {/* Tax Rate */}
                        <div className="grid gap-1.5">
                            <Label>Tax Rate (%)</Label>
                            <Input type="number" min="0" max="100" step="0.01" value={editForm.tax_rate} onChange={e => ef("tax_rate", e.target.value)} placeholder="0.00" />
                        </div>

                        {/* Classification */}
                        <div className="grid gap-2">
                            <Label>Classification</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: "is_saleable" as const, label: "Retail Saleable", hint: "Can be sold directly to patients" },
                                    { key: "is_stock_tracked" as const, label: "Track Stock", hint: "Count units in inventory" },
                                    { key: "is_procedure_item" as const, label: "Procedure Item", hint: "Usable in clinical requisitions" },
                                    { key: "is_clinic_item" as const, label: "Clinic Item", hint: "Usable in general requisitions" },
                                ].map(({ key, label, hint }) => (
                                    <label key={key} className="flex items-start gap-2.5 p-3 rounded-lg border border-[#E8E1D6] cursor-pointer hover:bg-[#F7F3ED] transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editForm[key] as boolean}
                                            onChange={e => ef(key, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 mt-0.5 shrink-0"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-[#1C1917]">{label}</div>
                                            <div className="text-xs text-[#78706A]">{hint}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t border-[#E8E1D6]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditDelete}
                                disabled={editDeleting || editSaving}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {editDeleting ? "Deleting…" : "Delete Product"}
                            </Button>
                            <Button
                                onClick={handleEditSave}
                                disabled={editSaving || editDeleting}
                                className="bg-[#1C1917] hover:bg-[#3E3832] text-white px-6"
                            >
                                {editSaving ? "Saving…" : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
