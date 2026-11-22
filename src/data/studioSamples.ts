export interface StudioExhibitSample {
  id: string;
  nodeCode: '01' | '02' | '03' | '04' | '05' | '06';
  nodeTitle: string;
  domainId: string;
  status: string;
  title: string;
  summary: string;
  techTags: [string, string, string];
  hue: 'gold' | 'cyan';
  actionType: 'external' | 'bot';
  actionLabel: string;
  url?: string;
  botPrompt?: string;
}

export const STUDIO_EXHIBITS: StudioExhibitSample[] = [
  {
    id: 'exhibit-01-banking-agent',
    nodeCode: '01',
    nodeTitle: 'ממשקי מחר',
    domainId: 'brain-top-left',
    status: 'קונספט 2027',
    title: 'סוכן בנקאות ופיננסים יוקרתי',
    summary:
      'קונספט "כל אתר = סוכן" המחליף קוביות סטטיות בחלון ספוט וזיהוי פעולה בזמן אמת.',
    techTags: ['Agentic UI', 'Spotlight Runtime', 'Zero-Scroll'],
    hue: 'cyan',
    actionType: 'bot',
    actionLabel: 'פתח בבוט',
    botPrompt: 'האר לי את ממשקי מחר — סוכן בנקאות ופיננסים יוקרתי',
  },
  {
    id: 'exhibit-02-alveare-ai',
    nodeCode: '02',
    nodeTitle: 'מוח מכונה',
    domainId: 'brain-mid-left',
    status: 'מוצר חי',
    title: 'Alveare AI',
    summary: 'פלטפורמת AI חיה לשירותים עסקיים, תיאום סוכנים ואוטומציה חכמה.',
    techTags: ['Alveare AI', 'Multi-Agent', 'Automation'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'http://alveare-ai.com',
  },
  {
    id: 'exhibit-03-meet3d-zume',
    nodeCode: '03',
    nodeTitle: 'למידה חיה',
    domainId: 'brain-bottom-left',
    status: 'אב-טיפוס',
    title: 'Meet3D / Zume Class',
    summary:
      'הרחבת Three.js שהופכת Google Meet לכיתת תלת-ממד אינטראקטיבית.',
    techTags: ['Three.js', 'WebRTC', 'Chrome Extension'],
    hue: 'gold',
    actionType: 'bot',
    actionLabel: 'פתח בבוט',
    botPrompt: 'האר לי את למידה חיה — Meet3D / Zume Class',
  },
  {
    id: 'exhibit-04-spectrum-edge',
    nodeCode: '04',
    nodeTitle: 'אדריכלות הקשב',
    domainId: 'brain-top-right',
    status: 'מחקר וכלים',
    title: 'הספקטרום האנושי: מוחות הקצה',
    summary:
      'כלים ומודלים להבנת ADHD ואוטיזם כיתרון קוגניטיבי במערכות למידה וקשב.',
    techTags: ['Neurodiversity', 'Cognitive UI', 'NotebookLM'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'https://notebooklm.google.com/notebook/ea8f6bd3-9b3e-4001-988a-39b51777a13e',
  },
  {
    id: 'exhibit-05-consciousness-design',
    nodeCode: '05',
    nodeTitle: 'רוח ומקור',
    domainId: 'brain-mid-right',
    status: '170 מקורות',
    title: 'תכנון התודעה ומחזורי הציוויליזציה',
    summary:
      'מנוע מחקר עומק בן 170 מקורות המחבר פילוסופיה, תודעה והתפתחות אנושית.',
    techTags: ['170 Sources', 'Deep Research', 'NotebookLM'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'https://notebooklm.google.com/notebook/021d819f-85d5-4d37-9078-bc865077ab9c',
  },
  {
    id: 'exhibit-06-bio-oracle',
    nodeCode: '06',
    nodeTitle: 'חדר המיזמים',
    domainId: 'brain-bottom-right',
    status: 'מיזם להאצה',
    title: 'Bio-Oracle',
    summary:
      'אבחון חזותי רפואי (עין ופנים) ורגולציה רפואית להשקעה והאצה.',
    techTags: ['Medical Vision', 'Bio-Signals', 'Venture'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'https://notebooklm.google.com/notebook/0e5d4e57-7336-4ff9-838f-6fcb1f5b4fd7',
  },
];

export function findExhibitByDomainId(domainId: string): StudioExhibitSample | undefined {
  return STUDIO_EXHIBITS.find((e) => e.domainId === domainId);
}

export function findExhibitByCode(code: string): StudioExhibitSample | undefined {
  return STUDIO_EXHIBITS.find((e) => e.nodeCode === code);
}

export function searchStudioExhibits(query: string): StudioExhibitSample | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  const rules: Array<{ code: StudioExhibitSample['nodeCode']; keywords: string[] }> = [
    { code: '01', keywords: ['ממשק', 'מחר', 'בנק', 'פיננס', 'סוכן', 'כל אתר', '01'] },
    { code: '02', keywords: ['מוח מכונה', 'מכונה', 'alveare', 'עסק', 'אוטומצ', 'פיתוח מוצר', '02'] },
    { code: '03', keywords: ['למידה חיה', 'למידה', 'meet3d', 'zume', 'three', 'כיתה', 'חינוך', '3d', '03'] },
    { code: '04', keywords: ['אדריכלות הקשב', 'קשב', 'adhd', 'אוטיזם', 'מוחות הקצה', 'ספקטרום', '04'] },
    { code: '05', keywords: ['רוח ומקור', 'רוח', 'מקור', 'תודעה', 'ציוויליזציה', '170', '05'] },
    { code: '06', keywords: ['חדר המיזמים', 'מיזם', 'מיזמים', 'bio-oracle', 'אבחון', 'רפוא', 'השקעה', '06'] },
  ];

  for (const r of rules) {
    if (r.keywords.some((kw) => q.includes(kw))) {
      return findExhibitByCode(r.code);
    }
  }

  return STUDIO_EXHIBITS.find(
    (ex) =>
      ex.title.toLowerCase().includes(q) ||
      ex.summary.toLowerCase().includes(q) ||
      ex.techTags.some((t) => t.toLowerCase().includes(q))
  );
}
