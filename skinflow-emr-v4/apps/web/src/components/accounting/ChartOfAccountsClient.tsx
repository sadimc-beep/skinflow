'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Loader2, Edit2 } from 'lucide-react';
import { accountingApi } from '@/lib/services/accounting';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ChartOfAccountsClient() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        account_type: 'ASSET',
        description: '',
        is_active: true
    });

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (typeFilter !== 'ALL') params.account_type = typeFilter;

            const response: any = await accountingApi.getAccounts(params);
            setAccounts(response.results || []);
        } catch (error) {
            console.error('Failed to load accounts:', error);
            toast.error('Failed to load chart of accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadAccounts();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, typeFilter]);

    const handleOpenModal = (account: any = null) => {
        if (account) {
            if (account.is_system_account) {
                toast.error("System accounts cannot be edited directly.");
                return;
            }
            setEditingId(account.id);
            setFormData({
                name: account.name,
                code: account.code || '',
                account_type: account.account_type,
                description: account.description || '',
                is_active: account.is_active
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                account_type: 'ASSET',
                description: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Account Name is required');
            return;
        }

        try {
            if (editingId) {
                await accountingApi.updateAccount(editingId, formData);
                toast.success('Account updated');
            } else {
                await accountingApi.createAccount(formData);
                toast.success('Account created');
            }
            setIsModalOpen(false);
            loadAccounts();
        } catch (error) {
            toast.error(editingId ? 'Failed to update account' : 'Failed to create account');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-transparent mb-2">
                <div className="flex flex-1 gap-3 w-full max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-[#78706A]" />
                        <Input
                            placeholder="Search accounts or codes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px] h-12 bg-white border-[#D9D0C5] rounded-xl shadow-sm text-sm text-[#1C1917] font-medium">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="border-[#D9D0C5] shadow-md rounded-xl">
                            <SelectItem value="ALL" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">All Types</SelectItem>
                            <SelectItem value="ASSET" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Asset</SelectItem>
                            <SelectItem value="LIABILITY" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Liability</SelectItem>
                            <SelectItem value="EQUITY" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Equity</SelectItem>
                            <SelectItem value="REVENUE" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Revenue</SelectItem>
                            <SelectItem value="EXPENSE" className="focus:bg-[#F7F3ED] focus:text-[#1C1917]">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832] shadow-sm">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Account
                </Button>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Code</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Name</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Type</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">System</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Status</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#A0978D]" />
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={6} className="h-24 text-center text-[#A0978D] font-medium">
                                        No accounts found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((acc) => (
                                    <TableRow
                                        key={acc.id}
                                        className="hover:bg-[#EDE7DC] border-b border-[#E8E1D6] transition-colors"
                                    >
                                        <TableCell className="font-bold text-[#1C1917] text-sm px-4 py-3">
                                            {acc.code || '-'}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div>
                                                <div className="font-bold text-[#1C1917] text-sm">{acc.name}</div>
                                                {acc.description && (
                                                    <div className="text-sm text-[#78706A] truncate max-w-[200px] mt-0.5">
                                                        {acc.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="inline-flex items-center rounded-md bg-[#F7F3ED] px-2 py-1 text-sm font-medium text-[#78706A] ring-1 ring-inset ring-[#D9D0C5]">
                                                {acc.account_type.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {acc.is_system_account ? (
                                                <span className="inline-flex items-center rounded-md bg-[#1C1917]/5 px-2 py-1 text-xs font-medium text-[#1C1917] ring-1 ring-inset ring-[#1C1917]/10">
                                                    System
                                                </span>
                                            ) : (
                                                <span className="text-[#A0978D] text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {acc.is_active ? (
                                                <span className="inline-flex items-center rounded-md bg-[#7A9E8A]/10 px-2 py-1 text-sm font-medium text-[#4A6B5A] ring-1 ring-inset ring-[#7A9E8A]/20">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-[#F7F3ED] px-2 py-1 text-sm font-medium text-[#78706A] ring-1 ring-inset ring-[#D9D0C5]">
                                                    Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(acc)} className="text-[#A0978D] hover:text-[#1C1917] hover:bg-[#F7F3ED]">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">{editingId ? 'Edit Account' : 'New Account'}</DialogTitle>
                        <DialogDescription className="text-sm text-[#78706A]">
                            {editingId ? 'Update ledger account details.' : 'Add a new ledger account to the chart.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Account Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Office Supplies"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Account Code</label>
                                <Input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g. 5001"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-bold text-[#1C1917]">Account Type</label>
                                <Select
                                    value={formData.account_type}
                                    onValueChange={v => setFormData({ ...formData, account_type: v })}
                                >
                                    <SelectTrigger className="h-12 bg-[#F7F3ED] border-[#D9D0C5] rounded-xl text-sm text-[#1C1917]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#D9D0C5] rounded-xl shadow-md">
                                        <SelectItem value="ASSET" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Asset (Cash, Receivables)</SelectItem>
                                        <SelectItem value="LIABILITY" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Liability (Payables, Loans)</SelectItem>
                                        <SelectItem value="EQUITY" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Equity (Retained Earnings)</SelectItem>
                                        <SelectItem value="REVENUE" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Revenue (Sales, Income)</SelectItem>
                                        <SelectItem value="EXPENSE" className="focus:bg-[#EDE7DC] focus:text-[#1C1917]">Expense (Rent, Materials)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-bold text-[#1C1917]">Description</label>
                            <Input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional notes"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSave} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">Save Account</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
