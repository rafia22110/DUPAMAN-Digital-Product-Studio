export interface StudioExhibitSample {
  id: string;
  code?: string;
  nodeCode: '01' | '02' | '03' | '04' | '05' | '06';
  nodeTitle: string;
  domainId: string;
  sectionLabel: string;
  status: string;
  readiness: string;
  readinessPct: number;
  title: string;
  subtitle: string;
  summary: string;
  highlights?: string[];
  techTags: [string, string, string];
  hue: 'gold' | 'cyan';
  actionType: 'external' | 'bot';
  actionLabel: string;
  url?: string;
  githubUrl?: string;
  liveUrl?: string;
  liveLabel?: string;
  thumbnail?: string;
  isEducational?: boolean;
  audienceNote?: string;
  botPrompt?: string;
}

export const STUDIO_EXHIBITS: StudioExhibitSample[] = [
  // 01 — ממשקי מחר
  {
    id: 'exhibit-01-banking-agent',
    code: 'DUP-001',
    nodeCode: '01',
    nodeTitle: 'ממשקי מחר',
    domainId: 'brain-top-left',
    sectionLabel: 'מדור ממשקי סוכן (Agentic UI)',
    status: 'קונספט 2027',
    readiness: '80% מוכן להפעלה',
    readinessPct: 80,
    title: 'סוכן בנקאות ופיננסים יוקרתי',
    subtitle:
      'קונספט "כל אתר = סוכן" המחליף קוביות סטטיות בחלון ספוט וזיהוי פעולה בזמן אמת.',
    summary:
      'קונספט "כל אתר = סוכן" המחליף קוביות סטטיות בחלון ספוט וזיהוי פעולה בזמן אמת.',
    highlights: [
      'חלון ספוט זכוכיתי אחד במקום עשרות תפריטים סטטיים.',
      'זיהוי כוונת לקוח בזמן אמת וביצוע פעולה מאומתת בלחיצה.',
      'ארכיטקטורת Zero-Scroll מוכנה לחיבור API פיננסי.',
    ],
    techTags: ['Agentic UI', 'Spotlight Runtime', 'Zero-Scroll'],
    hue: 'cyan',
    actionType: 'bot',
    actionLabel: 'פתח בבוט',
    githubUrl: 'https://github.com/rafia22110/DUPAMAN-Digital-Product-Studio',
    liveUrl: 'https://dupaman.vercel.app/',
    liveLabel: 'הדגמת הסטודיו',
    botPrompt: 'האר לי את ממשקי מחר — סוכן בנקאות ופיננסים יוקרתי',
  },

  // 02 — מוח מכונה
  {
    id: 'dup-021-aegis-mirror',
    code: 'DUP-021',
    nodeCode: '02',
    nodeTitle: 'מוח מכונה',
    domainId: 'brain-mid-left',
    sectionLabel: 'מדור אבטחת סוכנים ובקרה',
    status: 'אב-טיפוס פעיל',
    readiness: '75% מוכן להפעלה',
    readinessPct: 75,
    title: 'אייגיס מירור (Aegis Mirror)',
    subtitle:
      'שכבת פרטיות ובקרה אדריכלית לסוכני AI — בידוד מידע רגיש וניטור החלטות בזמן אמת.',
    summary:
      'שכבת פרטיות ובקרה אדריכלית לסוכני AI — בידוד מידע רגיש וניטור החלטות בזמן אמת.',
    highlights: [
      'נתב מדיניות דטרמיניסטי (Policy Router) שמסנן מידע רגיש לפני שהוא מגיע למודל.',
      'אשף הגדרה בעברית ב-3 שלבים עם ניטור זמני תגובה (Watchdog Latency).',
      'תשתית PocketBase מוכנה לארגונים ומוסדות חינוך.',
    ],
    techTags: ['Policy Router', 'Privacy Layer', 'PocketBase'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'מצגת ארכיטקטורה ↗',
    url: 'https://docs.google.com/presentation/d/1YBWNZwFxApiiNuHpzvIKCMKOIg7NYCRL4zeSi7gsJx8/edit?usp=drivesdk&ouid=101510516826827029597',
    githubUrl: 'https://github.com/rafia22110/Aegis-MirrorP',
    liveUrl:
      'https://docs.google.com/presentation/d/1YBWNZwFxApiiNuHpzvIKCMKOIg7NYCRL4zeSi7gsJx8/edit?usp=drivesdk&ouid=101510516826827029597',
    liveLabel: 'מצגת ארכיטקטורה',
    botPrompt: 'האר לי את DUP-021 — אייגיס מירור (Aegis Mirror)',
  },
  {
    id: 'exhibit-02-alveare-ai',
    code: 'DUP-002',
    nodeCode: '02',
    nodeTitle: 'מוח מכונה',
    domainId: 'brain-mid-left',
    sectionLabel: 'מדור פלטפורמות AI ואוטומציה',
    status: 'מוצר חי',
    readiness: '90% מוכן להפעלה',
    readinessPct: 90,
    title: 'Alveare AI',
    subtitle: 'פלטפורמת AI חיה לשירותים עסקיים, תיאום סוכנים ואוטומציה חכמה.',
    summary: 'פלטפורמת AI חיה לשירותים עסקיים, תיאום סוכנים ואוטומציה חכמה.',
    highlights: [
      'אורקסטרציה של מספר סוכני מומחים במקביל לתהליכי שירות ומכירה.',
      'חיבור ישיר לכלי CRM וייצור תוצרים עסקיים בזמן אמת.',
    ],
    techTags: ['Alveare AI', 'Multi-Agent', 'Automation'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'http://alveare-ai.com',
    githubUrl: 'https://github.com/rafia22110?tab=repositories',
    liveUrl: 'http://alveare-ai.com',
    liveLabel: 'כניסה ל-Alveare AI',
  },

  // 03 — למידה חיה (גלריית חינוך מונגשת למורות, הורים וכיתות)
  {
    id: 'dup-023-meet3d-zume',
    code: 'DUP-023',
    nodeCode: '03',
    nodeTitle: 'למידה חיה',
    domainId: 'brain-bottom-left',
    sectionLabel: 'מדור כיתה תלת-ממדית (3D)',
    status: '85% מוכן להפעלה',
    readiness: '85% מוכן להפעלה',
    readinessPct: 85,
    title: 'Meet3D / Zume Class',
    subtitle:
      'כיתה תלת-ממדית אינטראקטיבית בתוך Google Meet Sidepanel (Three.js) עם אווטארים, לוחות משותפים ומשחוק חי.',
    summary:
      'כיתה תלת-ממדית אינטראקטיבית בתוך Google Meet Sidepanel (Three.js) עם אווטארים, לוחות משותפים ומשחוק חי.',
    highlights: [
      'פועל ישירות בתוך Google Meet בלי התקנה מסובכת לתלמידים.',
      'אווטארים, לוחות כיתה משותפים ומשחוק חי להגברת מעורבות.',
      'חבילת מוצר והדגמה מלאה מוכנה להצגה להנהלות ובתי ספר.',
    ],
    techTags: ['Three.js', 'Google Meet Sidepanel', 'EdTech 3D'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'חבילת מוצר והדגמה ↗',
    url: 'https://docs.google.com/spreadsheets/d/1gIKpHGfHXplLcp9A08YmBJSyW7zoU1tP9oCOYp341iM/edit?usp=drivesdk&ouid=101510516826827029597',
    githubUrl: 'https://github.com/rafia22110/zume',
    liveUrl:
      'https://docs.google.com/spreadsheets/d/1gIKpHGfHXplLcp9A08YmBJSyW7zoU1tP9oCOYp341iM/edit?usp=drivesdk&ouid=101510516826827029597',
    liveLabel: 'חבילת מוצר והדגמה',
    isEducational: true,
    audienceNote: 'מתאים למורות, מדריכים ושיעורים מקוונים — מוכן להקרנה ושיתוף בכיתה.',
    botPrompt: 'האר לי את למידה חיה — Meet3D / Zume Class',
  },
  {
    id: 'dup-024-hanukkah-presentation',
    code: 'DUP-024',
    nodeCode: '03',
    nodeTitle: 'למידה חיה',
    domainId: 'brain-bottom-left',
    sectionLabel: 'מדור מצגות ופעילויות לכיתה',
    status: '95% מוכן להפעלה',
    readiness: '95% מוכן להפעלה',
    readinessPct: 95,
    title: 'מצגת חנוכה אינטראקטיבית',
    subtitle:
      'מרד החשמונאים, אור וגבורה — חוויית למידה פעילה לכיתה ולמשפחה עם דילמות היסטוריות והפעלות.',
    summary:
      'מרד החשמונאים, אור וגבורה — חוויית למידה פעילה לכיתה ולמשפחה עם דילמות היסטוריות והפעלות.',
    highlights: [
      'מוכן לשיעור חנוכה בכיתה או לפעילות משפחתית — ללא הכנה מוקדמת.',
      'כולל דילמות היסטוריות לדיון כיתתי, חידות והפעלות אור וגבורה.',
      'זמין להקרנה מיידית, להדפסת דף הנחיה למורה ולשיתוף בווטסאפ הכיתתי.',
    ],
    techTags: ['Interactive Slides', 'Classroom Activity', 'Hanukkah'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'פתיחת המצגת החיה ↗',
    url: 'https://docs.google.com/presentation/d/1Cy7VmNrRGro_EY2Rxecd4GfvFW8-riPOKxDzjdjHCOw/edit?usp=drivesdk&ouid=101510516826827029597',
    githubUrl: 'https://github.com/rafia22110/Presentation',
    liveUrl:
      'https://docs.google.com/presentation/d/1Cy7VmNrRGro_EY2Rxecd4GfvFW8-riPOKxDzjdjHCOw/edit?usp=drivesdk&ouid=101510516826827029597',
    liveLabel: 'פתיחת המצגת החיה',
    isEducational: true,
    audienceNote: 'מתאים למורות יסודי וחטיבה ולפעילות משפחתית — ניתן להדפיס דף שיעור או לפתוח ישירות.',
    botPrompt: 'האר לי את מצגת חנוכה אינטראקטיבית (DUP-024)',
  },
  {
    id: 'dup-038-concerned-citizens',
    code: 'DUP-038',
    nodeCode: '03',
    nodeTitle: 'למידה חיה',
    domainId: 'brain-bottom-left',
    sectionLabel: 'מדור חינוך ואזרחות פעילה',
    status: '100% מוכן להפעלה',
    readiness: '100% מוכן להפעלה',
    readinessPct: 100,
    title: 'אזרחים מודאגים — החינוך של כולנו',
    subtitle:
      'פלטפורמה אזרחית א-מפלגתית למען עתיד החינוך הממלכתי: המכתב לשר החינוך, סקר אנונימי חי ומונה קולות בזמן אמת.',
    summary:
      'פלטפורמה אזרחית א-מפלגתית למען עתיד החינוך הממלכתי: המכתב לשר החינוך, סקר אנונימי חי ומונה קולות בזמן אמת.',
    highlights: [
      'התדריך המלא לשר החינוך המיועד לקריאה ושיתוף מהיר.',
      'סקר אנונימי של 2 דקות להורים, מורים ואזרחים ללא ספאם.',
      'תוצאות חיות ומונה קולות שקוף בזמן אמת.',
    ],
    techTags: ['Live Civic Platform', 'Anonymous Poll', 'Education Policy'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'כניסה לאתר החי ↗',
    url: 'https://concerned-citizens.vercel.app/',
    githubUrl: 'https://github.com/rafia22110/Concerned-citizens',
    liveUrl: 'https://concerned-citizens.vercel.app/',
    liveLabel: 'כניסה לאתר החי',
    isEducational: true,
    audienceNote: 'מתאים להורים, צוותי הוראה ומנהלים — ניתן לשתף ישירות בקבוצות בית הספר.',
    botPrompt: 'האר לי את אזרחים מודאגים — החינוך של כולנו (DUP-038)',
  },

  // 04 — אדריכלות הקשב
  {
    id: 'exhibit-04-spectrum-edge',
    code: 'DUP-004',
    nodeCode: '04',
    nodeTitle: 'אדריכלות הקשב',
    domainId: 'brain-top-right',
    sectionLabel: 'מדור מחקר קוגניטיבי וקשב',
    status: 'מחקר וכלים',
    readiness: '85% מוכן להפעלה',
    readinessPct: 85,
    title: 'הספקטרום האנושי: מוחות הקצה',
    subtitle:
      'כלים ומודלים להבנת ADHD ואוטיזם כיתרון קוגניטיבי במערכות למידה וקשב.',
    summary:
      'כלים ומודלים להבנת ADHD ואוטיזם כיתרון קוגניטיבי במערכות למידה וקשב.',
    highlights: [
      'מיפוי מצבי מיקוד-על וחשיבה מסתעפת לעיצוב ממשקי למידה מותאמים.',
      'מאגר מחקר חי ב-NotebookLM עם שאלות ותובנות מעשיות.',
    ],
    techTags: ['Neurodiversity', 'Cognitive UI', 'NotebookLM'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'https://notebooklm.google.com/notebook/ea8f6bd3-9b3e-4001-988a-39b51777a13e',
    githubUrl: 'https://github.com/rafia22110/DUPAMAN-Digital-Product-Studio',
    liveUrl:
      'https://notebooklm.google.com/notebook/ea8f6bd3-9b3e-4001-988a-39b51777a13e',
    liveLabel: 'פתיחת מאגר המחקר',
  },

  // 05 — רוח ומקור
  {
    id: 'exhibit-05-consciousness-design',
    code: 'DUP-005',
    nodeCode: '05',
    nodeTitle: 'רוח ומקור',
    domainId: 'brain-mid-right',
    sectionLabel: 'מדור מחקר עומק ומורשת',
    status: '170 מקורות',
    readiness: '90% מוכן להפעלה',
    readinessPct: 90,
    title: 'תכנון התודעה ומחזורי הציוויליזציה',
    subtitle:
      'מנוע מחקר עומק בן 170 מקורות המחבר פילוסופיה, תודעה והתפתחות אנושית.',
    summary:
      'מנוע מחקר עומק בן 170 מקורות המחבר פילוסופיה, תודעה והתפתחות אנושית.',
    highlights: [
      '170 מקורות ראשוניים מאומתים המחוברים למפת סינפסות אחת.',
      'חקר מחזורי ציוויליזציה, משמעות ועיצוב תודעה בעידן AI.',
    ],
    techTags: ['170 Sources', 'Deep Research', 'NotebookLM'],
    hue: 'cyan',
    actionType: 'external',
    actionLabel: 'צפה בדמו ↗',
    url: 'https://notebooklm.google.com/notebook/021d819f-85d5-4d37-9078-bc865077ab9c',
    githubUrl: 'https://github.com/rafia22110/DUPAMAN-Digital-Product-Studio',
    liveUrl:
      'https://notebooklm.google.com/notebook/021d819f-85d5-4d37-9078-bc865077ab9c',
    liveLabel: 'פתיחת מחברת המחקר',
  },

  // 06 — חדר המיזמים
  {
    id: 'dup-022-alveare-bio-oracle',
    code: 'DUP-022',
    nodeCode: '06',
    nodeTitle: 'חדר המיזמים',
    domainId: 'brain-bottom-right',
    sectionLabel: 'מדור מיזמים לשותפים ומשקיעים',
    status: 'מיזם להאצה',
    readiness: '70% מוכן להפעלה',
    readinessPct: 70,
    title: 'Alveare AI ו-Bio-Oracle',
    subtitle:
      'מערכת AI רפואית-ויזואלית ואקוסיסטם סוכנים לניתוח סימני עיניים ואוטומציה חכמה — מוכן לשותפים ומשקיעים.',
    summary:
      'מערכת AI רפואית-ויזואלית ואקוסיסטם סוכנים לניתוח סימני עיניים ואוטומציה חכמה — מוכן לשותפים ומשקיעים.',
    highlights: [
      'אבחון חזותי לא-פולשני (סריקת עין ופנים) ממצלמה רגילה.',
      'משולב באקוסיסטם סוכני Alveare AI לאוטומציה ותיאום תהליכים.',
      'מפת דרך רגולטורית ומוצרית מוכנה להצגה למשקיעים ושותפים אסטרטגיים.',
    ],
    techTags: ['Medical Vision', 'Alveare Ecosystem', 'Venture Ready'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'ערוץ Alveare AI ↗',
    url: 'https://www.youtube.com/@AlveareAi',
    githubUrl: 'https://github.com/rafia22110?tab=repositories',
    liveUrl: 'https://www.youtube.com/@AlveareAi',
    liveLabel: 'ערוץ Alveare AI',
    botPrompt: 'האר לי את DUP-022 — Alveare AI ו-Bio-Oracle',
  },
  {
    id: 'exhibit-06-bio-oracle-dossier',
    code: 'DUP-006',
    nodeCode: '06',
    nodeTitle: 'חדר המיזמים',
    domainId: 'brain-bottom-right',
    sectionLabel: 'מדור תיק רגולציה ומחקר',
    status: 'תיק מחקר',
    readiness: '75% מוכן להפעלה',
    readinessPct: 75,
    title: 'Bio-Oracle — תיק מחקר ורגולציה',
    subtitle:
      'אבחון חזותי רפואי (עין ופנים) ורגולציה רפואית להשקעה והאצה.',
    summary:
      'אבחון חזותי רפואי (עין ופנים) ורגולציה רפואית להשקעה והאצה.',
    highlights: [
      'ניתוח מסלול קליני, רגולציה ופרטיות מטופלים (Federated / Synthetic Data).',
      'מאגר מחקר פתוח לעיון משקיעים ויועצים רפואיים.',
    ],
    techTags: ['Bio-Signals', 'Clinical Pathway', 'NotebookLM'],
    hue: 'gold',
    actionType: 'external',
    actionLabel: 'תיק מחקר מלא ↗',
    url: 'https://notebooklm.google.com/notebook/0e5d4e57-7336-4ff9-838f-6fcb1f5b4fd7',
    githubUrl: 'https://github.com/rafia22110/beuofdtast',
    liveUrl:
      'https://notebooklm.google.com/notebook/0e5d4e57-7336-4ff9-838f-6fcb1f5b4fd7',
    liveLabel: 'פתיחת תיק Bio-Oracle',
  },
];

/** One featured exhibit per locked node (01–06) for compact node jump strips */
export const PRIMARY_NODE_EXHIBITS: StudioExhibitSample[] = (
  ['01', '02', '03', '04', '05', '06'] as const
)
  .map((code) => STUDIO_EXHIBITS.find((e) => e.nodeCode === code))
  .filter((e): e is StudioExhibitSample => Boolean(e));

export function findExhibitsByDomainId(domainId: string): StudioExhibitSample[] {
  return STUDIO_EXHIBITS.filter((e) => e.domainId === domainId);
}

export function findExhibitByDomainId(domainId: string): StudioExhibitSample | undefined {
  return STUDIO_EXHIBITS.find((e) => e.domainId === domainId);
}

export function findExhibitByCode(code: string): StudioExhibitSample | undefined {
  return STUDIO_EXHIBITS.find((e) => e.nodeCode === code || e.code?.toLowerCase() === code.toLowerCase());
}

export function searchStudioExhibits(query: string): StudioExhibitSample | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // Direct DUP code or exact product matches first
  const exactRules: Array<{ id: string; keywords: string[] }> = [
    { id: 'dup-021-aegis-mirror', keywords: ['dup-021', 'אייגיס', 'מירור', 'aegis', 'פרטיות', 'בקרה'] },
    { id: 'dup-022-alveare-bio-oracle', keywords: ['dup-022', 'bio-oracle', 'אורקל', 'רפוא', 'עיניים', 'משקיע'] },
    { id: 'dup-023-meet3d-zume', keywords: ['dup-023', 'meet3d', 'zume', 'sidepanel', 'תלת-ממד', 'three'] },
    { id: 'dup-024-hanukkah-presentation', keywords: ['dup-024', 'חנוכה', 'חשמונאים', 'מכבים', 'מצגת'] },
    { id: 'dup-038-concerned-citizens', keywords: ['dup-038', 'אזרחים', 'מודאגים', 'שר החינוך', 'סקר', 'ממלכתי'] },
  ];

  for (const r of exactRules) {
    if (r.keywords.some((kw) => q.includes(kw))) {
      return STUDIO_EXHIBITS.find((e) => e.id === r.id);
    }
  }

  const nodeRules: Array<{ code: StudioExhibitSample['nodeCode']; keywords: string[] }> = [
    { code: '01', keywords: ['ממשק', 'מחר', 'בנק', 'פיננס', 'סוכן', 'כל אתר', '01'] },
    { code: '02', keywords: ['מוח מכונה', 'מכונה', 'alveare', 'עסק', 'אוטומצ', 'פיתוח מוצר', '02'] },
    { code: '03', keywords: ['למידה חיה', 'למידה', 'כיתה', 'חינוך', 'מורה', 'מורות', '3d', '03'] },
    { code: '04', keywords: ['אדריכלות הקשב', 'קשב', 'adhd', 'אוטיזם', 'מוחות הקצה', 'ספקטרום', '04'] },
    { code: '05', keywords: ['רוח ומקור', 'רוח', 'מקור', 'תודעה', 'ציוויליזציה', '170', '05'] },
    { code: '06', keywords: ['חדר המיזמים', 'מיזם', 'מיזמים', 'אבחון', 'השקעה', '06'] },
  ];

  for (const r of nodeRules) {
    if (r.keywords.some((kw) => q.includes(kw))) {
      return findExhibitByCode(r.code);
    }
  }

  return STUDIO_EXHIBITS.find(
    (ex) =>
      ex.title.toLowerCase().includes(q) ||
      ex.summary.toLowerCase().includes(q) ||
      ex.sectionLabel.toLowerCase().includes(q) ||
      ex.techTags.some((t) => t.toLowerCase().includes(q))
  );
}
