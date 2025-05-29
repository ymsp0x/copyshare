// project/src/pages/public/DegenMonitorPage.tsx
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { Link } from 'react-router-dom';
import { ArrowLeft, Twitter, Send, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar as BarChart } from 'react-chartjs-2';
import { useTokenOnChainData } from '../../hooks/useTokenOnChainData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface TokenInfo harus cocok dengan data LENGKAP yang dikirim dari backend
interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  vSol: number;
  vTokens: number;
  marketCap: number;
  uri: string;
  initialBuy: number;
  score: number; // Ini adalah skor gabungan dari backend
  flags: string[]; // Ini adalah flags gabungan dari backend
  type: 'legit' | 'suspicious' | 'autobuy_scam' | 'bundle_scam' | 'bundle_autobuy_scam' | 'scam';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'; // Ini adalah riskLevel gabungan dari backend
  twitterUrl?: string;
  telegramUrl?: string;
  // Data on-chain tambahan yang langsung datang dari backend (diisi oleh fetchOnChainData)
  holdersCount?: number | null;
  onChainScoreAdjustments?: number; // Score adjustment dari on-chain data (diterima dari backend)
  onChainFlags?: string[]; // Flags dari on-chain data (diterima dari backend)
  recentOnChainTrades?: { signature: string; type: string; amount: number; }[];
}

interface TradeInfo {
  mint: string;
  trader: string;
  solAmount: number;
  tokenAmount: number;
  tradeType: 'buy' | 'sell';
  timestamp: number;
  tokenName?: string;
  tokenSymbol?: string;
}

// Interface untuk transaksi yang dianalisis dari polling backend
interface AnalyzedTransaction {
    signature: string;
    type: string; // e.g., "BUY", "SELL", "OTHER"
    isBundle: boolean;
    whaleDetected: boolean;
    logs: string[]; // Logs from the transaction
    timestamp: number; // Block time in milliseconds
    mint?: string; // Optional: mint if parsed from transaction
    trader?: string; // Optional: trader if parsed from transaction
    solAmount?: number; // Optional: solAmount if parsed from transaction
    tokenAmount?: number; // Optional: tokenAmount if parsed from transaction
}


// Fungsi-fungsi risk level tetap sama, digunakan untuk render UI
const getCombinedRiskLevel = (combinedScore: number): TokenInfo['riskLevel'] => {
  if (combinedScore > 30) return 'Low';
  if (combinedScore >= 10) return 'Medium';
  if (combinedScore <= -20) return 'Critical';
  return 'High';
};


