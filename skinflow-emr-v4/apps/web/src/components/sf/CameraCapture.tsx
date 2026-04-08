'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    RefreshCw,
    X,
    RotateCcw,
    Check,
    Loader2,
    CameraOff,
    SwitchCamera,
} from 'lucide-react';
import {
    FaceFrontOverlay,
    FaceLeftOverlay,
    FaceRightOverlay,
    Face45LeftOverlay,
    Face45RightOverlay,
    BodyFrontOverlay,
    BodyBackOverlay,
} from './CameraOverlays';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoCategory = 'REGISTRATION' | 'PRE_SESSION' | 'POST_SESSION';
export type OverlayType =
    | 'face_front'
    | 'face_left'
    | 'face_right'
    | 'face_45_left'
    | 'face_45_right'
    | 'body_front'
    | 'body_back'
    | 'none';

export interface CameraCaptureProps {
    patientId: number;
    category: PhotoCategory;
    overlay: OverlayType;
    onCapture: (photoId: number) => void;
    onCancel: () => void;
    sessionId?: number;
    /** Optional: show a "Skip this angle" link in live mode (used by MultiAngleCapture). */
    onSkip?: () => void;
}

type CameraState =
    | 'loading'
    | 'live'
    | 'captured'
    | 'uploading'
    | 'upload_error'
    | 'permission_denied'
    | 'unavailable';

// ─── Constants ────────────────────────────────────────────────────────────────

const OVERLAY_LABEL: Record<OverlayType, string> = {
    face_front:    'Front View',
    face_left:     'Left Profile',
    face_right:    'Right Profile',
    face_45_left:  '3/4 Left View',
    face_45_right: '3/4 Right View',
    body_front:    'Body — Front',
    body_back:     'Body — Back',
    none:          '',
};

