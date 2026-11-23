import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveUniversalAgentMessage } from '../src/data/starterBridge.js';

interface VercelReq extends IncomingMessage {
  body?: Record<string, unknown>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as { message?: string; mode?: string };
  const payload = await resolveUniversalAgentMessage(
    String(body.message ?? ''),
    String(body.mode ?? 'human')
  );
  res.status(200).json(payload);
}
