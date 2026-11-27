import { useEffect, useState } from 'react';

export type PublicLanguage = 'en' | 'he';
const KEY = 'dupaman-public-language';
const EVENT = 'dupaman-language-change';

const EN: Record<string, string> = {
  "קונספט 2027": "2027 Concept",
  "מוצר חי": "Live Product",
  "אב-טיפוס": "Prototype",
  "מחקר וכלים": "Research & Tools",
  "170 מקורות": "170 Sources",
  "מיזם להאצה": "Venture in Development",
  "סוכן בנקאות ופיננסים יוקרתי": "Premium Banking & Finance Agent",
  "קונספט \"כל אתר = סוכן\" המחליף קוביות סטטיות בחלון ספוט וזיהוי פעולה בזמן אמת.": "A new interaction model replacing static tiles with an intelligent spotlight and real-time action recognition.",
  "פלטפורמת AI חיה לשירותים עסקיים, תיאום סוכנים ואוטומציה חכמה.": "A live AI platform for business services, agent orchestration and intelligent automation.",
  "הרחבת Three.js שהופכת Google Meet לכיתת תלת-ממד אינטראקטיבית.": "A Three.js extension that transforms Google Meet into an interactive 3D classroom.",
  "הספקטרום האנושי: מוחות הקצה": "The Human Spectrum: Neurodivergent Minds",
  "כלים ומודלים להבנת ADHD ואוטיזם כיתרון קוגניטיבי במערכות למידה וקשב.": "Tools and models exploring ADHD and autism as sources of cognitive advantage in learning and attention systems.",
  "תכנון התודעה ומחזורי הציוויליזציה": "Consciousness Design & Civilizational Cycles",
  "מנוע מחקר עומק בן 170 מקורות המחבר פילוסופיה, תודעה והתפתחות אנושית.": "A 170-source research engine connecting philosophy, consciousness and human development.",
  "אבחון חזותי רפואי (עין ופנים) ורגולציה רפואית להשקעה והאצה.": "Medical visual assessment (eye and face) with regulatory strategy for investment and acceleration.",
  "תצוגת סוכן פעילה": "Agent Runtime",
  "איזון נזילות": "Liquidity Optimization",
  "אופטימיזציית תיק פרטי בזמן אמת": "Real-time Private Portfolio Optimization",
  "הסוכן זיהה ₪420,000 פנויים והכין העברה שקופה למסלול נזיל נושא ריבית.": "The agent identified ₪420,000 in available funds and prepared a transparent transfer to an interest-bearing liquid account.",
  "גידור מט״ח": "FX Hedging",
  "בקרת חשיפה ומטבעות": "Currency Exposure Control",
  "מוצגת הצעת גידור מיידית בלחיצה — ללא צורך בחיפוש בתוך תפריטים.": "A hedging proposal is ready in one click — no menus or navigation required.",
  "ביצוע ישיר": "Direct Execution",
  "פקודת סוכן מאומתת": "Verified Agent Command",
  "אימות ביומטרי וביצוע פקודה פיננסית ישירות מתוך חלון הספוט.": "Biometric verification and financial command execution directly from the spotlight.",
  "ארכיטקטורת Alveare חיה": "Live Alveare Architecture",
  "קליטת פנייה": "Request Intake",
  "מיפוי כוונת הלקוח וזיהוי הקשר עסקי תוך מילי-שניות.": "Maps customer intent and business context in milliseconds.",
  "תיאום מומחים": "Expert Orchestration",
  "הפעלה מקבילה של סוכני מחקר, תמחור וזמינות שירות.": "Coordinates research, pricing and service-availability agents in parallel.",
  "ביצוע ואוטומציה": "Execution & Automation",
  "סגירת פעולה ב-CRM ושליחת סיכום מאושר בזמן אמת.": "Completes the CRM action and sends an approved summary in real time.",
  "סצנת WebGL 3D חיה": "Live WebGL 3D Scene",
  "אינטראקציית כיתה בתלת-ממד מעל Google Meet": "3D Classroom Experience for Google Meet",
  "מפת קשב אדפטיבית": "Adaptive Attention Map",
  "מצב מיקוד-על: מסנן רעש סביבתי ומאיר משימה אחת עמוקה לחיזוק היתרון הקוגניטיבי.": "Hyperfocus mode: filters distractions and brings one meaningful task into focus.",
  "מצב חשיבה מסתעפת: מחבר קשרים יצירתיים בין רעיונות ופורש מפת הקשרים צלולה.": "Divergent thinking mode: connects creative ideas and reveals a clear map of relationships.",
  "שכבה 01 · מקורות ראשוניים": "Layer 01 · Primary Sources",
  "170 מקורות מחקר מאומתים בתודעה, פילוסופיה והיסטוריה.": "170 curated research sources across consciousness, philosophy and history.",
  "שכבה 02 · מחזורי ציוויליזציה": "Layer 02 · Civilizational Cycles",
  "מיפוי דפוסים חוצי-תקופות של עלייה, משבר והתחדשות.": "A cross-era map of patterns of growth, crisis and renewal.",
  "שכבה 03 · תכנון התודעה": "Layer 03 · Consciousness Design",
  "חיבור בין חכמה עתיקה למודלים קוגניטיביים עכשוויים.": "Bridging ancient wisdom and contemporary cognitive models.",
  "שכבות המחקר (170 מקורות)": "Research Layers (170 Sources)",
  "סימולציית Bio-Oracle": "Bio-Oracle Simulation",
  "דיוק זיהוי מיקרו-תבניות": "Micro-pattern Recognition Accuracy",
  "תיק השקעה ורגולציה ממופה": "Mapped Investment & Regulatory Plan",
  "אבחון מהיר ממצלמה רגילה": "Rapid Assessment from a Standard Camera",
  "מוכן להצגה למשקיעים": "Investor Presentation Ready",
  'הסטודיו · כרטיס ביקור חי':'The Studio · A Living Introduction',
  'ממשקי מחר':'Agentic Interfaces','מוח מכונה':'Machine Intelligence','למידה חיה':'Immersive Learning',
  'אדריכלות הקשב':'The Architecture of Attention','רוח ומקור':'Consciousness & Origins','חדר המיזמים':'Venture Studio',
  'לחץ לכניסה לסטודיו ולבוט המארח':'Enter the Studio & Meet Your AI Host',
  'לחץ לכניסה לבוט ולמנהל המנויים':'Meet Your AI Host',
  'לחץ לתצוגת ממשקי מחר':'Explore Agentic Interfaces','לחץ לתצוגת מוח מכונה':'Explore Machine Intelligence',
  'לחץ לתצוגת למידה חיה':'Explore Immersive Learning','לחץ לתצוגת אדריכלות הקשב':'Explore Attention Architecture',
  'לחץ לתצוגת רוח ומקור':'Explore Consciousness & Origins','לחץ לחדר המיזמים':'Enter the Venture Studio',
  'מעצבים אפליקציות סוכן ומוצרים דיגיטליים — חיבור בין עומק אנושי, חינוך ובינה מלאכותית.':'We design intelligent digital products and agentic experiences at the intersection of human insight, learning and AI.',
  'קונספט "כל אתר = סוכן" — ממשקים מוארים המחליפים תפריטים סטטיים.':'A new interaction paradigm: every website becomes an intelligent, responsive agent.',
  'מערכות AI חיות, סוכנים אוטונומיים ותשתית שירותים עסקיים.':'Live AI systems, autonomous agents and intelligent business infrastructure.',
  'חוויות הוראה בתלת-ממד וכיתות אינטראקטיביות בזמן אמת.':'Immersive 3D learning environments and real-time interactive classrooms.',
  'כלים ומודלים להבנת מוחות הקצה והפיכת הקשב ליתרון קוגניטיבי.':'Tools and models exploring neurodiversity, cognition and the potential of human attention.',
  'מחקרי עומק בתודעה, פילוסופיה ומחזורי הציוויליזציה האנושית.':'Deep research into consciousness, philosophy and the cycles of human civilization.',
  'מיזמים נבחרים להאצה, השקעה ואבחון טכנולוגי מתקדם.':'Selected ventures for acceleration, investment and advanced technology assessment.',
  'אפליקציות סוכן וממשקי "כל אתר = סוכן" המחליפים ניווט מסורתי.':'Agentic applications and interfaces that replace traditional navigation with intelligent interaction.',
  'פלטפורמות בינה מלאכותית, סוכנים ואוטומציה חיה.':'AI platforms, autonomous agents and intelligent automation.',
  'סביבות למידה בתלת-ממד וכיתות אינטראקטיביות.':'Immersive 3D learning environments and interactive classrooms.',
  'מודלים וכלים למוחות הקצה, קשב ויתרון קוגניטיבי.':'Models and tools for neurodiversity, attention and cognitive advantage.',
  'תודעה, פילוסופיה ומחקרי עומק בציוויליזציה האנושית.':'Consciousness, philosophy and deep research into human civilization.',
  'מיזמים טכנולוגיים להאצה, רגולציה והשקעה.':'Technology ventures for acceleration, regulation and investment.',
  'חזרה':'Back','אודות':'About','יצירת קשר':'Contact','התחברות':'Login','לוח בקרה · תכנים':'Studio Admin',
  'כניסה לבוט ולמנויים':'Meet the AI Host','יצירת קשר':'Contact','הודעה נשלחה בהצלחה':'Message sent successfully',
  'אודות דופמין':'About DUPAMAN','התחברות לחשבון':'Account Login','שלח פנייה':'Send Message',
  'שם':'Name','הודעה...':'Your message...','שליחת הודעה נוספת':'Send another message',
  'הבוט המארח':'AI Host','כרטיס ביקור':'Studio Card','נקה זרקור':'Clear spotlight',
  'האר':'Explore','שם מלא':'Full name','שולח...':'Sending...','שליחת בקשה ישירה לסטודיו':'Send a direct inquiry',
  'אמור מה אתה מחפש — ממשקי מחר, למידה חיה, חדר המיזמים...':'Tell us what you are looking for — agentic interfaces, immersive learning, ventures...',
  'התאמה ותנאים':'Preferences & Terms','הכרחיות בלבד':'Essential only','אישור והמשך':'Accept & Continue',
  'עוגיות, תנאים ומתאם אוניברסלי':'Cookies, Terms & Preferences','סגור':'Close',
  '1. עוגיות וזיכרון סוכן':'1. Cookies & Agent Memory','2. טופס תנאי שימוש ופרטיות':'2. Terms of Use & Privacy',
  '3. מתאמים אוניברסליים לעיצוב':'3. Universal Design Preferences','שמור תנאים והתאמות':'Save Preferences',
  'הפעל הדגמה מורחבת':'Launch Interactive Demo','המשך שיחה בבוט':'Continue with the AI Host','סגור הדגמה':'Close Demo',
  'הדגמה אינטראקטיבית חיה':'Live Interactive Demo','בצע':'Run','תצוגת סוכן פעילה':'Agent Active',
  'הקלד פקודה בנקאית לסוכן (במקום תפריטים)...':'Enter a banking command — no menus required...',
  'הודעה נשלחה בהצלחה':'Your message has been sent','מחובר כ-':'Signed in as ',
  'צפה בדמו ↗':'View Live Demo ↗','פתח בבוט':'Explore with AI Host'
};

export function translateText(value: string | undefined | null, language: PublicLanguage): string {
  if (!value || language === 'he') return value ?? '';
  return EN[value] ?? value;
}

export function getPublicLanguage(): PublicLanguage {
  if (typeof window === 'undefined') return 'en';
  try { const saved = window.localStorage.getItem(KEY); if (saved === 'he' || saved === 'en') return saved; } catch {}
  return 'en';
}

export function setPublicLanguage(language: PublicLanguage): void {
  try { window.localStorage.setItem(KEY, language); } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: language }));
}

export function usePublicLanguage(): PublicLanguage {
  const [language, setLanguage] = useState<PublicLanguage>(getPublicLanguage);
  useEffect(() => {
    const sync = (event?: Event) => {
      const next = (event as CustomEvent<PublicLanguage> | undefined)?.detail ?? getPublicLanguage();
      if (next === 'en' || next === 'he') setLanguage(next);
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, [language]);
  return language;
}
