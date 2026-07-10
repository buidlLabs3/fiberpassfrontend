# FiberPass Frontend

FiberPass is a wallet dapp for prepaid, revocable Fiber Network payment sessions.

Instead of asking users to approve every tiny payment, FiberPass lets a user approve one spending pass for an app. The app can then charge small amounts within the user-defined limit until the pass is paused, revoked, expired, depleted, topped up, closed, or settled.

## What This App Does

- Connects a wallet with JoyID authentication.
- Creates prepaid payment session passes for apps.
- Shows active session limits, spend, and remaining balance.
- Lets users top up, pause, resume, and revoke sessions.
- Streams live spend updates from the backend API.
- Shows historical settled, revoked, and expired sessions.
- Shows automation invoices, batch progress, payment jobs, recipients, and webhook delivery state for developer apps.

## Product Goal

FiberPass makes Fiber Network micropayments usable for real apps:

> Approve once, pay continuously within limits.

The target use cases include AI agents, API services, RPC access, media streaming, decentralized storage, and any app that needs low-friction repeated micropayments.

## Current Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- JoyID CKB SDK
- FiberPass backend API

## Local Development

Prerequisites:

- Node.js
- Running FiberPass backend API

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Run the frontend:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

## Environment

```text
VITE_API_URL=http://localhost:4000
VITE_FIBER_NETWORK_NAME="Fiber Network Testnet"
VITE_JOYID_APP_URL=
VITE_JOYID_SERVER_URL=
```

## Status

This frontend is an early product implementation with JoyID auth, session APIs, app-scoped automation controls, and developer payment diagnostics wired to the backend. Real Fiber Network payment/session behavior depends on the configured backend Fiber RPC provider and testnet funding.
