import { DUPAMAN_DOMAINS, isWithinLast30Days } from './dupamanCatalog';

export type BrainCardCode = '01' | '02' | '03' | '04' | '05' | '06';

export interface RepositoryContentItem {
  id: string;
  title: string;
  summary: string;
  details?: string;
  type?: string;
  section?: 'news' | 'guides';
  sourceName?: string;
  url?: string;
  publishedAt?: string; // ISO YYYY-MM-DD
  cards: BrainCardCode[];
  tags: string[];
  /** When true (default), tags also auto-surface this item on matching cards so nothing is missed */
  autoMatchByTags?: boolean;
}

/**
 * Tag-to-card mapping so any item tagged with relevant keywords automatically appears
 * on every fitting brain card in addition to its explicit `cards` list.
 */
const CARD_TAG_RULES: Record<BrainCardCode, string[]> = {
  '01': ['חדשות', 'ניוז', 'עדכון', 'news'],
  '02': ['חינוך', 'למידה', 'כיתה', 'הוראה', 'פעילות חינוכית', 'מורים', 'תלמידים', 'education'],
  '03': ['פסיכולוגיה', 'בריאות', 'קשב', 'חוסן', 'רגשי', 'רווחה', 'psychology', 'health'],
  '04': ['בינה מלאכותית', 'ai', 'אקדמיה', 'פרומפט', 'סוכנים', 'מודלים', 'gpt', 'gemini'],
  '05': ['מדעי המוח', 'חדשנות', 'קוגניציה', 'דופמין', 'zero-g', 'מעבדה', 'neuroscience', 'innovation'],
  '06': ['מדע', 'פיזיקה', 'חלל', 'אסטרונומיה', 'מורשת', 'הגות', 'פרויקט', 'science', 'heritage'],
};

const CARD_CODE_TO_DOMAIN_ID: Record<BrainCardCode, string> = {
  '01': 'brain-top-left',
  '02': 'brain-mid-left',
  '03': 'brain-bottom-left',
  '04': 'brain-top-right',
  '05': 'brain-mid-right',
  '06': 'brain-bottom-right',
};

// Automatically discover and bundle every non-template JSON file placed inside /content/**
const rawModules = import.meta.glob<{ default: unknown }>('/content/**/*.json', {
  eager: true,
});

function normalizeItem(raw: unknown, fallbackId: string): RepositoryContentItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
  if (!title) return null;

  const validCodes = new Set<BrainCardCode>(['01', '02', '03', '04', '05', '06']);
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
    sourceName: typeof obj.sourceName === 'string' ? obj.sourceName.trim() : undefined,
    url: typeof obj.url === 'string' && obj.url.trim() ? obj.url.trim() : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt.trim() : undefined,
    cards: explicitCards,
    tags,
    autoMatchByTags: obj.autoMatchByTags !== false,
  };
}

function loadAllRepositoryItems(): RepositoryContentItem[] {
  const collected: RepositoryContentItem[] = [];

  for (const [filePath, mod] of Object.entries(rawModules)) {
    const fileName = filePath.split('/').pop() || '';
    // Ignore templates or hidden config files starting with "_"
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

  return collected;
}

export const ALL_REPOSITORY_CONTENT: RepositoryContentItem[] = loadAllRepositoryItems();

/**
 * Returns all cards (01..06) a content item belongs to, combining explicit `cards`
 * with automatic tag cross-matching so cross-topic items are never missed.
 */
export function resolveItemCards(item: RepositoryContentItem): BrainCardCode[] {
  const matched = new Set<BrainCardCode>(item.cards);

  if (item.autoMatchByTags !== false && item.tags.length > 0) {
    const normalizedTags = item.tags.map((t) => t.toLowerCase());
    (Object.keys(CARD_TAG_RULES) as BrainCardCode[]).forEach((code) => {
      // Card 01 (News & Guides) requires explicit '01' OR explicit news/freshness match with publishedAt
      if (code === '01' && !item.publishedAt) return;
      const keywords = CARD_TAG_RULES[code];
      if (keywords.some((kw) => normalizedTags.some((tag) => tag.includes(kw) || kw.includes(tag)))) {
        matched.add(code);
      }
    });
  }

  return Array.from(matched);
}

/**
 * Returns all repository content items that belong to a given brain card (`01`..`06`).
 * For Card `01`, automatically enforces the 30-day freshness window and optional `news`/`guides` filter.
 */
export function getContentForCard(
  cardCode: BrainCardCode,
  newsSection?: 'news' | 'guides'
): RepositoryContentItem[] {
  return ALL_REPOSITORY_CONTENT.filter((item) => {
    const cards = resolveItemCards(item);
    if (!cards.includes(cardCode)) return false;

    if (cardCode === '01') {
      if (item.publishedAt && !isWithinLast30Days(item.publishedAt)) return false;
      if (newsSection) {
        const itemSec = item.section ?? 'news';
        if (itemSec !== newsSection) return false;
      }
    }
    return true;
  });
}

/**
 * Searches the entire `content/` repository by title, summary, details, and tags for the AI Bot.
 */
export function searchRepositoryContent(query: string): Array<{
  item: RepositoryContentItem;
  primaryDomainId: string;
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
    const firstCode = matchedCards[0] ?? '02';
    const domainId = CARD_CODE_TO_DOMAIN_ID[firstCode];
    const dom = DUPAMAN_DOMAINS.find((d) => d.id === domainId);
    return {
      item,
      primaryDomainId: domainId,
      primaryHue: dom?.hue ?? 'cyan',
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
