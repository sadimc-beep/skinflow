"use client";

import { useState, useEffect } from "react";
import { Search, FileText, CheckCircle, XCircle, Package, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/models";
import Link from "next/link";

type RequisitionLine = {
    id: number;
    product_name: string;
    product_uom: string;
    quantity_requested: number;
    quantity_fulfilled: number;
};

type Requisition = {
    id: number;
    created_at: string;
    status: string;
    requisition_type: string;
    notes: string;
    rejection_notes: string;
    requested_by_name: string | null;
    approved_by_name: string | null;
    lines: RequisitionLine[];
    session_details: {
        id: number;
        status: string;
        patient_name: string | null;
        procedure_name: string | null;
    } | null;
};

type TabFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'FULFILLED';

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'DRAFT':      return <Badge variant="outline" className="bg-gray-50 text-gray-600">Draft</Badge>;
        case 'SUBMITTED':  return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>;
        case 'APPROVED':   return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Approved</Badge>;
        case 'FULFILLED':  return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Fulfilled</Badge>;
        case 'REJECTED':   return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
        case 'CANCELLED':  return <Badge variant="outline" className="bg-slate-100 text-slate-500">Cancelled</Badge>;
        default:           return <Badge variant="outline">{status}</Badge>;
    }
}

export function RequisitionsClient() {
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<TabFilter>('ALL');

    // Per-row action state
    const [actioning, setActioning] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionNote, setRejectionNote] = useState("");

    const fetchRequisitions = async () => {
        setIsLoading(true);
        try {
            const data = await fetchApi<PaginatedResponse<Requisition>>('inventory/requisitions/');
            setRequisitions(data.results || []);
        } catch {
            toast.error("Failed to fetch requisitions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequisitions(); }, []);

    const handleApprove = async (id: number) => {
        setActioning(id);
        try {
            await fetchApi(`inventory/requisitions/${id}/approve/`, { method: 'POST' });
            toast.success("Requisition approved.");
            setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to approve.");
        } finally {
            setActioning(null);
        }
    };

    const handleRejectSubmit = async (id: number) => {
        if (!rejectionNote.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }
        setActioning(id);
        try {
            await fetchApi(`inventory/requisitions/${id}/reject/`, {
                method: 'POST',
                body: JSON.stringify({ rejection_notes: rejectionNote }),
            });
            toast.success("Requisition rejected.");
            setRequisitions(prev => prev.map(r =>
                r.id === id ? { ...r, status: 'REJECTED', rejection_notes: rejectionNote } : r
            ));
            setRejectingId(null);
            setRejectionNote("");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to reject.");
        } finally {
            setActioning(null);
        }
    };

    const handleFulfill = async (id: number) => {
        setActioning(id);
        try {
            await fetchApi(`inventory/requisitions/${id}/fulfill/`, { method: 'POST' });
            toast.success("Items issued — stock deducted.");
            setRequisitions(prev => prev.map(r => r.id === id ? { ...r, status: 'FULFILLED' } : r));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to fulfill.");
        } finally {
            setActioning(null);
        }
    };

    const filtered = requisitions.filter(r => {
        const matchesTab =
            activeTab === 'ALL' ? true :
            activeTab === 'PENDING' ? r.status === 'SUBMITTED' :
            activeTab === 'APPROVED' ? r.status === 'APPROVED' :
            activeTab === 'FULFILLED' ? r.status === 'FULFILLED' : true;
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || (
            `REQ-${r.id}`.toLowerCase().includes(term) ||
            (r.session_details?.patient_name ?? '').toLowerCase().includes(term) ||
            (r.session_details?.procedure_name ?? '').toLowerCase().includes(term)
        );
        return matchesTab && matchesSearch;
    });

    const pendingCount = requisitions.filter(r => r.status === 'SUBMITTED').length;

    const tabs: { key: TabFilter; label: string }[] = [
        { key: 'ALL', label: 'All' },
        { key: 'PENDING', label: `Pending Approval${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'FULFILLED', label: 'Fulfilled' },
    ];

    return (
        <div className="space-y-5">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search by patient, procedure, or REQ ID…"
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tab filter */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-slate-800 text-slate-900'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Ref</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type / Patient</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
                                    Loading…
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    No requisitions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map(req => (
                                <>
                                    <TableRow key={req.id} className="hover:bg-slate-50">
                                        {/* Expand toggle */}
                                        <TableCell>
                                            <button
                                                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                                                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                            >
                                                {expandedId === req.id
                                                    ? <ChevronUp className="h-4 w-4" />
                                                    : <ChevronDown className="h-4 w-4" />
                                                }
                                            </button>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-slate-800">
                                            REQ-{req.id.toString().padStart(4, '0')}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                {req.requisition_type === 'CLINICAL' ? (
                                                    <Badge variant="secondary" className="w-fit bg-purple-50 text-purple-700 text-xs">Clinical</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="w-fit bg-blue-50 text-blue-700 text-xs">General</Badge>
                                                )}
                                                {req.session_details && (
                                                    <span className="text-xs text-slate-500 mt-0.5">
                                                        {req.session_details.patient_name ?? '—'}
                                                        {req.session_details.procedure_name && ` · ${req.session_details.procedure_name}`}
                                                        {' · '}
                                                        <Link href={`/sessions/${req.session_details.id}`} className="text-indigo-600 hover:underline">
                                                            Session #{req.session_details.id}
                                                        </Link>
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {req.lines?.length ?? 0} item{req.lines?.length !== 1 ? 's' : ''}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {req.requested_by_name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={req.status} />
                                            {req.rejection_notes && (
                                                <p className="text-xs text-red-600 mt-1 max-w-[180px] truncate" title={req.rejection_notes}>
                                                    {req.rejection_notes}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                {req.status === 'SUBMITTED' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            disabled={actioning === req.id}
                                                            onClick={() => handleApprove(req.id)}
                                                        >
                                                            {actioning === req.id
                                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                : <><CheckCircle className="h-3 w-3 mr-1" />Approve</>
                                                            }
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                                            disabled={actioning === req.id}
                                                            onClick={() => {
                                                                setRejectingId(rejectingId === req.id ? null : req.id);
                                                                setRejectionNote("");
                                                            }}
                                                        >
                                                            <XCircle className="h-3 w-3 mr-1" />Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {req.status === 'APPROVED' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        disabled={actioning === req.id}
                                                        onClick={() => handleFulfill(req.id)}
                                                    >
                                                        {actioning === req.id
                                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                                            : <><Package className="h-3 w-3 mr-1" />Issue Items</>
                                                        }
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {/* Reject inline form */}
                                    {rejectingId === req.id && (
                                        <TableRow key={`reject-${req.id}`} className="bg-red-50">
                                            <TableCell colSpan={8} className="py-3 px-6">
                                                <div className="flex items-start gap-3">
                                                    <Textarea
                                                        placeholder="Reason for rejection (required)…"
                                                        value={rejectionNote}
                                                        onChange={e => setRejectionNote(e.target.value)}
                                                        className="flex-1 text-sm bg-white border-red-200 min-h-[60px]"
                                                        rows={2}
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                            disabled={actioning === req.id}
                                                            onClick={() => handleRejectSubmit(req.id)}
                                                        >
                                                            Confirm Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => { setRejectingId(null); setRejectionNote(""); }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Expanded line items */}
                                    {expandedId === req.id && (
                                        <TableRow key={`expand-${req.id}`} className="bg-slate-50/70">
                                            <TableCell colSpan={8} className="py-3 px-10">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-slate-500 text-xs uppercase">
                                                            <th className="text-left pb-1">Product</th>
                                                            <th className="text-right pb-1">Requested</th>
                                                            <th className="text-right pb-1">Issued</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {req.lines.map(line => (
                                                            <tr key={line.id} className="border-t border-slate-200">
                                                                <td className="py-1 text-slate-700">{line.product_name}</td>
                                                                <td className="py-1 text-right text-slate-600">{line.quantity_requested} {line.product_uom}</td>
                                                                <td className="py-1 text-right">
                                                                    {req.status === 'FULFILLED'
                                                                        ? <span className="text-emerald-600 font-medium">{line.quantity_fulfilled} {line.product_uom}</span>
                                                                        : <span className="text-slate-400">—</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
