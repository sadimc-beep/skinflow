'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchApi } from '@/lib/api';

interface LimitInfo {
    current: number;
    max: number;
    percent: number;
    at_limit: boolean;
    near_limit: boolean;
}

interface UsageData {
    plan_name: string | null;
    subscription_status: string | null;
    plan_features: Record<string, boolean>;
    limits: {
        patients?: LimitInfo;
        users?: LimitInfo;
        branches?: LimitInfo;
    };
}

interface UsageContextValue {
    usage: UsageData | null;
    isLoading: boolean;
    hasFeature: (key: string) => boolean;
    refresh: () => void;
}

const UsageContext = createContext<UsageContextValue>({
    usage: null,
    isLoading: false,
    hasFeature: () => true,
    refresh: () => {},
});

export function UsageProvider({ children }: { children: ReactNode }) {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = async () => {
        try {
            const data = await fetchApi<UsageData>('core/usage/');
            setUsage(data);
        } catch {
            // Fail silently — missing subscription shouldn't break the app
            setUsage(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const hasFeature = (key: string): boolean => {
        if (!usage) return true; // Default allow while loading
        if (usage.subscription_status === 'CANCELLED') return false;
        const features = usage.plan_features;
        if (!features || !(key in features)) return true; // Key not gated = allow
        return !!features[key];
    };

    return (
        <UsageContext.Provider value={{ usage, isLoading, hasFeature, refresh: load }}>
            {children}
        </UsageContext.Provider>
    );
}

export function useUsage() {
    return useContext(UsageContext);
}
