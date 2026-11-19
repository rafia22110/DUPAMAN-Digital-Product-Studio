import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Landmark,
  Newspaper,
  X,
} from 'lucide-react';
import {
  DUPAMAN_DOMAINS,
  MAX_NEWS_AGE_DAYS,
  formatDaysAgoHebrew,
  type BrainDomain,
} from '../data/dupamanCatalog';
import {
  getContentForCard,
  type BrainCardCode,
  type RepositoryContentItem,
} from '../data/contentRegistry';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';

interface DomainIndexViewProps {
  domain: BrainDomain;
  onSelectDomain: (domainId: string) => void;
  onGoHome: () => void;
  onOpenBot: (prefillPrompt?: string, prefillTopic?: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

const ITEMS_PER_PAGE = 6;

export function DomainIndexView({
  domain,
  onSelectDomain,
  onGoHome,
  onOpenBot,
  onOpenLogoSection,
}: DomainIndexViewProps) {
  const [newsTab, setNewsTab] = useState<'news' | 'guides'>('news');
  const [eduTab, setEduTab] = useState<'learning' | 'heritage'>('learning');
  const [page, setPage] = useState(0);
  const [openItem, setOpenItem] = useState<RepositoryContentItem | null>(null);

  useEffect(() => {
    setOpenItem(null);
    setPage(0);
  }, [domain.id, newsTab, eduTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openItem) setOpenItem(null);
        else onGoHome();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItem, onGoHome]);

  const cardCode = domain.indexLabel as BrainCardCode;
  const allItems = useMemo(() => {
    return getContentForCard(cardCode, {
      newsSection: domain.kind === 'news-hub' ? newsTab : undefined,
      eduSubTab: cardCode === '02' ? eduTab : undefined,
    });
  }, [cardCode, domain.kind, newsTab, eduTab]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleItems = allItems.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  const isGold = domain.hue === 'gold' || (cardCode === '02' && eduTab === 'heritage');

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#020204] text-[#f3f5fa] select-none"
    >
      <SubtleBrainBackdrop accent={isGold ? 'gold' : 'cyan'} />

      {/* Floating Top-Right Transparent DUPAMAN Logo */}
      <FloatingLogoTrigger mode="floating-corner" onNavigate={onOpenLogoSection} />

      {/* Floating Top-Left Minimal Glass Controls */}
      <div className="fixed top-5 left-5 z-40 flex items-center gap-2">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>חזרה</span>
        </CrystalButton>
        <CrystalButton
          hue="gold"
          size="sm"
          onClick={() => onOpenBot(`ספר לי על התכנים ב-${domain.title}`, domain.shortTitle)}
        >
          <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
          <span className="hidden sm:inline">בוט ומנויים</span>
        </CrystalButton>
      </div>

      {/* Main Centered Zero-Scroll Spatial Canvas */}
      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col justify-between px-5 pt-14 pb-5 sm:px-10 sm:pt-12 sm:pb-6">
        {/* Clean Floating Title Header */}
        <header className="mx-auto flex max-w-2xl shrink-0 flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-widest text-[#dce0ea]/85">
            <span className={`font-mono ${isGold ? 'text-[#f8d478]' : 'text-[#84e8ff]'}`}>
              {domain.indexLabel}
            </span>
            <span className="opacity-40">·</span>
            <span>{domain.kicker}</span>
            {allItems.length > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-mono text-[10px] opacity-80">{allItems.length} פריטים</span>
              </>
            )}
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {domain.title}
          </h1>

          {/* Card 01: News | Guides Toggle (<= 30 Days) */}
          {domain.kind === 'news-hub' && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <CrystalButton
                hue="cyan"
                size="sm"
                active={newsTab === 'news'}
                onClick={() => setNewsTab('news')}
              >
                <Newspaper className="h-3.5 w-3.5" />
                <span>חדשות</span>
              </CrystalButton>
              <CrystalButton
                hue="gold"
                size="sm"
                active={newsTab === 'guides'}
                onClick={() => setNewsTab('guides')}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>מדריכים</span>
              </CrystalButton>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/14 bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#cfd7e6] backdrop-blur-md">
                <CalendarClock className="h-3.5 w-3.5 text-[#84e8ff]" />
                <span>עד {MAX_NEWS_AGE_DAYS} יום בלבד</span>
              </span>
            </div>
          )}

          {/* Card 02: Education | Heritage, History & Judaism Sub-Tab */}
          {cardCode === '02' && (
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <CrystalButton
                hue="cyan"
                size="sm"
                active={eduTab === 'learning'}
                onClick={() => setEduTab('learning')}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>חינוך ולמידה פעילה</span>
              </CrystalButton>
              <CrystalButton
                hue="gold"
                size="sm"
                active={eduTab === 'heritage'}
                onClick={() => setEduTab('heritage')}
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>הגות, היסטוריה ויהדות</span>
              </CrystalButton>
            </div>
          )}
        </header>

