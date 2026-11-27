import { type FormEvent, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Cookie,
  FileCheck2,
  Layers,
  Lock,
  ShieldCheck,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { CrystalButton, CrystalCard3D } from './GlassPrimitives';
import { usePublicLanguage, translateText } from '../i18n';

export type UniversalThemePreset = 'dupaman-obsidian' | 'edtech-emerald' | 'fintech-sapphire';

export interface UniversalConsentState {
  decided: boolean;
  essential: boolean;
  aiMemory: boolean;
  a2aTelemetry: boolean;
  termsAccepted: boolean;
  ventureNdaAccepted: boolean;
  signerName: string;
  signerEmail: string;
  consentId: string;
  updatedAt: string;
  themePreset: UniversalThemePreset;
  highContrastGlass: boolean;
  reducedMotion: boolean;
}

const CONSENT_STORAGE_KEY = 'dupaman_universal_consent_v1';

const DEFAULT_CONSENT_STATE: UniversalConsentState = {
  decided: false,
  essential: true,
  aiMemory: true,
  a2aTelemetry: true,
  termsAccepted: false,
  ventureNdaAccepted: false,
  signerName: '',
  signerEmail: '',
  consentId: '',
  updatedAt: '',
  themePreset: 'dupaman-obsidian',
  highContrastGlass: false,
  reducedMotion: false,
};

export const UNIVERSAL_THEME_PRESETS: Record<
  UniversalThemePreset,
  {
    name: string;
    sub: string;
    goldHex: string;
    cyanHex: string;
    badge: string;
  }
> = {
  'dupaman-obsidian': {
    name: 'DUPAMAN Obsidian Gold',
    sub: 'זהב מלכותי · ציאן קריסטלי · זכוכית עמוקה',
    goldHex: '#F5C563',
    cyanHex: '#38BDF8',
    badge: 'ברירת מחדל · סטודיו',
  },
  'edtech-emerald': {
    name: 'Living EdTech Emerald',
    sub: 'איזמרגד חינוכי · תכלת שמיים · מותאם למידה ו-3D',
    goldHex: '#34D399',
    cyanHex: '#38BDF8',
    badge: 'מתאם חינוך · איי אור / Meet3D',
  },
  'fintech-sapphire': {
    name: 'Agentic FinTech Sapphire',
    sub: 'ספיר בנקאי · פלטינה חכמה · ממשקי סוכן ארגוניים',
    goldHex: '#E2E8F0',
    cyanHex: '#60A5FA',
    badge: 'מתאם פיננסים · בנקאות סוכן',
  },
};

export function loadUniversalConsent(): UniversalConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT_STATE;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT_STATE;
    const parsed = JSON.parse(raw) as Partial<UniversalConsentState>;
    return {
      ...DEFAULT_CONSENT_STATE,
      ...parsed,
      essential: true,
    };
  } catch {
    return DEFAULT_CONSENT_STATE;
  }
}

export function saveUniversalConsent(next: UniversalConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    applyUniversalDesignTokens(next);
    window.dispatchEvent(new CustomEvent('dupaman_consent_updated', { detail: next }));
  } catch {
    // ignore storage errors
  }
}

export function applyUniversalDesignTokens(state: UniversalConsentState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const preset =
    UNIVERSAL_THEME_PRESETS[state.themePreset] ||
    UNIVERSAL_THEME_PRESETS['dupaman-obsidian'];
  root.style.setProperty('--accent-gold', preset.goldHex);
  root.style.setProperty('--accent-cyan', preset.cyanHex);
  root.style.setProperty(
    '--bg-glass',
    state.highContrastGlass ? 'rgba(10, 16, 30, 0.88)' : 'rgba(15, 23, 42, 0.58)'
  );
  root.dataset.dupamanTheme = state.themePreset;
  root.dataset.dupamanContrast = state.highContrastGlass ? 'high' : 'normal';
  root.dataset.dupamanMotion = state.reducedMotion ? 'reduced' : 'normal';
}

