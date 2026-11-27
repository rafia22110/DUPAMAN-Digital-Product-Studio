import { useEffect, useState } from 'react';

export type PublicLanguage = 'en' | 'he';
const KEY = 'dupaman-public-language';
const EVENT = 'dupaman-language-change';

const EN: Record<string, string> = {
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
