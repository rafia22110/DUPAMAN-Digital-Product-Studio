import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  FileText,
  Film,
  FolderOpen,
  Globe,
  Presentation,
  Search,
} from 'lucide-react';
import { DUPAMAN_DOMAINS, type BrainDomain } from '../data/dupamanCatalog';
import { useStudioExhibits } from '../data/exhibitsStore';
import type { ExhibitMediaType, StudioExhibitSample } from '../data/studioSamples';
import { ExhibitContentViewerModal } from './ExhibitContentViewerModal';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { CrystalButton } from './GlassPrimitives';
import { GalleryResourceCard } from './StudioExhibitCard';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';

interface DomainIndexViewProps {
  domain: BrainDomain;
  onSelectDomain: (domainId: string) => void;
  onGoHome: () => void;
  onOpenBot: (prefillPrompt?: string, prefillTopic?: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

const MEDIA_FILTERS: Array<{
  id: 'all' | ExhibitMediaType;
  label: string;
  icon: typeof FolderOpen;
}> = [
  { id: 'all', label: 'הכול', icon: FolderOpen },
  { id: 'presentation', label: 'מצגות', icon: Presentation },
  { id: 'pdf', label: 'PDF ומסמכים', icon: FileText },
  { id: 'video', label: 'וידאו', icon: Film },
  { id: 'live-app', label: 'אתרים וכלים חיים', icon: Globe },
];

export function DomainIndexView({
  domain,
  onSelectDomain,
  onGoHome,
  onOpenBot,
  onOpenLogoSection,
}: DomainIndexViewProps) {
  const allExhibits = useStudioExhibits();
  const domainExhibits = useMemo(
    () => allExhibits.filter((e) => e.domainId === domain.id),
    [allExhibits, domain.id]
  );

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<'all' | ExhibitMediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedSection('all');
    setSelectedMedia('all');
    setSearchQuery('');
    setViewerIndex(null);
  }, [domain.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewerIndex === null) {
        onGoHome();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome, viewerIndex]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    for (const ex of domainExhibits) {
      if (ex.sectionLabel) set.add(ex.sectionLabel);
    }
    return Array.from(set);
  }, [domainExhibits]);

  const filteredExhibits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return domainExhibits.filter((ex) => {
      if (selectedSection !== 'all' && ex.sectionLabel !== selectedSection) return false;
      if (selectedMedia !== 'all' && ex.mediaType !== selectedMedia) return false;
      if (q) {
        const hay = `${ex.title} ${ex.summary} ${ex.sectionLabel} ${ex.mediaBadge} ${ex.techTags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [domainExhibits, selectedSection, selectedMedia, searchQuery]);

  // Group filtered exhibits by clear Section ("מדור") headings
  const groupedBySection = useMemo(() => {
    const map = new Map<string, StudioExhibitSample[]>();
    for (const ex of filteredExhibits) {
      const key = ex.sectionLabel || `מדור ${domain.title}`;
      const list = map.get(key) || [];
      list.push(ex);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredExhibits, domain.title]);

  const isGold = domain.hue === 'gold';
  const isEducationalNode = domain.id === 'brain-bottom-left';

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#04070f] text-[#f4f7fc]"
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

      {/* Organized Gallery & Content Repository Container */}
      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col gap-3.5 px-4 pt-16 pb-4 sm:px-8 sm:pt-14 sm:pb-5">
        {/* Clean Repository Header */}
        <header className="flex shrink-0 flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest text-[#cbd5e1]">
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
            <span className="opacity-40">·</span>
            <span>{domainExhibits.length} תכנים במאגר</span>
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          >
            {domain.title}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#dce5f5] sm:text-sm">
            {isEducationalNode
              ? 'מאגר פעילויות, מצגות וכלים נגיש למורות ולהורים — לחצו על כל כרטיסייה לצפייה ישירה בתוכן המלא, הורדה, הדפסה או מעבר לפריט הבא.'
              : domain.description}
          </p>
        </header>

        {/* Practical Repository Filter Bar: Search + Sections ("מדורים") + Media Type */}
        <div className="flex shrink-0 flex-col gap-2.5 rounded-2xl border border-white/14 bg-[#0b1120]/85 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Quick Search */}
            <div className="relative min-w-[210px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש חופשי במאגר (למשל: חנוכה, PDF, מצגת)..."
                className="w-full rounded-xl border border-white/16 bg-white/[0.05] py-2 pr-9 pl-3 text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#f8d478]/60 sm:text-sm"
              />
            </div>

            {/* Media-Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {MEDIA_FILTERS.map((mf) => {
                const Icon = mf.icon;
                const active = selectedMedia === mf.id;
                return (
                  <button
                    key={mf.id}
                    type="button"
                    onClick={() => setSelectedMedia(mf.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? isGold
                          ? 'border-[#f8d478]/65 bg-[#f2be4e]/22 text-white'
                          : 'border-[#84e8ff]/65 bg-[#48d6fc]/22 text-white'
                        : 'border-white/12 bg-white/[0.04] text-[#cbd5e1] hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{mf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear Department / Section ("מדורים") Tabs */}
          {sections.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
              <span className="ml-1 text-[11px] font-bold text-[#9eb2d1]">מדורים:</span>
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  selectedSection === 'all'
                    ? 'border-white/45 bg-white/16 text-white'
                    : 'border-white/10 bg-white/[0.03] text-[#cbd5e1] hover:text-white'
                }`}
              >
                כל המדורים ({domainExhibits.length})
              </button>
              {sections.map((sec) => {
                const active = selectedSection === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                      active
                        ? isGold
                          ? 'border-[#f8d478]/65 bg-[#f2be4e]/20 text-[#fff4d4]'
                          : 'border-[#84e8ff]/65 bg-[#48d6fc]/20 text-[#ebfbff]'
                        : 'border-white/10 bg-white/[0.03] text-[#cbd5e1] hover:text-white'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Spacious Scrollable Gallery Organized by Clear Section Headings ("מדורים") */}
        <section className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1">
          {groupedBySection.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-white/12 bg-white/[0.03] p-8 text-center">
              <FolderOpen className="h-8 w-8 text-[#94a3b8]" />
              <div className="text-sm font-bold text-white">לא נמצאו תכנים תואמים לסינון</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSection('all');
                  setSelectedMedia('all');
                  setSearchQuery('');
                }}
                className="mt-1 cursor-pointer rounded-xl border border-[#84e8ff]/45 bg-[#48d6fc]/15 px-4 py-1.5 text-xs font-bold text-white hover:bg-[#48d6fc]/28"
              >
                הצג את כל התכנים בצומת
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-3">
              {groupedBySection.map(([secName, items]) => (
                <div key={secName} className="flex flex-col gap-3">
                  {/* Clear Section Heading ("כותרת מדור ברורה") */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isGold ? 'bg-[#f8d478]' : 'bg-[#84e8ff]'
                        }`}
                      />
                      <h2 className="text-base font-extrabold text-white sm:text-lg">{secName}</h2>
                      <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#cbd5e1]">
                        {items.length === 1 ? 'פריט 1' : `${items.length} פריטים`}
                      </span>
                    </div>
                    <div className="hidden h-px flex-1 bg-gradient-to-l from-white/15 to-transparent sm:block" />
                  </div>

                  {/* Clean Responsive Gallery Grid (Video cards span wider just like the sketch!) */}
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      items.length === 1
                        ? 'max-w-3xl'
                        : items.length === 2
                          ? 'md:grid-cols-2'
                          : 'md:grid-cols-2 xl:grid-cols-3'
                    }`}
                  >
                    {items.map((item) => {
                      const flatIdx = filteredExhibits.findIndex((f) => f.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className={
                            item.mediaType === 'video' && items.length > 1
                              ? 'md:col-span-2'
                              : ''
                          }
                        >
                          <GalleryResourceCard
                            exhibit={item}
                            accessibleMode={isEducationalNode}
                            onOpenViewer={() => setViewerIndex(flatIdx >= 0 ? flatIdx : 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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

      {/* REAL Live Document / Slides / Video / Web App Full-Screen Viewer */}
      {viewerIndex !== null && filteredExhibits.length > 0 && (
        <ExhibitContentViewerModal
          exhibits={filteredExhibits}
          activeIndex={viewerIndex}
          onChangeIndex={(next) => setViewerIndex(next)}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
