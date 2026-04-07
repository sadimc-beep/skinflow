'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ImpersonationState {
    isImpersonating: boolean;
    orgName: string | null;
    sessionId: number | null;
    startImpersonation: (orgName: string, sessionId: number) => void;
    endImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationState>({
    isImpersonating: false,
    orgName: null,
    sessionId: null,
    startImpersonation: () => { },
    endImpersonation: () => { },
});

export function useImpersonation() {
    return useContext(ImpersonationContext);
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [orgName, setOrgName] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);

    useEffect(() => {
        // Check localStorage for active impersonation
        const stored = localStorage.getItem('skinflow_impersonation');
        if (stored) {
            const data = JSON.parse(stored);
            setIsImpersonating(true);
            setOrgName(data.orgName);
            setSessionId(data.sessionId);
        }
    }, []);

    const startImpersonation = (name: string, sid: number) => {
        setIsImpersonating(true);
        setOrgName(name);
        setSessionId(sid);
        localStorage.setItem('skinflow_impersonation', JSON.stringify({ orgName: name, sessionId: sid }));
    };

    const endImpersonation = () => {
        setIsImpersonating(false);
        setOrgName(null);
        setSessionId(null);
        localStorage.removeItem('skinflow_impersonation');
    };

    return (
        <ImpersonationContext.Provider value={{ isImpersonating, orgName, sessionId, startImpersonation, endImpersonation }}>
            {children}
        </ImpersonationContext.Provider>
    );
}

export function ImpersonationBanner() {
    const { isImpersonating, orgName, endImpersonation } = useImpersonation();

    if (!isImpersonating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#C4705A] text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-semibold shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>🔴 You are viewing as <strong>{orgName}</strong> — Support Session Active</span>
            <button
                onClick={endImpersonation}
                className="ml-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition"
            >
                <X className="w-3 h-3" /> Exit Impersonation
            </button>
        </div>
    );
}
