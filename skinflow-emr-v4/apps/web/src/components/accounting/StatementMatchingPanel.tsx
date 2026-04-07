'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Link2Off, EyeOff, Plus, X } from 'lucide-react';
import { accountingApi } from '@/lib/services/accounting';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

interface StatementMatchingPanelProps {
    bank: any;
    onClose: () => void;
}

type TabKey = 'ALL' | 'UNMATCHED' | 'MATCHED' | 'IGNORED';

export function StatementMatchingPanel({ bank, onClose }: StatementMatchingPanelProps) {
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('UNMATCHED');

    // All GL accounts for the "Create JE" offset selector
    const [allAccounts, setAllAccounts] = useState<any[]>([]);
    // Uncleared JE lines for the "Manual Match" selector
    const [unclearedJeLines, setUnclearedJeLines] = useState<any[]>([]);

    // Manual Match dialog state
    const [matchForLine, setMatchForLine] = useState<any | null>(null);
    const [selectedJeLineId, setSelectedJeLineId] = useState<string>('');

    // Create JE dialog state
    const [createJeForLine, setCreateJeForLine] = useState<any | null>(null);
    const [jeForm, setJeForm] = useState({ date: '', description: '', offset_account_id: '', amount: '' });
    const [isSavingJe, setIsSavingJe] = useState(false);

    const loadLines = useCallback(async () => {
        setLoading(true);
        try {
            const res: any = await accountingApi.getStatementLines(bank.id, { page_size: 200 });
            setLines(res.results || res || []);
        } catch {
            toast.error('Failed to load statement lines');
        } finally {
            setLoading(false);
        }
    }, [bank.id]);

    useEffect(() => {
        loadLines();
        // Load GL accounts and uncleared JE lines in parallel
        Promise.all([
            accountingApi.getAccounts({ page_size: 300 }),
            accountingApi.getUnclearedLines(bank.id),
        ]).then(([accsRes, jeRes]) => {
            setAllAccounts((accsRes as any).results || []);
            setUnclearedJeLines((jeRes as any) || []);
        }).catch(() => {});
    }, [bank.id, loadLines]);

    const filteredLines = activeTab === 'ALL'
        ? lines
        : lines.filter(l => l.status === activeTab);

    const counts = {
        ALL: lines.length,
        UNMATCHED: lines.filter(l => l.status === 'UNMATCHED').length,
        MATCHED: lines.filter(l => l.status === 'MATCHED').length,
        IGNORED: lines.filter(l => l.status === 'IGNORED').length,
    };

    // ─── Manual Match ────────────────────────────────────────────────────────
    const handleOpenMatch = (line: any) => {
        setMatchForLine(line);
        setSelectedJeLineId('');
    };

    const handleConfirmMatch = async () => {
        if (!matchForLine || !selectedJeLineId) return;
        try {
            await accountingApi.matchStatementLine(matchForLine.id, { journal_line_id: Number(selectedJeLineId) });
            toast.success('Matched successfully');
            setMatchForLine(null);
            // Refresh lines + uncleared JE lines
            await Promise.all([loadLines(), accountingApi.getUnclearedLines(bank.id).then(r => setUnclearedJeLines((r as any) || []))]);
        } catch (e: any) {
            toast.error(e.message || 'Match failed');
        }
    };

    // ─── Unmatch ─────────────────────────────────────────────────────────────
    const handleUnmatch = async (line: any) => {
        try {
            await accountingApi.unmatchStatementLine(line.id);
            toast.success('Unmatched');
            await Promise.all([loadLines(), accountingApi.getUnclearedLines(bank.id).then(r => setUnclearedJeLines((r as any) || []))]);
        } catch (e: any) {
            toast.error(e.message || 'Unmatch failed');
        }
    };

    // ─── Ignore ──────────────────────────────────────────────────────────────
    const handleIgnore = async (line: any) => {
        try {
            await accountingApi.ignoreStatementLine(line.id);
            toast.success('Line ignored');
            await loadLines();
        } catch (e: any) {
            toast.error(e.message || 'Failed to ignore');
        }
    };

    // ─── Create JE ───────────────────────────────────────────────────────────
    const handleOpenCreateJe = (line: any) => {
        setCreateJeForLine(line);
        setJeForm({
            date: line.date,
            description: line.description || '',
            offset_account_id: '',
            amount: String(Math.abs(Number(line.amount))),
        });
    };

    const handleCreateJeAndMatch = async () => {
        if (!createJeForLine || !jeForm.offset_account_id) {
            toast.error('Please select an offset account');
            return;
        }
        if (!jeForm.date || !jeForm.amount || Number(jeForm.amount) <= 0) {
            toast.error('Date and amount are required');
            return;
        }

        setIsSavingJe(true);
        try {
            const isPositive = Number(createJeForLine.amount) > 0;
            const bankAccountId = bank.ledger_account_details?.id ?? bank.ledger_account;
            const offsetAccountId = Number(jeForm.offset_account_id);
            const amount = jeForm.amount;

            // Positive (money in): DR bank, CR offset
            // Negative (money out): CR bank, DR offset
            const lines_data = isPositive
                ? [
                    { account: bankAccountId, debit: amount, credit: '0', description: jeForm.description },
                    { account: offsetAccountId, debit: '0', credit: amount, description: jeForm.description },
                  ]
                : [
                    { account: offsetAccountId, debit: amount, credit: '0', description: jeForm.description },
                    { account: bankAccountId, debit: '0', credit: amount, description: jeForm.description },
                  ];

            const je: any = await accountingApi.createJournal({
                date: jeForm.date,
                description: jeForm.description,
                reference_number: `STMT-${createJeForLine.id}`,
                lines_data,
            });

            // Find the JE line for the bank's ledger account
            const bankLine = je.lines?.find((l: any) => l.account === bankAccountId);
            if (!bankLine) {
                toast.error('Journal entry created but could not auto-match — link manually');
                setCreateJeForLine(null);
                await loadLines();
                return;
            }

            await accountingApi.matchStatementLine(createJeForLine.id, { journal_line_id: bankLine.id });
            toast.success('Journal entry created and matched');
            setCreateJeForLine(null);
            await Promise.all([loadLines(), accountingApi.getUnclearedLines(bank.id).then(r => setUnclearedJeLines((r as any) || []))]);
        } catch (e: any) {
            toast.error(e.message || 'Failed to create journal entry');
        } finally {
            setIsSavingJe(false);
        }
    };

    const tabClass = (tab: TabKey) =>
        `px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === tab
            ? 'bg-[#1C1917] text-white'
            : 'text-[#78706A] hover:text-[#1C1917] hover:bg-[#F7F3ED]'}`;

    const statusBadge = (status: string) => {
        if (status === 'MATCHED') return <Badge className="bg-emerald-100 text-emerald-800 border-0 font-semibold text-xs">Matched</Badge>;
        if (status === 'IGNORED') return <Badge className="bg-[#E8E1D6] text-[#78706A] border-0 font-semibold text-xs">Ignored</Badge>;
        return <Badge className="bg-amber-100 text-amber-800 border-0 font-semibold text-xs">Unmatched</Badge>;
    };

    return (
        <>
            {/* Main Panel */}
            <Dialog open onOpenChange={onClose}>
                <DialogContent className="max-w-5xl bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="mb-4 shrink-0">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">
                            Match Transactions — {bank.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            Review imported statement lines and match them to journal entries.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tabs */}
                    <div className="flex gap-2 shrink-0 mb-4">
                        {(['ALL', 'UNMATCHED', 'MATCHED', 'IGNORED'] as TabKey[]).map(tab => (
                            <button key={tab} className={tabClass(tab)} onClick={() => setActiveTab(tab)}>
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                                <span className="ml-2 text-xs opacity-70">({counts[tab]})</span>
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto border border-[#E8E1D6] rounded-2xl min-h-0">
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-6 w-6 animate-spin text-[#A0978D]" />
                            </div>
                        ) : filteredLines.length === 0 ? (
                            <div className="flex justify-center items-center h-48 text-[#A0978D] text-sm font-medium">
                                No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} lines.
                                {activeTab === 'UNMATCHED' && lines.length === 0 && ' Import a statement to get started.'}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-[#F7F3ED] sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs">Date</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs">Description</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs">Ref</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs text-right">Amount</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs">Status</TableHead>
                                        <TableHead className="font-bold text-[#1C1917] py-3 px-4 text-xs">Matched To</TableHead>
                                        <TableHead className="py-3 px-4"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLines.map(line => (
                                        <TableRow key={line.id} className="border-b border-[#E8E1D6] hover:bg-[#F7F3ED]">
                                            <TableCell className="px-4 py-3 text-xs text-[#78706A] whitespace-nowrap">{formatDate(line.date)}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-[#1C1917] max-w-[200px] truncate">{line.description || '—'}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-[#78706A]">{line.reference || '—'}</TableCell>
                                            <TableCell className={`px-4 py-3 text-xs font-bold tabular-nums text-right ${Number(line.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {Number(line.amount) >= 0 ? '+' : ''}{formatCurrency(line.amount)}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">{statusBadge(line.status)}</TableCell>
                                            <TableCell className="px-4 py-3 text-xs text-[#78706A]">
                                                {line.status === 'MATCHED' && line.matched_entry_reference ? (
                                                    <span className="font-medium text-emerald-700">
                                                        {line.matched_entry_reference} · {line.matched_entry_date ? formatDate(line.matched_entry_date) : ''}
                                                    </span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div className="flex gap-1 justify-end">
                                                    {line.status === 'UNMATCHED' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs rounded-lg border-[#D9D0C5] text-[#1C1917] hover:bg-[#EDE7DC]"
                                                                onClick={() => handleOpenMatch(line)}
                                                                title="Link to existing JE"
                                                            >
                                                                <Link2 className="h-3 w-3 mr-1" />Match
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs rounded-lg border-[#D9D0C5] text-blue-700 hover:bg-blue-50"
                                                                onClick={() => handleOpenCreateJe(line)}
                                                                title="Create journal entry"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />Create JE
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-xs rounded-lg text-[#A0978D] hover:text-[#78706A] hover:bg-[#F7F3ED]"
                                                                onClick={() => handleIgnore(line)}
                                                                title="Ignore this line"
                                                            >
                                                                <EyeOff className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {line.status === 'MATCHED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 px-2 text-xs rounded-lg text-[#A0978D] hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleUnmatch(line)}
                                                            title="Remove match"
                                                        >
                                                            <Link2Off className="h-3 w-3 mr-1" />Unmatch
                                                        </Button>
                                                    )}
                                                    {line.status === 'IGNORED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 px-2 text-xs rounded-lg text-[#A0978D] hover:text-[#1C1917] hover:bg-[#F7F3ED]"
                                                            onClick={() => handleUnmatch(line)}
                                                            title="Restore to unmatched"
                                                        >
                                                            <X className="h-3 w-3 mr-1" />Restore
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <DialogFooter className="mt-4 shrink-0">
                        <Button variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Match Dialog */}
            {matchForLine && (
                <Dialog open onOpenChange={() => setMatchForLine(null)}>
                    <DialogContent className="sm:max-w-[520px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold font-serif text-[#1C1917]">Link to Journal Entry</DialogTitle>
                            <DialogDescription className="text-sm text-[#78706A]">
                                Select the uncleared journal entry line that corresponds to this statement line.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-[#F7F3ED] border border-[#D9D0C5] rounded-xl p-4 mb-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-[#78706A] font-medium">Statement Line</span>
                                <span className={`font-bold tabular-nums ${Number(matchForLine.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {Number(matchForLine.amount) >= 0 ? '+' : ''}{formatCurrency(matchForLine.amount)}
                                </span>
                            </div>
                            <div className="text-[#78706A] mt-1 text-xs truncate">{matchForLine.description} · {formatDate(matchForLine.date)}</div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Uncleared Journal Entry Line *</label>
                            <Select value={selectedJeLineId} onValueChange={setSelectedJeLineId}>
                                <SelectTrigger className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                    <SelectValue placeholder="Select a journal entry line..." />
                                </SelectTrigger>
                                <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md max-h-[240px]">
                                    {unclearedJeLines.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-[#A0978D]">No uncleared lines available</div>
                                    )}
                                    {unclearedJeLines.map((jl: any) => (
                                        <SelectItem key={jl.id} value={jl.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                                            <span className="text-xs">{formatDate(jl.date)} · {jl.reference || 'Manual'} · {jl.description}</span>
                                            <span className={`ml-2 text-xs font-bold ${Number(jl.debit) > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {Number(jl.debit) > 0 ? `DR ${formatCurrency(jl.debit)}` : `CR ${formatCurrency(jl.credit)}`}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="mt-6 gap-3">
                            <Button variant="outline" onClick={() => setMatchForLine(null)} className="h-11 px-6 rounded-xl font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                            <Button onClick={handleConfirmMatch} disabled={!selectedJeLineId} className="h-11 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                                <Link2 className="h-4 w-4 mr-2" />Confirm Match
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Create JE + Auto-Match Dialog */}
            {createJeForLine && (
                <Dialog open onOpenChange={() => setCreateJeForLine(null)}>
                    <DialogContent className="sm:max-w-[540px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold font-serif text-[#1C1917]">Create Journal Entry</DialogTitle>
                            <DialogDescription className="text-sm text-[#78706A]">
                                Create a matching journal entry. The bank account is pre-selected on the correct side.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Statement line summary */}
                        <div className="bg-[#F7F3ED] border border-[#D9D0C5] rounded-xl p-4 mb-5 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-[#78706A] font-medium">Statement Line</span>
                                <span className={`font-bold tabular-nums ${Number(createJeForLine.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {Number(createJeForLine.amount) >= 0 ? '+' : ''}{formatCurrency(createJeForLine.amount)}
                                </span>
                            </div>
                            <div className="text-[#78706A] mt-1 text-xs">{createJeForLine.description} · {formatDate(createJeForLine.date)}</div>
                        </div>

                        {/* Pre-selected bank line (read-only) */}
                        <div className="border border-[#D9D0C5] rounded-xl p-4 mb-4 bg-white">
                            <div className="text-xs font-bold text-[#A0978D] mb-2 uppercase tracking-wide">
                                {Number(createJeForLine.amount) >= 0 ? 'Debit (Money In)' : 'Credit (Money Out)'} — Bank Ledger
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-[#1C1917]">
                                    {bank.ledger_account_details?.code && `${bank.ledger_account_details.code} · `}{bank.ledger_account_details?.name ?? bank.name}
                                </span>
                                <span className={`text-sm font-bold tabular-nums ${Number(createJeForLine.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {Number(createJeForLine.amount) >= 0 ? 'DR' : 'CR'} {formatCurrency(Math.abs(Number(createJeForLine.amount)))}
                                </span>
                            </div>
                            <div className="text-xs text-[#A0978D] mt-1">Auto-selected · read-only</div>
                        </div>

                        {/* Offset account + fields */}
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">
                                    {Number(createJeForLine.amount) >= 0 ? 'Credit (Offset Account)' : 'Debit (Offset Account)'} *
                                </label>
                                <Select value={jeForm.offset_account_id} onValueChange={v => setJeForm({ ...jeForm, offset_account_id: v })}>
                                    <SelectTrigger className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                        <SelectValue placeholder="Select offset account..." />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md max-h-[240px]">
                                        {allAccounts.map((acc: any) => (
                                            <SelectItem key={acc.id} value={acc.id.toString()} className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">
                                                {acc.code ? `${acc.code} - ` : ''}{acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold text-[#1C1917]">Date *</label>
                                    <Input
                                        type="date"
                                        value={jeForm.date}
                                        onChange={e => setJeForm({ ...jeForm, date: e.target.value })}
                                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold text-[#1C1917]">Amount *</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={jeForm.amount}
                                        onChange={e => setJeForm({ ...jeForm, amount: e.target.value })}
                                        className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Description</label>
                                <Input
                                    value={jeForm.description}
                                    onChange={e => setJeForm({ ...jeForm, description: e.target.value })}
                                    placeholder="e.g. Rent Payment, Sales Revenue"
                                    className="h-11 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6 gap-3">
                            <Button variant="outline" onClick={() => setCreateJeForLine(null)} className="h-11 px-6 rounded-xl font-bold border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                            <Button onClick={handleCreateJeAndMatch} disabled={isSavingJe || !jeForm.offset_account_id} className="h-11 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                                {isSavingJe ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create & Match
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
