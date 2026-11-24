import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import {
  STUDIO_EXHIBITS,
  type ExhibitMediaType,
  type StudioExhibitSample,
} from '../src/data/studioSamples.js';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

const OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
const DEFAULT_SHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const DEFAULT_SHEET_GID = '445464849';
const DEFAULT_CMS_GID = '326580483';

const NODE_META: Record<
  StudioExhibitSample['nodeCode'],
  { domainId: string; nodeTitle: string; hue: 'gold' | 'cyan' }
> = {
  '01': { domainId: 'brain-top-left', nodeTitle: 'ממשקי מחר', hue: 'cyan' },
  '02': { domainId: 'brain-mid-left', nodeTitle: 'מוח מכונה', hue: 'cyan' },
  '03': { domainId: 'brain-bottom-left', nodeTitle: 'למידה חיה', hue: 'gold' },
  '04': { domainId: 'brain-top-right', nodeTitle: 'אדריכלות הקשב', hue: 'cyan' },
  '05': { domainId: 'brain-mid-right', nodeTitle: 'רוח ומקור', hue: 'cyan' },
  '06': { domainId: 'brain-bottom-right', nodeTitle: 'חדר המיזמים', hue: 'gold' },
};

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      // ignore CR
    } else if (ch === '\n') {
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

function mapTopicToNodeCode(topicRaw: string): StudioExhibitSample['nodeCode'] {
  const t = topicRaw.trim().toLowerCase();
  if (t === '01' || t.includes('ממשק') || t.includes('agentic')) return '01';
  if (t === '02' || t === 'ai' || t.includes('מוח מכונה') || t.includes('טכנולוג')) return '02';
  if (t === '03' || t.includes('חינוך') || t.includes('למיד') || t.includes('education')) return '03';
  if (t === '04' || t.includes('neuro') || t.includes('קשב') || t.includes('מוח')) return '04';
  if (t === '05' || t.includes('רוח') || t.includes('מקור') || t.includes('מורשת') || t.includes('heritage')) return '05';
  if (t === '06' || t.includes('health') || t.includes('מיזם') || t.includes('רפוא')) return '06';
  return '02';
}

function detectMediaType(url: string, rawType?: string): { mediaType: ExhibitMediaType; mediaBadge: string } {
  const rt = (rawType || '').trim().toLowerCase();
  const u = (url || '').toLowerCase();
  if (rt === 'video' || u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com')) {
    return { mediaType: 'video', mediaBadge: 'וידאו' };
  }
  if (rt === 'presentation' || u.includes('/presentation/') || u.includes('.ppt')) {
    return { mediaType: 'presentation', mediaBadge: 'מצגת' };
  }
  if (rt === 'pdf' || u.includes('.pdf') || u.includes('/document/') || u.includes('/spreadsheets/')) {
    return { mediaType: 'pdf', mediaBadge: 'PDF' };
  }
  return { mediaType: 'live-app', mediaBadge: 'קישור חי' };
}

function normalizeCmsRecord(raw: Record<string, unknown>): StudioExhibitSample | null {
  const title = String(raw.title ?? '').trim();
  if (!title) return null;

  const nodeCodeRaw = String(raw.nodeCode ?? '03').padStart(2, '0');
  const nodeCode = (
    ['01', '02', '03', '04', '05', '06'].includes(nodeCodeRaw) ? nodeCodeRaw : '03'
  ) as StudioExhibitSample['nodeCode'];
  const meta = NODE_META[nodeCode];

  const liveUrl = String(raw.liveUrl ?? raw.url ?? '').trim();
  const detected = detectMediaType(liveUrl, String(raw.mediaType ?? ''));
  const readinessPct = Math.max(10, Math.min(100, Number(raw.readinessPct ?? 90) || 90));
  const tagsRaw = Array.isArray(raw.techTags)
    ? raw.techTags.map((t) => String(t).trim()).filter(Boolean)
    : String(raw.techTags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
  const techTags: [string, string, string] = [
    tagsRaw[0] || 'DUPAMAN CMS',
    tagsRaw[1] || detected.mediaBadge,
    tagsRaw[2] || `Node ${nodeCode}`,
  ];

  const highlightsRaw = Array.isArray(raw.highlights)
    ? raw.highlights.map((h) => String(h).trim()).filter(Boolean)
    : String(raw.highlights ?? '')
        .split('||')
        .map((h) => h.trim())
        .filter(Boolean);

  const summary = String(raw.summary ?? raw.subtitle ?? title).trim();
  const liveLabel = String(raw.liveLabel ?? 'פתיחה').trim() || 'פתיחה';

  return {
    id: String(raw.id || `cms-${crypto.randomUUID().slice(0, 8)}`),
    code: String(raw.code || '').trim() || undefined,
    nodeCode,
    nodeTitle: meta.nodeTitle,
    domainId: meta.domainId,
    sectionLabel: String(raw.sectionLabel || `מדור ${meta.nodeTitle}`).trim(),
    mediaType: detected.mediaType,
    mediaBadge: String(raw.mediaBadge || detected.mediaBadge).trim(),
    status: String(raw.status || `${readinessPct}% מוכן להפעלה`).trim(),
    readiness: `${readinessPct}% מוכן להפעלה`,
    readinessPct,
    title,
    subtitle: summary,
    summary,
    highlights: highlightsRaw.length > 0 ? highlightsRaw : undefined,
    techTags,
    hue: meta.hue,
    actionType: liveUrl ? 'external' : 'bot',
    actionLabel: liveUrl ? `${liveLabel} ↗` : 'פתח בבוט',
    url: liveUrl || undefined,
    liveUrl: liveUrl || undefined,
    liveLabel,
    githubUrl: String(raw.githubUrl ?? '').trim() || undefined,
    isEducational:
      raw.isEducational === true ||
      String(raw.isEducational).toUpperCase() === 'TRUE' ||
      nodeCode === '03',
    audienceNote: String(raw.audienceNote ?? '').trim() || undefined,
    botPrompt: `האר לי את ${title}`,
  };
}

function timingSafeMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

async function verifyOwnerRequest(req: VercelReq, body: Record<string, unknown>): Promise<boolean> {
  const email = String(req.headers['x-admin-email'] ?? body.ownerEmail ?? '')
    .trim()
    .toLowerCase();
  if (email !== OWNER_EMAIL) return false;

  // 1. Verify Google ID Token if provided
  const authHeader = String(req.headers.authorization ?? '');
  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7).trim();
    try {
      const check = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      if (check.ok) {
        const info = (await check.json()) as { email?: string; email_verified?: string };
        if (
          String(info.email ?? '').toLowerCase() === OWNER_EMAIL &&
          String(info.email_verified) === 'true'
        ) {
          return true;
        }
      }
    } catch {
      // fall through
    }
  }

  // 2. Verify server-side Owner PIN if configured in environment
  const envPin = (process.env.DUPAMAN_ADMIN_PIN || '').trim();
  const providedPin = String(req.headers['x-admin-pin'] ?? body.adminPin ?? '').trim();
  if (envPin) {
    return Boolean(providedPin) && timingSafeMatch(providedPin, envPin);
  }

  return false;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const sheetId = (process.env.DUPAMAN_SHEET_ID || DEFAULT_SHEET_ID).trim();
  const sheetGid = (process.env.DUPAMAN_SHEET_GID || DEFAULT_SHEET_GID).trim();
  const scriptUrl = (
    process.env.DUPAMAN_EXHIBITS_SCRIPT_URL ||
    String(req.headers['x-sheet-script-url'] ?? '')
  ).trim();

  if (req.method === 'GET') {
    const includeSheetInbox =
      String(Array.isArray(req.query?.inbox) ? req.query?.inbox[0] : req.query?.inbox ?? '') === '1';

    let remoteExhibits: StudioExhibitSample[] = [];
    let sheetConnected = false;

    // 1. Read published CMS exhibits from Apps Script Web App if connected,
    //    or directly from the live Studio_CMS tab (gid=326580483) in Google Sheets!
    if (scriptUrl && scriptUrl.startsWith('https://script.google.com/')) {
      try {
        const upstream = await fetch(scriptUrl, { redirect: 'follow' });
        if (upstream.ok) {
          const data = (await upstream.json()) as { ok?: boolean; exhibits?: Record<string, unknown>[] };
          if (data.ok && Array.isArray(data.exhibits)) {
            remoteExhibits = data.exhibits
              .map(normalizeCmsRecord)
              .filter((e): e is StudioExhibitSample => Boolean(e));
            sheetConnected = true;
          }
        }
      } catch {
        // fall through to direct Studio_CMS CSV feed
      }
    }

    if (remoteExhibits.length === 0) {
      const cmsGid = (process.env.DUPAMAN_CMS_GID || DEFAULT_CMS_GID).trim();
      try {
        const cmsCsvRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(cmsGid)}`,
          { redirect: 'follow' }
        );
        if (cmsCsvRes.ok) {
          const cmsCsvText = await cmsCsvRes.text();
          const parsedCms = parseCsvRows(cmsCsvText);
          if (parsedCms.length > 1) {
            const headers = parsedCms[0].map((h) => h.trim());
            const records = parsedCms.slice(1).map((cols) => {
              const rec: Record<string, unknown> = {};
              headers.forEach((h, idx) => {
                rec[h] = (cols[idx] || '').trim();
              });
              return rec;
            });
            remoteExhibits = records
              .map(normalizeCmsRecord)
              .filter((e): e is StudioExhibitSample => Boolean(e));
            sheetConnected = true;
          }
        }
      } catch {
        // graceful fallback to built-in exhibits
      }
    }

    // 2. Optionally fetch raw rows from Rafael's connected Google Sheet (gid=445464849) for 1-click import
    let sheetInbox: Array<{
      rowIndex: number;
      date: string;
      title: string;
      topic: string;
      subtopic: string;
      source: string;
      summary: string;
      highlights: string[];
      lifeQuote: string;
      question: string;
      url: string;
      suggestedNodeCode: StudioExhibitSample['nodeCode'];
      mediaType: ExhibitMediaType;
      mediaBadge: string;
    }> = [];

    if (includeSheetInbox) {
      try {
        const csvRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(sheetGid)}`,
          { redirect: 'follow' }
        );
        if (csvRes.ok) {
          const csvText = await csvRes.text();
          const parsed = parseCsvRows(csvText);
          if (parsed.length > 1) {
            sheetInbox = parsed
              .slice(1, 61)
              .map((cols, idx) => {
                const date = (cols[0] || '').trim();
                const title = (cols[1] || '').trim();
                const topic = (cols[2] || '').trim();
                const subtopic = (cols[3] || '').trim();
                const source = (cols[4] || '').trim();
                const line1 = (cols[5] || '').trim();
                const line2 = (cols[6] || '').trim();
                const line3 = (cols[7] || '').trim();
                const lifeQuote = (cols[8] || '').trim();
                const question = (cols[9] || '').trim();
                const url = (cols[10] || '').trim();
                const detected = detectMediaType(url);
                return {
                  rowIndex: idx + 2,
                  date,
                  title,
                  topic,
                  subtopic,
                  source,
                  summary: line1 || subtopic || title,
                  highlights: [line1, line2, line3, lifeQuote, question].filter(Boolean),
                  lifeQuote,
                  question,
                  url,
                  suggestedNodeCode: mapTopicToNodeCode(topic || subtopic),
                  mediaType: detected.mediaType,
                  mediaBadge: detected.mediaBadge,
                };
              })
              .filter((r) => Boolean(r.title));
          }
        }
      } catch {
        // leave empty on network error
      }
    }

    // Merge built-in exhibits with live Sheet CMS exhibits (Sheet items override same id or prepend cleanly)
    const mergedMap = new Map<string, StudioExhibitSample>();
    for (const ex of remoteExhibits) {
      mergedMap.set(ex.id, ex);
    }
    for (const ex of STUDIO_EXHIBITS) {
      if (!mergedMap.has(ex.id)) {
        mergedMap.set(ex.id, ex);
      }
    }

    res.status(200).json({
      ok: true,
      sheetId,
      sheetGid,
      sheetConnected,
      hasServerScript: Boolean(process.env.DUPAMAN_EXHIBITS_SCRIPT_URL),
      hasServerPin: Boolean(process.env.DUPAMAN_ADMIN_PIN),
      exhibits: Array.from(mergedMap.values()),
      remoteIds: remoteExhibits.map((e) => e.id),
      ...(includeSheetInbox ? { sheetInbox } : {}),
    });
    return;
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const authorized = await verifyOwnerRequest(req, body);

    // If Apps Script URL is configured and user is verified, persist directly to Google Sheet!
    const targetScriptUrl = (
      process.env.DUPAMAN_EXHIBITS_SCRIPT_URL ||
      String(body.scriptUrl ?? '')
    ).trim();

    if (!authorized && process.env.DUPAMAN_ADMIN_PIN) {
      res.status(403).json({ ok: false, error: 'גישה מותרת לבעל הסטודיו בלבד.' });
      return;
    }

    if (targetScriptUrl && targetScriptUrl.startsWith('https://script.google.com/')) {
      try {
        const upstream = await fetch(targetScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerEmail: OWNER_EMAIL,
            secret: process.env.DUPAMAN_WEBHOOK_SECRET || '',
            action: req.method === 'DELETE' ? 'delete' : 'upsert',
            id: body.id,
            exhibit: body.exhibit,
          }),
          redirect: 'follow',
        });
        const result = (await upstream.json()) as { ok?: boolean; id?: string; error?: string };
        if (result.ok) {
          res.status(200).json({ ok: true, persistedToSheet: true, id: result.id ?? body.id });
          return;
        }
        res.status(502).json({
          ok: false,
          error: result.error || 'שגיאה בכתיבה לגיליון Google Sheets',
        });
        return;
      } catch (err) {
        res.status(502).json({
          ok: false,
          error: err instanceof Error ? err.message : 'שגיאת חיבור ל-Google Apps Script',
        });
        return;
      }
    }

    res.status(200).json({
      ok: true,
      persistedToSheet: false,
      note: 'נשמר מקומית בסטודיו — לחיבור כתיבה ישירה לגיליון הדבק את כתובת ה-Apps Script בלשונית חיבור לגיליון.',
    });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}
