"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, CheckCircle, Clock, XCircle, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

type Product = {
    id: number;
    name: string;
    sku: string | null;
    uom?: { abbreviation: string } | null;
};

type RequisitionLine = {
    productId: number;
    productName: string;
    uom: string;
    quantity: number;
};

type Requisition = {
    id: number;
    status: string;
    lines: { id: number; product_name: string; product_uom: string; quantity_requested: number }[];
    requested_by_name: string | null;
    approved_by_name: string | null;
    rejection_notes: string;
};

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'DRAFT':      return <Badge variant="outline" className="bg-gray-50 text-gray-600">Draft</Badge>;
        case 'SUBMITTED':  return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted — Awaiting Approval</Badge>;
        case 'APPROVED':   return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Approved — Ready for Issue</Badge>;
        case 'FULFILLED':  return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Fulfilled</Badge>;
        case 'REJECTED':   return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
        case 'CANCELLED':  return <Badge variant="outline" className="bg-slate-100 text-slate-500">Cancelled</Badge>;
        default:           return <Badge variant="outline">{status}</Badge>;
    }
}

export function ClinicalRequisitionForm({ sessionId, readonly = false }: { sessionId: number; readonly?: boolean }) {
    // Existing requisition for this session (if any)
    const [existingReq, setExistingReq] = useState<Requisition | null>(null);
    const [loadingExisting, setLoadingExisting] = useState(true);

    // Draft form state
    const [lines, setLines] = useState<RequisitionLine[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load existing requisition for this session on mount
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchApi<{ results: Requisition[] }>(
                    `inventory/requisitions/?requisition_type=CLINICAL&session=${sessionId}`
                );
                if (res.results?.length > 0) {
                    setExistingReq(res.results[0]);
                }
            } catch {
                // non-fatal
            } finally {
                setLoadingExisting(false);
            }
        };
        load();
    }, [sessionId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetchApi<{ results: Product[] }>(
                    `inventory/products/?product_type=CONSUMABLE&is_procedure_item=true&search=${encodeURIComponent(value)}`
                );
                setSearchResults(res.results || []);
                setShowDropdown(true);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSelectProduct = (product: Product) => {
        if (lines.some(l => l.productId === product.id)) {
            toast.info("Item already added.");
            setShowDropdown(false);
            setSearchQuery("");
            return;
        }
        setLines(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            uom: product.uom?.abbreviation ?? 'unit',
            quantity: 1,
        }]);
        setSearchQuery("");
        setShowDropdown(false);
        setSearchResults([]);
    };

    const handleRemoveLine = (index: number) => {
        setLines(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, qty: number) => {
        setLines(prev => {
            const next = [...prev];
            next[index].quantity = Math.max(1, qty);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (lines.length === 0) {
            toast.error("Add at least one item before submitting.");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                session: sessionId,
                requisition_type: "CLINICAL",
                status: "SUBMITTED",
                lines_input: lines.map(l => ({
                    product: l.productId,
                    quantity_requested: l.quantity,
                })),
            };
            const created = await fetchApi<Requisition>('inventory/requisitions/', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setExistingReq(created);
            setLines([]);
            toast.success("Requisition submitted to inventory for approval.");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to submit requisition.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingExisting) {
        return (
            <Card className="mt-8 border-slate-200">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </CardContent>
            </Card>
        );
    }

    // ── Existing requisition view ────────────────────────────────
    if (existingReq) {
        const canResubmit = existingReq.status === 'REJECTED' || existingReq.status === 'CANCELLED';
        return (
            <Card className="mt-8 border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5 text-slate-500" />
                                Material Requisition REQ-{existingReq.id}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Requested by: {existingReq.requested_by_name ?? '—'}
                                {existingReq.approved_by_name && ` · Reviewed by: ${existingReq.approved_by_name}`}
                            </CardDescription>
                        </div>
                        <StatusBadge status={existingReq.status} />
                    </div>
                    {existingReq.rejection_notes && (
                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                            <strong>Rejection reason:</strong> {existingReq.rejection_notes}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-4">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-32 text-right">Qty Requested</TableHead>
                                <TableHead className="w-32 text-right">Qty Issued</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {existingReq.lines.map(line => (
                                <TableRow key={line.id}>
                                    <TableCell className="font-medium">{line.product_name}</TableCell>
                                    <TableCell className="text-right">{line.quantity_requested} {line.product_uom}</TableCell>
                                    <TableCell className="text-right">
                                        {existingReq.status === 'FULFILLED'
                                            ? <span className="text-emerald-600 font-medium">{line.quantity_requested} {line.product_uom}</span>
                                            : <span className="text-slate-400">—</span>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                {canResubmit && !readonly && (
                    <CardFooter className="border-t bg-slate-50 rounded-b-lg">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setExistingReq(null); }}
                            className="text-slate-600"
                        >
                            Create New Requisition
                        </Button>
                    </CardFooter>
                )}
            </Card>
        );
    }

    // ── New requisition form ─────────────────────────────────────
    if (readonly) {
        return (
            <Card className="mt-8 border-slate-200 shadow-sm">
                <CardContent className="py-8 text-center text-slate-500">
                    No material requisition was submitted for this session.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-8 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-slate-500" />
                    Clinical Material Requisition
                </CardTitle>
                <CardDescription>Request consumables and procedure items from inventory.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
                {/* Product search */}
                <div ref={searchRef} className="relative max-w-md">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search consumable products…"
                            value={searchQuery}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="flex-1"
                            autoComplete="off"
                        />
                        {isSearching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                            {searchResults.map(product => (
                                <button
                                    key={product.id}
                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0 flex justify-between items-center"
                                    onMouseDown={() => handleSelectProduct(product)}
                                >
                                    <span className="font-medium text-slate-800">{product.name}</span>
                                    {product.sku && <span className="text-xs text-slate-400 ml-2">{product.sku}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                    {showDropdown && !isSearching && searchResults.length === 0 && searchQuery.trim() && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500">
                            No consumable products found for "{searchQuery}".
                        </div>
                    )}
                </div>

                {/* Lines table */}
                {lines.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="w-36">Quantity</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.map((line, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium text-slate-700">{line.productName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={line.quantity}
                                                    onChange={e => handleUpdateQuantity(index, Number(e.target.value))}
                                                    className="w-20"
                                                />
                                                <span className="text-xs text-slate-400">{line.uom}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveLine(index)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-sm">
                        Search and add consumable items above to build your requisition.
                    </div>
                )}
            </CardContent>

            {lines.length > 0 && (
                <CardFooter className="justify-end bg-slate-50 rounded-b-lg border-t pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                    >
                        {isSubmitting
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                            : "Submit for Approval"
                        }
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
