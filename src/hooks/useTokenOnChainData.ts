// project/src/hooks/useTokenOnChainData.ts
import { useState, useEffect, useCallback, useRef } from 'react';

// NOTE: This URL should point to your backend WebSocket server
const BACKEND_WS_URL = import.meta.env.VITE_PUMP_FUN_WS_URL || 'ws://localhost:8080';

// Interfaces for data expected from backend
interface BackendOnChainData {
    holdersCount: number | null;
    pastTrades: { signature: string; type: string; amount: number; }[];
    scoreAdjustments: number;
    flags: string[];
}

interface UseTokenOnChainDataResult {
    // Data objek sekarang secara eksplisit berisi 'data' (BackendOnChainData) dan 'mint' (string)
    data: { data: BackendOnChainData | null; mint: string | null; } | null;
    isLoading: boolean;
    error: string | null;
    fetchOnChainData: (mint: string, creator: string) => void;
}

export function useTokenOnChainData(): UseTokenOnChainDataResult {
    // State sekarang menyimpan objek yang berisi data on-chain dan mint terkait
    const [data, setData] = useState<{ data: BackendOnChainData | null; mint: string | null; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const currentRequestedMintRef = useRef<string | null>(null); 

    useEffect(() => {
        if (!BACKEND_WS_URL) {
            setError("Backend WS URL is not configured. Please set VITE_PUMP_FUN_WS_URL in your .env.local file.");
            return;
        }

        const ws = new WebSocket(BACKEND_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => console.log('Hook: Connected to backend WS for on-chain data requests');
        ws.onclose = () => console.log('Hook: Disconnected from backend WS for on-chain data requests');
        ws.onerror = (err) => {
            console.error('Hook: Backend WS error:', err);
            setError("WebSocket error for on-chain data. Is backend running?");
            setIsLoading(false); //
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Periksa apakah pesan ini adalah respons untuk permintaan on-chain kita
                if (message.type === 'onChainDataResponse') { //
                    if (message.mint === currentRequestedMintRef.current) { //
                        setData({ data: message.data, mint: message.mint }); //
                        setError(null);
                        setIsLoading(false);
                        currentRequestedMintRef.current = null;
                    }
                } else if (message.type === 'onChainDataError') { //
                    if (message.mint === currentRequestedMintRef.current) { //
                        setError(message.error || "Kesalahan tidak diketahui saat mengambil data on-chain dari backend.");
                        setIsLoading(false);
                        setData(null);
                        currentRequestedMintRef.current = null;
                    }
                }
            } catch (e) {
                console.error('Hook: Kesalahan parsing pesan WS dari backend:', e);
                setError("Kesalahan parsing respons data on-chain dari backend.");
                setIsLoading(false);
            }
        };

        return () => {
            ws.close();
        };
    }, [BACKEND_WS_URL]);

    const fetchOnChainData = useCallback((mint: string, creator: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError("WebSocket ke backend tidak terbuka. Tidak dapat meminta data on-chain.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setData(null);

        currentRequestedMintRef.current = mint;

        wsRef.current.send(JSON.stringify({
            type: 'requestOnChainData',
            mint: mint,
            creator: creator
        }));
    }, []);

    return { data, isLoading, error, fetchOnChainData };
}