export function openUniversalConsentModal(tab: 'cookies' | 'terms' | 'adapters' = 'terms'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('dupaman_open_consent_modal', { detail: { tab } })
  );
}

export function UniversalConsentAdapter() {
  const language = usePublicLanguage();
  const en = language === 'en';
  const [consent, setConsent] = useState<UniversalConsentState>(() =>
    loadUniversalConsent()
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cookies' | 'terms' | 'adapters'>('cookies');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    applyUniversalDesignTokens(consent);
  }, [consent]);

  useEffect(() => {
    const onSync = (e: Event) => {
      const ev = e as CustomEvent<UniversalConsentState>;
      if (ev.detail) setConsent(ev.detail);
    };
    const onOpenModal = (e: Event) => {
      const ev = e as CustomEvent<{ tab?: 'cookies' | 'terms' | 'adapters' }>;
      if (ev.detail?.tab) setActiveTab(ev.detail.tab);
      setModalOpen(true);
    };
    window.addEventListener('dupaman_consent_updated', onSync);
    window.addEventListener('dupaman_open_consent_modal', onOpenModal);
    return () => {
      window.removeEventListener('dupaman_consent_updated', onSync);
      window.removeEventListener('dupaman_open_consent_modal', onOpenModal);
    };
  }, []);

  const createConsentStamp = () =>
    `DUP-CNS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const handleQuickAcceptAll = () => {
    const next: UniversalConsentState = {
      ...consent,
      decided: true,
      essential: true,
      aiMemory: true,
      a2aTelemetry: true,
      termsAccepted: true,
      consentId: consent.consentId || createConsentStamp(),
      updatedAt: new Date().toISOString(),
    };
    setConsent(next);
    saveUniversalConsent(next);
    setModalOpen(false);
  };

  const handleQuickEssentialOnly = () => {
    const next: UniversalConsentState = {
      ...consent,
      decided: true,
      essential: true,
      aiMemory: false,
      a2aTelemetry: false,
      termsAccepted: true,
      consentId: consent.consentId || createConsentStamp(),
      updatedAt: new Date().toISOString(),
    };
    setConsent(next);
    saveUniversalConsent(next);
    setModalOpen(false);
  };

  const handleSaveModalForm = (e: FormEvent) => {
    e.preventDefault();
    const next: UniversalConsentState = {
      ...consent,
      decided: true,
      essential: true,
      termsAccepted: true,
      consentId: consent.consentId || createConsentStamp(),
      updatedAt: new Date().toISOString(),
    };
    setConsent(next);
    saveUniversalConsent(next);
    setSavedNotice(`ההעדפות ותנאי השימוש נשמרו (${next.consentId})`);
    window.setTimeout(() => {
      setSavedNotice(null);
      setModalOpen(false);
    }, 1100);
  };

  return (
    <>
      {/* 1. FLOATING GLASS CONSENT PILL (When user has not decided yet — Zero-Scroll, Non-Blocking) */}
      {!consent.decided && !modalOpen && (
        <aside
          dir={en ? "ltr" : "rtl"}
          aria-label={en ? "Cookie consent and terms" : "הסכמת עוגיות ותנאי שימוש"}
          style={{
            background:
              'linear-gradient(135deg, rgba(14,22,38,0.88) 0%, rgba(7,11,22,0.94) 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,244,210,0.35), 0 20px 55px rgba(0,0,0,0.78), 0 0 28px rgba(56,189,248,0.14)',
            animation: 'glassCardReveal 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-3xl flex-col justify-between gap-3 rounded-2xl border border-white/20 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:px-5"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#f8d478]/40 bg-[#f2be4e]/12 text-[#f8d478]">
              <Cookie className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  dir="ltr"
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-[10px] font-semibold tracking-widest text-[#f8d478]"
                >
                  DUPAMAN UNIVERSAL CONSENT · COOKIES &amp; TERMS
                </span>
                <span className="rounded-full border border-[#84e8ff]/30 bg-[#48d6fc]/10 px-2 py-0.2 text-[10px] text-[#84e8ff]">
                  Zero-Scroll
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#dce3f1]">
                אנו משתמשים בעוגיות ליבה ובזיכרון סוכן מקומי להארת יצירות מותאמת אישית. המשך הגלישה או אישור מהווים הסכמה{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('terms');
                    setModalOpen(true);
                  }}
                  className="cursor-pointer font-semibold text-[#84e8ff] underline decoration-[#84e8ff]/50 hover:text-white"
                >
                  לתנאי השימוש, הפרטיות והמתאמים האוניברסליים
                </button>
                .
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <CrystalButton
              hue="neutral"
              size="sm"
              onClick={() => {
                setActiveTab('cookies');
                setModalOpen(true);
              }}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{translateText("התאמה ותנאים", language)}</span>
            </CrystalButton>
            <CrystalButton hue="neutral" size="sm" onClick={handleQuickEssentialOnly}>
              <span>{translateText("הכרחיות בלבד", language)}</span>
            </CrystalButton>
            <CrystalButton hue="gold" size="sm" onClick={handleQuickAcceptAll}>
              <Check className="h-3.5 w-3.5" />
              <span>{translateText("אישור והמשך", language)}</span>
            </CrystalButton>
          </div>
        </aside>
      )}

      {/* 2. MICRO GLASS TRIGGER BADGE (Always accessible in bottom-left corner once decided) */}
      {consent.decided && !modalOpen && (
        <div dir="rtl" className="fixed bottom-3.5 left-4 z-40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('cookies');
              setModalOpen(true);
            }}
            style={{
              background: 'rgba(10, 16, 30, 0.72)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 24px rgba(0,0,0,0.55)',
            }}
            className="group flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-[#cfd7e6] backdrop-blur-md transition-all hover:border-[#f8d478]/50 hover:text-white"
            title="ניהול עוגיות, טופס תנאי שימוש ומתאמים אוניברסליים"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#f8d478] transition-transform group-hover:scale-110" />
            <span>{translateText("עוגיות, תנאים ומתאם אוניברסלי", language)}</span>
          </button>
        </div>
      )}

      {/* 3. FULL ZERO-SCROLL CRYSTAL MODAL: COOKIES + TERMS FORM + UNIVERSAL ADAPTERS */}
      {modalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040a]/80 p-4 backdrop-blur-xl select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <CrystalCard3D hue="gold" interactive={false} className="w-full max-w-2xl">
            <form onSubmit={handleSaveModalForm} className="flex flex-col gap-4 p-5 sm:p-6">
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/14 pb-3.5">
                <div>
                  <div
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-[11px] tracking-widest text-[#f8d478]"
                  >
                    DUPAMAN UNIVERSAL ADAPTER · COOKIES, TERMS &amp; DESIGN TOKENS
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    הגדרות עוגיות, טופס תנאי שימוש ומתאמים אוניברסליים
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer rounded-full border border-white/15 bg-white/[0.04] p-1.5 text-[#cfd7e6] hover:border-white/35 hover:text-white"
                  aria-label="סגור"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 3 Glass Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <CrystalButton
                  hue="gold"
                  size="sm"
                  active={activeTab === 'cookies'}
                  onClick={() => setActiveTab('cookies')}
                >
                  <Cookie className="h-3.5 w-3.5" />
                  <span>{translateText("1. עוגיות וזיכרון סוכן", language)}</span>
                </CrystalButton>
                <CrystalButton
                  hue="cyan"
                  size="sm"
                  active={activeTab === 'terms'}
                  onClick={() => setActiveTab('terms')}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>{translateText("2. טופס תנאי שימוש ופרטיות", language)}</span>
                </CrystalButton>
                <CrystalButton
                  hue="gold"
                  size="sm"
                  active={activeTab === 'adapters'}
                  onClick={() => setActiveTab('adapters')}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{translateText("3. מתאמים אוניברסליים לעיצוב", language)}</span>
                </CrystalButton>
              </div>

              {/* TAB 1: COOKIES & AGENT MEMORY */}
              {activeTab === 'cookies' && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-white/14 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">
                          עוגיות ליבה, אבטחה וניווט מרחבי (Essential Core)
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#bac4d6]">
                          נדרשות להפעלת ממשק ה-Zero-Scroll, שמירת חותמת ההסכמה ואבטחת פניות בסטודיו.
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                        פעיל תמיד
                      </span>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/14 bg-white/[0.03] p-3.5 transition-colors hover:border-[#f8d478]/40">
                    <div>
                      <div className="text-xs font-bold text-white">
                        זיכרון הבוט המארח והארת זרקור (Spotlight AI Memory)
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#bac4d6]">
                        שומר מקומית את העדפות השיחה עם המארח החי (צומת 00) כדי להתאים לך הדגמות ואב-טיפוס בזמן אמת.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={consent.aiMemory}
                      onChange={(e) =>
                        setConsent((prev) => ({ ...prev, aiMemory: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#f8d478]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/14 bg-white/[0.03] p-3.5 transition-colors hover:border-[#84e8ff]/40">
                    <div>
                      <div className="text-xs font-bold text-white">
                        גשר סוכנים אוניברסלי (A2A / A2UI 1.0 Runtime)
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#bac4d6]">
                        מאפשר חיבור מבוקר של משטחי A2UI 1.0 ומניפסט הסוכן (`/.well-known/agent.json`) לסוכני AI מורשים.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={consent.a2aTelemetry}
                      onChange={(e) =>
                        setConsent((prev) => ({ ...prev, a2aTelemetry: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#84e8ff]"
                    />
                  </label>
                </div>
              )}

              {/* TAB 2: TERMS & PRIVACY FORM */}
              {activeTab === 'terms' && (
                <div className="flex flex-col gap-3">
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-white/14 bg-white/[0.03] p-3.5 text-xs leading-relaxed text-[#dce3f1]">
                    <p>
                      <strong className="text-[#f8d478]">1. רישוי רב-שכבתי וקניין רוחני:</strong>{' '}
                      קוד המקור פתוח תחת רישיון <strong>MIT</strong>; מאגר התכנים והמחקרים תחת{' '}
                      <strong>CC BY-NC-SA 4.0</strong>; סימני המותג DUPAMAN, הלוגואים ומיזמי הדגל
                      שמורים לרפאל ארגנטי (All Rights Reserved).
                    </p>
                    <p>
                      <strong className="text-[#84e8ff]">2. פרטיות והגנת מידע:</strong> פרטים הנמסרים
                      בטופס כרטיס הביקור החי (00) או דרך נקודת הקצה `/api/subscribe` משמשים אך ורק
                      לתיאום הדגמה, אב-טיפוס או גישה לחדר המיזמים, ואינם נמכרים לצד שלישי.
                    </p>
                    <p>
                      <strong className="text-[#f8d478]">3. חדר המיזמים (06 · Venture Vault):</strong>{' '}
                      הצגת חומרי אבחון ומחקר קליני-רגולטורי (כגון Bio-Oracle) כפופה לשמירה על סודיות
                      מקצועית ואינה מהווה ייעוץ רפואי או הצעת השקעה פומבית.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      type="text"
                      value={consent.signerName}
                      onChange={(e) =>
                        setConsent((prev) => ({ ...prev, signerName: e.target.value }))
                      }
                      placeholder={en ? "Full name / organization (optional)" : "שם מלא / ארגון (אופציונלי לתיעוד הסכמה)"}
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                    />
                    <input
                      type="email"
                      dir="ltr"
                      value={consent.signerEmail}
                      onChange={(e) =>
                        setConsent((prev) => ({ ...prev, signerEmail: e.target.value }))
                      }
                      placeholder="name@company.com (אופציונלי)"
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/14 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white">
                    <input
                      type="checkbox"
                      required
                      checked={consent.termsAccepted}
                      onChange={(e) =>
                        setConsent((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#f8d478]"
                    />
                    <span>
                      אני מאשר/ת את תנאי השימוש, מדיניות הפרטיות והעוגיות של DUPAMAN Studio.
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/14 bg-white/[0.03] px-3.5 py-2.5 text-xs text-[#dce3f1]">
                    <input
                      type="checkbox"
                      checked={consent.ventureNdaAccepted}
                      onChange={(e) =>
                        setConsent((prev) => ({
                          ...prev,
                          ventureNdaAccepted: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#84e8ff]"
                    />
                    <span>
                      אישור סודיות לחדר המיזמים (06): אני מתחייב/ת לשמור בסודיות חומרים עסקיים ורפואיים.
                    </span>
                  </label>
                </div>
              )}

              {/* TAB 3: UNIVERSAL DESIGN ADAPTERS */}
              {activeTab === 'adapters' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-[#cfd7e6]">
                    המתאם האוניברסלי של DUPAMAN מתאים את אסימוני הזכוכית, הניגודיות והתנועה לכל לקוח,
                    מוצר או סוכן בלחיצה אחת — תוך שמירה על חוויית ה-Zero-Scroll:
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {(
                      Object.keys(UNIVERSAL_THEME_PRESETS) as UniversalThemePreset[]
                    ).map((presetKey) => {
                      const p = UNIVERSAL_THEME_PRESETS[presetKey];
                      const active = consent.themePreset === presetKey;
                      return (
                        <button
                          key={presetKey}
                          type="button"
                          onClick={() =>
                            setConsent((prev) => ({ ...prev, themePreset: presetKey }))
                          }
                          className={`flex cursor-pointer flex-col justify-between gap-2 rounded-2xl border p-3 text-right transition-all ${
                            active
                              ? 'border-[#f8d478] bg-white/[0.09] shadow-lg'
                              : 'border-white/14 bg-white/[0.03] hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-[#f8d478]">
                              {p.badge}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                style={{ backgroundColor: p.goldHex }}
                                className="h-3 w-3 rounded-full border border-white/40"
                              />
                              <span
                                style={{ backgroundColor: p.cyanHex }}
                                className="h-3 w-3 rounded-full border border-white/40"
                              />
                            </div>
                          </div>
                          <div>
                            <div
                              dir="ltr"
                              style={{ fontFamily: 'var(--font-display)' }}
                              className="text-xs font-bold text-white"
                            >
                              {p.name}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#bac4d6]">{p.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/14 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white">
                      <span>זכוכית בניגודיות גבוהה (High-Contrast Glass)</span>
                      <input
                        type="checkbox"
                        checked={consent.highContrastGlass}
                        onChange={(e) =>
                          setConsent((prev) => ({
                            ...prev,
                            highContrastGlass: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#84e8ff]"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/14 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white">
                      <span>הפחתת אנימציות ותנועה (Reduced Motion)</span>
                      <input
                        type="checkbox"
                        checked={consent.reducedMotion}
                        onChange={(e) =>
                          setConsent((prev) => ({
                            ...prev,
                            reducedMotion: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#f8d478]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {savedNotice && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/12 px-3.5 py-2 text-xs text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{savedNotice}</span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/12 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#9aa8bf]">
                  <Lock className="h-3.5 w-3.5 text-[#84e8ff]" />
                  <span>
                    {consent.consentId
                      ? `חותמת הסכמה פעילה: ${consent.consentId}`
                      : 'מותאם לתקני פרטיות, A2A ו-A2UI 1.0'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <CrystalButton
                    hue="neutral"
                    size="sm"
                    onClick={handleQuickEssentialOnly}
                  >
                    <span>הכרחיות בלבד</span>
                  </CrystalButton>
                  <CrystalButton hue="gold" size="sm" type="submit">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{translateText("שמור תנאים והתאמות", language)}</span>
                  </CrystalButton>
                </div>
              </div>
            </form>
          </CrystalCard3D>
        </div>
      )}
    </>
  );
}
