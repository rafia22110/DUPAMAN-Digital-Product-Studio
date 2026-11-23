import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { STUDIO_EXHIBITS } from '../src/data/studioSamples.js';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === 'GET') {
    const qRaw = Array.isArray(req.query?.q) ? req.query?.q[0] : req.query?.q;
    const nodeRaw = Array.isArray(req.query?.node) ? req.query?.node[0] : req.query?.node;
    const q = String(qRaw ?? '').trim().toLowerCase();
    const nodeFilter = String(nodeRaw ?? '').trim();

    let exhibits = STUDIO_EXHIBITS;
    if (nodeFilter) {
      exhibits = exhibits.filter((e) => e.nodeCode === nodeFilter.padStart(2, '0'));
    }
    if (q) {
      exhibits = exhibits.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.nodeTitle.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.techTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      agent: 'DUPAMAN Digital Product Studio',
      studio: 'DUPAMAN Studio',
      founder: 'רפאל ארגנטי',
      googleCloudProject: 'gen-lang-client-0569299984',
      protocol: 'a2a/1.0',
      exhibits,
    });
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? 'External A2A Agent').trim().slice(0, 100);
    const nodeCode = body.nodeCode ? String(body.nodeCode).padStart(2, '0') : '';
    const matched = nodeCode ? STUDIO_EXHIBITS.find((e) => e.nodeCode === nodeCode) : undefined;
    const topics = body.topics ?? (matched ? [matched.nodeTitle] : ['ממשקי מחר']);

    if (!email || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ ok: false, error: 'נא להזין כתובת אימייל תקינה.' });
      return;
    }

    const scriptUrl = process.env.DUPAMAN_SCRIPT_URL;
    const secret = process.env.DUPAMAN_WEBHOOK_SECRET;
    if (scriptUrl) {
      try {
        const upstream = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, name, email, topics, source: 'a2a-gateway' }),
          redirect: 'follow',
        });
        if (upstream.ok) {
          const result = (await upstream.json()) as { ok?: boolean; status?: string; id?: string };
          if (result.ok) {
            res.status(200).json({
              protocol: 'a2a/1.0',
              skill: 'request_prototype',
              ok: true,
              status: result.status || 'created',
              id: result.id ?? `DUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            });
            return;
          }
        }
      } catch {
        // fall through to local confirmation
      }
    }

    res.status(200).json({
      protocol: 'a2a/1.0',
      skill: 'request_prototype',
      ok: true,
      status: 'created',
      id: `DUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}