        {/* Zero-Scroll 3D Crystal-Glass Cards Stage (Up to 6 Cards Per Page) */}
        <section className="my-3.5 flex min-h-0 flex-1 items-center justify-center">
          {visibleItems.length > 0 ? (
            <div
              className={`grid h-full w-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 ${
                visibleItems.length > 4
                  ? 'lg:grid-cols-3 lg:grid-rows-2'
                  : visibleItems.length <= 3
                    ? 'lg:grid-cols-3'
                    : 'sm:grid-rows-2'
              }`}
            >
              {visibleItems.map((item, idx) => {
                const cardHue =
                  domain.kind === 'news-hub'
                    ? newsTab === 'guides'
                      ? 'gold'
                      : 'cyan'
                    : isGold
                      ? 'gold'
                      : 'cyan';
                const num = safePage * ITEMS_PER_PAGE + idx + 1;
                return (
                  <CrystalCard3D
                    key={item.id}
                    hue={cardHue}
                    onClick={() => {
                      if (!item.url) setOpenItem(item);
                    }}
                    className="min-h-0"
                  >
                    <div className="flex h-full flex-col justify-between p-4 sm:p-5">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#dce0ea]/85">
                          <span
                            className={`truncate ${
                              cardHue === 'gold' ? 'text-[#f8d478]' : 'text-[#84e8ff]'
                            }`}
                          >
                            {String(num).padStart(2, '0')} · {item.type || item.sourceName || domain.shortTitle}
                          </span>
                          {item.publishedAt && (
                            <span className="shrink-0 font-mono text-[10px] text-[#c8d4e8]">
                              {formatDaysAgoHebrew(item.publishedAt)}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-1.5 line-clamp-1 text-base font-semibold tracking-tight text-white">
                          {item.title}
                        </h2>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#e6e9f0]/88">
                          {item.summary}
                        </p>

                        {item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#d6def0]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2">
                        {item.url ? (
                          <CrystalLinkButton
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            hue={cardHue}
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                          >
                            <span>פתיחת מקור</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </CrystalLinkButton>
                        ) : (
                          <CrystalButton
                            hue={cardHue}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenItem(item);
                            }}
                            className="flex-1"
                          >
                            <span>פתיחת תוכן</span>
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </CrystalButton>
                        )}

                        <CrystalButton
                          hue="neutral"
                          size="sm"
                          title="שאל את הבוט על תוכן זה"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBot(`ספר לי על "${item.title}"`, domain.shortTitle);
                          }}
                          className="px-2.5"
                        >
                          <Bot className="h-3.5 w-3.5 opacity-80" />
                        </CrystalButton>
                      </div>
                    </div>
                  </CrystalCard3D>
                );
              })}
            </div>
          ) : (
            <div className="h-full w-full" aria-label="דף נקי ומוכן לתכנים" />
          )}
        </section>

        {/* Bottom Controls: Optional Zero-Scroll Pagination + Minimal 6-Brain Switcher */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <CrystalButton
                hue={isGold ? 'gold' : 'cyan'}
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-2.5 py-1 text-[11px]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span>הקודם</span>
              </CrystalButton>
              <span className="font-mono text-[11px] text-[#cfd7e6]">
                {safePage + 1} / {totalPages}
              </span>
              <CrystalButton
                hue={isGold ? 'gold' : 'cyan'}
                size="sm"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-2.5 py-1 text-[11px]"
              >
                <span>הבא</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </CrystalButton>
            </div>
          )}

          <nav
            aria-label="מעבר בין 6 המוחות"
            className="mx-auto flex flex-wrap items-center justify-center gap-1.5"
          >
            {DUPAMAN_DOMAINS.map((d) => (
              <CrystalButton
                key={d.id}
                hue={d.hue}
                size="sm"
                active={d.id === domain.id}
                onClick={() => onSelectDomain(d.id)}
                className="px-3 py-1 text-[11px]"
              >
                <span className="font-mono text-[10px] opacity-70">{d.indexLabel}</span>
                <span>{d.shortTitle}</span>
              </CrystalButton>
            ))}
          </nav>
        </div>
      </main>

      {/* Floating Crystal-Glass Content Viewer (for in-site items without external URL) */}
      {openItem && (
        <div
          onClick={() => setOpenItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#010205]/65 p-5 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'glassCardReveal 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            className="w-full max-w-xl"
          >
            <CrystalCard3D hue={isGold ? 'gold' : 'cyan'} interactive={false}>
              <div className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className={`font-mono text-[11px] ${
                        isGold ? 'text-[#f8d478]' : 'text-[#84e8ff]'
                      }`}
                    >
                      {domain.title} {openItem.type ? `· ${openItem.type}` : ''}
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-white">{openItem.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenItem(null)}
                    aria-label="סגור"
                    className="cursor-pointer rounded-xl border border-white/18 bg-white/[0.05] p-2 text-white/80 hover:bg-white/15 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm leading-7 text-[#e6eaf3]">{openItem.summary}</p>
                {openItem.details && (
                  <p className="rounded-xl border border-white/12 bg-white/[0.04] p-4 text-xs leading-6 text-[#cfd7e6]">
                    {openItem.details}
                  </p>
                )}

                {openItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {openItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/14 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[#dce4f5]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <CrystalButton
                    hue="gold"
                    size="sm"
                    onClick={() => onOpenBot(`ספר לי עוד על "${openItem.title}"`, domain.shortTitle)}
                  >
                    <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
                    <span>שאל את הבוט</span>
                  </CrystalButton>
                  <CrystalButton hue="neutral" size="sm" onClick={() => setOpenItem(null)}>
                    <span>סגור</span>
                  </CrystalButton>
                </div>
              </div>
            </CrystalCard3D>
          </div>
        </div>
      )}
    </div>
  );
}
