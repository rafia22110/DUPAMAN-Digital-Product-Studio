export const MAX_NEWS_AGE_DAYS = 30;

export interface NewsGuideItem {
  id: string;
  section: 'news' | 'guides';
  topicLabel: string;
  title: string;
  sourceName: string;
  summary: string;
  url: string;
  publishedAt: string;
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
  indexLabel: '01' | '02' | '03' | '04' | '05' | '06';
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

export const NEWS_AND_GUIDES_FEED: NewsGuideItem[] = [];

export const DUPAMAN_DOMAINS: BrainDomain[] = [
  {
    id: 'brain-top-left',
    indexLabel: '01',
    kicker: 'Agentic Interfaces',
    title: 'ממשקי מחר',
    shortTitle: 'ממשקי מחר',
    description: 'אפליקציות סוכן וממשקי "כל אתר = סוכן" המחליפים ניווט מסורתי.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-mid-left',
    indexLabel: '02',
    kicker: 'Machine Intelligence',
    title: 'מוח מכונה',
    shortTitle: 'מוח מכונה',
    description: 'פלטפורמות בינה מלאכותית, סוכנים ואוטומציה חיה.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-bottom-left',
    indexLabel: '03',
    kicker: 'Live 3D Learning',
    title: 'למידה חיה',
    shortTitle: 'למידה חיה',
    description: 'סביבות למידה בתלת-ממד וכיתות אינטראקטיביות.',
    hue: 'gold',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-top-right',
    indexLabel: '04',
    kicker: 'Attention Architecture',
    title: 'אדריכלות הקשב',
    shortTitle: 'אדריכלות הקשב',
    description: 'מודלים וכלים למוחות הקצה, קשב ויתרון קוגניטיבי.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-mid-right',
    indexLabel: '05',
    kicker: 'Spirit & Origin',
    title: 'רוח ומקור',
    shortTitle: 'רוח ומקור',
    description: 'תודעה, פילוסופיה ומחקרי עומק בציוויליזציה האנושית.',
    hue: 'cyan',
    kind: 'personal-hub',
    items: [],
  },
  {
    id: 'brain-bottom-right',
    indexLabel: '06',
    kicker: 'Venture Room',
    title: 'חדר המיזמים',
    shortTitle: 'חדר המיזמים',
    description: 'מיזמים טכנולוגיים להאצה, רגולציה והשקעה.',
    hue: 'gold',
    kind: 'personal-hub',
    items: [],
  },
];

export const INITIAL_SUBSCRIBERS: SubscriberEntry[] = [];

export function findDomainById(id: string): BrainDomain | undefined {
  return DUPAMAN_DOMAINS.find((d) => d.id === id);
}
