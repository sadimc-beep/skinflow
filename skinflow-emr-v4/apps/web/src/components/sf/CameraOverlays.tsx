/**
 * SVG positioning overlay guides for clinical photo capture.
 * Each component fills its container (w-full h-full).
 * Use as children inside a relative-positioned wrapper with pointer-events-none.
 */

const PRIMARY = 'rgba(100,220,120,0.72)';
const GUIDE   = 'rgba(255,255,255,0.50)';
const TEXT    = 'rgba(255,255,255,0.80)';

const STROKE_MAIN  = { stroke: PRIMARY, strokeWidth: '0.8',  fill: 'none' };
const STROKE_GUIDE = { stroke: GUIDE,   strokeWidth: '0.45', fill: 'none', strokeDasharray: '3 2' };
const STROKE_SOLID = { stroke: GUIDE,   strokeWidth: '0.45', fill: 'none' };

// ─── Face Front ──────────────────────────────────────────────────────────────

export function FaceFrontOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Face oval */}
            <ellipse cx="50" cy="48" rx="22" ry="28" {...STROKE_MAIN} />

            {/* Vertical center line */}
            <line x1="50" y1="20" x2="50" y2="76" {...STROKE_GUIDE} />

            {/* Eye line */}
            <line x1="29" y1="41" x2="71" y2="41" {...STROKE_GUIDE} />

            {/* Nose line */}
            <line x1="33" y1="52" x2="67" y2="52" {...STROKE_GUIDE} />

            {/* Lip line */}
            <line x1="35" y1="59" x2="65" y2="59" {...STROKE_GUIDE} />

            {/* Corner ticks — top */}
            <line x1="12" y1="10" x2="20" y2="10" {...STROKE_SOLID} />
            <line x1="12" y1="10" x2="12" y2="18" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="80" y2="10" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="88" y2="18" {...STROKE_SOLID} />

            {/* Corner ticks — bottom */}
            <line x1="12" y1="90" x2="20" y2="90" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="12" y2="82" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="80" y2="90" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="88" y2="82" {...STROKE_SOLID} />

            <text x="50" y="96" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                Front View — align face within oval
            </text>
        </svg>
    );
}

// ─── Face Left Profile ────────────────────────────────────────────────────────

export function FaceLeftOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Profile oval — offset left, slightly narrower */}
            <ellipse cx="44" cy="48" rx="17" ry="26" {...STROKE_MAIN} />

            {/* Nose protrusion suggestion */}
            <path d="M 61 50 Q 66 52 61 56" {...STROKE_MAIN} />

            {/* Eye line */}
            <line x1="28" y1="41" x2="62" y2="41" {...STROKE_GUIDE} />

            {/* Nose line */}
            <line x1="30" y1="52" x2="66" y2="52" {...STROKE_GUIDE} />

            {/* Lip line */}
            <line x1="32" y1="59" x2="62" y2="59" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="12" y1="10" x2="20" y2="10" {...STROKE_SOLID} />
            <line x1="12" y1="10" x2="12" y2="18" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="80" y2="10" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="88" y2="18" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="20" y2="90" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="12" y2="82" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="80" y2="90" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="88" y2="82" {...STROKE_SOLID} />

            <text x="50" y="96" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                Left Profile — patient faces right
            </text>
        </svg>
    );
}

// ─── Face Right Profile ───────────────────────────────────────────────────────

export function FaceRightOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Profile oval — offset right */}
            <ellipse cx="56" cy="48" rx="17" ry="26" {...STROKE_MAIN} />

            {/* Nose protrusion suggestion */}
            <path d="M 39 50 Q 34 52 39 56" {...STROKE_MAIN} />

            {/* Eye line */}
            <line x1="38" y1="41" x2="72" y2="41" {...STROKE_GUIDE} />

            {/* Nose line */}
            <line x1="34" y1="52" x2="70" y2="52" {...STROKE_GUIDE} />

            {/* Lip line */}
            <line x1="38" y1="59" x2="68" y2="59" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="12" y1="10" x2="20" y2="10" {...STROKE_SOLID} />
            <line x1="12" y1="10" x2="12" y2="18" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="80" y2="10" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="88" y2="18" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="20" y2="90" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="12" y2="82" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="80" y2="90" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="88" y2="82" {...STROKE_SOLID} />

            <text x="50" y="96" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                Right Profile — patient faces left
            </text>
        </svg>
    );
}

// ─── Face 45° Left ────────────────────────────────────────────────────────────

export function Face45LeftOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* 3/4 view oval — slightly left of center, slightly narrower */}
            <ellipse cx="47" cy="48" rx="20" ry="27" {...STROKE_MAIN} />

            {/* Off-center vertical line (nose axis) */}
            <line x1="45" y1="21" x2="45" y2="75" {...STROKE_GUIDE} />

            {/* Eye line */}
            <line x1="27" y1="41" x2="68" y2="41" {...STROKE_GUIDE} />

            {/* Nose line */}
            <line x1="30" y1="52" x2="67" y2="52" {...STROKE_GUIDE} />

            {/* Lip line */}
            <line x1="32" y1="59" x2="65" y2="59" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="12" y1="10" x2="20" y2="10" {...STROKE_SOLID} />
            <line x1="12" y1="10" x2="12" y2="18" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="80" y2="10" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="88" y2="18" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="20" y2="90" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="12" y2="82" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="80" y2="90" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="88" y2="82" {...STROKE_SOLID} />

            <text x="50" y="96" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                3/4 Left — patient turns slightly left
            </text>
        </svg>
    );
}

