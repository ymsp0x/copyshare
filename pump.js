// pump.js
import fetch from 'node-fetch';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';

const HELIUS_API_KEY = '72c13572-59a7-4a76-8fef-84366e00e7cd'; // ganti dengan API Helius kamu
const PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'; // Program ID Pump.fun (cek dan konfirmasi)
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const app = express();
const server = http.createServer(app);
const wssFrontend = new WebSocketServer({ server });

let clients = [];

wssFrontend.on('connection', (ws) => {
  console.log('👤 Client connected');
  ws.send(JSON.stringify({ message: 'Welcome to Pump.fun TX monitor' }));
  clients.push(ws);
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

async function getRecentTransactions() {
  const body = {
    jsonrpc: '2.0',
    id: '1',
    method: 'getSignaturesForAddress',
    params: [
      PROGRAM_ID,
      { limit: 10 }
    ]
  };

  const res = await fetch(HELIUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return json.result;
}

async function getParsedTransaction(signature) {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransaction',
    params: [signature, { encoding: "jsonParsed" }]
  };

  const res = await fetch(HELIUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return json.result;
}

let lastSeen = new Set();

async function monitor() {
  try {
    const txs = await getRecentTransactions();
    for (const tx of txs) {
      const sig = tx.signature;
      if (lastSeen.has(sig)) continue;
      lastSeen.add(sig);

      const detail = await getParsedTransaction(sig);
      if (!detail) continue;

      const info = parseTransaction(detail);
      if (info) {
        console.log('📦 TX:', info);
        broadcast(info);
      }
    }

    // Batasi memory
    if (lastSeen.size > 1000) lastSeen.clear();
  } catch (err) {
    console.error('Polling error:', err.message);
  }
}

// Analisis dan filter logika
function parseTransaction(tx) {
  const instructions = tx.transaction.message.instructions;
  const accounts = tx.transaction.message.accountKeys;
  const logs = tx.meta?.logMessages || [];

  const isBuy = logs.some(log => log.includes("buy"));
  const isSell = logs.some(log => log.includes("sell"));
  const isBundle = logs.length > 10;
  const whaleDetected = (tx.meta?.postTokenBalances || []).some(b => Number(b.uiTokenAmount?.uiAmount) > 50000);

  return {
    signature: tx.transaction.signatures[0],
    type: isBuy ? "BUY" : isSell ? "SELL" : "OTHER",
    isBundle,
    whaleDetected,
    logs: logs.slice(0, 5)
  };
}

// Mulai polling
setInterval(monitor, 4000);

// Jalankan server WebSocket
const PORT = 4242;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on ws://localhost:${PORT}`);
});
