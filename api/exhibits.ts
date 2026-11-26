import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { STUDIO_EXHIBITS, type StudioExhibitSample } from '../src/data/studioSamples.js';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

interface VercelRes extends ServerResponse {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

const OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
const DEFAULT_SHEET_ID = '1bg7IQTV2QLhiOfN4Dex755wURn4jt7yfMOPLRqDx2u8';

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

function mapTopicToNodeCode(topicRaw: string): StudioExhibitSample['nodeCode'] {
  const t = topicRaw.trim().toLowerCase();
  if (t.includes('01') || t.includes('ממשק') || t.includes('agentic') || t.includes('עיצוב')) return '01';
  if (t.includes('02') || t === 'ai' || t.includes('בינה') || t.includes('סוכנ') || t.includes('מודל שפה')) return '02';
  if (t.includes('03') || t.includes('חינוך') || t.includes('למיד') || t.includes('כיתה') || t.includes('הוראה') || t.includes('edtech') || t.includes('תלמיד')) return '03';
  if (t.includes('04') || t.includes('קשב') || t.includes('פסיכולוג') || t.includes('adhd') || t.includes('neuro') || t.includes('בריאות') || t.includes('חוסן') || t.includes('מוח')) return '04';
  if (t.includes('05') || t.includes('רוח') || t.includes('מקור') || t.includes('רמב') || t.includes('תודעה') || t.includes('היסטור') || t.includes('יהדות') || t.includes('מורשת') || t.includes('פילוסופ')) return '05';
  if (t.includes('06') || t.includes('מדע') || t.includes('physics') || t.includes('פיזיק') || t.includes('astronomy') || t.includes('אסטרונומ') || t.includes('מיזם') || t.includes('bio-oracle') || t.includes('רפוא')) return '06';
  return '02';
}

const TAG_SUGGESTIONS: Array<[string, string[]]> = [
  ['בינה מלאכותית', ['בינה מלאכותית', 'ai', 'סוכן', 'llm', 'מודל שפה', 'אוטומציה', 'rag']],
  ['למידה דיגיטלית', ['חינוך', 'למידה', 'הוראה', 'כיתה', 'מדריך', 'קורס', 'edtech', 'תלמיד']],
  ['מדעי המוח', ['מדעי המוח', 'נוירו', 'קוגניציה', 'דופמין', 'קשב', 'eeg', 'פסיכולוג', 'adhd']],
  ['עיצוב דיגיטלי', ['עיצוב', 'מוצר', 'ux', 'ui', 'מיתוג', 'ממשק', 'סטודיו']],
  ['היסטוריה ומורשת', ['היסטור', 'יהדות', 'מורשת', 'רמב', 'ליבוביץ', 'תנך', 'תושב']],
  ['מדע וטכנולוגיה', ['מדע', 'פיזיק', 'אסטרונומ', 'חלל', 'כימיה', 'גיאומטריה', 'חשמל']],
  ['יזמות וחדשנות', ['מיזם', 'יזמות', 'סטארט', 'חדשנות', 'משקיע']],
];

function suggestArticleTags(values: string[], sourceTags: string): string[] {
  const supplied = sourceTags
    .split(/[,;|\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const haystack = values.join(' ').toLowerCase();
  const inferred = TAG_SUGGESTIONS.filter(([, keywords]) =>
    keywords.some((keyword) => haystack.includes(keyword))
  ).map(([tag]) => tag);
  const combined = [...supplied, ...inferred];
  return Array.from(new Set(combined.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
}

function normalizeVisibility(val: unknown): 'TRUE' | 'FALSE' | 'HIDDEN' {
  const raw = String(val ?? '').trim();
  const upper = raw.toUpperCase();
  if (upper === 'TRUE' || raw === 'מאושר באתר' || raw === 'אושר באתר') return 'TRUE';
  if (upper === 'HIDDEN' || raw === 'מוסתר' || raw === 'הוסתר מהאתר') return 'HIDDEN';
  return 'FALSE';
}

function resolvePreviewUrl(rawPreview: string, idOrCode: string): string {
  const trimmed = rawPreview.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const match = `${trimmed} ${idOrCode}`.match(/DUP-\d{3}/i);
  if (match) return `https://dupaman.vercel.app/cards/${match[0].toUpperCase()}.html`;
  return '';
}

function defaultCardTemplate(nodeCode: StudioExhibitSample['nodeCode'], hint = ''): string {
  const h = hint.toLowerCase();
  if (h.includes('סט 2') || h.includes('daylight') || h.includes('crystal')) return 'סט 2 · Daylight Crystal';
  if (h.includes('סט 3') || h.includes('investor') || h.includes('vault') || h.includes('1m')) return 'סט 3 · $1M Investor Vault';
  if (h.includes('סט 1') || h.includes('dark glass')) return 'סט 1 · Studio Dark Glass';
  if (nodeCode === '03') return 'סט 2 · Daylight Crystal';
  if (nodeCode === '06') return 'סט 3 · $1M Investor Vault';
  return 'סט 1 · Studio Dark Glass';
}

function normalizeCmsRow(raw: Record<string, unknown>): {
  exhibit: StudioExhibitSample | null;
  id: string;
  visibility: 'TRUE' | 'FALSE' | 'HIDDEN';
} {
  const id = String(raw.id ?? raw['מזהה'] ?? '').trim();
  const visibility = normalizeVisibility(raw.visibility ?? raw['אישור באתר'] ?? raw['מוצג_באתר']);
  const title = String(raw.title ?? raw['כותרת'] ?? '').trim();

  if (!id || !title) {
    return { exhibit: null, id, visibility };
  }

  const rawNode = String(raw.nodeCode ?? raw['קוד צומת'] ?? '').trim();
  const padded = rawNode ? rawNode.padStart(2, '0') : '';
  const nodeCode: StudioExhibitSample['nodeCode'] = ['01', '02', '03', '04', '05', '06'].includes(padded)
    ? (padded as StudioExhibitSample['nodeCode'])
    : mapTopicToNodeCode(`${String(raw.sectionLabel ?? raw['מדור'] ?? '')} ${title}`);
  const meta = NODE_META[nodeCode];

  const url = String(raw.liveUrl ?? raw.url ?? raw['כתובת חיה'] ?? '').trim();
  const tagsRaw = Array.isArray(raw.techTags)
    ? raw.techTags.map((t) => String(t).trim()).filter(Boolean)
    : String(raw.techTags ?? raw['תגיות טכנולוגיה'] ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
  const techTags: [string, string, string] = [
    tagsRaw[0] || 'DUPAMAN',
    tagsRaw[1] || meta.nodeTitle,
    tagsRaw[2] || `Node ${nodeCode}`,
  ];

  const summary = String(raw.summary ?? raw['תקציר'] ?? title).trim();
  const actionLabel = String(
    raw.liveLabel ?? raw.actionLabel ?? raw['תווית כפתור'] ?? (url ? 'צפה בדמו ↗' : 'פתח בבוט')
  ).trim();
  const cardTemplate = defaultCardTemplate(
    nodeCode,
    String(raw.cardTemplate ?? raw['תבנית כרטיסייה'] ?? '')
  );
  const previewUrl = String(raw.previewUrl ?? raw['תצוגה מקדימה'] ?? '').trim();

  return {
    id,
    visibility,
    exhibit: {
      id,
      nodeCode,
      nodeTitle: meta.nodeTitle,
      domainId: meta.domainId,
      status: String(raw.status ?? raw['סטטוס מקור'] ?? 'מוצר חי').trim(),
      title,
      summary,
      techTags,
      hue: meta.hue,
      actionType: url ? 'external' : 'bot',
      actionLabel: url && !actionLabel.includes('↗') ? `${actionLabel} ↗` : actionLabel,
      url: url || undefined,
      botPrompt: `האר לי את ${nodeCode} — ${title}`,
      cardTemplate,
      previewUrl: previewUrl || undefined,
    },
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

  const envPin = (process.env.DUPAMAN_ADMIN_PIN || '').trim();
  if (!envPin) return true;
  const providedPin = String(req.headers['x-admin-pin'] ?? body.adminPin ?? '').trim();
  return Boolean(providedPin) && timingSafeMatch(providedPin, envPin);
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const sheetId = (process.env.DUPAMAN_SHEET_ID || DEFAULT_SHEET_ID).trim();
  const scriptUrl = (process.env.DUPAMAN_EXHIBITS_SCRIPT_URL || '').trim();
  const webhookSecret = (process.env.DUPAMAN_WEBHOOK_SECRET || '').trim();
  const writeConfigured = Boolean(
    scriptUrl &&
      scriptUrl.startsWith('https://script.google.com/') &&
      webhookSecret
  );

  if (req.method === 'GET') {
    const includeInbox =
      String(Array.isArray(req.query?.inbox) ? req.query?.inbox[0] : req.query?.inbox ?? '') === '1';

    if (includeInbox) {
      res.setHeader('Cache-Control', 'private, no-store');
      const authorized = await verifyOwnerRequest(req, {});
      if (!authorized) {
        res.status(403).json({
          ok: false,
          authError: true,
          writeConfigured,
          error: 'נדרש קוד מנהל תקף של רפאל ארגנטי כדי לטעון את תיבת הטיוטות מהגיליון.',
        });
        return;
      }
    }

    const approvedExhibits: StudioExhibitSample[] = [];
    const hiddenIds = new Set<string>();
    let sheetConnected = false;
    let activeSheetId = sheetId;

    // 1. Read approved/hidden asset statuses from the private sheet via Apps Script Web App
    if (scriptUrl && scriptUrl.startsWith('https://script.google.com/')) {
      try {
        const upstream = await fetch(scriptUrl, { redirect: 'follow' });
        if (upstream.ok) {
          const data = (await upstream.json()) as {
            ok?: boolean;
            sheetId?: string;
            records?: Record<string, unknown>[];
          };
          if (data.ok && Array.isArray(data.records)) {
            sheetConnected = true;
            if (data.sheetId) activeSheetId = data.sheetId;
            for (const r of data.records) {
              const norm = normalizeCmsRow(r);
              if (norm.visibility === 'HIDDEN' && norm.id) {
                hiddenIds.add(norm.id);
              } else if (norm.visibility === 'TRUE' && norm.exhibit) {
                approvedExhibits.push(norm.exhibit);
              }
            }
          }
        }
      } catch {
        // Apps Script unavailable
      }
    }

    // Merge: approved sheet assets + non-hidden built-in studio exhibits
    const mergedMap = new Map<string, StudioExhibitSample>();
    for (const ex of approvedExhibits) {
      if (!hiddenIds.has(ex.id)) {
        mergedMap.set(ex.id, ex);
      }
    }
    for (const ex of STUDIO_EXHIBITS) {
      if (!hiddenIds.has(ex.id) && !mergedMap.has(ex.id)) {
        mergedMap.set(ex.id, ex);
      }
    }

    // 2. Owner-only private inbox + tag dictionary directly from Apps Script (POST with secret)
    let sheetInbox: Array<{
      id: string;
      tabLabel: string;
      rowIndex: number;
      date: string;
      contentType: string;
      title: string;
      topic: string;
      summary: string;
      url: string;
      stage: string;
      siteApproval: string;
      suggestedNodeCode: StudioExhibitSample['nodeCode'];
      suggestedTags: string[];
      cardTemplate: string;
      previewUrl: string;
    }> = [];
    let tagDictionary: Array<{
      group: string;
      tag: string;
      definition: string;
      usage: string;
      status: string;
    }> = [];
    let sheetCounts: { assets: number; content: number; tags: number; channels: number } | undefined;

    if (includeInbox && scriptUrl && webhookSecret) {
      try {
        const inboxRes = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getInbox',
            ownerEmail: OWNER_EMAIL,
            secret: webhookSecret,
          }),
          redirect: 'follow',
        });
        if (inboxRes.ok) {
          const inboxData = (await inboxRes.json()) as {
            ok?: boolean;
            sheetId?: string;
            inbox?: Array<Record<string, unknown>>;
            tags?: Array<{ group: string; tag: string; definition: string; usage: string; status: string }>;
            counts?: { assets: number; content: number; tags: number; channels: number };
          };
          if (inboxData.ok) {
            sheetConnected = true;
            if (inboxData.sheetId) activeSheetId = inboxData.sheetId;
            if (inboxData.counts) sheetCounts = inboxData.counts;
            if (Array.isArray(inboxData.tags)) tagDictionary = inboxData.tags;
            if (Array.isArray(inboxData.inbox)) {
              sheetInbox = inboxData.inbox.map((item, idx) => {
                const title = String(item.title || '').trim();
                const topic = String(item.topic || '').trim();
                const subtopic = String(item.subtopic || '').trim();
                const summary = String(item.summary || title).trim();
                const rawNode = String(item.nodeCode || '').trim().padStart(2, '0');
                const suggestedNodeCode: StudioExhibitSample['nodeCode'] = ['01', '02', '03', '04', '05', '06'].includes(rawNode)
                  ? (rawNode as StudioExhibitSample['nodeCode'])
                  : mapTopicToNodeCode(`${topic} ${subtopic} ${title}`);
                return {
                  id: String(item.id || `sheet-item-${idx + 1}`),
                  tabLabel: String(item.tabLabel || 'מאגר תכנים'),
                  rowIndex: Number(item.rowIndex || idx + 2),
                  date: String(item.date || ''),
                  contentType: String(item.contentType || 'תוכן'),
                  title,
                  topic: subtopic || topic,
                  summary,
                  url: String(item.url || ''),
                  stage: String(item.stage || 'קליטה'),
                  siteApproval: String(item.siteApproval || 'לא אושר באתר'),
                  suggestedNodeCode,
                  suggestedTags: suggestArticleTags(
                    [title, topic, subtopic, summary],
                    String(item.tags || '')
                  ),
                  cardTemplate: defaultCardTemplate(
                    suggestedNodeCode,
                    String(item.cardTemplate || '')
                  ),
                  previewUrl: resolvePreviewUrl(
                    String(item.previewUrl || ''),
                    String(item.id || '')
                  ),
                };
              });
            }
          }
        }
      } catch {
        // inbox fetch failed
      }
    }

    res.status(200).json({
      ok: true,
      sheetId: activeSheetId,
      sheetConnected,
      writeConfigured,
      exhibits: Array.from(mergedMap.values()),
      hiddenIds: Array.from(hiddenIds),
      ...(includeInbox ? { sheetInbox, tagDictionary, sheetCounts } : {}),
    });
    return;
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const authorized = await verifyOwnerRequest(req, body);
    if (!authorized) {
      res.status(403).json({ ok: false, error: 'הגישה מותרת לרפאל ארגנטי בלבד (בדוק את קוד המנהל).' });
      return;
    }

    if (!writeConfigured) {
      res.status(503).json({
        ok: false,
        error: 'חיבור הגיליון לא הוגדר בשרת (Vercel). לא נשמר ולא פורסם תוכן.',
      });
      return;
    }

    try {
      const upstream = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: OWNER_EMAIL,
          secret: webhookSecret,
          action: req.method === 'DELETE' ? 'delete' : String(body.action || 'upsert'),
          id: body.id,
          visibility: body.visibility || 'TRUE',
          nodeCode: body.nodeCode,
          title: body.title,
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
        error: err instanceof Error ? err.message : 'שגיאת חיבור ל-Apps Script',
      });
      return;
    }
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}