// ─── Face 45° Right ───────────────────────────────────────────────────────────

export function Face45RightOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* 3/4 view oval — slightly right of center */}
            <ellipse cx="53" cy="48" rx="20" ry="27" {...STROKE_MAIN} />

            {/* Off-center vertical line (nose axis) */}
            <line x1="55" y1="21" x2="55" y2="75" {...STROKE_GUIDE} />

            {/* Eye line */}
            <line x1="32" y1="41" x2="73" y2="41" {...STROKE_GUIDE} />

            {/* Nose line */}
            <line x1="33" y1="52" x2="70" y2="52" {...STROKE_GUIDE} />

            {/* Lip line */}
            <line x1="35" y1="59" x2="68" y2="59" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="12" y1="10" x2="20" y2="10" {...STROKE_SOLID} />
            <line x1="12" y1="10" x2="12" y2="18" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="80" y2="10" {...STROKE_SOLID} />
            <line x1="88" y1="10" x2="88" y2="18" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="20" y2="90" {...STROKE_SOLID} />
            <line x1="12" y1="90" x2="12" y2="82" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="80" y2="90" {...STROKE_SOLID} />
            <line x1="88" y1="90" x2="88" y2="82" {...STROKE_SOLID} />

            <text x="50" y="96" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                3/4 Right — patient turns slightly right
            </text>
        </svg>
    );
}

// ─── Body Front ───────────────────────────────────────────────────────────────

export function BodyFrontOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Body outline — shoulders to mid-thigh */}
            <rect x="28" y="8" width="44" height="82" rx="3" {...STROKE_MAIN} />

            {/* Vertical center line */}
            <line x1="50" y1="8" x2="50" y2="90" {...STROKE_GUIDE} />

            {/* Shoulder line */}
            <line x1="28" y1="18" x2="72" y2="18" {...STROKE_GUIDE} />

            {/* Waist line */}
            <line x1="28" y1="52" x2="72" y2="52" {...STROKE_GUIDE} />

            {/* Hip line */}
            <line x1="28" y1="64" x2="72" y2="64" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="8"  y1="8"  x2="16" y2="8"  {...STROKE_SOLID} />
            <line x1="8"  y1="8"  x2="8"  y2="16" {...STROKE_SOLID} />
            <line x1="92" y1="8"  x2="84" y2="8"  {...STROKE_SOLID} />
            <line x1="92" y1="8"  x2="92" y2="16" {...STROKE_SOLID} />
            <line x1="8"  y1="92" x2="16" y2="92" {...STROKE_SOLID} />
            <line x1="8"  y1="92" x2="8"  y2="84" {...STROKE_SOLID} />
            <line x1="92" y1="92" x2="84" y2="92" {...STROKE_SOLID} />
            <line x1="92" y1="92" x2="92" y2="84" {...STROKE_SOLID} />

            <text x="50" y="97.5" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                Body Front — stand arms slightly away from body
            </text>
        </svg>
    );
}

// ─── Body Back ────────────────────────────────────────────────────────────────

export function BodyBackOverlay() {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Body outline */}
            <rect x="28" y="8" width="44" height="82" rx="3" {...STROKE_MAIN} />

            {/* Vertical center line */}
            <line x1="50" y1="8" x2="50" y2="90" {...STROKE_GUIDE} />

            {/* Shoulder line */}
            <line x1="28" y1="18" x2="72" y2="18" {...STROKE_GUIDE} />

            {/* Waist line */}
            <line x1="28" y1="52" x2="72" y2="52" {...STROKE_GUIDE} />

            {/* Hip line */}
            <line x1="28" y1="64" x2="72" y2="64" {...STROKE_GUIDE} />

            {/* Corner ticks */}
            <line x1="8"  y1="8"  x2="16" y2="8"  {...STROKE_SOLID} />
            <line x1="8"  y1="8"  x2="8"  y2="16" {...STROKE_SOLID} />
            <line x1="92" y1="8"  x2="84" y2="8"  {...STROKE_SOLID} />
            <line x1="92" y1="8"  x2="92" y2="16" {...STROKE_SOLID} />
            <line x1="8"  y1="92" x2="16" y2="92" {...STROKE_SOLID} />
            <line x1="8"  y1="92" x2="8"  y2="84" {...STROKE_SOLID} />
            <line x1="92" y1="92" x2="84" y2="92" {...STROKE_SOLID} />
            <line x1="92" y1="92" x2="92" y2="84" {...STROKE_SOLID} />

            <text x="50" y="97.5" textAnchor="middle" fontSize="3.5" fill={TEXT}>
                Body Back — patient faces away from camera
            </text>
        </svg>
    );
}
