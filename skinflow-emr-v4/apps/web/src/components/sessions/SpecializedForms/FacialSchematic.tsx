"use client";

import React, { useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Check, Trash2 } from 'lucide-react';
import { FaceSVG } from './FaceSVG';

export type InjectionPoint = {
    id: string;
    label: string;
    x: number;
    y: number;
};

// Standard cosmetic injection zones
export const BOTOX_ZONES: InjectionPoint[] = [
    { id: 'frontalis', label: 'Forehead (Frontalis)', x: 150, y: 80 },
    { id: 'glabella', label: 'Frown Lines (Glabella)', x: 150, y: 125 },
    { id: 'crows_feet_left', label: 'Crow\'s Feet (L)', x: 95, y: 145 },
    { id: 'crows_feet_right', label: 'Crow\'s Feet (R)', x: 205, y: 145 },
    { id: 'bunny_lines', label: 'Bunny Lines', x: 150, y: 165 },
    { id: 'masseter_left', label: 'Masseter (L)', x: 80, y: 220 },
    { id: 'masseter_right', label: 'Masseter (R)', x: 220, y: 220 },
    { id: 'mentalis', label: 'Chin (Mentalis)', x: 150, y: 265 },
];

export const FILLER_ZONES: InjectionPoint[] = [
    { id: 'tear_trough_left', label: 'Tear Trough (L)', x: 120, y: 155 },
    { id: 'tear_trough_right', label: 'Tear Trough (R)', x: 180, y: 155 },
    { id: 'cheeks_left', label: 'Cheek (L)', x: 100, y: 180 },
    { id: 'cheeks_right', label: 'Cheek (R)', x: 200, y: 180 },
    { id: 'nasolabial_left', label: 'Nasolabial Fold (L)', x: 130, y: 200 },
    { id: 'nasolabial_right', label: 'Nasolabial Fold (R)', x: 170, y: 200 },
    { id: 'lips_upper', label: 'Upper Lip', x: 150, y: 225 },
    { id: 'lips_lower', label: 'Lower Lip', x: 150, y: 240 },
    { id: 'marionette_left', label: 'Marionette Line (L)', x: 125, y: 245 },
    { id: 'marionette_right', label: 'Marionette Line (R)', x: 175, y: 245 },
    { id: 'jawline_left', label: 'Jawline (L)', x: 90, y: 250 },
    { id: 'jawline_right', label: 'Jawline (R)', x: 210, y: 250 },
    { id: 'chin', label: 'Chin', x: 150, y: 275 },
];

export interface FacialSchematicProps {
    mode: 'botox' | 'filler';
    data: Record<string, number | string>; // Maps zone id to value (Units for Botox, Volume for Filler)
    onChange: (zoneId: string, value: number | string) => void;
    readonly?: boolean;
    imageUrl?: string | null;
    customZones?: InjectionPoint[];
    onAddCustomZone?: (x: number, y: number) => void;
    onRemoveCustomZone?: (zoneId: string) => void;
}

export function FacialSchematic({ mode, data, onChange, readonly = false, imageUrl, customZones = [], onAddCustomZone, onRemoveCustomZone }: FacialSchematicProps) {
    const baseZones = mode === 'botox' ? BOTOX_ZONES : FILLER_ZONES;
    const zones = [...baseZones, ...customZones];
    const unitLabel = mode === 'botox' ? 'Units' : 'mL';
    const activeColor = mode === 'botox' ? 'bg-blue-500' : 'bg-purple-500';
    const containerRef = useRef<HTMLDivElement>(null);

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readonly || !onAddCustomZone || !containerRef.current) return;

        // Prevent adding point if clicking on an existing pin
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).closest('button')) {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const xPercent = (e.clientX - rect.left) / rect.width;
        const yPercent = (e.clientY - rect.top) / rect.height;

        // Map percent back to our 300x400 coordinate system
        const mappedX = xPercent * 300;
        const mappedY = yPercent * 400;

        onAddCustomZone(mappedX, mappedY);
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full max-w-[300px] mx-auto aspect-[3/4] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner ${!readonly ? 'cursor-crosshair' : ''}`}
            onClick={handleContainerClick}
        >
            {imageUrl
                ? <img src={imageUrl} alt="Patient Clinical Photo" className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0"><FaceSVG /></div>
            }

            {/* Interactive Points */}
            {zones.map(zone => {
                const value = data[zone.id];
                const hasValue = value !== undefined && value !== '' && Number(value) > 0;

                return (
                    <Popover key={zone.id}>
                        <PopoverTrigger asChild>
                            <button
                                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md transform hover:scale-110 z-10 ${hasValue
                                    ? `${activeColor} text-white ring-2 ring-white`
                                    : 'bg-white border-2 border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600'
                                    }`}
                                style={{ left: `${(zone.x / 300) * 100}%`, top: `${(zone.y / 400) * 100}%` }}
                                disabled={readonly}
                            >
                                {hasValue ? value : '+'}
                            </button>
                        </PopoverTrigger>
                        {!readonly && (
                            <PopoverContent className="w-60 p-4" side="top" align="center">
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm leading-none">{zone.label}</h4>
                                            {zone.id.startsWith('custom-') && onRemoveCustomZone && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onRemoveCustomZone(zone.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 -mr-1 rounded transition-colors focus:outline-none"
                                                    title="Remove Pin"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Enter dosage amount</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step={mode === 'filler' ? "0.1" : "1"}
                                            min="0"
                                            placeholder={`0`}
                                            defaultValue={value as string || ''}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    onChange(zone.id, val ? Number(val) : '');
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                onChange(zone.id, val ? Number(val) : '');
                                            }}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-medium text-slate-500 w-8">{unitLabel}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground italic flex">
                                        <Check className="w-3 h-3 mr-1" /> Auto-saves on blur or enter
                                    </span>
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                );
            })}
        </div>
    );
}

