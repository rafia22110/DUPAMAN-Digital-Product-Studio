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
const DEFAULT_SHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const DEFAULT_ARTICLES_GID = '445464849';
const DEFAULT_REVIEW_GID = '814921096';
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

function normalizeSheetHeader(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeSheetHeader);
  const terms = aliases.map(normalizeSheetHeader);
  return normalized.findIndex((header) => terms.some((term) => header === term || header.includes(term)));
}

function cellAt(cols: string[], index: number, fallbackIndex: number): string {
  return (cols[index >= 0 ? index : fallbackIndex] || '').trim();
}

function mapTopicToNodeCode(topicRaw: string): StudioExhibitSample['nodeCode'] {
  const t = topicRaw.trim().toLowerCase();
  if (t.includes('01') || t.includes('ממשק') || t.includes('agentic')) return '01';
  if (t.includes('02') || t === 'ai' || t.includes('בינה') || t.includes('סוכנ') || t.includes('מודל שפה')) return '02';
  if (t.includes('03') || t.includes('חינוך') || t.includes('למיד') || t.includes('כיתה') || t.includes('הוראה') || t.includes('edtech')) return '03';
  if (t.includes('04') || t.includes('קשב') || t.includes('פסיכולוג') || t.includes('adhd') || t.includes('neuro') || t.includes('בריאות') || t.includes('חוסן')) return '04';
  if (t.includes('05') || t.includes('רוח') || t.includes('מקור') || t.includes('רמב') || t.includes('תודעה') || t.includes('היסטור') || t.includes('יהדות') || t.includes('מורשת') || t.includes('פילוסופ')) return '05';
  if (t.includes('06') || t.includes('מדע') || t.includes('physics') || t.includes('פיזיק') || t.includes('astronomy') || t.includes('אסטרונומ') || t.includes('מיזם') || t.includes('bio-oracle') || t.includes('רפוא')) return '06';
  return '02';
}

const TAG_SUGGESTIONS: Array<[string, string[]]> = [
  ['בינה מלאכותית', ['בינה מלאכותית', 'ai', 'סוכן', 'llm', 'מודל שפה', 'אוטומציה', 'rag']],
  ['למידה וחינוך', ['חינוך', 'למידה', 'הוראה', 'כיתה', 'מדריך', 'קורס', 'edtech', 'תלמיד']],
  ['פסיכולוגיה ובריאות', ['פסיכולוג', 'בריאות', 'רגשי', 'חוסן', 'adhd', 'אוטיזם', 'רפואה']],
  ['מדעי המוח וקשב', ['מדעי המוח', 'נוירו', 'קוגניציה', 'דופמין', 'קשב', 'eeg', 'מלטונין']],
  ['היסטוריה ומורשת', ['היסטור', 'יהדות', 'מורשת', 'רמב', 'ליבוביץ', 'תנך', 'תושב']],
  ['מדע וטכנולוגיה', ['מדע', 'פיזיק', 'אסטרונומ', 'חלל', 'כימיה', 'גיאומטריה', 'חשמל']],
  ['יזמות וחדשנות', ['מיזם', 'יזמות', 'סטארט', 'חדשנות', 'משקיע', 'מוצר']],
];

