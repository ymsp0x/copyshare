// backend/server.js
const WebSocket = require('ws');
const { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram } = require('@solana/web3.js');
const fetch = require('node-fetch');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors'); // Pastikan ini diimpor

dotenv.config();

// --- Konfigurasi Backend ---
const BACKEND_WS_PORT = process.env.BACKEND_WS_PORT || 8080;
const HELIUS_RPC_URL = process.env.VITE_SOLANA_RPC_URL;
const PUMP_FUN_WS_URL = process.env.VITE_PUMP_FUN_WS_URL;
const PUMP_FUN_PROGRAM_ID_USER_STR = process.env.VITE_PUMP_FUN_PROGRAM_ID;

// Ambil CORS_ORIGIN dari .env
const CORS_ORIGIN_ENV = process.env.CORS_ORIGIN; //
let corsOptions = {};

// Logika untuk mengurai CORS_ORIGIN
if (CORS_ORIGIN_ENV === '*') { //
    corsOptions = { origin: '*', methods: ['GET', 'POST'], credentials: true }; // Mengizinkan semua asal jika '*'
    console.warn("WARNING: CORS is set to allow all origins ('*'). This is not recommended for production."); //
} else if (CORS_ORIGIN_ENV) { //
    // Pisahkan string berdasarkan koma dan trim spasi (jika ada)
    const allowedOrigins = CORS_ORIGIN_ENV.split(',').map(origin => origin.trim()); //
    corsOptions = { //
        origin: function (origin, callback) { //
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true); //
            if (allowedOrigins.indexOf(origin) === -1) { //
                const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`; //
                return callback(new Error(msg), false); //
            }
            return callback(null, true); //
        },
        methods: ['GET', 'POST'], // Hanya izinkan metode yang relevan
        credentials: true // Jika Anda menggunakan cookie atau header otorisasi
    };
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`); //
} else {
    // Default jika CORS_ORIGIN tidak disetel sama sekali (bisa memblokir permintaan lintas asal)
    console.warn("CORS_ORIGIN environment variable is not set. CORS might restrict access."); //
    corsOptions = { origin: false }; // Secara default to 'false' (tidak mengizinkan) jika tidak disetel
}


let PUMP_FUN_PROGRAM_ID_USER;

// Validasi PUMP_FUN_PROGRAM_ID_USER_STR saat startup
try {
    if (!PUMP_FUN_PROGRAM_ID_USER_STR) {
        throw new Error("VITE_PUMP_FUN_PROGRAM_ID is not configured in backend/.env");
    }
    PUMP_FUN_PROGRAM_ID_USER = new PublicKey(PUMP_FUN_PROGRAM_ID_USER_STR);
    console.log(`Using PUMP_FUN_PROGRAM_ID: ${PUMP_FUN_PROGRAM_ID_USER.toBase58()}`);
} catch (e) {
    console.error(`ERROR: Invalid PUMP_FUN_PROGRAM_ID configured or missing: ${e.message}`);
    process.exit(1);
}

if (!HELIUS_RPC_URL || HELIUS_RPC_URL.includes('YOUR_API_KEY_HERE')) {
    console.error("ERROR: VITE_SOLANA_RPC_URL is not configured correctly in backend/.env");
    process.exit(1);
}
if (!PUMP_FUN_WS_URL) {
    console.error("ERROR: VITE_PUMP_FUN_WS_URL is not configured in backend/.env");
    process.exit(1);
}

const solanaConnection = new Connection(HELIUS_RPC_URL, 'confirmed');

// --- Setup Express dan WebSocket Server untuk Frontend ---
const app = express();
const server = http.createServer(app);

// Terapkan middleware CORS di sini
app.use(cors(corsOptions)); //

const wssFrontend = new WebSocket.Server({ server });

let frontendClients = [];

wssFrontend.on('connection', ws => {
    console.log('👤 Frontend client connected!');
    frontendClients.push(ws);
    ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to Backend Pump.fun Monitor Relay' }));

    activeTokens.forEach(token => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'newToken', data: token }));
        }
    });

    ws.on('message', async message => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'requestOnChainData') {
                const { mint: mintAddressStr, creator: creatorAddressStr } = parsedMessage;

                let mintPublicKey, creatorPublicKey;
                try {
                    mintPublicKey = new PublicKey(mintAddressStr);
                    creatorPublicKey = new PublicKey(creatorAddressStr);
                } catch (e) {
                    console.error(`Backend: Invalid PublicKey received for onChainData request: ${e.message}. Mint: ${mintAddressStr}, Creator: ${creatorAddressStr}`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'onChainDataError', mint: mintAddressStr, error: 'Invalid mint or creator address format.' }));
                    }
                    return;
                }

                console.log(`Backend: Menerima permintaan data on-chain untuk ${mintAddressStr}`);
                try {
                    const onChainData = await fetchAndProcessOnChainData(mintPublicKey, creatorPublicKey);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'onChainDataResponse', data: onChainData, mint: mintAddressStr }));
                    }
                } catch (error) {
                    console.error(`Backend: Gagal mengambil data on-chain untuk ${mintAddressStr}: ${error.message}`);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'onChainDataError', mint: mintAddressStr, error: `Failed to fetch on-chain data: ${error.message}` }));
                    }
                }
            }
        } catch (error) {
            console.error('Backend: Gagal memproses pesan dari frontend:', error.message);
        }
    });

    ws.on('close', () => {
        console.log('Frontend client disconnected!');
        frontendClients = frontendClients.filter(client => client !== ws);
    });
    ws.on('error', error => console.error('Frontend WS error:', error.message));
});

