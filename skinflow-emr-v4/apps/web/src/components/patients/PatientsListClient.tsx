"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Patient } from '@/types/models';

export function PatientsListClient({ initialPatients }: { initialPatients: Patient[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Basic client-side filtering for immediate feedback, 
    // real implementation would debounce and call Next.js Server Action or API
    const filteredPatients = initialPatients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone_primary.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search patients..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Button asChild>
                    <Link href="/patients/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Patient
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>DOB</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPatients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No patients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPatients.map((patient) => (
                                <TableRow key={patient.id} className="cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>
                                    <TableCell className="font-medium">
                                        {patient.first_name} {patient.last_name}
                                    </TableCell>
                                    <TableCell>
                                        {patient.phone_primary}
                                        <div className="text-xs text-muted-foreground">{patient.email}</div>
                                    </TableCell>
                                    <TableCell>{patient.date_of_birth || 'N/A'}</TableCell>
                                    <TableCell>{patient.gender}</TableCell>
                                    <TableCell>
                                        {patient.has_chronic_conditions && (
                                            <Badge variant="outline" className="mr-1 bg-[#F7F3ED] text-[#C4705A] border-[#C4705A]/30">Chronic</Badge>
                                        )}
                                        {patient.has_known_allergies && (
                                            <Badge variant="outline" className="mr-1 bg-[#F7F3ED] text-[#C4A882] border-[#C4A882]/30">Allergy</Badge>
                                        )}
                                        {!patient.has_chronic_conditions && !patient.has_known_allergies && (
                                            <Badge variant="outline" className="bg-[#F7F3ED] text-[#7A9E8A] border-[#7A9E8A]/30">Clear</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/patients/${patient.id}`); }}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/patients/${patient.id}/edit`); }}>
                                                    Edit Patient
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
