import { DUPAMAN_DOMAINS, isWithinLast30Days } from './dupamanCatalog';

export type BrainCardCode = '00' | '01' | '02' | '03' | '04' | '05' | '06';

export interface RepositoryContentItem {
  id: string;
  title: string;
  summary: string;
  details?: string;
  type?: string;
  section?: 'news' | 'guides';
  subTab?: 'learning' | 'heritage';
  sourceName?: string;
  url?: string;
  publishedAt?: string; // ISO YYYY-MM-DD
  cards: BrainCardCode[];
  tags: string[];
  /** Only approved items (approved !== false and draft !== true) are published to the site */
  approved?: boolean;
  /** When true (default), tags automatically route this item to every matching card */
  autoMatchByTags?: boolean;
}

/**
 * Infrastructure Tag-to-Card Routing Table.
 * Any approved file dropped into `content/inbox/` (or any subfolder of `content/`)
 * is automatically routed to ALL cards matching its `tags` AND/OR explicit `cards`.
 */
export const CARD_TAG_RULES: Record<BrainCardCode, string[]> = {
  '00': ['ניהול', 'מנויים', 'crm', 'highlevel', 'מיתוג אישי', 'ליבה', '00'],
  '01': ['חדשות', 'ניוז', 'עדכון', 'מדריכים', 'חדש', 'news', 'guides', '01'],
  '02': [
    'חינוך',
    'למידה',
    'הוראה',
    'כיתה',
    'מערכי שיעור',
    'פעילות חינוכית',
    'הגות',
    'היסטוריה',
    'יהדות',
    'מורשת',
    'תנ״ך',
    'תושב״ע',
    'education',
    'heritage',
    '02',
  ],
  '03': [
    'פסיכולוגיה',
    'בריאות',
    'רגשי',
    'חוסן',
    'חברות',
    'חרם חברתי',
    'תקשורת',
    'רפואה',
    'psychology',
    'health',
    '03',
  ],
  '04': [
    'בינה מלאכותית',
    'ai',
    'אקדמיה',
    'סוכנים',
    'סוכני ai',
    'פרומפטים',
    'rag',
    'gemini',
    'antigravity',
    'אווטארים',
    '04',
  ],
  '05': [
    'מדעי המוח',
    'קוגניציה',
    'דופמין',
    'קשב',
    'תודעה',
    'נוירופידבק',
    'eeg',
    'חדשנות',
    'מלטונין',
    'neuroscience',
    'innovation',
    '05',
  ],
  '06': [
    'מדע',
    'פיזיקה',
    'אסטרונומיה',
    'חלל',
    'חשמל',
    'גיאומטריה',
    'טבע',
    'אנרגיה',
    'כימיה',
    'science',
    'physics',
    'astronomy',
    '06',
  ],
};

const HERITAGE_TAGS = ['הגות', 'היסטוריה', 'יהדות', 'מורשת', 'רמב״ם', 'ליבוביץ׳', 'ארנדט', 'חשמונאים'];

const CARD_CODE_TO_DOMAIN_ID: Record<Exclude<BrainCardCode, '00'>, string> = {
  '01': 'brain-top-left',
  '02': 'brain-mid-left',
  '03': 'brain-bottom-left',
  '04': 'brain-top-right',
  '05': 'brain-mid-right',
  '06': 'brain-bottom-right',
};

// Auto-discover every non-template .json and .md file dropped anywhere under /content/**
const rawJsonModules = import.meta.glob<{ default: unknown }>('/content/**/*.json', {
  eager: true,
});

const rawMarkdownModules = import.meta.glob<string>('/content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function inferSubTab(explicit: unknown, tags: string[]): 'learning' | 'heritage' | undefined {
  if (explicit === 'learning' || explicit === 'heritage') return explicit;
  const low = tags.map((t) => t.toLowerCase());
  if (HERITAGE_TAGS.some((ht) => low.some((t) => t.includes(ht)))) return 'heritage';
  return undefined;
}

function normalizeItem(raw: unknown, fallbackId: string): RepositoryContentItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Quality control gate: skip drafts or explicitly unapproved items
  if (obj.draft === true || obj.approved === false || obj.status === 'draft') return null;

  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
  if (!title) return null;

  const validCodes = new Set<BrainCardCode>(['00', '01', '02', '03', '04', '05', '06']);
  const explicitCards = Array.isArray(obj.cards)
    ? obj.cards
        .map((c) => String(c).trim().padStart(2, '0') as BrainCardCode)
        .filter((c) => validCodes.has(c))
    : [];

  const tags = Array.isArray(obj.tags)
    ? obj.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : fallbackId,
    title,
    summary,
    details: typeof obj.details === 'string' ? obj.details.trim() : undefined,
    type: typeof obj.type === 'string' ? obj.type.trim() : undefined,
    section: obj.section === 'news' || obj.section === 'guides' ? obj.section : undefined,
    subTab: inferSubTab(obj.subTab, tags),
    sourceName: typeof obj.sourceName === 'string' ? obj.sourceName.trim() : undefined,
    url: typeof obj.url === 'string' && obj.url.trim() ? obj.url.trim() : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt.trim() : undefined,
    cards: explicitCards,
    tags,
    approved: true,
    autoMatchByTags: obj.autoMatchByTags !== false,
  };
}

/**
 * Parses a Markdown file with simple YAML frontmatter (--- ... ---) dropped into content/inbox/.
 */