server.listen(BACKEND_WS_PORT, () => {
  console.log(`🚀 Backend WebSocket server running on port ${BACKEND_WS_PORT}`);
});

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});


// --- In-Memory Data Stores ---
const activeTokens = new Map();
const creatorDeployHistory = new Map();
let lastSeenPollingSignatures = new Set();

// --- Buffering untuk Pengiriman ke Frontend ---
let tradeBuffer = [];
let analyzedTxBuffer = [];
const BUFFER_SEND_INTERVAL = 500;

setInterval(() => {
    if (tradeBuffer.length > 0) {
        broadcastToFrontend({ type: 'tradeBatch', data: tradeBuffer });
        tradeBuffer = [];
    }
    if (analyzedTxBuffer.length > 0) {
        broadcastToFrontend({ type: 'analyzedTxBatch', data: analyzedTxBuffer });
        analyzedTxBuffer = [];
    }
}, BUFFER_SEND_INTERVAL);


// --- Degen Detection Logic ---

const getRiskLevel = (type) => {
    switch (type) {
        case 'legit': return 'Low';
        case 'suspicious': return 'Medium';
        case 'autobuy_scam':
        case 'bundle_scam': return 'High';
        case 'bundle_autobuy_scam':
        case 'scam': return 'Critical';
        default: return 'Medium';
    }
};

