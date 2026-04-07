"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inventoryApi } from "@/lib/services/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Send } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils/formatters";

export function PurchaseOrderFormClient() {
    const router = useRouter();
    const [vendors, setVendors] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [poNumber, setPoNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
    const [vendorId, setVendorId] = useState<string>("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState("");

    // Lines State
    const [lines, setLines] = useState<any[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [vendorsRes, productsRes] = await Promise.all([
                    inventoryApi.vendors.list({ limit: 100 }),
                    inventoryApi.products.list({ limit: 500 })
                ]);
                setVendors(vendorsRes.results || []);
                setProducts(productsRes.results || []);
            } catch (error) {
                toast.error("Failed to load form data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const addLine = () => {
        setLines([...lines, { productId: "", quantity: 1, unitPrice: 0 }]);
    };

    const removeLine = (index: number) => {
        if (lines.length > 1) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // Auto-fill price if product is selected
        if (field === 'productId') {
            const product = products.find(p => p.id.toString() === value.toString());
            if (product) {
                newLines[index].unitPrice = parseFloat(product.cost_price || 0);
            }
        }

        setLines(newLines);
    };

    const totalAmount = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

    const handleSave = async (status: 'DRAFT' | 'SENT') => {
        if (!vendorId) return toast.error("Please select a vendor");
        if (lines.some(l => !l.productId || l.quantity <= 0)) return toast.error("Please fill all product lines properly");

        setIsSaving(true);
        try {
            // 1. Create PO
            const poData = {
                vendor: parseInt(vendorId),
                po_number: poNumber,
                order_date: orderDate,
                expected_delivery_date: expectedDate || null,
                status: status,
                total_amount: totalAmount
            };
            const po: any = await inventoryApi.purchaseOrders.create(poData);

            // 2. Create Lines sequentially
            // For a production app, the backend might handle this nested, 
            // but for safety we POST lines individually to the DRF router.
            for (const line of lines) {
                await fetchApi('inventory/purchase-order-lines/', {
                    method: 'POST',
                    body: JSON.stringify({
                        po: po.id,
                        product: parseInt(line.productId),
                        quantity: line.quantity,
                        unit_price: line.unitPrice
                    })
                });
            }

            toast.success(`Purchase Order ${status === 'SENT' ? 'Sent' : 'Drafted'} successfully!`);
            router.push('/inventory/purchase-orders');
        } catch (error: any) {
            toast.error(error.message || "Failed to save Purchase Order");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for direct API calls outside the standard inventory module mappings
    const fetchApi = async (path: string, options: any) => {
        const res = await fetch(`/api/${path}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    };

    if (isLoading) return <div className="text-center p-12 text-slate-500">Loading form data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Draft Purchase Order</h1>
                    <p className="text-slate-500">Create a new supply order for a vendor.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-sm">Order Items</CardTitle>
                        <CardDescription>Select the products and quantities to order.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Product</TableHead>
                                    <TableHead className="w-[20%]">Quantity</TableHead>
                                    <TableHead className="w-[20%]">Unit Price (cost)</TableHead>
                                    <TableHead className="w-[15%] text-right">Total</TableHead>
                                    <TableHead className="w-[5%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.map((line, index) => (
                                    <TableRow key={index} className="hover:bg-transparent">
                                        <TableCell>
                                            <Select value={line.productId} onValueChange={(v) => updateLine(index, 'productId', v)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.unitPrice}
                                                onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(line.quantity * line.unitPrice)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeLine(index)} disabled={lines.length === 1} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-slate-100">
                            <Button variant="outline" onClick={addLine} className="w-full border-dashed border-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50">
                                <Plus className="mr-2 h-4 w-4" /> Add Product Line
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-sm">Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Vendor</Label>
                                <Select value={vendorId} onValueChange={setVendorId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map(v => (
                                            <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>PO Number</Label>
                                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Issue Date</Label>
                                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Delivery</Label>
                                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-indigo-50/50">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-600 font-medium">Total Amount</span>
                                <span className="text-2xl font-bold text-indigo-900">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="space-y-3">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSave('SENT')} disabled={isSaving}>
                                    <Send className="mr-2 h-4 w-4" /> Issue to Vendor
                                </Button>
                                <Button variant="outline" className="w-full bg-white" onClick={() => handleSave('DRAFT')} disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" /> Save as Draft
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
