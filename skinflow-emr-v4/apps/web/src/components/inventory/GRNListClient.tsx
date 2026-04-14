"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/services/inventory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Truck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function GRNListClient() {
    const [grns, setGrns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Receive modal state
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [pendingPOs, setPendingPOs] = useState<any[]>([]);
    const [selectedPoId, setSelectedPoId] = useState<string>("");
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [locations, setLocations] = useState<any[]>([]);
    const [receiveLines, setReceiveLines] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await inventoryApi.grns.list({ search: searchTerm });
            setGrns(res.results || []);
        } catch (error) {
            toast.error("Failed to fetch GRNs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchData, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleOpenReceiveModal = async () => {
        try {
            const [posRes, posResPartial, locsRes] = await Promise.all([
                inventoryApi.purchaseOrders.list({ status: 'SENT', limit: 100 }),
                inventoryApi.purchaseOrders.list({ status: 'PARTIALLY_RECEIVED', limit: 100 }),
                inventoryApi.stockLocations.list(),
            ]);

            setPendingPOs([...(posRes.results || []), ...(posResPartial.results || [])]);
            setLocations(locsRes.results || []);
            setSelectedPoId("");
            setSelectedPo(null);
            setReceiveLines([]);
            setIsReceiveModalOpen(true);
        } catch (error) {
            toast.error("Failed to load PO data");
        }
    };

    const handleSelectPO = async (poId: string) => {
        setSelectedPoId(poId);
        try {
            const po: any = await inventoryApi.purchaseOrders.get(parseInt(poId));
            setSelectedPo(po);
            // Pre-fill receive lines
            const lines = po.lines.map((line: any) => ({
                po_line_id: line.id,
                product_id: line.product,
                product_name: line.product_name,
                expected: Number(line.quantity) - Number(line.received_quantity),
                received: Number(line.quantity) - Number(line.received_quantity), // Default to full remaining
                location_id: locations.length > 0 ? locations[0].id : "",
                batch_number: "",
                expiry_date: ""
            })).filter((l: any) => l.expected > 0);

            setReceiveLines(lines);
        } catch (error) {
            toast.error("Failed to fetch PO details");
        }
    };

    const updateReceiveLine = (index: number, field: string, value: any) => {
        const newLines = [...receiveLines];
        newLines[index] = { ...newLines[index], [field]: value };
        setReceiveLines(newLines);
    };

    const handleConfirmReceive = async () => {
        if (!selectedPoId) return;
        if (receiveLines.some(l => !l.location_id)) return toast.error("Please select a storage location for all items");

        setIsSubmitting(true);
        try {
            // 1. Create GRN Draft
            const grnData = {
                po: parseInt(selectedPoId),
                grn_number: `GRN-${Date.now().toString().slice(-6)}`,
                receive_date: new Date().toISOString().split('T')[0],
                status: 'DRAFT'
            };
            const grn: any = await inventoryApi.grns.create(grnData);

            // 2. Map and Create Lines
            for (const line of receiveLines) {
                if (line.received > 0) {
                    await fetch('/api/inventory/grn-lines/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            grn: grn.id,
                            po_line: line.po_line_id,
                            product: line.product_id,
                            location: line.location_id,
                            quantity_received: line.received,
                            batch_number: line.batch_number || null,
                            expiry_date: line.expiry_date || null
                        })
                    });
                }
            }

            // 3. Confirm GRN — backend auto-adjusts stock, updates PO, and drafts the Vendor Bill
            await inventoryApi.grns.confirm(grn.id);

            toast.success("Goods securely received into stock!");
            setIsReceiveModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to process receipt");
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
                        placeholder="Search GRN number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                    />
                </div>
                <Button onClick={handleOpenReceiveModal} className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-6 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto">
                    <Truck className="mr-2 h-5 w-5 text-[#C4A882]" /> Receive Shipment
                </Button>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">GRN Number</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Receive Date</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Linked PO</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-[#78706A] font-medium text-sm">Loading GRNs...</TableCell>
                                </TableRow>
                            ) : grns.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={4} className="h-32 text-center text-[#A0978D] font-medium text-sm">
                                        No goods received notes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                grns.map((grn) => (
                                    <TableRow key={grn.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-[#F7F3ED] p-2 rounded-lg border border-[#D9D0C5]">
                                                    <Truck className="h-4 w-4 text-[#1C1917]" />
                                                </div>
                                                <span className="font-bold text-[#1C1917] text-sm">{grn.grn_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm font-medium py-5 px-6">
                                            {format(new Date(grn.receive_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-[#1C1917] font-bold text-sm py-5 px-6">
                                            {grn.po_number || '-'}
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <Badge className={`text-xs font-bold px-3 py-1 rounded-lg ${grn.status === 'CONFIRMED' ? 'bg-[#7A9E8A] text-white border-0 shadow-sm' : 'bg-[#EDE7DC] text-[#78706A] border border-[#D9D0C5] shadow-sm'}`}>
                                                {grn.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Receive Shipment (GRN)</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label>Select Expected Purchase Order</Label>
                            <Select value={selectedPoId} onValueChange={handleSelectPO}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Sent PO..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {pendingPOs.map(po => (
                                        <SelectItem key={po.id} value={po.id.toString()}>
                                            {po.po_number} - {po.vendor_name} (Issued: {format(new Date(po.order_date), 'MMM d, yyyy')})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPo && (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[20%]">Product</TableHead>
                                            <TableHead className="w-[10%]">Expected</TableHead>
                                            <TableHead className="w-[15%] text-indigo-700">Receiving</TableHead>
                                            <TableHead className="w-[25%]">Dest. Location</TableHead>
                                            <TableHead className="w-[15%]">Batch No.</TableHead>
                                            <TableHead className="w-[15%]">Expiry</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receiveLines.map((line, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium text-xs">{line.product_name}</TableCell>
                                                <TableCell className="text-sm">{line.expected}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={line.expected}
                                                        className="h-8 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-indigo-900"
                                                        value={line.received}
                                                        onChange={(e) => updateReceiveLine(idx, 'received', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={line.location_id.toString()} onValueChange={(v) => updateReceiveLine(idx, 'location_id', v)}>
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Location" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {locations.map(loc => (
                                                                <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Lot..."
                                                        className="h-8 text-xs"
                                                        value={line.batch_number}
                                                        onChange={(e) => updateReceiveLine(idx, 'batch_number', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="date"
                                                        className="h-8 text-xs"
                                                        value={line.expiry_date}
                                                        onChange={(e) => updateReceiveLine(idx, 'expiry_date', e.target.value)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {selectedPo && (
                            <div className="bg-indigo-50 p-4 rounded-lg flex items-start space-x-3 text-sm text-indigo-900">
                                <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <p>Confirming this GRN will automatically <strong>deduct the PO balance</strong> and <strong>add these exact quantities to your unreserved Warehouse Stock</strong> in the selected locations. A Vendor Bill will also be auto-generated for Accounts Payable.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmReceive} disabled={!selectedPo || isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? "Processing..." : "Confirm & Receive to Stock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
