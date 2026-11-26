import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';

interface VercelReq extends IncomingMessage {
  body?: Record<string, unknown>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (body.website) {
    res.status(200).json({ ok: true, status: 'ignored' });
    return;
  }

  const name = String(body.name ?? '').trim().slice(0, 100);
  const email = String(body.email ?? '').trim().toLowerCase();
  const source = String(body.source ?? 'website').trim().slice(0, 60);
  const topics = Array.isArray(body.topics)
    ? body.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : String(body.topics ?? 'כללי').trim().slice(0, 150);

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ ok: false, error: 'נא להזין כתובת אימייל תקינה.' });
    return;
  }

  const scriptUrl = (process.env.DUPAMAN_SCRIPT_URL || process.env.DUPAMAN_EXHIBITS_SCRIPT_URL || '').trim();
  const secret = (process.env.DUPAMAN_WEBHOOK_SECRET || '').trim();
  if (scriptUrl && secret) {
    try {
      const upstream = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', secret, name, email, topics, source }),
        redirect: 'follow',
      });
      if (upstream.ok) {
        const result = (await upstream.json()) as { ok?: boolean; status?: string; id?: string; error?: string };
        if (result.ok) {
          res.status(200).json({
            ok: true,
            persistedToSheet: true,
            status: result.status || 'created',
            id: result.id ?? `DUP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          });
          return;
        }
      }
    } catch {
      // upstream failed
    }
  }

  res.status(503).json({
    ok: false,
    error: 'לא ניתן לשמור את ההרשמה לגיליון כרגע. נסה שוב בעוד רגע.',
  });
}