function parseMarkdownContent(rawMd: string, fallbackId: string): RepositoryContentItem | null {
  const match = rawMd.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2].trim();
  const meta: Record<string, unknown> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const sepIdx = line.indexOf(':');
    if (sepIdx <= 0) continue;
    const key = line.slice(0, sepIdx).trim();
    const val = line.slice(sepIdx + 1).trim();
    if (!key) continue;

    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (val === 'true') {
      meta[key] = true;
    } else if (val === 'false') {
      meta[key] = false;
    } else {
      meta[key] = val.replace(/^["']|["']$/g, '');
    }
  }

  if (!meta.details && body) meta.details = body;
  if (!meta.summary && body) meta.summary = body.split(/\r?\n/)[0].slice(0, 180);

  return normalizeItem(meta, fallbackId);
}

function loadAllRepositoryItems(): RepositoryContentItem[] {
  const collected: RepositoryContentItem[] = [];

  for (const [filePath, mod] of Object.entries(rawJsonModules)) {
    const fileName = filePath.split('/').pop() || '';
    if (fileName.startsWith('_')) continue;

    const payload = mod?.default ?? mod;
    if (Array.isArray(payload)) {
      payload.forEach((entry, idx) => {
        const item = normalizeItem(entry, `${fileName}-${idx}`);
        if (item) collected.push(item);
      });
    } else {
      const item = normalizeItem(payload, fileName.replace(/\.json$/i, ''));
      if (item) collected.push(item);
    }
  }

  for (const [filePath, rawMd] of Object.entries(rawMarkdownModules)) {
    const fileName = filePath.split('/').pop() || '';
    if (fileName.startsWith('_') || fileName.toLowerCase() === 'readme.md') continue;
    const item = parseMarkdownContent(rawMd, fileName.replace(/\.md$/i, ''));
    if (item) collected.push(item);
  }

  return collected;
}

export const ALL_REPOSITORY_CONTENT: RepositoryContentItem[] = loadAllRepositoryItems();

export function resolveItemCards(item: RepositoryContentItem): BrainCardCode[] {
  const matched = new Set<BrainCardCode>(item.cards);

  if (item.autoMatchByTags !== false && item.tags.length > 0) {
    const normalizedTags = item.tags.map((t) => t.toLowerCase());
    (Object.keys(CARD_TAG_RULES) as BrainCardCode[]).forEach((code) => {
      if (code === '01' && !item.publishedAt) return;
      const keywords = CARD_TAG_RULES[code];
      if (
        keywords.some((kw) => normalizedTags.some((tag) => tag.includes(kw) || kw.includes(tag)))
      ) {
        matched.add(code);
      }
    });
  }

  return Array.from(matched);
}

export function getContentForCard(
  cardCode: BrainCardCode,
  options?: { newsSection?: 'news' | 'guides'; eduSubTab?: 'learning' | 'heritage' }
): RepositoryContentItem[] {
  return ALL_REPOSITORY_CONTENT.filter((item) => {
    const cards = resolveItemCards(item);
    if (!cards.includes(cardCode)) return false;

    if (cardCode === '01') {
      if (item.publishedAt && !isWithinLast30Days(item.publishedAt)) return false;
      if (options?.newsSection) {
        const itemSec = item.section ?? 'news';
        if (itemSec !== options.newsSection) return false;
      }
    }

    if (cardCode === '02' && options?.eduSubTab) {
      const itemTab = item.subTab ?? 'learning';
      if (itemTab !== options.eduSubTab) return false;
    }

    return true;
  });
}

export function searchRepositoryContent(query: string): Array<{
  item: RepositoryContentItem;
  primaryDomainId?: string;
  primaryHue: 'gold' | 'cyan';
  matchedCards: BrainCardCode[];
}> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  const scored: Array<{
    item: RepositoryContentItem;
    score: number;
    matchedCards: BrainCardCode[];
  }> = [];

  for (const item of ALL_REPOSITORY_CONTENT) {
    const titleLow = item.title.toLowerCase();
    const summaryLow = item.summary.toLowerCase();
    const tagsLow = item.tags.map((t) => t.toLowerCase());

    let score = 0;
    if (titleLow.includes(q)) score += 6;
    if (tagsLow.some((t) => t === q || q.includes(t) || t.includes(q))) score += 5;
    if (summaryLow.includes(q)) score += 3;

    for (const tok of tokens) {
      if (tagsLow.some((t) => t.includes(tok))) score += 3;
      if (titleLow.includes(tok)) score += 2;
      if (summaryLow.includes(tok)) score += 1;
    }

    if (score > 0) {
      scored.push({ item, score, matchedCards: resolveItemCards(item) });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map(({ item, matchedCards }) => {
    const nonCore = matchedCards.find((c) => c !== '00') as
      | Exclude<BrainCardCode, '00'>
      | undefined;
    const domainId = nonCore ? CARD_CODE_TO_DOMAIN_ID[nonCore] : undefined;
    const dom = domainId ? DUPAMAN_DOMAINS.find((d) => d.id === domainId) : undefined;
    return {
      item,
      primaryDomainId: domainId,
      primaryHue: dom?.hue ?? 'gold',
      matchedCards,
    };
  });
}

export function getAllUniqueTags(): string[] {
  const set = new Set<string>();
  for (const item of ALL_REPOSITORY_CONTENT) {
    for (const tag of item.tags) set.add(tag);
  }
  return Array.from(set);
}