function broadcastToFrontend(data) {
    const msg = JSON.stringify(data);
    frontendClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

// --- Connection & Reconnect Logic to Pump.fun WebSocket API ---
let pumpFunWs = null;
let pumpFunReconnectTimeout = null;
const RECONNECT_DELAY_MS = 5000;

function initializePumpFunWs() {
    if (pumpFunWs) {
        pumpFunWs.removeAllListeners();
        pumpFunWs.close();
    }

    pumpFunWs = new WebSocket(PUMP_FUN_WS_URL);

    pumpFunWs.onopen = () => {
        console.log('✅ Connected to Pump.fun WebSocket API for new tokens');
        pumpFunWs.send(JSON.stringify({ method: 'subscribeNewToken' }));
        if (pumpFunReconnectTimeout) {
            clearTimeout(pumpFunReconnectTimeout);
            pumpFunReconnectTimeout = null;
        }
    };

    pumpFunWs.onmessage = async (message) => {
        try {
            const data = JSON.parse(message.data);

            if (data.txType === 'buy' || data.txType === 'sell') {
                const trade = {
                    mint: data.mint,
                    trader: data.buyer || 'N/A',
                    solAmount: data.amount,
                    tokenAmount: data.tokenAmount || 0,
                    tradeType: data.txType,
                    timestamp: data.timestamp,
                    tokenName: activeTokens.get(data.mint)?.name || 'Unknown',
                    tokenSymbol: activeTokens.get(data.mint)?.symbol || 'UNKNOWN',
                };
                tradeBuffer.push(trade);
                return;
            }

            if (!data.mint || !data.name) return;

            const now = Date.now();
            const creator = data.traderPublicKey;
            let initialScore = 0;
            const initialFlags = [];

            if (data.marketCapSol > 100) { initialScore += 15; initialFlags.push('high_market_cap'); }
            if (data.vSolInBondingCurve > 2) initialScore += 10;
            if (data.vTokensInBondingCurve > 1_000_000_000) initialScore += 10;

            if (!data.uri || !data.uri.startsWith('http')) {
                initialFlags.push('invalid_metadata_uri');
                initialScore -= 10;
            } else {
                let twitterUrl, telegramUrl;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    const response = await fetch(data.uri, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
                        const metadata = await response.json();
                        twitterUrl = metadata.twitter || metadata.extensions?.twitter || metadata.links?.twitter;
                        telegramUrl = metadata.telegram || metadata.extensions?.telegram || metadata.links?.telegram;
                    } else {
                        initialFlags.push('metadata_fetch_failed');
                        initialScore -= 5;
                    }
                } catch (fetchError) {
                    initialFlags.push('metadata_fetch_error');
                    initialScore -= 5;
                    console.warn(`Backend: Error fetching metadata from ${data.uri}: ${fetchError.message}`);
                }
                data.twitterUrl = twitterUrl;
                data.telegramUrl = telegramUrl;
            }

            if (data.initialBuy > 0 && data.solAmount <= 0.05) { initialFlags.push('sniper_autobuy'); initialScore -= 15; }

            const recentDeploys = (creatorDeployHistory.get(creator) || []).filter(ts => now - ts < 5 * 60 * 1000);
            if (recentDeploys.length >= 2) { initialFlags.push('creator_deploy_spam'); initialScore -= 20; }
            creatorDeployHistory.set(creator, [...recentDeploys, now]);
            if (creatorDeployHistory.size > 1000) {
                const oneHourAgo = now - 60 * 60 * 1000;
                for (let [key, value] of creatorDeployHistory.entries()) {
                    if (value[value.length - 1] < oneHourAgo) {
                        creatorDeployHistory.delete(key);
                    }
                }
            }

            let type = 'suspicious';
            if (initialScore > 30) type = 'legit';
            else if (initialScore <= -20 || initialFlags.includes('creator_deploy_spam') || initialFlags.includes('sniper_autobuy')) {
                 if (initialFlags.includes('creator_deploy_spam') && initialFlags.includes('sniper_autobuy')) type = 'bundle_autobuy_scam';
                 else if (initialFlags.includes('creator_deploy_spam')) type = 'bundle_scam';
                 else if (initialFlags.includes('sniper_autobuy')) type = 'autobuy_scam';
                 else type = 'scam';
            }
            const riskLevel = getRiskLevel(type);

            const token = {
                mint: data.mint, name: data.name, symbol: data.symbol, creator: data.traderPublicKey,
                vSol: data.vSolInBondingCurve || 0, vTokens: data.vTokensInBondingCurve || 0, marketCap: data.marketCapSol || 0,
                uri: data.uri, initialBuy: data.initialBuy || 0, score: initialScore, flags: initialFlags,
                type: type, riskLevel: riskLevel, twitterUrl: data.twitterUrl, telegramUrl: data.telegramUrl,
                holdersCount: null, onChainScoreAdjustments: 0, onChainFlags: [], recentOnChainTrades: []
            };

            activeTokens.set(token.mint, token);
            if (activeTokens.size > 100) {
                const oldestMint = activeTokens.keys().next().value;
                activeTokens.delete(oldestMint);
            }

            broadcastToFrontend({ type: 'newToken', data: token });

        } catch (error) { console.error('Backend: Error processing message from Pump.fun WS:', error.message); }
    };

    pumpFunWs.onclose = () => {
        console.log('Backend: Connection to Pump.fun WebSocket closed. Attempting to reconnect...');
        pumpFunReconnectTimeout = setTimeout(initializePumpFunWs, RECONNECT_DELAY_MS);
    };
    pumpFunWs.onerror = error => {
        console.error('Backend: Pump.fun WebSocket error:', error.message);
        pumpFunWs.close();
    };
}

