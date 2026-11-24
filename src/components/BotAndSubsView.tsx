import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  RotateCcw,
  Send,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { DUPAMAN_DOMAINS } from '../data/dupamanCatalog';
import {
  STUDIO_EXHIBITS,
  findExhibitByCode,
  searchStudioExhibits,
  type StudioExhibitSample,
} from '../data/studioSamples';
import { useStudioExhibits } from '../data/exhibitsStore';
import { CrystalButton, CrystalCard3D } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { StudioExhibitCard } from './StudioExhibitCard';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';
import { openUniversalConsentModal } from './UniversalConsentAdapter';

type BotRuntimeState = 'idle' | 'waking' | 'listening' | 'spotlight' | 'collapsed';

interface BotMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  spotlight?: StudioExhibitSample;
}

interface BotAndSubsViewProps {
  prefillPrompt?: string | null;
  prefillTopic?: string | null;
  onGoHome: () => void;
  onOpenDomain: (domainId: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

const NODE_CHOICES = DUPAMAN_DOMAINS.map((d) => d.title);

const OPENING_BOT_MESSAGE =
  'ברוך הבא ל-DUPAMAN. כאן לא גוללים בתפריטים — אומרים מה מחפשים, ואני מאיר את היצירה המדויקת. מתעניין בפיתוח מוצר, למידה חיה, או בחדר המיזמים?';

const CORE_PILLARS = [
  'ממשקי מחר (כל אתר = סוכן)',
  'למידה חיה ו-3D',
  'מערכות AI ואדריכלות הקשב',
];

export function BotAndSubsView({
  prefillPrompt = null,
  prefillTopic = null,
  onGoHome,
  onOpenDomain,
  onOpenLogoSection,
}: BotAndSubsViewProps) {
  const [mobileView, setMobileView] = useState<'bot' | 'card'>('bot');

  // Conversational & Spotlight Runtime State Machine
  const activeExhibits = useStudioExhibits();
  const [botState, setBotState] = useState<BotRuntimeState>('waking');
  const [spotlightExhibit, setSpotlightExhibit] = useState<StudioExhibitSample | null>(null);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: OPENING_BOT_MESSAGE,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  // Direct Action Form (Left Panel — Live Business Card)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<string[]>(
    prefillTopic && NODE_CHOICES.includes(prefillTopic)
      ? [prefillTopic]
      : ['ממשקי מחר']
  );
  const [saving, setSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement | null>(null);
  const lastPrefillRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const wakeTimerRef = useRef<number | null>(null);

  // Trigger 0.8s waking animation on mount
  const triggerWakeCycle = () => {
    setBotState('waking');
    if (wakeTimerRef.current) window.clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = window.setTimeout(() => {
      setBotState((prev) => (prev === 'waking' ? 'listening' : prev));
    }, 800);
  };

  useEffect(() => {
    triggerWakeCycle();
    return () => {
      if (wakeTimerRef.current) window.clearTimeout(wakeTimerRef.current);
    };
  }, []);

  // Return to waking after 60s of quiet
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 60_000 && botState === 'listening') {
        lastActivityRef.current = Date.now();
        triggerWakeCycle();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [botState]);

  useEffect(() => {
    if (prefillTopic && NODE_CHOICES.includes(prefillTopic)) {
      setSelectedNodes((prev) => (prev.includes(prefillTopic) ? prev : [...prev, prefillTopic]));
    }
  }, [prefillTopic]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, thinking, spotlightExhibit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onGoHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome]);

