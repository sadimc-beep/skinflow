"use client";

/**
 * Clinical face schematic SVG — 300×400 viewBox.
 * Coordinate system matches the zone positions in FacialSchematic.tsx:
 *   forehead (150,80), glabella (150,125), crow's feet (95/205,145),
 *   cheeks (100/200,180), masseter (80/220,220), lips (150,225-240), chin (150,265-275).
 */
export function FaceSVG() {
    return (
        <svg
            viewBox="0 0 300 400"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Clinical face schematic"
        >
            {/* ── Background ─────────────────────────────────────────── */}
            <rect width="300" height="400" fill="#F7F3ED" />

            {/* ── Neck ───────────────────────────────────────────────── */}
            <path
                d="M 130 290 L 120 350 L 180 350 L 170 290 Z"
                fill="#EDE9E3"
                stroke="#C4BAB0"
                strokeWidth="1.5"
            />

            {/* ── Face outline ───────────────────────────────────────── */}
            <path
                d="M 150 30
                   C 196 28, 240 56, 252 102
                   C 260 138, 258 176, 246 212
                   C 236 238, 222 258, 200 272
                   C 184 281, 166 288, 150 290
                   C 134 288, 116 281, 100 272
                   C 78 258, 64 238, 54 212
                   C 42 176, 40 138, 48 102
                   C 60 56, 104 28, 150 30 Z"
                fill="#EDE9E3"
                stroke="#B0A89E"
                strokeWidth="2"
            />

            {/* ── Ear left ───────────────────────────────────────────── */}
            <ellipse cx="46" cy="182" rx="10" ry="20" fill="#EDE9E3" stroke="#B0A89E" strokeWidth="1.5" />
            <path d="M 50 170 Q 40 182 50 194" fill="none" stroke="#C4BAB0" strokeWidth="1" />

            {/* ── Ear right ──────────────────────────────────────────── */}
            <ellipse cx="254" cy="182" rx="10" ry="20" fill="#EDE9E3" stroke="#B0A89E" strokeWidth="1.5" />
            <path d="M 250 170 Q 260 182 250 194" fill="none" stroke="#C4BAB0" strokeWidth="1" />

            {/* ── Eyebrow left ───────────────────────────────────────── */}
            <path
                d="M 84 121 Q 105 113 128 118"
                fill="none"
                stroke="#8C7B72"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* ── Eyebrow right ──────────────────────────────────────── */}
            <path
                d="M 172 118 Q 195 113 216 121"
                fill="none"
                stroke="#8C7B72"
                strokeWidth="3"
                strokeLinecap="round"
            />

            {/* ── Eye left — white + iris + pupil ────────────────────── */}
            <ellipse cx="106" cy="142" rx="22" ry="13" fill="white" stroke="#B0A89E" strokeWidth="1.5" />
            <ellipse cx="106" cy="142" rx="9" ry="9" fill="#8C9BAD" />
            <ellipse cx="106" cy="142" rx="5" ry="5" fill="#3A3230" />
            <ellipse cx="108" cy="140" rx="2" ry="2" fill="white" />
            {/* Upper eyelid */}
            <path d="M 84 138 Q 106 128 128 138" fill="none" stroke="#8C7B72" strokeWidth="1.5" strokeLinecap="round" />

            {/* ── Eye right — white + iris + pupil ───────────────────── */}
            <ellipse cx="194" cy="142" rx="22" ry="13" fill="white" stroke="#B0A89E" strokeWidth="1.5" />
            <ellipse cx="194" cy="142" rx="9" ry="9" fill="#8C9BAD" />
            <ellipse cx="194" cy="142" rx="5" ry="5" fill="#3A3230" />
            <ellipse cx="196" cy="140" rx="2" ry="2" fill="white" />
            {/* Upper eyelid */}
            <path d="M 172 138 Q 194 128 216 138" fill="none" stroke="#8C7B72" strokeWidth="1.5" strokeLinecap="round" />

            {/* ── Nose ───────────────────────────────────────────────── */}
            {/* Bridge */}
            <path
                d="M 143 148 L 138 185"
                fill="none"
                stroke="#C4BAB0"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M 157 148 L 162 185"
                fill="none"
                stroke="#C4BAB0"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Nose base */}
            <path
                d="M 138 185 Q 130 195 134 197 Q 150 202 166 197 Q 170 195 162 185"
                fill="none"
                stroke="#B0A89E"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Nostril left */}
            <ellipse cx="136" cy="197" rx="6" ry="4" fill="none" stroke="#B0A89E" strokeWidth="1.5" />
            {/* Nostril right */}
            <ellipse cx="164" cy="197" rx="6" ry="4" fill="none" stroke="#B0A89E" strokeWidth="1.5" />

            {/* ── Philtrum ───────────────────────────────────────────── */}
            <path
                d="M 143 202 L 140 218 M 157 202 L 160 218"
                fill="none"
                stroke="#C4BAB0"
                strokeWidth="1"
                strokeLinecap="round"
            />

            {/* ── Mouth ──────────────────────────────────────────────── */}
            {/* Upper lip */}
            <path
                d="M 126 226 Q 138 220 150 224 Q 162 220 174 226"
                fill="#D4BFB8"
                stroke="#B0A89E"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Mouth line */}
            <path
                d="M 126 226 Q 150 232 174 226"
                fill="none"
                stroke="#9C8880"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Lower lip */}
            <path
                d="M 126 226 Q 150 248 174 226"
                fill="#D4BFB8"
                stroke="#B0A89E"
                strokeWidth="1.5"
                strokeLinecap="round"
            />

            {/* ── Chin crease ────────────────────────────────────────── */}
            <path
                d="M 140 262 Q 150 266 160 262"
                fill="none"
                stroke="#C4BAB0"
                strokeWidth="1"
                strokeLinecap="round"
            />

            {/* ── Hair line (top of forehead) ─────────────────────────── */}
            <path
                d="M 80 60 Q 115 42 150 38 Q 185 42 220 60"
                fill="none"
                stroke="#8C7B72"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 2"
            />

            {/* ── Nasolabial fold hints ───────────────────────────────── */}
            <path d="M 122 195 Q 118 215 124 235" fill="none" stroke="#C4BAB0" strokeWidth="1" strokeLinecap="round" />
            <path d="M 178 195 Q 182 215 176 235" fill="none" stroke="#C4BAB0" strokeWidth="1" strokeLinecap="round" />

            {/* ── Label ──────────────────────────────────────────────── */}
            <text
                x="150"
                y="385"
                textAnchor="middle"
                fontSize="9"
                fill="#A8A29E"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.5"
            >
                CLINICAL FACE SCHEMATIC
            </text>
        </svg>
    );
}
