import type { IncomingMessage, ServerResponse } from 'node:http';
import { findStarterNode, renderHtmxExhibitFragment } from '../src/data/starterBridge.js';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
}

export default function handler(req: VercelReq, res: VercelRes) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const rawId = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;
  const node = findStarterNode(String(rawId ?? ''));

  if (!node) {
    res.statusCode = 404;
    res.end('<div class="exhibit-card">הצומת לא נמצא.</div>');
    return;
  }

  res.statusCode = 200;
  res.end(renderHtmxExhibitFragment(node));
}
