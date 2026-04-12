"use client";

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search…',
    emptyText = 'No results found.',
    disabled = false,
    className,
}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selected = options.find(o => o.value === value);

    // Substring match anywhere in the label — case-insensitive
    const filtered = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(''); }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="truncate">{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {filtered.map(option => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4 shrink-0',
                                            value === option.value ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
