// test.js
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:4242');

ws.on('open', () => {
  console.log('✅ Connected to backend WebSocket');
});

ws.on('message', (data) => {
  console.log('🔵 Received message:', data.toString());
});