initializePumpFunWs();


// --- Polling Function for General Transactions (from Pump.fun Program ID) ---
let pollingIntervalId = null;
let isPollingActive = false;
const POLLING_INTERVAL = 4000;
const POLLING_RETRY_DELAY = 10000;

async function getRecentTransactionsFromHelius() {
  const body = {
    jsonrpc: '2.0',
    id: '1',
    method: 'getSignaturesForAddress',
    params: [
      PUMP_FUN_PROGRAM_ID_USER.toBase58(),
      { limit: 10 }
    ]
  };

  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return json.result;
}

async function getParsedTransactionFromHelius(signature) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]
  };

  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return json.result;
}

async function monitorPollingTransactions() {
  if (isPollingActive) return;
  isPollingActive = true;

  try {
    const txs = await getRecentTransactionsFromHelius();
    if (!txs) {
        console.warn('Polling Helius: No transaction signatures received.');
        return;
    }

    for (const tx of txs) {
      const sig = tx.signature;
      if (lastSeenPollingSignatures.has(sig)) continue;
      lastSeenPollingSignatures.add(sig);

      const detail = await getParsedTransactionFromHelius(sig);
      if (!detail) continue;

      const analyzedInfo = parseAndFilterTransaction(detail);
      if (analyzedInfo) {
        analyzedTxBuffer.push(analyzedInfo);
      }
    }

    if (lastSeenPollingSignatures.size > 2000) {
        const recentSigs = Array.from(lastSeenPollingSignatures).slice(-1000);
        lastSeenPollingSignatures = new Set(recentSigs);
    }

  } catch (err) {
    console.error('Polling Helius error:', err.message);
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        console.log(`Helius polling stopped. Retrying in ${POLLING_RETRY_DELAY / 1000} seconds...`);
        setTimeout(() => {
            pollingIntervalId = setInterval(monitorPollingTransactions, POLLING_INTERVAL);
            console.log('Helius polling restarted.');
        }, POLLING_RETRY_DELAY);
    }
  } finally {
      isPollingActive = false;
  }
}

function parseAndFilterTransaction(txDetail) {
  const instructions = txDetail.transaction.message.instructions;
  const accounts = txDetail.transaction.message.accountKeys;
  const logs = txDetail.meta?.logMessages || [];

  const signature = txDetail.transaction.signatures[0];
  const blockTime = txDetail.blockTime ? txDetail.blockTime * 1000 : Date.now();

  let type = "OTHER";
  if (logs.some(log => log.includes("Instruction: Buy"))) type = "BUY";
  else if (logs.some(log => log.includes("Instruction: Sell"))) type = "SELL";

  let mint = null;
  let trader = null;
  let solAmount = 0;
  let tokenAmount = 0;

  const pumpFunInstruction = instructions.find(ix => ix.programId && ix.programId.equals(PUMP_FUN_PROGRAM_ID_USER));

  if (pumpFunInstruction) {
      if (accounts[4]) {
          mint = accounts[4].toBase58();
      }

      const tokenAmountMatch = logs.find(log => log.includes('tokens bought:') || log.includes('tokens sold:'));
      if (tokenAmountMatch) {
          try {
              const amountMatch = tokenAmountMatch.match(/(\d+\.?\d*)\s*(tokens\s*(bought|sold))/i);
              if (amountMatch && amountMatch[1]) {
                  tokenAmount = parseFloat(amountMatch[1]);
              }
          } catch (e) {
              console.warn(`Error parsing token amount from log for sig ${signature}: ${e.message}`);
          }
      }

      if (tokenAmount === 0 && mint) {
          const relevantTokenBalance = txDetail.meta?.postTokenBalances?.find(b => b.mint === mint);
          if (relevantTokenBalance) {
              const preBalance = txDetail.meta.preTokenBalances?.find(b => b.mint === mint && b.owner === relevantTokenBalance.owner);
              const postBalance = Number(relevantTokenBalance.uiTokenAmount.amount);
              const initialBalance = preBalance ? Number(preBalance.uiTokenAmount.amount) : 0;
              tokenAmount = Math.abs(postBalance - initialBalance) / (10 ** relevantTokenBalance.uiTokenAmount.decimals);
          }
      }

      let maxSolChange = 0;
      let candidateTrader = null;
      accounts.forEach((accKey, idx) => {
          if (!accKey.equals(SystemProgram.programId) && !accKey.equals(PUMP_FUN_PROGRAM_ID_USER)) {
              if (txDetail.meta.postBalances[idx] !== undefined && txDetail.meta.preBalances[idx] !== undefined) {
                  const change = (txDetail.meta.postBalances[idx] - txDetail.meta.preBalances[idx]) / LAMPORTS_PER_SOL;
                  if (Math.abs(change) > Math.abs(maxSolChange)) {
                      maxSolChange = change;
                      candidateTrader = accKey.toBase58();
                  }
              }
          }
      });
      if (maxSolChange !== 0) {
          solAmount = Math.abs(maxSolChange);
          trader = candidateTrader;
      }
  }

  const isBundle = instructions.length > 3 || logs.length > 20;
  let whaleDetected = false;
  if (solAmount > 50) {
      whaleDetected = true;
  }

  if (type === "OTHER" || !mint || !trader || solAmount === 0) {
      return null;
  }

  return {
    signature: signature,
    type: type,
    mint: mint,
    trader: trader,
    solAmount: solAmount,
    tokenAmount: tokenAmount,
    timestamp: blockTime,
    isBundle: isBundle,
    whaleDetected: whaleDetected,
    logs: logs.slice(0, 5)
  };
}