  const sendPrompt = async (text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;

    lastActivityRef.current = Date.now();
    setBotState('listening');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: clean }]);
    setInput('');
    setThinking(true);

    const qLower = clean.toLowerCase();
    const matchedFromActive = activeExhibits.find(
      (ex) =>
        ex.title.toLowerCase().includes(qLower) ||
        ex.summary.toLowerCase().includes(qLower) ||
        ex.nodeTitle.toLowerCase().includes(qLower) ||
        ex.techTags.some((t) => t.toLowerCase().includes(qLower))
    );
    const fallbackMatch = searchStudioExhibits(clean);
    const matchedExhibit =
      matchedFromActive ||
      (fallbackMatch && activeExhibits.some((e) => e.id === fallbackMatch.id)
        ? activeExhibits.find((e) => e.id === fallbackMatch.id)
        : undefined);

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          matchedExhibitId: matchedExhibit?.id ?? null,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { fallback?: boolean; reply?: string };
        if (!data.fallback && data.reply) {
          if (matchedExhibit) {
            setSpotlightExhibit(matchedExhibit);
            setBotState('spotlight');
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `b-${Date.now()}`,
              role: 'bot',
              text: data.reply!,
              spotlight: matchedExhibit,
            },
          ]);
          return;
        }
      }
    } catch {
      // Fall through to deterministic Studio Spotlight Runtime
    } finally {
      setThinking(false);
    }

    if (matchedExhibit) {
      setSpotlightExhibit(matchedExhibit);
      setBotState('spotlight');
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `הארתי עבורך את ${matchedExhibit.nodeTitle} — ${matchedExhibit.title}:`,
          spotlight: matchedExhibit,
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: 'אפשר לכוון ישירות לפי אחת היצירות: ממשקי מחר, מוח מכונה, למידה חיה, אדריכלות הקשב, רוח ומקור או חדר המיזמים. איזו מהן תרצה שאאיר?',
      },
    ]);
  };

  useEffect(() => {
    if (prefillPrompt && lastPrefillRef.current !== prefillPrompt) {
      lastPrefillRef.current = prefillPrompt;
      void sendPrompt(prefillPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPrompt]);

  const handleCollapseSpotlight = () => {
    lastActivityRef.current = Date.now();
    setSpotlightExhibit(null);
    setBotState('collapsed');
    window.setTimeout(() => {
      setBotState('listening');
    }, 260);
  };

  const toggleNodeChoice = (nodeTitle: string) => {
    setSelectedNodes((prev) =>
      prev.includes(nodeTitle)
        ? prev.length > 1
          ? prev.filter((t) => t !== nodeTitle)
          : prev
        : [...prev, nodeTitle]
    );
  };

  const handleDirectActionSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'אורח סטודיו';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFeedback('נא להזין כתובת אימייל תקינה.');
      return;
    }
    if (!acceptedTerms) {
      setFeedback('נא לאשר את תנאי השימוש ומדיניות הפרטיות של הסטודיו.');
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          topics: selectedNodes,
          source: 'studio-00-card',
        }),
      });
      const d = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (res.ok && d.ok) {
        setFeedback(`הפנייה התקבלה · מזהה ${d.id || 'DUPAMAN'}`);
        setName('');
        setEmail('');
      } else {
        setFeedback(d.error || 'אירעה שגיאה בשליחה, נסה שוב.');
      }
    } catch {
      setFeedback('שגיאת חיבור לשרת, נסה שוב בעוד רגע.');
    } finally {
      setSaving(false);
    }
  };

  const quickSparks: Array<{ label: string; code: StudioExhibitSample['nodeCode'] }> = [
    { label: 'ממשקי מחר', code: '01' },
    { label: 'למידה חיה', code: '03' },
    { label: 'חדר המיזמים', code: '06' },
  ];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#020204] text-[#f3f5fa] select-none"
    >
      <SubtleBrainBackdrop accent="gold" />

      {/* Floating Top-Right Transparent DUPAMAN Logo */}
      <FloatingLogoTrigger mode="floating-corner" onNavigate={onOpenLogoSection} />

      {/* Floating Top-Left Minimal Glass Controls */}
      <div className="fixed top-5 left-5 z-40 flex items-center gap-2">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>חזרה</span>
        </CrystalButton>
        <div className="flex items-center gap-1.5 lg:hidden">
          <CrystalButton
            hue="gold"
            size="sm"
            active={mobileView === 'bot'}
            onClick={() => setMobileView('bot')}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>הבוט המארח</span>
          </CrystalButton>
          <CrystalButton
            hue="cyan"
            size="sm"
            active={mobileView === 'card'}
            onClick={() => setMobileView('card')}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>כרטיס ביקור</span>
          </CrystalButton>
        </div>
      </div>

      {/* Main Centered Dual Crystal-Glass Chambers (ZERO Page Scroll) */}
      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col px-5 pt-16 pb-6 sm:px-10 sm:pt-14 sm:pb-7">
        <header className="mx-auto mb-4 shrink-0 text-center">
          <div
            dir="ltr"
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[11px] tracking-widest text-[#f8d478]"
          >
            00 · DUPAMAN DIGITAL PRODUCT STUDIO
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-bold text-white sm:text-3xl"
          >
            הסטודיו · כרטיס ביקור חי
          </h1>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          {/* RIGHT PANEL (First in RTL Grid, 7 cols): Conversational & Spotlight Runtime Bot */}
          <section
            style={
              botState === 'waking'
                ? { animation: 'botWaking 800ms cubic-bezier(0.16, 1, 0.3, 1)' }
                : undefined
            }
            className={`min-h-0 flex-col lg:col-span-7 ${
              mobileView === 'bot' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <CrystalCard3D hue="gold" interactive={false} className="h-full min-h-0">
              <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/12 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-5 w-5 text-[#f8d478]" />
                    <span className="text-sm font-semibold text-white">הבוט המארח</span>
                    <span
                      dir="ltr"
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="rounded-full border border-[#f8d478]/35 bg-[#f2be4e]/12 px-2 py-0.5 text-[10px] tracking-wider text-[#f8d478]"
                    >
                      {botState}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {quickSparks.map((sp) => (
                      <button
                        key={sp.code}
                        type="button"
                        onClick={() => {
                          const ex = findExhibitByCode(sp.code);
                          if (ex) void sendPrompt(ex.nodeTitle);
                        }}
                        className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[#dce2ef] transition-colors hover:border-[#f8d478]/45 hover:bg-[#f2be4e]/12 hover:text-white"
                      >
                        {sp.label}
                      </button>
                    ))}
                    {spotlightExhibit && (
                      <button
                        type="button"
                        onClick={handleCollapseSpotlight}
                        title="חזרה למצב שקט"
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#cfd7e6] hover:text-white"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>נקה זרקור</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Contained message + single Spotlight runtime feed */}
                <div
                  ref={feedRef}
                  className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-2 ${
                        m.role === 'user' ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`max-w-[92%] rounded-2xl border px-3.5 py-2.5 text-xs leading-relaxed backdrop-blur-md sm:text-sm ${
                          m.role === 'user'
                            ? 'border-[#84e8ff]/35 bg-[#48d6fc]/12 text-[#eefbff]'
                            : 'border-white/16 bg-white/[0.05] text-[#f3f6fc]'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Single Focused Spotlight Exhibit Card (replaces static /content links) */}
                  {spotlightExhibit && botState === 'spotlight' && (
                    <div className="my-1 w-full">
                      <StudioExhibitCard
                        exhibit={spotlightExhibit}
                        compact
                        onOpenInBot={() => onOpenDomain(spotlightExhibit.domainId)}
                      />
                    </div>
                  )}

                  {thinking && (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#f8d478]/25 bg-[#f2be4e]/10 px-3 py-1.5 text-xs text-[#fce7b2]">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        מאיר את היצירה המדויקת...
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct node jump pills + chat input */}
                <div className="mt-2 flex shrink-0 flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    {STUDIO_EXHIBITS.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onOpenDomain(ex.domainId)}
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#bac4d6] transition-colors hover:border-white/30 hover:text-white"
                      >
                        <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }}>
                          {ex.nodeCode}
                        </span>{' '}
                        {ex.nodeTitle}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void sendPrompt(input);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/18 bg-white/[0.04] p-1.5 focus-within:border-[#f8d478]/50"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        lastActivityRef.current = Date.now();
                        setInput(e.target.value);
                      }}
                      placeholder="אמור מה אתה מחפש — ממשקי מחר, למידה חיה, חדר המיזמים..."
                      className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-[#93a0b8] outline-none sm:text-sm"
                    />
                    <CrystalButton
                      hue="gold"
                      size="sm"
                      type="submit"
                      disabled={!input.trim() || thinking}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>האר</span>
                    </CrystalButton>
                  </form>
                </div>
              </div>
            </CrystalCard3D>
          </section>

          {/* LEFT PANEL (Second in RTL Grid, 5 cols): Raphael's Live Studio Business Card + Direct Action Form */}
          <section
            className={`min-h-0 flex-col lg:col-span-5 ${
              mobileView === 'card' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <CrystalCard3D hue="cyan" interactive={false} className="h-full min-h-0">
              <div className="flex h-full min-h-0 flex-col justify-between p-4 sm:p-5">
                {/* Identity & Manifesto */}
                <div className="flex flex-col gap-2.5 border-b border-white/12 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      רפאל ארגנטי ·{' '}
                      <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }}>
                        DUPAMAN Studio
                      </span>
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#dce4f2]">
                      מעצבים אפליקציות סוכן ומוצרים דיגיטליים — חיבור בין עומק אנושי, חינוך
                      ובינה מלאכותית.
                    </p>
                  </div>

                  {/* 3 Core Domain Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {CORE_PILLARS.map((pillar) => (
                      <span
                        key={pillar}
                        className="rounded-lg border border-[#84e8ff]/28 bg-[#48d6fc]/10 px-2.5 py-1 text-[10px] font-medium text-[#dcf8ff]"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Form -> /api/subscribe */}
                <form
                  onSubmit={handleDirectActionSubmit}
                  className="mt-3 flex min-h-0 flex-1 flex-col justify-between gap-2.5"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="text-xs font-semibold text-[#f8d478]">
                      הזמנת אב-טיפוס · תיאום הדגמה · גישה לחדר המיזמים
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם מלא"
                        className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                      />
                      <input
                        type="email"
                        required
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 text-[11px] text-[#cfd7e6]">בחר צומת עניין:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {NODE_CHOICES.map((nodeName) => {
                          const on = selectedNodes.includes(nodeName);
                          return (
                            <button
                              key={nodeName}
                              type="button"
                              onClick={() => toggleNodeChoice(nodeName)}
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] transition-colors ${
                                on
                                  ? 'border-[#84e8ff]/55 bg-[#48d6fc]/16 text-[#ebfbff]'
                                  : 'border-white/14 bg-white/[0.03] text-[#bac4d6] hover:bg-white/10'
                              }`}
                            >
                              {on && <Check className="h-3 w-3 text-[#84e8ff]" />}
                              <span>{nodeName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-[#cfd7e6]">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#84e8ff]"
                      />
                      <span>
                        אני מאשר/ת את{' '}
                        <button
                          type="button"
                          onClick={() => openUniversalConsentModal('terms')}
                          className="cursor-pointer font-semibold text-[#84e8ff] underline hover:text-white"
                        >
                          תנאי השימוש, העוגיות והפרטיות
                        </button>{' '}
                        של DUPAMAN.
                      </span>
                    </label>
                    {feedback && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-[#84e8ff]/35 bg-[#48d6fc]/12 px-3 py-2 text-xs text-[#e8fbff]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#84e8ff]" />
                        <span>{feedback}</span>
                      </div>
                    )}
                    <CrystalButton
                      hue="cyan"
                      size="md"
                      type="submit"
                      disabled={saving}
                      className="w-full"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{saving ? 'שולח...' : 'שליחת בקשה ישירה לסטודיו'}</span>
                    </CrystalButton>
                  </div>
                </form>
              </div>
            </CrystalCard3D>
          </section>
        </div>
      </main>
    </div>
  );
}
