'use client';

import { useState } from 'react';
import { CameraCapture } from './CameraCapture';
import type { OverlayType, PhotoCategory } from './CameraCapture';

// ─── Angle sequence ───────────────────────────────────────────────────────────

const SEQUENCE: Array<{ overlay: OverlayType; label: string }> = [
    { overlay: 'face_front',    label: 'Front View' },
    { overlay: 'face_left',     label: 'Left Profile' },
    { overlay: 'face_right',    label: 'Right Profile' },
    { overlay: 'face_45_left',  label: '3/4 Left View' },
    { overlay: 'face_45_right', label: '3/4 Right View' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MultiAngleCaptureProps {
    patientId: number;
    sessionId: number;
    category: Extract<PhotoCategory, 'PRE_SESSION' | 'POST_SESSION'>;
    onComplete: (photoIds: number[]) => void;
    onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiAngleCapture({
    patientId,
    sessionId,
    category,
    onComplete,
    onCancel,
}: MultiAngleCaptureProps) {
    const [step, setStep]             = useState(0);
    const [capturedIds, setCapturedIds] = useState<number[]>([]);

    const advance = (ids: number[]) => {
        const nextStep = step + 1;
        if (nextStep >= SEQUENCE.length) {
            onComplete(ids);
        } else {
            setStep(nextStep);
        }
    };

    const handleCapture = (photoId: number) => {
        const ids = [...capturedIds, photoId];
        setCapturedIds(ids);
        advance(ids);
    };

    const handleSkip = () => {
        advance(capturedIds);
    };

    const current    = SEQUENCE[step];
    const progressPct = (step / SEQUENCE.length) * 100;

    return (
        <>
            {/* The camera for the current angle */}
            <CameraCapture
                patientId={patientId}
                sessionId={sessionId}
                category={category}
                overlay={current.overlay}
                onCapture={handleCapture}
                onSkip={handleSkip}
                onCancel={onCancel}
            />

            {/*
             * Progress overlay — z-[60] renders above CameraCapture's z-50.
             * pointer-events-none so it never blocks the camera controls;
             * only the step badge itself is non-interactive.
             */}
            <div className="fixed inset-x-0 top-0 z-[60] pointer-events-none">
                {/* Thin progress bar */}
                <div className="h-[3px] bg-white/15">
                    <div
                        className="h-full bg-indigo-400 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/*
                 * Step count chip — positioned at top-[72px] so it clears the
                 * CameraCapture top-4 control row (close + switch buttons + angle label).
                 */}
                <div className="flex items-center justify-center mt-[72px]">
                    <div className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full select-none tracking-wide">
                        Photo {step + 1} of {SEQUENCE.length}
                        <span className="text-white/60 font-normal mx-1.5">—</span>
                        {current.label}
                    </div>
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 mt-2.5">
                    {SEQUENCE.map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${
                                i < step
                                    ? 'w-2 h-2 bg-indigo-400'        // captured
                                    : i === step
                                    ? 'w-2.5 h-2.5 bg-white'         // current
                                    : 'w-2 h-2 bg-white/30'          // upcoming
                            }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