if (!pollingIntervalId) {
    pollingIntervalId = setInterval(monitorPollingTransactions, POLLING_INTERVAL);
}

async function fetchAndProcessOnChainData(mintPublicKey, creatorPublicKey) {
    let scoreAdjustments = 0;
    const flags = [];
    let holdersCount = null;
    let recentOnChainTrades = [];

    try {
        flags.push('holder_data_unavailable_backend');

        try {
            const signatures = await solanaConnection.getSignaturesForAddress(creatorPublicKey, { limit: 10 });
            if (signatures.length > 0) {
                const parsedTransactions = await solanaConnection.getParsedTransactions(
                    signatures.map(sig => sig.signature),
                    { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }
                );
                parsedTransactions.forEach(tx => {
                    if (tx && tx.meta && tx.transaction.message.instructions) {
                        const pumpInstruction = tx.transaction.message.instructions.find(ix => ix.programId && ix.programId.equals(PUMP_FUN_PROGRAM_ID_USER));

                        if (pumpInstruction) {
                            const creatorAccountIndex = tx.transaction.message.accountKeys.findIndex(key => key.toBase58() === creatorPublicKey.toBase58());
                            let solChange = 0;
                            if (creatorAccountIndex !== -1 && tx.meta.postBalances[creatorAccountIndex] !== undefined && tx.meta.preBalances[creatorAccountIndex] !== undefined) {
                                solChange = tx.meta.postBalances[creatorAccountIndex] - tx.meta.preBalances[creatorAccountIndex];
                            }
                            if (solChange !== 0) {
                                const type = solChange > 0 ? 'sell' : 'buy';
                                recentOnChainTrades.push({ signature: tx.transaction.signatures[0], type: type, amount: Math.abs(solChange / LAMPORTS_PER_SOL) });
                            }
                        }
                    }
                });
            }
            console.log(`Backend On-Chain: Fetched ${recentOnChainTrades.length} past trades for ${mintPublicKey.toBase58()} (creator activity)`);
        } catch (err) {
            console.error(`Backend On-Chain: Failed to fetch past trades for ${mintPublicKey.toBase58()}: ${err.message}`);
            flags.push('trade_history_unavailable');
        }

        return { holdersCount, pastTrades: recentOnChainTrades, scoreAdjustments, flags };

    } catch (error) {
        console.error('Backend On-Chain: Fatal error fetching on-chain data:', error.message);
        return { holdersCount: null, pastTrades: [], scoreAdjustments: 0, flags: ['backend_onchain_error'] };
    }
}

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
    console.log(`Backend: Clearing ${activeTokens.size} tokens from memory.`);
    activeTokens.clear();
}, CLEANUP_INTERVAL_MS);