import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildA2UISurfaceMessages, findStarterNode } from '../src/data/starterBridge.js';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
  send: (body: string) => void;
}

export default function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawId = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
  const node = findStarterNode(String(rawId ?? '01'));

  if (!node) {
    res.status(404).json({ error: 'Surface node not found', nodeId: rawId });
    return;
  }

  const a2uiMessages = buildA2UISurfaceMessages(node);
  res.setHeader('Content-Type', 'application/a2ui+json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify(a2uiMessages));
}