function suggestArticleTags(values: string[], sourceTags: string): string[] {
  const supplied = sourceTags.split(/[,;|\\n]+/).map((tag) => tag.trim()).filter(Boolean);
  const haystack = values.join(' ').toLowerCase();
  const inferred = TAG_SUGGESTIONS.filter(([, keywords]) =>
    keywords.some((keyword) => haystack.includes(keyword))
  ).map(([tag]) => tag);
  const combined = [...supplied, ...values.filter(Boolean), ...inferred, 'מאמר'];
  return Array.from(new Set(combined.map((tag) => tag.trim()).filter(Boolean))).slice(0, 12);
}
function normalizeCmsRow(raw: Record<string, unknown>): {
  exhibit: StudioExhibitSample | null;
  id: string;
  visibility: 'TRUE' | 'FALSE' | 'HIDDEN';
} {
  const id = String(raw.id ?? '').trim();
  const visRaw = String(raw['מוצג_באתר'] ?? raw.visibility ?? 'FALSE')
    .trim()
    .toUpperCase();
  const visibility: 'TRUE' | 'FALSE' | 'HIDDEN' =
    visRaw === 'TRUE' ? 'TRUE' : visRaw === 'HIDDEN' ? 'HIDDEN' : 'FALSE';

  const title = String(raw.title ?? '').trim();
  if (!id || !title) {
    return { exhibit: null, id, visibility };
  }

  const nodeCodeRaw = String(raw.nodeCode ?? '03').padStart(2, '0');
  const nodeCode = (
    ['01', '02', '03', '04', '05', '06'].includes(nodeCodeRaw) ? nodeCodeRaw : '03'
  ) as StudioExhibitSample['nodeCode'];
  const meta = NODE_META[nodeCode];

  const url = String(raw.liveUrl ?? raw.url ?? '').trim();
  const tagsRaw = Array.isArray(raw.techTags)
    ? raw.techTags.map((t) => String(t).trim()).filter(Boolean)
    : String(raw.techTags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
  const techTags: [string, string, string] = [
    tagsRaw[0] || 'DUPAMAN',
    tagsRaw[1] || meta.nodeTitle,
    tagsRaw[2] || `Node ${nodeCode}`,
  ];

  const summary = String(raw.summary ?? title).trim();
  const actionLabel = String(raw.liveLabel ?? raw.actionLabel ?? (url ? 'צפה בדמו ↗' : 'פתח בבוט')).trim();

  return {
    id,
    visibility,
    exhibit: {
      id,
      nodeCode,
      nodeTitle: meta.nodeTitle,
      domainId: meta.domainId,
      status: String(raw.status || 'מוצר חי').trim(),
      title,
      summary,
      techTags,
      hue: meta.hue,
      actionType: url ? 'external' : 'bot',
      actionLabel: url && !actionLabel.includes('↗') ? `${actionLabel} ↗` : actionLabel,
      url: url || undefined,
      botPrompt: `האר לי את ${nodeCode} — ${title}`,
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
  const providedPin = String(req.headers['x-admin-pin'] ?? body.adminPin ?? '').trim();
  return Boolean(envPin && providedPin) && timingSafeMatch(providedPin, envPin);
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const sheetId = (process.env.DUPAMAN_SHEET_ID || DEFAULT_SHEET_ID).trim();
  const scriptUrl = (process.env.DUPAMAN_EXHIBITS_SCRIPT_URL || '').trim();

  if (req.method === 'GET') {
    const includeInbox =
      String(Array.isArray(req.query?.inbox) ? req.query?.inbox[0] : req.query?.inbox ?? '') === '1';

    if (includeInbox) {
      res.setHeader('Cache-Control', 'private, no-store');
      if (!(await verifyOwnerRequest(req, {}))) {
        res.status(403).json({ ok: false, error: 'הגישה לתיבת הטיוטות מותרת לבעלים בלבד.' });
        return;
      }
    }

    const approvedExhibits: StudioExhibitSample[] = [];
    const draftCmsExhibits: StudioExhibitSample[] = [];
    const hiddenIds = new Set<string>();
    let sheetConnected = false;

    // 1. Read explicit Studio_CMS control records (ONLY rows marked TRUE are shown publicly!)
    let rawRecords: Record<string, unknown>[] = [];
    if (scriptUrl && scriptUrl.startsWith('https://script.google.com/')) {
      try {
        const upstream = await fetch(scriptUrl, { redirect: 'follow' });
        if (upstream.ok) {
          const data = (await upstream.json()) as { ok?: boolean; records?: Record<string, unknown>[] };
          if (data.ok && Array.isArray(data.records)) {
            rawRecords = data.records;
            sheetConnected = true;
          }
        }
      } catch {
        // fall through to CSV read
      }
    }

    if (rawRecords.length === 0) {
      try {
        const cmsCsvRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(DEFAULT_CMS_GID)}`,
          { redirect: 'follow' }
        );
        if (cmsCsvRes.ok) {
          const csvText = await cmsCsvRes.text();
          const parsed = parseCsvRows(csvText);
          if (parsed.length > 1) {
            const headers = parsed[0].map((h) => h.trim());
            rawRecords = parsed.slice(1).map((cols) => {
              const rec: Record<string, unknown> = {};
              headers.forEach((h, idx) => {
                rec[h] = (cols[idx] || '').trim();
              });
              return rec;
            });
          }
        }
      } catch {
        // ignore network issues
      }
    }

    for (const r of rawRecords) {
      const norm = normalizeCmsRow(r);
      if (norm.visibility === 'HIDDEN' && norm.id) {
        hiddenIds.add(norm.id);
      } else if (norm.visibility === 'TRUE' && norm.exhibit) {
        approvedExhibits.push(norm.exhibit);
      } else if (norm.visibility === 'FALSE' && norm.exhibit) {
        draftCmsExhibits.push(norm.exhibit);
      }
    }

    // Merge: approved CMS items override or join STUDIO_EXHIBITS; hiddenIds are excluded!
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

    // 2. Private Inbox ONLY when requested by Rafael's Control Panel (?inbox=1) — NEVER shown publicly!
    const sheetInbox: Array<{
      id: string;
      tabLabel: string;
      rowIndex: number;
      date: string;
      title: string;
      topic: string;
      summary: string;
      url: string;
      suggestedNodeCode: StudioExhibitSample['nodeCode'];
    }> = [];

    if (includeInbox) {
      // Include unapproved Studio_CMS rows
      draftCmsExhibits.forEach((d, idx) => {
        sheetInbox.push({
          id: d.id,
          tabLabel: 'Studio_CMS (טיוטה)',
          rowIndex: idx + 2,
          date: '',
          title: d.title,
          topic: d.nodeTitle,
          summary: d.summary,
          url: d.url || '',
          suggestedNodeCode: d.nodeCode,
        });
      });

      // Read articles tab (gid=445464849 — exact Sheet link provided by Rafael)
      try {
        const artRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(DEFAULT_ARTICLES_GID)}`,
          { redirect: 'follow' }
        );
        if (artRes.ok) {
          const parsed = parseCsvRows(await artRes.text());
          const rows = parsed;
          if (rows.length > 1) {
            const headers = rows[0].map((value) => value.trim());
            const titleCol = findColumn(headers, ['title', 'headline', 'blog title', 'article title', 'כותרת', 'כותרת הכתבה', 'כותרת המאמר', 'שם הכתבה', 'שם המאמר']);
            const headerRow = titleCol >= 0;
            const columns = {
              date: headerRow ? findColumn(headers, ['date', 'published at', 'published date', 'תאריך', 'תאריך פרסום']) : -1,
              title: headerRow ? titleCol : 1,
              topic: headerRow ? findColumn(headers, ['topic', 'category', 'subject', 'תחום', 'נושא', 'קטגוריה']) : 2,
              subtopic: headerRow ? findColumn(headers, ['subtopic', 'subcategory', 'sub topic', 'תת נושא', 'תת נושא', 'תת קטגוריה']) : 3,
              summary: headerRow ? findColumn(headers, ['summary', 'excerpt', 'description', 'abstract', 'תקציר', 'סיכום', 'תיאור', 'תמצית']) : 5,
              tags: headerRow ? findColumn(headers, ['tags', 'keywords', 'תגיות', 'תגים', 'מילות מפתח']) : -1,
              url: headerRow ? findColumn(headers, ['url', 'link', 'source url', 'קישור', 'לינק', 'כתובת']) : 10,
            };
            const firstDataRow = headerRow ? 1 : 0;
            rows.slice(firstDataRow).forEach((cols, idx) => {
              const title = cellAt(cols, columns.title, 1);
              if (!title) return;
              const topic = cellAt(cols, columns.topic, 2);
              const subtopic = cellAt(cols, columns.subtopic, 3);
              const summary = cellAt(cols, columns.summary, 5) || title;
              const tags = suggestArticleTags([title, topic, subtopic, summary], cellAt(cols, columns.tags, -1));
              const sheetRowNumber = idx + firstDataRow + 1;
              sheetInbox.push({
                id: `sheet-art-${sheetRowNumber}`,
                tabLabel: 'לשונית מאמרים',
                rowIndex: sheetRowNumber,
                date: cellAt(cols, columns.date, 0),
                title,
                topic: subtopic || topic,
                summary,
                url: cellAt(cols, columns.url, 10),
                suggestedNodeCode: mapTopicToNodeCode(`${topic} ${subtopic} ${title}`),
                suggestedTags: tags,
              });
            });
          }
        }
      } catch {
        // ignore
      }

      // Read ready-for-review tab (gid=814921096)
      try {
        const revRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(DEFAULT_REVIEW_GID)}`,
          { redirect: 'follow' }
        );
        if (revRes.ok) {
          const parsed = parseCsvRows(await revRes.text());
          parsed.forEach((cols, idx) => {
            const code = (cols[0] || '').trim();
            if (!code.startsWith('DUP-')) return;
            const title = (cols[2] || '').trim();
            if (!title) return;
            const primaryNode = (cols[4] || '').trim();
            const rawSummary = (cols[7] || '').replace(/^GEO:\s*/i, '').split('| Slug:')[0].trim();
            sheetInbox.push({
              id: code.toLowerCase(),
              tabLabel: `מוכן לבדיקה (${code})`,
              rowIndex: idx + 1,
              date: (cols[1] || '').trim(),
              title,
              topic: primaryNode || (cols[3] || '').trim(),
              summary: rawSummary || title,
              url: (cols[8] || '').trim(),
              suggestedNodeCode: mapTopicToNodeCode(`${primaryNode} ${title}`),
            });
          });
        }
      } catch {
        // ignore
      }
    }

    const writeConfigured = Boolean(
      scriptUrl &&
      scriptUrl.startsWith('https://script.google.com/') &&
      process.env.DUPAMAN_WEBHOOK_SECRET &&
      process.env.DUPAMAN_ADMIN_PIN
    );

    res.status(200).json({
      ok: true,
      sheetConnected,
      writeConfigured,
      exhibits: Array.from(mergedMap.values()),
      hiddenIds: Array.from(hiddenIds),
      ...(includeInbox ? { sheetInbox } : {}),
    });
    return;
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const authorized = await verifyOwnerRequest(req, body);
    if (!authorized) {
      res.status(403).json({ ok: false, error: 'הגישה מותרת לרפאל ארגנטי בלבד.' });
      return;
    }

    const targetScriptUrl = (process.env.DUPAMAN_EXHIBITS_SCRIPT_URL || '').trim();
    const webhookSecret = (process.env.DUPAMAN_WEBHOOK_SECRET || '').trim();
    if (!targetScriptUrl || !targetScriptUrl.startsWith('https://script.google.com/') || !webhookSecret) {
      res.status(503).json({ ok: false, error: 'חיבור הגיליון לא הוגדר בשרת. לא נשמר ולא פורסם תוכן.' });
      return;
    }

    if (targetScriptUrl && targetScriptUrl.startsWith('https://script.google.com/')) {
      try {
        const upstream = await fetch(targetScriptUrl, {
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
          error: result.error || 'שגיאה בכתיבה לגיליון',
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

    res.status(503).json({ ok: false, error: 'חיבור הגיליון אינו זמין. לא נשמר ולא פורסם תוכן.' });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}
