"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/services/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building2, Mail, Phone, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export function VendorsClient() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        tax_id: ""
    });

    const fetchVendors = async () => {
        setIsLoading(true);
        try {
            const res = await inventoryApi.vendors.list({ search: searchTerm });
            setVendors(res.results || []);
        } catch (error) {
            toast.error("Failed to fetch vendors");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchVendors, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleOpenModal = (vendor?: any) => {
        if (vendor) {
            setFormData(vendor);
            setIsEditing(true);
        } else {
            setFormData({ id: 0, name: "", contact_name: "", email: "", phone: "", address: "", tax_id: "" });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                await inventoryApi.vendors.update(formData.id, formData);
                toast.success("Vendor updated successfully");
            } else {
                await inventoryApi.vendors.create(formData);
                toast.success("Vendor created successfully");
            }
            setIsModalOpen(false);
            fetchVendors();
        } catch (error: any) {
            toast.error(error.message || "Failed to save vendor");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-[#78706A]" />
                    <Input
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-12 text-sm bg-white border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl shadow-sm placeholder:text-[#A0978D]"
                    />
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-[#1C1917] hover:bg-[#3E3832] text-white h-12 px-6 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto">
                    <Plus className="mr-2 h-5 w-5 text-[#C4A882]" /> Add Vendor
                </Button>
            </div>

            <Card className="bg-white border-[#E8E1D6] shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#F7F3ED]">
                            <TableRow className="border-b border-[#D9D0C5] hover:bg-transparent">
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Vendor Info</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Contact Person</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm ">Communications</TableHead>
                                <TableHead className="font-bold text-[#1C1917] py-5 px-6 text-sm  text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-[#78706A] font-medium text-sm">Loading vendors...</TableCell>
                                </TableRow>
                            ) : vendors.length === 0 ? (
                                <TableRow className="border-b border-[#E8E1D6]">
                                    <TableCell colSpan={4} className="h-32 text-center text-[#A0978D] font-medium text-sm">
                                        No vendors found. Try adding a new supplier.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vendors.map((vendor) => (
                                    <TableRow key={vendor.id} className="hover:bg-[#F7F3ED] border-b border-[#E8E1D6] transition-colors">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#EDE7DC] flex items-center justify-center border border-[#D9D0C5] flex-shrink-0">
                                                    <Building2 className="h-6 w-6 text-[#1C1917]" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#1C1917] text-sm">{vendor.name}</div>
                                                    {vendor.tax_id && <div className="text-sm text-[#78706A] mt-0.5">Tax ID: {vendor.tax_id}</div>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[#78706A] text-sm py-5 px-6">
                                            {vendor.contact_name ? (
                                                <span className="font-bold text-[#1C1917]">{vendor.contact_name}</span>
                                            ) : (
                                                <span className="text-[#A0978D] italic">No contact specified</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="space-y-1.5">
                                                {vendor.email && (
                                                    <div className="flex items-center text-sm text-[#78706A] font-medium">
                                                        <Mail className="w-4 h-4 mr-2 text-[#A0978D]" />
                                                        {vendor.email}
                                                    </div>
                                                )}
                                                {vendor.phone && (
                                                    <div className="flex items-center text-sm text-[#78706A] font-medium">
                                                        <Phone className="w-4 h-4 mr-2 text-[#A0978D]" />
                                                        {vendor.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-5 px-6">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleOpenModal(vendor)}
                                                className="bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED] text-sm font-bold h-10 px-4 rounded-lg shadow-sm"
                                            >
                                                Edit Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white border-[#E8E1D6] rounded-3xl p-8 shadow-xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-serif text-[#1C1917]">{isEditing ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-sm font-bold text-[#1C1917]">Company Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Allergan Aesthetics"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_name" className="text-sm font-bold text-[#1C1917]">Primary Contact</Label>
                                <Input
                                    id="contact_name"
                                    value={formData.contact_name}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    placeholder="Jane Doe"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax_id" className="text-sm font-bold text-[#1C1917]">Tax ID / BIN</Label>
                                <Input
                                    id="tax_id"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    placeholder="Optional"
                                    className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-sm font-bold text-[#1C1917]">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="orders@allergan.com"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone" className="text-sm font-bold text-[#1C1917]">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 234 567 890"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address" className="text-sm font-bold text-[#1C1917]">Physical Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Pharma Blvd, MedCity"
                                className="h-12 bg-[#F7F3ED] border-[#D9D0C5] focus-visible:ring-[#C4A882] rounded-xl text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 space-x-3 gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl font-bold bg-white border-[#D9D0C5] text-[#1C1917] hover:bg-[#F7F3ED]">Cancel</Button>
                        <Button onClick={handleSave} disabled={!formData.name.trim()} className="h-12 px-6 rounded-xl font-bold bg-[#1C1917] text-white hover:bg-[#3E3832]">
                            {isEditing ? "Save Changes" : "Create Vendor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
