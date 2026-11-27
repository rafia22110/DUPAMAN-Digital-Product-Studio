import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { DUPAMAN_DOMAINS, type BrainDomain } from '../data/dupamanCatalog';
import { useStudioExhibits } from '../data/exhibitsStore';
import { CrystalButton } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { StudioExhibitCard } from './StudioExhibitCard';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';
import { usePublicLanguage, translateText } from '../i18n';

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
  const language = usePublicLanguage();
  const en = language === 'en';
  const allExhibits = useStudioExhibits();
  const domainExhibits = useMemo(
    () => allExhibits.filter((e) => e.domainId === domain.id),
    [allExhibits, domain.id]
  );
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [domain.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onGoHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome]);

  const safeIdx = domainExhibits.length > 0 ? activeIdx % domainExhibits.length : 0;
  const exhibit = domainExhibits[safeIdx];
  const isGold = domain.hue === 'gold';

  return (
    <div
      dir={en ? "ltr" : "rtl"}
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#020204] text-[#f3f5fa] select-none"
    >
      <SubtleBrainBackdrop accent={isGold ? 'gold' : 'cyan'} />

      {/* Floating Top-Right Transparent DUPAMAN Logo */}
      <FloatingLogoTrigger mode="floating-corner" onNavigate={onOpenLogoSection} />

      {/* Floating Top-Left Minimal Glass Controls */}
      <div className="fixed top-5 left-5 z-40 flex items-center gap-2">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>{en ? "Back" : "חזרה"}</span>
        </CrystalButton>
        <CrystalButton
          hue="gold"
          size="sm"
          onClick={() => onOpenBot(`האר לי את ${translateText(domain.title, language)}`, domain.shortTitle)}
        >
          <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
          <span className="hidden sm:inline">{en ? "Studio · Live introduction" : "הסטודיו · כרטיס ביקור חי"}</span>
        </CrystalButton>
      </div>

      {/* Main Centered Zero-Scroll Spatial Canvas */}
      <main className="relative z-20 flex h-full w-full max-w-5xl flex-col justify-between px-5 pt-16 pb-6 sm:px-10 sm:pt-14 sm:pb-7">
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
              {translateText(domain.kicker, language)}
            </span>
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            {domain.title}
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#d7dfee]/85 sm:text-sm">
            {translateText(domain.description, language)}
          </p>
        </header>

        {/* Single Clean Luxury Exhibit Template Centered in Viewport (with subtle switcher only if Rafael added >1 item) */}
        <section className="my-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5">
          {domainExhibits.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <CrystalButton
                hue="neutral"
                size="sm"
                onClick={() =>
                  setActiveIdx((prev) => (prev - 1 + domainExhibits.length) % domainExhibits.length)
                }
                className="px-2.5 py-1 text-[11px]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </CrystalButton>
              {domainExhibits.map((item, idx) => (
                <CrystalButton
                  key={item.id}
                  hue={domain.hue}
                  size="sm"
                  active={idx === safeIdx}
                  onClick={() => setActiveIdx(idx)}
                  className="px-3 py-1 text-[11px]"
                >
                  <span>{translateText(item.title, language)}</span>
                </CrystalButton>
              ))}
              <CrystalButton
                hue="neutral"
                size="sm"
                onClick={() => setActiveIdx((prev) => (prev + 1) % domainExhibits.length)}
                className="px-2.5 py-1 text-[11px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </CrystalButton>
            </div>
          )}

          {exhibit ? (
            <div className="w-full max-w-5xl">
              <StudioExhibitCard
                exhibit={exhibit}
                onOpenInBot={(prompt, topic) => onOpenBot(prompt, topic)}
              />
            </div>
          ) : (
            <div className="h-full w-full" aria-label={en ? "Content area" : "דף נקי ומוכן לתכנים"} />
          )}
        </section>

        {/* Minimal Floating Glass Switcher Across All 6 Locked Studio Nodes */}
        <nav
          aria-label={en ? "Navigate the six domains" : "מעבר בין 6 הצמתים"}
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
              <span>{translateText(d.shortTitle, language)}</span>
            </CrystalButton>
          ))}
        </nav>
      </main>
    </div>
  );
}
