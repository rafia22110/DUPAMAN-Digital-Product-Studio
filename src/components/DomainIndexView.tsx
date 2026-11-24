import { useEffect, useState } from 'react';
import { ArrowRight, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { DUPAMAN_DOMAINS, type BrainDomain } from '../data/dupamanCatalog';
import { findExhibitsByDomainId } from '../data/studioSamples';
import { CrystalButton } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { StudioExhibitCard } from './StudioExhibitCard';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';

interface DomainIndexViewProps {
  domain: BrainDomain;
  onSelectDomain: (domainId: string) => void;
  onGoHome: () => void;
  onOpenBot: (prefillPrompt?: string, prefillTopic?: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

export function DomainIndexView({
  domain,
  onSelectDomain,
  onGoHome,
  onOpenBot,
  onOpenLogoSection,
}: DomainIndexViewProps) {
  const exhibits = findExhibitsByDomainId(domain.id);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [domain.id]);

  const safeIdx = exhibits.length > 0 ? activeIdx % exhibits.length : 0;
  const currentExhibit = exhibits[safeIdx];
  const isGold = domain.hue === 'gold';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onGoHome();
      } else if (exhibits.length > 1 && e.key === 'ArrowLeft') {
        setActiveIdx((prev) => (prev + 1) % exhibits.length);
      } else if (exhibits.length > 1 && e.key === 'ArrowRight') {
        setActiveIdx((prev) => (prev - 1 + exhibits.length) % exhibits.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome, exhibits.length]);

  const handleNext = () => {
    if (exhibits.length > 1) {
      setActiveIdx((prev) => (prev + 1) % exhibits.length);
    }
  };

  const handlePrev = () => {
    if (exhibits.length > 1) {
      setActiveIdx((prev) => (prev - 1 + exhibits.length) % exhibits.length);
    }
  };

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
          onClick={() => onOpenBot(`האר לי את ${domain.title}`, domain.shortTitle)}
        >
          <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
          <span className="hidden sm:inline">הסטודיו · כרטיס ביקור חי</span>
        </CrystalButton>
      </div>

      {/* Main Centered Zero-Scroll Spatial Canvas */}
      <main className="relative z-20 flex h-full w-full max-w-5xl flex-col justify-between px-5 pt-16 pb-5 sm:px-10 sm:pt-12 sm:pb-6">
        {/* Clean Floating Title Header */}
        <header className="mx-auto flex max-w-2xl shrink-0 flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-widest text-[#dce0ea]/85">
            <span
              dir="ltr"
              style={{ fontFamily: 'var(--font-display)' }}
              className={isGold ? 'text-[#f8d478]' : 'text-[#84e8ff]'}
            >
              {domain.indexLabel}
            </span>
            <span className="opacity-40">·</span>
            <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }}>
              {domain.kicker}
            </span>
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {domain.title}
          </h1>
          <p className="mt-0.5 text-xs leading-relaxed text-[#d7dfee]/85 sm:text-sm">
            {domain.description}
          </p>
        </header>

        {/* Organized Section Tabs + Centered Exhibit Showcase + Quick "מתאים / מה הבא" Bar */}
        <section className="my-2 flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          {exhibits.length > 1 && (
            <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-3 py-2 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-1.5">
                {exhibits.map((item, idx) => {
                  const active = idx === safeIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-medium transition-all ${
                        active
                          ? isGold
                            ? 'border-[#f8d478]/65 bg-[#f2be4e]/20 text-white shadow-[0_0_16px_rgba(248,212,120,0.2)]'
                            : 'border-[#84e8ff]/65 bg-[#48d6fc]/20 text-white shadow-[0_0_16px_rgba(132,232,255,0.2)]'
                          : 'border-white/12 bg-white/[0.03] text-[#c7d3e6] hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {item.code && (
                        <span
                          dir="ltr"
                          style={{ fontFamily: 'var(--font-display)' }}
                          className="text-[10px] opacity-80"
                        >
                          {item.code}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#aeb9cf]">
                  {safeIdx + 1} / {exhibits.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="היצירה הקודמת"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] text-[#e6edf9] hover:bg-white/15"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>הקודם</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="מה הבא"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#f8d478]/40 bg-[#f2be4e]/15 px-2.5 py-1 text-[11px] font-semibold text-[#fff3cf] hover:bg-[#f2be4e]/25"
                >
                  <span>מה הבא?</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {currentExhibit ? (
            <div className="w-full max-w-5xl">
              <StudioExhibitCard
                exhibit={currentExhibit}
                onOpenInBot={(prompt, topic) => onOpenBot(prompt, topic)}
              />
            </div>
          ) : (
            <div className="h-full w-full" aria-label="דף נקי ומוכן לתכנים" />
          )}
        </section>

        {/* Minimal Floating Glass Switcher Across All 6 Locked Studio Nodes */}
        <nav
          aria-label="מעבר בין 6 הצמתים"
          className="mx-auto flex shrink-0 flex-wrap items-center justify-center gap-1.5"
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
              <span
                dir="ltr"
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-[10px] opacity-70"
              >
                {d.indexLabel}
              </span>
              <span>{d.shortTitle}</span>
            </CrystalButton>
          ))}
        </nav>
      </main>
    </div>
  );
}