export default function DegenMonitorPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [trades, setTrades] = useState<TradeInfo[]>([]);
  const [analyzedTransactions, setAnalyzedTransactions] = useState<AnalyzedTransaction[]>([]);

  // onChainDataResponse.data adalah BackendOnChainData, onChainDataResponse.mint adalah mint yang diminta
  const { data: onChainDataResponse, isLoading: isLoadingOnChain, error: onChainError, fetchOnChainData } = useTokenOnChainData(); //


  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    legit: 0,
    suspicious: 0,
    autobuy_scam: 0,
    bundle_scam: 0,
    bundle_autobuy_scam: 0,
    scam: 0,
  });

  const BACKEND_WS_URL = import.meta.env.VITE_PUMP_FUN_WS_URL;

  useEffect(() => {
    if (!BACKEND_WS_URL) {
      console.error("VITE_PUMP_FUN_WS_URL is not configured in your .env.local file.");
      return;
    }

    const ws = new WebSocket(BACKEND_WS_URL);

    ws.onopen = () => {
      console.log('✅ Connected to Backend WebSocket server');
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'newToken') { //
            const token = message.data as TokenInfo; //
            setTokens(prev => {
                if (!prev.some(t => t.mint === token.mint)) {
                    const tokenWithDefaults: TokenInfo = {
                        ...token,
                        holdersCount: token.holdersCount || null,
                        onChainScoreAdjustments: token.onChainScoreAdjustments || 0,
                        onChainFlags: token.onChainFlags || [],
                        recentOnChainTrades: token.recentOnChainTrades || []
                    };
                    return [tokenWithDefaults, ...prev.slice(0, 100)];
                }
                return prev;
            });
            setSummaryStats(prev => ({
                ...prev,
                total: prev.total + 1,
                [token.type]: (prev as any)[token.type] + 1,
            }));
        } else if (message.type === 'tradeBatch') { //
            const newTrades = message.data as TradeInfo[]; //
            setTrades(prev => [...newTrades, ...prev].slice(0, 50));
        } else if (message.type === 'analyzedTxBatch') { //
            const newAnalyzedTxs = message.data as AnalyzedTransaction[]; //
            setAnalyzedTransactions(prev => [...newAnalyzedTxs, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error('Frontend: Error parsing WS message from backend:', e);
      }
    };

    ws.onclose = () => console.log('Frontend: Disconnected from Backend WebSocket server.');
    ws.onerror = error => {
      console.error('Frontend: Backend WS error:', error);
      setError("WebSocket error for on-chain data. Is backend running?"); // Update error state in DegenMonitorPage if WS connection fails
    };


    return () => {
      ws.close();
    };
  }, [BACKEND_WS_URL]);

  const handleRowClick = (token: TokenInfo) => {
    if (selectedToken?.mint === token.mint) {
      setSelectedToken(null);
    } else {
      setSelectedToken(token); // Set selectedToken awal
      // Hanya fetch on-chain data jika belum ada atau untuk token yang berbeda
      if (!token.holdersCount || !token.recentOnChainTrades || onChainDataResponse?.mint !== token.mint) {
          fetchOnChainData(token.mint, token.creator); //
      }
      setTimeout(() => {
          document.getElementById('token-detail-pane')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  useEffect(() => {
    // This effect updates selectedToken with on-chain data once it's available
    if (selectedToken && onChainDataResponse && onChainDataResponse.mint === selectedToken.mint) { //
      setSelectedToken(prev => ({
        ...prev!, // Ensure prev is not null
        holdersCount: onChainDataResponse.data?.holdersCount,
        onChainScoreAdjustments: onChainDataResponse.data?.scoreAdjustments,
        onChainFlags: onChainDataResponse.data?.flags,
        recentOnChainTrades: onChainDataResponse.data?.pastTrades
      }));
    }
  }, [onChainDataResponse, selectedToken]); //


  const handleCloseDetailPane = () => {
    setSelectedToken(null);
  };

  // Pastikan variabel ini diturunkan berdasarkan selectedToken yang sudah diperbarui
  const detailPaneCombinedScore = selectedToken ? selectedToken.score + (selectedToken.onChainScoreAdjustments || 0) : null;
  const detailPaneFinalRiskLevel = selectedToken ? getCombinedRiskLevel(detailPaneCombinedScore!) : null;


  const chartData = {
    labels: ['Legit', 'Suspicious', 'Autobuy Scam', 'Bundle Scam', 'Bundle Autobuy Scam', 'Scam'],
    datasets: [
      {
        label: 'Token Type Distribution',
        data: [
          summaryStats.legit,
          summaryStats.suspicious,
          summaryStats.autobuy_scam,
          summaryStats.bundle_scam,
          summaryStats.bundle_autobuy_scam,
          summaryStats.scam,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'var(--text-neutral-900)',
        },
      },
      title: {
        display: true,
        text: 'Token Type Distribution',
        color: 'var(--text-neutral-900)',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'var(--text-neutral-700)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          // Dark mode grid color should be handled in index.css if not already
        },
      },
      y: {
        ticks: {
          color: 'var(--text-neutral-700)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          // Dark mode grid color should be handled in index.css if not already
        },
      },
    },
  };


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-dark dark:text-text-light flex flex-col">
      <Navbar showSearchAndCategories={false} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-6">🧠 Pump.fun Token Monitor</h1>

        {/* Chart Container */}
        <div className="mb-8 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700">
            <BarChart data={chartData} options={chartOptions} />
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-neutral-100 dark:border-neutral-700 mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Type / Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Flags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">MarketCap (SOL)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">vSOL (Curve)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Creator</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700">
                {tokens.length === 0 ? (
                  <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                            <Loader2 className="animate-spin inline-block mr-2 text-primary-500" /> Menunggu data token baru dari backend...
                        </td>
                  </tr>
                ) : (
                  tokens.map((t, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150 cursor-pointer",
                        t.riskLevel === 'Critical' && 'bg-red-50 dark:bg-red-950',
                        t.riskLevel === 'High' && 'bg-orange-50 dark:bg-orange-950',
                        t.riskLevel === 'Medium' && 'bg-yellow-50 dark:bg-yellow-950',
                        t.riskLevel === 'Low' && 'bg-green-50 dark:bg-green-950',
                        selectedToken?.mint === t.mint && 'bg-blue-50 dark:bg-blue-900'
                      )}
                      onClick={() => handleRowClick(t)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {t.name} ({t.symbol})
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">{t.mint}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          `px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`,
                          t.type === 'legit' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
                          t.type === 'suspicious' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
                          (t.type === 'autobuy_scam' || t.type === 'bundle_scam') && 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
                          (t.type === 'scam' || t.type === 'bundle_autobuy_scam') && 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        )}>
                          Type: {t.type.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Risk: <span className={cn(
                            t.riskLevel === 'Low' && 'text-green-600 dark:text-green-400 font-bold',
                            t.riskLevel === 'Medium' && 'text-yellow-600 dark:text-yellow-400 font-bold',
                            t.riskLevel === 'High' && 'text-orange-600 dark:text-orange-400 font-bold',
                            t.riskLevel === 'Critical' && 'text-red-600 dark:text-red-400 font-bold'
                          )}>{t.riskLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-bold">
                        {t.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {t.flags.length > 0 ? t.flags.join(', ').replace(/_/g, ' ') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {t.marketCap.toFixed(4)} SOL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {t.vSol.toFixed(4)} SOL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-500 dark:text-neutral-400">
                        {t.creator.slice(0, 6)}...{t.creator.slice(-4)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Token Details Pane */}
        {selectedToken && (
          <div id="token-detail-pane" className="mt-8 bg-white dark:bg-neutral-800 rounded-lg p-8 shadow-xl relative border border-neutral-100 dark:border-neutral-700">
            <button
              onClick={handleCloseDetailPane}
              className="absolute top-4 right-4 text-neutral-600 dark:text-neutral-300 hover:text-red-500"
              aria-label="Close token details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-50">Selected Token Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Token Image Section */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-700">
                {selectedToken.uri ? (
                  <img
                    src={selectedToken.uri}
                    alt={`${selectedToken.name} Token Image`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src="https://via.placeholder.com/150?text=No+Image";
                    }}
                    className="max-w-[150px] max-h-[150px] w-full h-auto object-contain rounded-lg mb-4"
                  />
                ) : (
                  <div className="max-w-[150px] max-h-[150px] w-full h-auto flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-lg mb-4 text-neutral-500 dark:text-neutral-400 text-center text-sm">
                    No Image Available
                  </div>
                )}
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 text-center mb-2">{selectedToken.name} ({selectedToken.symbol})</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                       <span className={cn(
                            `px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`,
                            selectedToken.type === 'legit' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
                            selectedToken.type === 'suspicious' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
                            (selectedToken.type === 'autobuy_scam' || selectedToken.type === 'bundle_scam') && 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
                            (selectedToken.type === 'scam' || selectedToken.type === 'bundle_autobuy_scam') && 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                       )}>
                         Type: {selectedToken.type.replace(/_/g, ' ')}
                       </span>
                       {detailPaneFinalRiskLevel && (
                        <span className={cn(
                              `px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`,
                              detailPaneFinalRiskLevel === 'Low' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
                              detailPaneFinalRiskLevel === 'Medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
                              detailPaneFinalRiskLevel === 'High' && 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
                              detailPaneFinalRiskLevel === 'Critical' && 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        )}>
                          Risk: {detailPaneFinalRiskLevel}
                        </span>
                       )}
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="md:col-span-2 space-y-3 text-neutral-700 dark:text-neutral-200 text-base">
                    <p><strong>Mint Address:</strong> <span className="font-mono break-all">{selectedToken.mint}</span></p>
                    <p><strong>Creator:</strong> <span className="font-mono break-all">{selectedToken.creator}</span></p>
                    <p><strong>Initial Score:</strong> {selectedToken.score}</p>
                    {/* Data on-chain dari backend */}
                    {isLoadingOnChain ? (
                        <p className="flex items-center text-primary-500"><Loader2 className="animate-spin mr-2"/> Fetching on-chain data...</p>
                    ) : onChainError ? (
                        <p className="text-red-500">Error fetching on-chain data: {onChainError}</p>
                    ) : (
                        <>
                            <p><strong>Holders (Top ~20):</strong> {selectedToken.holdersCount !== null ? selectedToken.holdersCount : 'N/A'}</p>
                            {selectedToken.onChainScoreAdjustments !== 0 ? (
                                <p><strong>Score Adjustment (On-chain):</strong> {selectedToken.onChainScoreAdjustments}</p>
                            ) : null}
                            <p><strong>Final Score:</strong> {detailPaneCombinedScore}</p>
                            {selectedToken.onChainFlags && selectedToken.onChainFlags.length > 0 && <p><strong>On-chain Flags:</strong> {selectedToken.onChainFlags.join(', ').replace(/_/g, ' ')}</p>}
                        </>
                    )}
                    <p><strong>Market Cap:</strong> {selectedToken.marketCap.toFixed(4)} SOL</p>
                    <p><strong>vSOL (Curve):</strong> {selectedToken.vSol.toFixed(4)} SOL</p>
                    <p><strong>vTokens (Curve):</strong> {selectedToken.vTokens}</p>
                    <p><strong>Initial Buy:</strong> {selectedToken.initialBuy}</p>
                    <p><strong>Flags (Initial):</strong> {selectedToken.flags.length > 0 ? selectedToken.flags.join(', ').replace(/_/g, ' ') : '-'}</p>
                    <p><strong>Metadata URI:</strong> <a href={selectedToken.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{selectedToken.uri}</a></p>
                    
                    {/* Social Links dari data token */}
                    <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <h3 className="text-lg font-medium mb-3 text-neutral-700 dark:text-neutral-200">Social Links</h3>
                      <div className="flex gap-4 flex-wrap">
                        {selectedToken.twitterUrl ? (
                          <a href={selectedToken.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                            <Twitter className="h-5 w-5 mr-2" /> Twitter
                          </a>
                        ) : (
                          <span className="flex items-center bg-neutral-200 text-neutral-600 px-4 py-2 rounded-md cursor-not-allowed">
                            <Twitter className="h-5 w-5 mr-2" /> Twitter (N/A)
                          </span>
                        )}
                        {selectedToken.telegramUrl ? (
                          <a href={selectedToken.telegramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition-colors">
                            <Send className="h-5 w-5 mr-2" /> Telegram
                          </a>
                        ) : (
                          <span className="flex items-center bg-neutral-200 text-neutral-600 px-4 py-2 rounded-md cursor-not-allowed">
                            <Send className="h-5 w-5 mr-2" /> Telegram (N/A)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Recent On-chain Trades dari backend data */}
                    {isLoadingOnChain ? null : onChainError ? null : selectedToken.recentOnChainTrades && selectedToken.recentOnChainTrades.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-medium mb-3 text-neutral-700 dark:text-neutral-200">Recent On-chain Transactions (Creator's Activity)</h3>
                            <ul className="list-disc pl-5 text-sm">
                                {selectedToken.recentOnChainTrades.map((trade, idx) => (
                                    <li key={idx} className="mb-1">
                                        <span className={cn(
                                            trade.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                                            'font-semibold'
                                        )}>
                                            {trade.type.toUpperCase()}
                                        </span> {trade.amount.toFixed(4)} SOL (Sig: <a href={`https://solscan.io/tx/${trade.signature}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{trade.signature.slice(0, 8)}...</a>)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Live Buy/Sell Transactions Section (dari backend) */}
            <div className="mt-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-neutral-100 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 p-4 border-b border-neutral-200 dark:border-neutral-700">Live Buy/Sell Transactions (Backend Stream)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Token</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Amount (SOL)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Amount (Tokens)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Trader</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700">
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                          Menunggu transaksi buy/sell...
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                              trade.tradeType === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            )}>
                              {trade.tradeType === 'buy' ? <ArrowUpRight className="inline-block h-3 w-3 mr-1" /> : <ArrowDownLeft className="inline-block h-3 w-3 mr-1" />}
                              {trade.tradeType.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {trade.tokenName && trade.tokenSymbol ? `${trade.tokenName} (${trade.tokenSymbol})` : 'N/A'}
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono break-all">{trade.mint.slice(0, 6)}...{trade.mint.slice(-4)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                            {trade.solAmount.toFixed(4)} SOL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                            {trade.tokenAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-500 dark:text-neutral-400">
                            {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Analyzed Transactions Section (dari backend polling) */}
            <div className="mt-8 bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-neutral-100 dark:border-neutral-700">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 p-4 border-b border-neutral-200 dark:border-neutral-700">Analyzed Transactions (Backend Polling)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Signature</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Bundle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Whale</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700">
                    {analyzedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                          Menunggu transaksi analisis dari backend...
                        </td>
                      </tr>
                    ) : (
                      analyzedTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-900 dark:text-neutral-100">
                            <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {tx.signature.slice(0, 8)}...{tx.signature.slice(-4)}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                              tx.type === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                              tx.type === 'SELL' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                              'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                            )}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tx.isBundle ? (
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">Bundle</span>
                            ) : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tx.whaleDetected ? (
                              <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">Whale</span>
                            ) : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>

          <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-8 mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Temukan dan bagikan proyek menakjubkan.
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} CopyShare. Semua hak dilindungi.
                </div>
              </div>
            </div>
          </footer>
        </div>
      );
    }