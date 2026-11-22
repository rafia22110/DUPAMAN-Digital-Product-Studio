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
    kicker: 'DUPAMAN Digital Product Studio',
    title: 'הסטודיו · כרטיס ביקור חי',
    description:
      'מעצבים אפליקציות סוכן ומוצרים דיגיטליים — חיבור בין עומק אנושי, חינוך ובינה מלאכותית.',
    ctaLabel: 'לחץ לכניסה לסטודיו ולבוט המארח',
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
    kicker: 'Agentic Interfaces',
    title: 'ממשקי מחר',
    description: 'קונספט "כל אתר = סוכן" — ממשקים מוארים המחליפים תפריטים סטטיים.',
    ctaLabel: 'לחץ לתצוגת ממשקי מחר',
    nx: 0.105,
    ny: 0.185,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'right',
  },
  {
    id: 'brain-mid-left',
    indexLabel: '02',
    kicker: 'Machine Intelligence',
    title: 'מוח מכונה',
    description: 'מערכות AI חיות, סוכנים אוטונומיים ותשתית שירותים עסקיים.',
    ctaLabel: 'לחץ לתצוגת מוח מכונה',
    nx: 0.055,
    ny: 0.555,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'right',
  },
  {
    id: 'brain-bottom-left',
    indexLabel: '03',
    kicker: 'Live 3D Learning',
    title: 'למידה חיה',
    description: 'חוויות הוראה בתלת-ממד וכיתות אינטראקטיביות בזמן אמת.',
    ctaLabel: 'לחץ לתצוגת למידה חיה',
    nx: 0.285,
    ny: 0.905,
    hitRadius: 0.088,
    hue: 'gold',
    cardPlacement: 'top-right',
  },
  {
    id: 'brain-top-right',
    indexLabel: '04',
    kicker: 'Attention Architecture',
    title: 'אדריכלות הקשב',
    description: 'כלים ומודלים להבנת מוחות הקצה והפיכת הקשב ליתרון קוגניטיבי.',
    ctaLabel: 'לחץ לתצוגת אדריכלות הקשב',
    nx: 0.905,
    ny: 0.165,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'left',
  },
  {
    id: 'brain-mid-right',
    indexLabel: '05',
    kicker: 'Spirit & Origin',
    title: 'רוח ומקור',
    description: 'מחקרי עומק בתודעה, פילוסופיה ומחזורי הציוויליזציה האנושית.',
    ctaLabel: 'לחץ לתצוגת רוח ומקור',
    nx: 0.945,
    ny: 0.535,
    hitRadius: 0.088,
    hue: 'cyan',
    cardPlacement: 'left',
  },
  {
    id: 'brain-bottom-right',
    indexLabel: '06',
    kicker: 'Venture Room',
    title: 'חדר המיזמים',
    description: 'מיזמים נבחרים להאצה, השקעה ואבחון טכנולוגי מתקדם.',
    ctaLabel: 'לחץ לחדר המיזמים',
    nx: 0.765,
    ny: 0.895,
    hitRadius: 0.088,
    hue: 'gold',
    cardPlacement: 'top-left',
  },
];
