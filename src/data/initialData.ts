/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Session, TransactionLog } from '../types';

export const INITIAL_ACTIVE_SESSIONS: Session[] = [
  {
    id: '0x9a23...bc81',
    name: 'AI Chat Assistant',
    serviceAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d14766',
    spent: 0.45,
    limit: 1.00,
    currency: 'USDC',
    duration: '24h',
    status: 'active',
    iconType: 'ai',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    expiryTime: '24 Hours',
    autoMicroCharges: true,
    singleUse: false,
    logs: [
      { id: 'l1', type: 'Chat Completion Request', timestamp: '15:42:01 UTC', amount: 0.02 },
      { id: 'l2', type: 'Embeddings Computation', timestamp: '15:42:45 UTC', amount: 0.005 },
      { id: 'l3', type: 'Chat Completion Request', timestamp: '15:45:10 UTC', amount: 0.025 },
      { id: 'l4', type: 'Agent Vector DB Search', timestamp: '15:48:00 UTC', amount: 0.01 },
      { id: 'l5', type: 'Context Token Streaming', timestamp: '15:52:12 UTC', amount: 0.04 }
    ]
  },
  {
    id: '0x3f5b...aa92',
    name: 'Decentralized Storage',
    serviceAddress: '0x2a9D2f8e170068D2e113B01B5F6D147662c2A133',
    spent: 3.20,
    limit: 5.00,
    currency: 'USDC',
    duration: '7d',
    status: 'active',
    iconType: 'database',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    expiryTime: '7 Days',
    autoMicroCharges: true,
    singleUse: false,
    logs: [
      { id: 'l10', type: 'Upload Shard #1 (250MB)', timestamp: '10:14:01 UTC', amount: 0.45 },
      { id: 'l11', type: 'Upload Shard #2 (250MB)', timestamp: '10:15:20 UTC', amount: 0.45 },
      { id: 'l12', type: 'Bandwidth Maintenance Fee', timestamp: '12:00:00 UTC', amount: 0.10 },
      { id: 'l13', type: 'Pinning Service Agreement', timestamp: '14:22:18 UTC', amount: 1.20 },
      { id: 'l14', type: 'Decentralized Replication x3', timestamp: '16:05:55 UTC', amount: 1.00 }
    ]
  },
  {
    id: '0x8e12...ff34',
    name: 'RPC Node Access',
    serviceAddress: '0x5F6D1476600a22a133171f337a9D2f8e170068D2',
    spent: 8.85,
    limit: 10.00,
    currency: 'USDC',
    duration: '24h',
    status: 'active',
    iconType: 'rpc',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    expiryTime: '24 Hours',
    autoMicroCharges: true,
    singleUse: false,
    logs: [
      { id: 'l20', type: 'eth_call (Batch x500)', timestamp: '11:23:45 UTC', amount: 0.25 },
      { id: 'l21', type: 'eth_getLogs (Range 10k)', timestamp: '12:14:12 UTC', amount: 0.85 },
      { id: 'l22', type: 'eth_estimateGas RPC API', timestamp: '13:02:01 UTC', amount: 0.05 },
      { id: 'l23', type: 'eth_subscribe (WebSocket)', timestamp: '14:00:00 UTC', amount: 2.20 },
      { id: 'l24', type: 'eth_blockNumber Polling', timestamp: '14:50:11 UTC', amount: 0.50 }
    ]
  }
];

export const INITIAL_HISTORY_SESSIONS: Session[] = [
  {
    id: '0x9f8a...3b21',
    name: 'AWS Lambda Compute',
    serviceAddress: '0x00429C001945d9e2ffb0c6ff002d6f6900057f2b',
    spent: 1.00,
    limit: 5.00,
    currency: 'USDC',
    duration: '2h 14m',
    status: 'settled',
    iconType: 'cloud',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiryTime: 'Expired after 2h 14m',
    autoMicroCharges: true,
    singleUse: false,
    logs: [
      { id: 'h1', type: 'Invoke Handler Function (x10)', timestamp: '14:23:45 UTC', amount: 0.02 },
      { id: 'h2', type: 'Cold Start Optimization Warmup', timestamp: '14:24:12 UTC', amount: 0.02 },
      { id: 'h3', type: 'Invoke Handler Function (x10)', timestamp: '14:25:01 UTC', amount: 0.02 },
      { id: 'h4', type: 'Invoke Handler Function (x40)', timestamp: '14:32:10 UTC', amount: 0.08 },
      { id: 'h5', type: 'Database Proxy Connection Tunnels', timestamp: '14:45:00 UTC', amount: 0.36 },
      { id: 'h6', type: 'Compute Compute Provision Scale', timestamp: '15:10:22 UTC', amount: 0.50 }
    ]
  },
  {
    id: '0xe5d2...1c22',
    name: 'OpenAI API Access',
    serviceAddress: '0x002d6f001945d9e2ffb0c6ff00266100155b233a',
    spent: 4.52,
    limit: 5.00,
    currency: 'USDC',
    duration: '45m',
    status: 'settled',
    iconType: 'code',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    expiryTime: 'Settled by User',
    autoMicroCharges: true,
    singleUse: false,
    logs: [
      { id: 'h10', type: 'gpt-4o Text Generation Request', timestamp: '09:12:05 UTC', amount: 1.25 },
      { id: 'h11', type: 'gpt-4o-mini Classification Node', timestamp: '09:15:30 UTC', amount: 0.12 },
      { id: 'h12', type: 'gpt-4o Vision API Image Parse', timestamp: '09:18:22 UTC', amount: 1.50 },
      { id: 'h13', type: 'gpt-4o Text Generation Request', timestamp: '09:30:45 UTC', amount: 1.65 }
    ]
  },
  {
    id: '0xb231...7c8c',
    name: 'Decentralized RPC',
    serviceAddress: '0x005236001945d9e2ffb0c6ff00523600211317ef',
    spent: 0.00,
    limit: 2.00,
    currency: 'USDC',
    duration: '1m',
    status: 'revoked',
    iconType: 'rpc',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    expiryTime: 'Revoked by Owner',
    autoMicroCharges: true,
    singleUse: true,
    logs: []
  },
  {
    id: '0x718a...88ff',
    name: 'Premium Video Stream',
    serviceAddress: '0x00311f001945d9e2ffb0c6ff00211300382417ea',
    spent: 0.50,
    limit: 1.00,
    currency: 'USDC',
    duration: '30m',
    status: 'expired',
    iconType: 'video',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    expiryTime: 'Expired',
    autoMicroCharges: false,
    singleUse: false,
    logs: [
      { id: 'h20', type: 'FHD Stream Playback (10 min)', timestamp: '18:00:15 UTC', amount: 0.15 },
      { id: 'h21', type: 'FHD Stream Playback (10 min)', timestamp: '18:10:15 UTC', amount: 0.15 },
      { id: 'h22', type: 'FHD Stream Playback (10 min)', timestamp: '18:20:15 UTC', amount: 0.15 },
      { id: 'h23', type: 'Audio Stream Dolby Pass-through', timestamp: '18:30:00 UTC', amount: 0.05 }
    ]
  }
];

export const DEVELOPER_CODE_SNIPPET = `import { FiberClient } from '@fiberpass/sdk';

// Initialize the streaming client
const fiber = new FiberClient({
  network: 'mainnet',
  apiKey: process.env.FIBER_KEY
});

// Create a session limit
const session = await fiber.createSession({
  appId: 'ai-agent-v1',
  limit: '5.00 USDC',
  duration: '1h'
});

console.log(\`Session Active: \${session.id}\`);`;
