import { Actor, HttpAgent, type Identity } from "@dfinity/agent";
import { useAuth } from "../auth/AuthProvider";
import { idlFactory, canisterId } from "../../../declarations/Sniper";
import type { _SERVICE } from "../../../declarations/Sniper/Sniper.did";
import { useState, useEffect, useCallback } from "react";

// Use environment variable or fallback to generated canister ID
const SNIPER_CANISTER_ID = import.meta.env.VITE_SNIPER_CANISTER_ID || canisterId || "2s576-nh777-77774-qabaa-cai";

export const useSniper = () => {
    const { identity, isAuthenticated } = useAuth(); // Assuming this hook provides identity
    const [actor, setActor] = useState<_SERVICE | null>(null);

    useEffect(() => {
        const initActor = async () => {
            if (!isAuthenticated || !identity) {
                setActor(null);
                return;
            }

            const agent = new HttpAgent({ identity });

            // Fetch root key for local dev
            if (process.env.NODE_ENV !== "production") {
                await agent.fetchRootKey().catch(console.error);
            }

            const newActor = Actor.createActor<_SERVICE>(idlFactory, {
                agent,
                canisterId: SNIPER_CANISTER_ID,
            });

            setActor(newActor);
        };

        initActor();
    }, [identity, isAuthenticated]);

    // Wrapper functions
    const addSnipe = useCallback(async (tokenId: string, targetMC: number, amountBTC: bigint) => {
        if (!actor) throw new Error("Sniper actor not initialized");
        return await actor.addSnipe(tokenId, targetMC, amountBTC);
    }, [actor]);

    const cancelSnipe = useCallback(async (id: bigint) => {
        if (!actor) throw new Error("Sniper actor not initialized");
        return await actor.cancelSnipe(id);
    }, [actor]);

    const getUserSnipes = useCallback(async () => {
        if (!actor) return [];
        return await actor.getUserSnipes();
    }, [actor]);

    const deposit = useCallback(async (amount: bigint) => {
        if (!actor) throw new Error("Sniper actor not initialized");
        return await actor.deposit(amount);
    }, [actor]);

    const getBalance = useCallback(async () => {
        if (!actor) return BigInt(0);
        return await actor.getBalance();
    }, [actor]);

    return {
        actor,
        addSnipe,
        cancelSnipe,
        getUserSnipes,
        deposit,
        getBalance,
        isAuthenticated
    };
};
