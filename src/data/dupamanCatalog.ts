export const MAX_NEWS_AGE_DAYS = 30;

export interface NewsGuideItem {
  id: string;
  section: 'news' | 'guides';
  topicLabel: string;
  title: string;
  sourceName: string;
  summary: string;
  url: string;
  publishedAt: string; // ISO date YYYY-MM-DD
}

export interface PersonalContentItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  url?: string;
  fileName?: string;
  details?: string;
  isUserAdded?: boolean;
}

export interface BrainDomain {
  id: string;
  indexLabel: string;
  kicker: string;
  title: string;
  shortTitle: string;
  description: string;
  hue: 'gold' | 'cyan';
  kind: 'news-hub' | 'personal-hub';
  items: PersonalContentItem[];
}

export interface SubscriberEntry {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  topics: string[];
  status: 'פעיל' | 'חדש' | 'מושהה';
  source: string;
}

export function isWithinLast30Days(isoDate: string): boolean {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return false;
  const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return diffDays >= -1 && diffDays <= MAX_NEWS_AGE_DAYS;
}

export function formatDaysAgoHebrew(isoDate: string): string {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return 'חדש';
  const days = Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'לפני יומיים';
  return `לפני ${days} ימים`;
}

/**
 * Clean reset: empty until we build each card's contents one by one.
 */
export const NEWS_AND_GUIDES_FEED: NewsGuideItem[] = [];

export const DUPAMAN_DOMAINS: BrainDomain[] = [
  {
    id: 'brain-top-left',
    indexLabel: '01',
    kicker: 'News & Guides · 30 Days',
    title: 'חדשות ומדריכים',
    shortTitle: 'חדשות ומדריכים',
    description: 'מחולק לחדשות ומדריכים — תכנים חדשים עד 30 יום בלבד.',
    hue: 'cyan',
    kind: 'news-hub',
    items: [],
  },
  {
    id: 'brain-mid-left',
    indexLabel: '02',
    kicker: 'Education',
    title: 'חינוך ולמידה פעילה',
    shortTitle: 'חינוך ולמידה',
    description: 'מוכן לבניית התכנים שלך.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-bottom-left',
    indexLabel: '03',
    kicker: 'Psychology & Health',
    title: 'פסיכולוגיה ובריאות',
    shortTitle: 'פסיכולוגיה ובריאות',
    description: 'מוכן לבניית התכנים שלך.',
    hue: 'gold',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-top-right',
    indexLabel: '04',
    kicker: 'Artificial Intelligence',
    title: 'בינה מלאכותית יוצרת',
    shortTitle: 'בינה מלאכותית',
    description: 'מוכן לבניית התכנים שלך.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-mid-right',
    indexLabel: '05',
    kicker: 'Neuroscience & Innovation',
    title: 'מדעי המוח וקוגניציה',
    shortTitle: 'מדעי המוח',
    description: 'מוכן לבניית התכנים שלך.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-bottom-right',
    indexLabel: '06',
    kicker: 'Science & Projects',
    title: 'מדע, פיזיקה ואסטרונומיה',
    shortTitle: 'מדע וחלל',
    description: 'מוכן לבניית התכנים שלך.',
    hue: 'gold',
    kind: 'personal-hub',
    items: [],
  },
];

export const INITIAL_SUBSCRIBERS: SubscriberEntry[] = [];

export function findDomainById(id: string): BrainDomain | undefined {
  return DUPAMAN_DOMAINS.find((d) => d.id === id);
}
