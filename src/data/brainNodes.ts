export interface BrainNodeSpec {
  id: string;
  indexLabel: string;
  title: string;
  kicker: string;
  description: string;
  ctaLabel: string;
  nx: number; // normalized 0..1 inside Illustrative_Image2_956e8c1e.jpg
  ny: number;
  hitRadius: number; // normalized radius relative to constellation baseSize
  hue: 'gold' | 'cyan';
  isMain?: boolean;
  cardPlacement: 'right' | 'left' | 'top-right' | 'top-left' | 'bottom';
}

export const BRAIN_NODES: BrainNodeSpec[] = [
  {
    id: 'brain-core',
    indexLabel: '00',
    kicker: 'DUPAMAN · Heritage · Education · AI',
    title: 'דופמין — המרחב המרכזי',
    description:
      'המוח המרכזי של דופמין. מכאן עוברים לבוט החכם שמכיר את כל 45 הנכסים והמחברות, למנהל המנויים ולנכסי הליבה.',
    ctaLabel: 'לחץ למעבר לבוט ולמנהל המנויים',
    nx: 0.5,
    ny: 0.54,
    hitRadius: 0.145,
    hue: 'gold',
    isMain: true,
    cardPlacement: 'bottom',
  },
  {
    id: 'brain-top-left',
    indexLabel: '01',
    kicker: 'News & Guides · 30 Days',
    title: 'חדשות ומדריכים',
    description: 'מאמרי דופמין ניהול, חידושים (47 מקורות), אוצר GitHub, מדריך Antigravity ו-Gems.',
    ctaLabel: 'לחץ לחדשות ומדריכים',
    nx: 0.105,
    ny: 0.185,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'right',
  },
  {
    id: 'brain-mid-left',
    indexLabel: '02',
    kicker: 'Education & Heritage',
    title: 'חינוך ולמידה פעילה',
    description: 'סוכני AI בהוראה, מערכי שיעור, SymboTalk + לשונית הגות, היסטוריה ויהדות (הרמב״ם, ליבוביץ׳, ארנדט).',
    ctaLabel: 'לחץ לאינדקס החינוך וההגות',
    nx: 0.055,
    ny: 0.555,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'right',
  },
  {
    id: 'brain-bottom-left',
    indexLabel: '03',
    kicker: 'Psychology & Health',
    title: 'פסיכולוגיה ובריאות',
    description: 'מיומנויות חברתיות (51 מקורות), חרם חברתי, דופמין ופעילות גופנית ומחקרי בריאות.',
    ctaLabel: 'לחץ לאינדקס הפסיכולוגיה',
    nx: 0.285,
    ny: 0.905,
    hitRadius: 0.088,
    hue: 'gold',
    cardPlacement: 'top-right',
  },
  {
    id: 'brain-top-right',
    indexLabel: '04',
    kicker: 'Artificial Intelligence',
    title: 'בינה מלאכותית יוצרת',
    description: 'צוות 136 מומחים (86 מקורות), prompts.chat, מדריך RAG, אווטארים, Hermes ו-Gemini Skills.',
    ctaLabel: 'לחץ לאקדמיית ה-AI',
    nx: 0.905,
    ny: 0.165,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'left',
  },
  {
    id: 'brain-mid-right',
    indexLabel: '05',
    kicker: 'Neuroscience & Cognition',
    title: 'מדעי המוח וקוגניציה',
    description: 'תכנון התודעה (170 מקורות), מוחות הקצה, מלטונין, Bio-Oracle ומעגלי דופמין והרגלים.',
    ctaLabel: 'לחץ לאינדקס מדעי המוח',
    nx: 0.945,
    ny: 0.535,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'left',
  },
  {
    id: 'brain-bottom-right',
    indexLabel: '06',
    kicker: 'Science & Cosmos',
    title: 'מדע, פיזיקה ואסטרונומיה',
    description: 'חלל (81 מקורות), פרדוקס פרמי, מערכת השמש, אדיסון וטסלה, גיאומטריה בדידה ואנרגיה.',
    ctaLabel: 'לחץ לאינדקס המדע והחלל',
    nx: 0.765,
    ny: 0.895,
    hitRadius: 0.088,
    hue: 'gold',
    cardPlacement: 'top-left',
  },
];
