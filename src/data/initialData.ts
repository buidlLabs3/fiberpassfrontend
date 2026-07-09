/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEVELOPER_CODE_SNIPPET = `import { FiberClient } from '@fiberpass/sdk';

const fiber = new FiberClient({
  network: process.env.FIBER_NETWORK ?? 'testnet',
  apiKey: process.env.FIBERPASS_API_KEY
});

const pass = await fiber.createPass({
  appAddress: process.env.FIBER_APP_ADDRESS,
  limit: '5.00 USDC',
  expiresIn: '1h'
});

await fiber.charge({
  passId: pass.id,
  amount: '0.02 USDC',
  reason: 'AI request completed'
});`;
