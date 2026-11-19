import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  DUPAMAN_DOMAINS,
  INITIAL_SUBSCRIBERS,
  type SubscriberEntry,
} from '../data/dupamanCatalog';
import {
  ALL_REPOSITORY_CONTENT,
  getAllUniqueTags,
  searchRepositoryContent,
} from '../data/contentRegistry';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';

interface ChatLink {
  label: string;
  domainId?: string;
  url?: string;
  hue: 'gold' | 'cyan';
}

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  links?: ChatLink[];
}

interface BotAndSubsViewProps {
  prefillPrompt?: string | null;
  prefillTopic?: string | null;
  onGoHome: () => void;
  onOpenDomain: (domainId: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

const SUBS_STORAGE_KEY = 'dupaman_subscribers_v2';
const ACTIVE_SUB_STORAGE_KEY = 'dupaman_active_sub_v2';
const TOPIC_NAMES = DUPAMAN_DOMAINS.map((d) => d.shortTitle);

function formatStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

function answerLocally(
  query: string,
  activeSub: SubscriberEntry | null,
  totalSubs: number
): { reply: string; links: ChatLink[]; focusTab?: 'my' | 'list'; topicHint?: string } {
  const q = query.trim().toLowerCase();

  // Subscription management questions
  if (
    q.includes('מנוי') ||
    q.includes('הירשם') ||
    q.includes('הרשמה') ||
    q.includes('עדכונ') ||
    q.includes('רשימ') ||
    q.includes('השה') ||
    q.includes('בטל')
  ) {
    if (q.includes('רשימ') || q.includes('כמה') || q.includes('ניהול')) {
      return {
        reply: `במערכת רשומים כרגע ${totalSubs} מנויים. פתחתי את רשימת המנויים בצד שמאל — ניתן ללחוץ על סטטוס של כל מנוי כדי להחליף בין פעיל, חדש ומושהה.`,
        links: [],
        focusTab: 'list',
      };
    }

    const topicHint = TOPIC_NAMES.find((t) => q.includes(t.toLowerCase()));
    const statusLine = activeSub
      ? `המנוי שלך (${activeSub.name}, ${activeSub.id}) בסטטוס "${activeSub.status}" בתחומים: ${activeSub.topics.join(', ')}.`
      : 'עדיין לא נרשמת כמנוי במכשיר זה.';

    return {
      reply: `${statusLine} תוכל להירשם, לבחור נושאים או להשהות ולחדש את המנוי מיד בפאנל "מנהל המנויים" משמאל.`,
      links: [],
      focusTab: 'my',
      topicHint,
    };
  }

  // 1. Search the live /content repository first (using title, summary & tags across all cards)
  const repoMatches = searchRepositoryContent(query);
  if (repoMatches.length > 0) {
    return {
      reply: `מצאתי ${repoMatches.length} תכנים מתאימים במאגר התכנים (לפי כותרת ותגיות): ${repoMatches
        .map((m) => `"${m.item.title}" [תגיות: ${m.item.tags.join(', ')}]`)
        .join(' | ')}`,
      links: repoMatches.map((m) => ({
        label: m.item.title,
        url: m.item.url,
        domainId: m.item.url ? undefined : m.primaryDomainId,
        hue: m.primaryHue,
      })),
    };
  }

  // 2. Match any brain card directly
  const matchRules: Array<{ id: string; keys: string[] }> = [
    { id: 'brain-top-left', keys: ['חדשות', 'ניוז', 'עדכון', 'מדריכים', 'חודש'] },
    { id: 'brain-mid-left', keys: ['חינוך', 'למידה', 'העלא', 'פעילות', 'כיתה', 'מורה'] },
    { id: 'brain-bottom-left', keys: ['פסיכולוג', 'בריאות', 'קשב', 'דופמין', 'רגשי'] },
    { id: 'brain-top-right', keys: ['אקדמיה', 'בינה', 'ai', 'סוכן', 'פרומפט', 'מדריך'] },
    { id: 'brain-mid-right', keys: ['חדשנות', 'מאגר', 'מוח', 'zero-g', 'מעבדה', 'קוגניצ'] },
    { id: 'brain-bottom-right', keys: ['מדע', 'מורשת', 'חלל', 'פיזיק', 'פרויקט'] },
  ];

  for (const rule of matchRules) {
    if (rule.keys.some((k) => q.includes(k))) {
      const dom = DUPAMAN_DOMAINS.find((d) => d.id === rule.id);
      if (dom) {
        return {
          reply: `כרטיסייה ${dom.indexLabel} ("${dom.title}") פתוחה ומוכנה לתכנים שתעלה לתיקיית content/ עם תגיות מתאימות.`,
          links: [{ label: `${dom.indexLabel} · כניסה ל-${dom.shortTitle}`, domainId: dom.id, hue: dom.hue }],
        };
      }
    }
  }

  const allTags = getAllUniqueTags();
  const repoSummary =
    ALL_REPOSITORY_CONTENT.length > 0
      ? `במאגר התכנים קיימים כרגע ${ALL_REPOSITORY_CONTENT.length} פריטים (תגיות: ${allTags.slice(0, 6).join(', ')}).`
      : 'מאגר התכנים (content/) נקי ומוכן — כל קובץ עם תגיות שתעלה אליו יופיע אוטומטית בכרטיסיות המתאימות ואני אכיר אותו מיד.';

  return {
    reply: `אני הבוט המרכזי של דופמין (DUPAMAN). ${repoSummary} לאיזו כרטיסייה תרצה לעבור?`,
    links: DUPAMAN_DOMAINS.map((d) => ({
      label: `${d.indexLabel} · ${d.shortTitle}`,
      domainId: d.id,
      hue: d.hue,
    })),
  };
}

export function BotAndSubsView({
  prefillPrompt = null,
  prefillTopic = null,
  onGoHome,
  onOpenDomain,
  onOpenLogoSection,
}: BotAndSubsViewProps) {
  const [mobileView, setMobileView] = useState<'bot' | 'subs'>('bot');
  const [subsTab, setSubsTab] = useState<'my' | 'list'>('my');

  const [subscribers, setSubscribers] = useState<SubscriberEntry[]>(() => {
    try {
      const raw = localStorage.getItem(SUBS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SubscriberEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_SUBSCRIBERS;
  });

  const [activeSubId, setActiveSubId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_SUB_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const activeSub = useMemo(
    () => subscribers.find((s) => s.id === activeSubId) ?? null,
    [subscribers, activeSubId]
  );

  const [name, setName] = useState(activeSub?.name ?? '');
  const [email, setEmail] = useState(activeSub?.email ?? '');
  const [topics, setTopics] = useState<string[]>(
    prefillTopic
      ? [prefillTopic]
      : activeSub?.topics?.length
        ? activeSub.topics
        : ['בינה מלאכותית', 'חינוך ולמידה']
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'bot',
      text: 'שלום! אני הבוט של DUPAMAN. אני מכיר את כל 6 המוחות והמקורות המאומתים באתר, ויכול גם לנהל עבורך את המנוי ותחומי העדכון.',
      links: DUPAMAN_DOMAINS.slice(0, 4).map((d) => ({
        label: `${d.indexLabel} · ${d.shortTitle}`,
        domainId: d.id,
        hue: d.hue,
      })),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const lastPrefillRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subscribers));
    } catch {
      // ignore
    }
  }, [subscribers]);

  useEffect(() => {
    try {
      if (activeSubId) localStorage.setItem(ACTIVE_SUB_STORAGE_KEY, activeSubId);
    } catch {
      // ignore
    }
  }, [activeSubId]);

  useEffect(() => {
    if (prefillTopic) {
      setTopics((prev) => (prev.includes(prefillTopic) ? prev : [...prev, prefillTopic]));
    }
  }, [prefillTopic]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, thinking]);

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

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: clean }]);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          activeSubscriber: activeSub,
          subscribersCount: subscribers.length,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { fallback?: boolean; reply?: string };
        if (!data.fallback && data.reply) {
          const localLinks = answerLocally(clean, activeSub, subscribers.length).links;
          setMessages((prev) => [
            ...prev,
            { id: `b-${Date.now()}`, role: 'bot', text: data.reply!, links: localLinks },
          ]);
          return;
        }
      }
    } catch {
      // use local Hebrew brain
    } finally {
      setThinking(false);
    }

    const ans = answerLocally(clean, activeSub, subscribers.length);
    if (ans.focusTab) setSubsTab(ans.focusTab);
    if (ans.topicHint) {
      setTopics((prev) => (prev.includes(ans.topicHint!) ? prev : [...prev, ans.topicHint!]));
    }
    setMessages((prev) => [
      ...prev,
      { id: `b-${Date.now()}`, role: 'bot', text: ans.reply, links: ans.links },
    ]);
  };

  useEffect(() => {
    if (prefillPrompt && lastPrefillRef.current !== prefillPrompt) {
      lastPrefillRef.current = prefillPrompt;
      void sendPrompt(prefillPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPrompt]);

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]
    );
  };

  const handleSaveSub = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'מנוי דופמין';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFeedback('נא להזין כתובת אימייל תקינה.');
      return;
    }

    setSaving(true);
    setFeedback(null);
    let serverId: string | null = null;
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          topics,
          source: 'brain-core-bot',
        }),
      });
      if (res.ok) {
        const d = (await res.json()) as { id?: string };
        if (d.id) serverId = d.id;
      }
    } catch {
      // fallback to local storage
    }

    const existing = subscribers.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updated: SubscriberEntry = {
        ...existing,
        name: cleanName,
        topics,
        status: 'פעיל',
      };
      setSubscribers((prev) => prev.map((s) => (s.id === existing.id ? updated : s)));
      setActiveSubId(existing.id);
      setFeedback(`המנוי עודכן (${existing.id})`);
    } else {
      const newId = serverId || `DUP-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
      const created: SubscriberEntry = {
        id: newId,
        createdAt: formatStamp(),
        name: cleanName,
        email: cleanEmail,
        topics,
        status: 'פעיל',
        source: 'brain-core-bot',
      };
      setSubscribers((prev) => [created, ...prev]);
      setActiveSubId(newId);
      setFeedback(`נרשמת בהצלחה · מזהה ${newId}`);
    }
    setSaving(false);
  };

  const cycleStatus = (id: string) => {
    const order: SubscriberEntry['status'][] = ['פעיל', 'מושהה', 'חדש'];
    setSubscribers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: order[(order.indexOf(s.status) + 1) % order.length] } : s
      )
    );
  };

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
            <span>בוט</span>
          </CrystalButton>
          <CrystalButton
            hue="cyan"
            size="sm"
            active={mobileView === 'subs'}
            onClick={() => setMobileView('subs')}
          >
            <Users className="h-3.5 w-3.5" />
            <span>מנויים</span>
          </CrystalButton>
        </div>
      </div>

      {/* Main Centered Dual Crystal-Glass Chambers (ZERO Page Scroll) */}
      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col px-5 pt-16 pb-6 sm:px-10 sm:pt-14 sm:pb-7">
        <header className="mx-auto mb-4 shrink-0 text-center">
          <div className="font-mono text-[11px] tracking-widest text-[#f8d478]">
            00 · DUPAMAN CORE
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-bold text-white sm:text-3xl"
          >
            הבוט החכם ומנהל המנויים
          </h1>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Chamber 1: AI Site Bot */}
          <section
            className={`min-h-0 flex-col lg:col-span-7 ${
              mobileView === 'bot' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <CrystalCard3D hue="gold" interactive={false} className="h-full min-h-0">
              <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
                <div className="flex shrink-0 items-center justify-between border-b border-white/12 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-5 w-5 text-[#f8d478]" />
                    <span className="text-sm font-semibold text-white">בוט הידע של דופמין</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['חדשות ומדריכים', 'אקדמיה ו-AI', 'ניהול מנוי'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => void sendPrompt(chip)}
                        className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[#dce2ef] transition-colors hover:border-[#f8d478]/45 hover:bg-[#f2be4e]/12 hover:text-white"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contained message feed */}
                <div
                  ref={feedRef}
                  className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl border px-3.5 py-2.5 text-xs leading-relaxed backdrop-blur-md sm:text-sm ${
                          m.role === 'user'
                            ? 'border-[#84e8ff]/35 bg-[#48d6fc]/12 text-[#eefbff]'
                            : 'border-white/16 bg-white/[0.05] text-[#f3f6fc]'
                        }`}
                      >
                        <p>{m.text}</p>
                        {m.links && m.links.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                            {m.links.map((lk) =>
                              lk.url ? (
                                <CrystalLinkButton
                                  key={`${m.id}-${lk.label}`}
                                  href={lk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  hue={lk.hue}
                                  size="sm"
                                  className="px-2.5 py-1 text-[11px]"
                                >
                                  <span>{lk.label}</span>
                                  <ExternalLink className="h-3 w-3 opacity-80" />
                                </CrystalLinkButton>
                              ) : (
                                <CrystalButton
                                  key={`${m.id}-${lk.label}`}
                                  hue={lk.hue}
                                  size="sm"
                                  onClick={() => lk.domainId && onOpenDomain(lk.domainId)}
                                  className="px-2.5 py-1 text-[11px]"
                                >
                                  <span>{lk.label}</span>
                                  <ArrowLeft className="h-3 w-3 opacity-80" />
                                </CrystalButton>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#f8d478]/25 bg-[#f2be4e]/10 px-3 py-1.5 text-xs text-[#fce7b2]">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        חושב...
                      </span>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendPrompt(input);
                  }}
                  className="mt-3 flex shrink-0 items-center gap-2 rounded-xl border border-white/18 bg-white/[0.04] p-1.5 focus-within:border-[#f8d478]/50"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="שאל על כל תחום, אתר מאומת או ניהול מנוי..."
                    className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-[#93a0b8] outline-none sm:text-sm"
                  />
                  <CrystalButton
                    hue="gold"
                    size="sm"
                    type="submit"
                    disabled={!input.trim() || thinking}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>שלח</span>
                  </CrystalButton>
                </form>
              </div>
            </CrystalCard3D>
          </section>

          {/* Chamber 2: Subscription Manager */}
          <section
            className={`min-h-0 flex-col lg:col-span-5 ${
              mobileView === 'subs' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <CrystalCard3D hue="cyan" interactive={false} className="h-full min-h-0">
              <div className="flex h-full min-h-0 flex-col p-4 sm:p-5">
                <div className="flex shrink-0 items-center justify-between border-b border-white/12 pb-3">
                  <span className="text-sm font-semibold text-white">מנהל המנויים</span>
                  <div className="flex items-center gap-1.5">
                    <CrystalButton
                      hue="cyan"
                      size="sm"
                      active={subsTab === 'my'}
                      onClick={() => setSubsTab('my')}
                      className="px-2.5 py-1 text-[11px]"
                    >
                      המנוי שלי
                    </CrystalButton>
                    <CrystalButton
                      hue="neutral"
                      size="sm"
                      active={subsTab === 'list'}
                      onClick={() => setSubsTab('list')}
                      className="px-2.5 py-1 text-[11px]"
                    >
                      מנויים ({subscribers.length})
                    </CrystalButton>
                  </div>
                </div>

                {subsTab === 'my' ? (
                  <form
                    onSubmit={handleSaveSub}
                    className="mt-3 flex min-h-0 flex-1 flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-3">
                      {activeSub && (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-400/28 bg-emerald-400/10 px-3 py-2 text-xs">
                          <div>
                            <div className="font-medium text-emerald-100">{activeSub.name}</div>
                            <div className="font-mono text-[10px] text-emerald-200/80">
                              {activeSub.id} · {activeSub.status}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => cycleStatus(activeSub.id)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] text-white hover:bg-white/20"
                          >
                            {activeSub.status === 'מושהה' ? (
                              <>
                                <PlayCircle className="h-3.5 w-3.5 text-emerald-300" />
                                <span>חדש</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="h-3.5 w-3.5 text-amber-300" />
                                <span>השהה</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="שם"
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
                        <div className="mb-2 text-[11px] text-[#cfd7e6]">תחומי עניין:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {TOPIC_NAMES.map((t) => {
                            const on = topics.includes(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => toggleTopic(t)}
                                className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] transition-colors ${
                                  on
                                    ? 'border-[#84e8ff]/55 bg-[#48d6fc]/16 text-[#ebfbff]'
                                    : 'border-white/14 bg-white/[0.03] text-[#bac4d6] hover:bg-white/10'
                                }`}
                              >
                                {on && <Check className="h-3 w-3 text-[#84e8ff]" />}
                                <span>{t}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
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
                        <span>{saving ? 'שומר...' : activeSub ? 'עדכן מנוי' : 'הירשם למנויים'}</span>
                      </CrystalButton>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {subscribers.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/14 bg-white/[0.04] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-white">{sub.name}</div>
                          <div className="truncate text-[11px] text-[#bac4d6]">{sub.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => cycleStatus(sub.id)}
                          className={`shrink-0 cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] ${
                            sub.status === 'פעיל'
                              ? 'border-emerald-400/40 bg-emerald-400/14 text-emerald-200'
                              : sub.status === 'חדש'
                                ? 'border-[#84e8ff]/40 bg-[#48d6fc]/14 text-[#c2f4ff]'
                                : 'border-amber-400/40 bg-amber-400/14 text-amber-200'
                          }`}
                        >
                          {sub.status}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CrystalCard3D>
          </section>
        </div>
      </main>
    </div>
  );
}
