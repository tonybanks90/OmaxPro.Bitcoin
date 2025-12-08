import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { BoostStatus, type BoostRequest } from '@ckboost/client';

// =====================
// Type Definitions
// =====================

export interface BoostHistoryEntry {
    id: string;
    status: BoostStatus;
    amount: string;
    amountRaw: string;
    receivedAmount: string;
    maxFeePercentage: number;
    depositAddress: string;
    explorerUrl?: string;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    fee?: string;
}

export interface UseBoostHistoryReturn {
    history: BoostHistoryEntry[];
    addRequest: (request: BoostRequest) => void;
    updateRequest: (requestId: string, updates: Partial<BoostHistoryEntry>) => void;
    getRequest: (requestId: string) => BoostHistoryEntry | undefined;
    removeRequest: (requestId: string) => void;
    clearHistory: () => void;
    isLoading: boolean;
}

// =====================
// Storage
// =====================

const HISTORY_STORAGE_KEY_PREFIX = 'ckboost_user_history_';
const MAX_HISTORY_ENTRIES = 50; // Limit history to prevent storage overflow

function getHistoryStorageKey(principalId: string): string {
    return `${HISTORY_STORAGE_KEY_PREFIX}${principalId}`;
}

function loadHistory(principalId: string): BoostHistoryEntry[] {
    if (!principalId) return [];
    try {
        const data = localStorage.getItem(getHistoryStorageKey(principalId));
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHistory(principalId: string, history: BoostHistoryEntry[]): void {
    if (!principalId) return;
    try {
        // Keep only most recent entries
        const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);
        localStorage.setItem(getHistoryStorageKey(principalId), JSON.stringify(trimmedHistory));
    } catch (e) {
        console.warn('Failed to save boost history:', e);
    }
}

// =====================
// Hook Implementation
// =====================

export function useBoostHistory(): UseBoostHistoryReturn {
    const { principalId, isAuthenticated } = useAuth();
    const [history, setHistory] = useState<BoostHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load history on mount or when user changes
    useEffect(() => {
        if (isAuthenticated && principalId) {
            setIsLoading(true);
            const loadedHistory = loadHistory(principalId);
            setHistory(loadedHistory);
            setIsLoading(false);
        } else {
            setHistory([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, principalId]);

    // Save whenever history changes
    useEffect(() => {
        if (principalId && history.length > 0) {
            saveHistory(principalId, history);
        }
    }, [history, principalId]);

    const addRequest = useCallback((request: BoostRequest): void => {
        const entry: BoostHistoryEntry = {
            id: request.id,
            status: request.status,
            amount: request.amount,
            amountRaw: request.amountRaw,
            receivedAmount: request.receivedAmount,
            maxFeePercentage: request.maxFeePercentage,
            depositAddress: request.depositAddress || '',
            explorerUrl: request.explorerUrl,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };

        setHistory(prev => {
            // Check if already exists
            const exists = prev.some(h => h.id === request.id);
            if (exists) {
                return prev.map(h => h.id === request.id ? { ...h, ...entry } : h);
            }
            return [entry, ...prev];
        });
    }, []);

    const updateRequest = useCallback((requestId: string, updates: Partial<BoostHistoryEntry>): void => {
        setHistory(prev =>
            prev.map(h => h.id === requestId ? { ...h, ...updates, updatedAt: Date.now() } : h)
        );
    }, []);

    const getRequest = useCallback((requestId: string): BoostHistoryEntry | undefined => {
        return history.find(h => h.id === requestId);
    }, [history]);

    const removeRequest = useCallback((requestId: string): void => {
        setHistory(prev => prev.filter(h => h.id !== requestId));
    }, []);

    const clearHistory = useCallback((): void => {
        setHistory([]);
        if (principalId) {
            localStorage.removeItem(getHistoryStorageKey(principalId));
        }
    }, [principalId]);

    return {
        history,
        addRequest,
        updateRequest,
        getRequest,
        removeRequest,
        clearHistory,
        isLoading
    };
}

// =====================
// Utility Functions
// =====================

export function getStatusLabel(status: BoostStatus): string {
    switch (status) {
        case BoostStatus.PENDING:
            return 'Pending';
        case BoostStatus.ACTIVE:
            return 'in Progress';
        case BoostStatus.COMPLETED:
            return 'Completed';
        case BoostStatus.CANCELLED:
            return 'Cancelled';
        default:
            return 'Unknown';
    }
}

export function getStatusColor(status: BoostStatus): string {
    switch (status) {
        case BoostStatus.PENDING:
            return 'text-warning bg-warning/10';
        case BoostStatus.ACTIVE:
            return 'text-accent bg-accent/10';
        case BoostStatus.COMPLETED:
            return 'text-success bg-success/10';
        case BoostStatus.CANCELLED:
            return 'text-destructive bg-destructive/10';
        default:
            return 'text-muted-foreground bg-muted/10';
    }
}

export function calculateProgress(status: BoostStatus): number {
    switch (status) {
        case BoostStatus.PENDING:
            return 25;
        case BoostStatus.ACTIVE:
            return 60;
        case BoostStatus.COMPLETED:
            return 100;
        case BoostStatus.CANCELLED:
            return 0;
        default:
            return 0;
    }
}

export function getEstimatedTimeRemaining(status: BoostStatus): string {
    switch (status) {
        case BoostStatus.PENDING:
            return '~5-10 min (awaiting booster)';
        case BoostStatus.ACTIVE:
            return '~2-5 min (processing)';
        case BoostStatus.COMPLETED:
            return 'Complete';
        case BoostStatus.CANCELLED:
            return 'Cancelled';
        default:
            return 'Unknown';
    }
}