const OVERLAY_MAP: Record<Exclude<OverlayType, 'none'>, React.ComponentType> = {
    face_front:    FaceFrontOverlay,
    face_left:     FaceLeftOverlay,
    face_right:    FaceRightOverlay,
    face_45_left:  Face45LeftOverlay,
    face_45_right: Face45RightOverlay,
    body_front:    BodyFrontOverlay,
    body_back:     BodyBackOverlay,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CameraCapture({
    patientId,
    category,
    overlay,
    onCapture,
    onCancel,
    sessionId,
    onSkip,
}: CameraCaptureProps) {
    const videoRef   = useRef<HTMLVideoElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const streamRef  = useRef<MediaStream | null>(null);

    const [cameraState,  setCameraState]  = useState<CameraState>('loading');
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [capturedUrl,  setCapturedUrl]  = useState<string | null>(null);
    const [facingMode,   setFacingMode]   = useState<'environment' | 'user'>('environment');
    const [flashOpacity, setFlashOpacity] = useState(0);
    const [uploadError,  setUploadError]  = useState<string | null>(null);

    // ── Camera lifecycle ──────────────────────────────────────────────────────

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async (facing: 'environment' | 'user') => {
        stopStream();
        setCameraState('loading');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width:  { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            streamRef.current = stream;
            // Video element is always mounted — ref is always valid here.
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
            setCameraState('live');
        } catch (err: unknown) {
            const name = (err as Error).name;
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setCameraState('permission_denied');
            } else {
                setCameraState('unavailable');
            }
        }
    }, [stopStream]);

    // Start camera on mount, stop on unmount.
    useEffect(() => {
        startCamera('environment');
        return () => stopStream();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Revoke object URL when it changes (retake flow).
    useEffect(() => {
        return () => {
            if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        };
    }, [capturedUrl]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleToggleCamera = async () => {
        const next = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(next);
        await startCamera(next);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width  = video.videoWidth  || 1920;
        canvas.height = video.videoHeight || 1080;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        // Flash effect: fade in instantly, fade out over 350ms.
        setFlashOpacity(1);
        setTimeout(() => setFlashOpacity(0), 50);

        canvas.toBlob(
            blob => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                setCapturedBlob(blob);
                setCapturedUrl(url);
                // Stop stream to conserve battery after capture.
                stopStream();
                setCameraState('captured');
            },
            'image/jpeg',
            0.92,
        );
    };

    const handleRetake = () => {
        setCapturedBlob(null);
        setCapturedUrl(null);
        setUploadError(null);
        startCamera(facingMode);
    };

    const handleUsePhoto = async () => {
        if (!capturedBlob) return;
        setCameraState('uploading');
        setUploadError(null);

        const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
        });
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('category', category);

        const base  = process.env.NEXT_PUBLIC_DJANGO_BASE_URL ?? 'http://127.0.0.1:8000';
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('skinflow_access_token')
            : null;

        let url: string;
        if (sessionId) {
            url = `${base}/api/clinical/sessions/${sessionId}/upload_photo/`;
        } else {
            formData.append('patient', String(patientId));
            url = `${base}/api/clinical/photos/`;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as Record<string, unknown>;
                const msg = (err.detail ?? err.error ?? `Upload failed (${res.status})`) as string;
                throw new Error(msg);
            }

            const data = await res.json() as { id: number };
            onCapture(data.id);
        } catch (err: unknown) {
            const msg = (err instanceof Error ? err.message : null) ?? 'Upload failed. Please try again.';
            setUploadError(msg);
            setCameraState('upload_error');
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const OverlayComponent = overlay !== 'none' ? OVERLAY_MAP[overlay] : null;
    const overlayLabel     = OVERLAY_LABEL[overlay];

    const isLiveState    = cameraState === 'live';
    const isCapturedState = cameraState === 'captured' || cameraState === 'upload_error';
    const isErrorState   = cameraState === 'permission_denied' || cameraState === 'unavailable';
    const isLoadingState = cameraState === 'loading';
    const isUploadingState = cameraState === 'uploading';

    // Hide video in these states (keep mounted for ref stability).
    const videoHidden = !isLiveState && !isLoadingState;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Hidden canvas — only used for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ── Viewport ── */}
            <div className="relative flex-1 overflow-hidden">

                {/* Video: always mounted so ref is always valid */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${videoHidden ? 'invisible' : ''}`}
                />

                {/* Captured image preview */}
                {capturedUrl && (isCapturedState || isUploadingState) && (
                    <img
                        src={capturedUrl}
                        alt="Captured photo"
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                    />
                )}

                {/* SVG positioning overlay (live mode only) */}
                {isLiveState && OverlayComponent && (
                    <div className="absolute inset-0 pointer-events-none">
                        <OverlayComponent />
                    </div>
                )}

                {/* Angle label pill */}
                {isLiveState && overlayLabel && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/55 text-white text-sm font-medium px-4 py-1.5 rounded-full pointer-events-none select-none whitespace-nowrap">
                        {overlayLabel}
                    </div>
                )}

                {/* Flash effect */}
                <div
                    className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-[350ms]"
                    style={{ opacity: flashOpacity }}
                />

                {/* ── Close button ── */}
                <button
                    onClick={onCancel}
                    aria-label="Close camera"
                    className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/55 flex items-center justify-center text-white hover:bg-black/75 transition-colors active:scale-95"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ── Camera flip button (live mode only) ── */}
                {isLiveState && (
                    <button
                        onClick={handleToggleCamera}
                        aria-label="Switch camera"
                        className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/55 flex items-center justify-center text-white hover:bg-black/75 transition-colors active:scale-95"
                    >
                        <SwitchCamera className="w-5 h-5" />
                    </button>
                )}

                {/* ── Loading spinner ── */}
                {isLoadingState && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                )}

                {/* ── Upload progress ── */}
                {isUploadingState && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 pointer-events-none">
                        <Loader2 className="w-12 h-12 text-white animate-spin mb-3" />
                        <p className="text-white font-medium text-lg">Uploading photo…</p>
                    </div>
                )}

                {/* ── Permission denied ── */}
                {cameraState === 'permission_denied' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white text-center px-8">
                        <CameraOff className="w-16 h-16 mb-5 text-red-400" />
                        <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
                        <p className="text-gray-400 mb-5">
                            Allow camera access in your browser settings, then try again.
                        </p>
                        <p className="text-gray-500 text-sm">
                            iOS: Settings → Safari → Camera → Allow
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            Android: Settings → Apps → Browser → Permissions → Camera
                        </p>
                    </div>
                )}

                {/* ── Camera unavailable ── */}
                {cameraState === 'unavailable' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white text-center px-8">
                        <CameraOff className="w-16 h-16 mb-5 text-yellow-400" />
                        <h3 className="text-xl font-semibold mb-2">Camera Unavailable</h3>
                        <p className="text-gray-400">
                            No camera was detected on this device. Please use a tablet or
                            desktop with a working camera.
                        </p>
                    </div>
                )}

                {/* ── Upload error banner ── */}
                {cameraState === 'upload_error' && uploadError && (
                    <div className="absolute bottom-28 left-4 right-4 bg-red-950/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg text-sm">
                        <span className="font-medium">Upload failed: </span>{uploadError}
                    </div>
                )}
            </div>

            {/* ── Bottom controls ── */}
            <div className="flex-shrink-0 bg-black">

                {/* Live: shutter button + optional skip */}
                {isLiveState && (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <button
                            onClick={handleCapture}
                            aria-label="Take photo"
                            className="w-20 h-20 rounded-full bg-white border-[5px] border-gray-300 shadow-xl active:scale-95 transition-transform flex items-center justify-center"
                        >
                            <div className="w-[52px] h-[52px] rounded-full bg-white border-2 border-gray-300" />
                        </button>
                        {onSkip && (
                            <button
                                onClick={onSkip}
                                className="text-white/65 text-sm hover:text-white transition-colors pb-2"
                            >
                                Skip this angle →
                            </button>
                        )}
                    </div>
                )}

                {/* Captured / upload error: Retake + Use Photo */}
                {isCapturedState && (
                    <div className="flex gap-3 px-5 py-5">
                        <Button
                            variant="outline"
                            onClick={handleRetake}
                            className="flex-1 h-14 text-base bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:text-white"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Retake
                        </Button>
                        <Button
                            onClick={handleUsePhoto}
                            className="flex-1 h-14 text-base bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Check className="w-5 h-5 mr-2" />
                            Use Photo
                        </Button>
                    </div>
                )}

                {/* Error states: close only */}
                {isErrorState && (
                    <div className="px-5 py-5">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="w-full h-14 text-base bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:text-white"
                        >
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
