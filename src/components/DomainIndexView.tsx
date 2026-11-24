import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Download,
  FileText,
  Film,
  FolderOpen,
  Globe,
  Presentation,
  Printer,
  Search,
  Sparkles,
} from 'lucide-react';
import { DUPAMAN_DOMAINS, type BrainDomain } from '../data/dupamanCatalog';
import { useStudioExhibits } from '../data/exhibitsStore';
import type { ExhibitMediaType, StudioExhibitSample } from '../data/studioSamples';
import {
  ExhibitContentViewerModal,
  triggerPrintExhibitSheet,
  triggerSmartDownloadExhibit,
} from './ExhibitContentViewerModal';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { CrystalButton } from './GlassPrimitives';
import { GalleryResourceCard, getExhibitCover } from './StudioExhibitCard';
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
  { id: 'pdf', label: 'מאמרים, PDF ודפי עבודה', icon: FileText },
  { id: 'video', label: 'וידאו', icon: Film },
  { id: 'live-app', label: 'אפליקציות ואתרים', icon: Globe },
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
  const featuredItem =
    selectedSection === 'all' && selectedMedia === 'all' && !searchQuery.trim()
      ? filteredExhibits[0]
      : null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#03050b] text-[#f4f7fc]"
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

      {/* Luxury Spatial Gallery Canvas */}
      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col gap-3 px-4 pt-16 pb-4 sm:px-8 sm:pt-12 sm:pb-5">
        {/* Sleek Top Title Strip */}
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
            <span className="text-white/85">{domainExhibits.length} תכנים במאגר</span>
          </div>
          <h1
            style={{ textShadow: '0 4px 24px rgba(2,4,10,0.85)' }}
            className="mt-0.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          >
            {domain.title}
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-[#cbd5e1] sm:text-sm">
            {isEducationalNode
              ? 'מאגר פעילויות, מצגות ודפי עבודה — לחצו על כל כרטיסייה לצפייה מלאה, הורדה או הדפסה.'
              : domain.description}
          </p>
        </header>

        {/* Scrollable Luxury Gallery Area (Hero Spotlight + Filter Pills + Section Grids) */}
        <section className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1">
          <div className="flex flex-col gap-5 pb-4">
            {/* 1. LUXURY HERO SPOTLIGHT BANNER (inspired by Pinterest Chess / Steary / Flix references) */}
            {featuredItem && (
              <div
                className={`relative overflow-hidden rounded-[26px] border p-5 sm:p-7 ${
                  isGold
                    ? 'border-[#f8d478]/35 shadow-[0_24px_70px_rgba(0,0,0,0.68)]'
                    : 'border-[#84e8ff]/35 shadow-[0_24px_70px_rgba(0,0,0,0.68)]'
                }`}
              >
                <img
                  src={getExhibitCover(featuredItem)}
                  alt={featuredItem.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-[#04070e]/95 via-[#060b16]/82 to-[#04070e]/50" />

                <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div className="max-w-2xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 font-bold backdrop-blur-md ${
                          isGold
                            ? 'border-[#f8d478]/50 bg-[#f2be4e]/18 text-[#fff3cf]'
                            : 'border-[#84e8ff]/50 bg-[#48d6fc]/18 text-[#dcf8ff]'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>מומלץ לפתיחה · {featuredItem.sectionLabel}</span>
                      </span>
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/18 px-2.5 py-0.5 font-bold text-emerald-200">
                        {featuredItem.readiness}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {featuredItem.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#e2eaf7] sm:text-sm">
                      {featuredItem.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewerIndex(0)}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all sm:text-sm ${
                        isGold
                          ? 'bg-gradient-to-l from-[#f8d478] to-[#eab308] text-[#0b0e14] shadow-[0_8px_28px_rgba(248,212,120,0.3)] hover:brightness-110'
                          : 'bg-gradient-to-l from-[#84e8ff] to-[#38bdf8] text-[#06101b] shadow-[0_8px_28px_rgba(72,214,252,0.3)] hover:brightness-110'
                      }`}
                    >
                      <span>צפייה בתוכן המלא</span>
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerSmartDownloadExhibit(featuredItem)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/22 bg-white/[0.08] px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/18"
                    >
                      <Download className="h-3.5 w-3.5 text-[#84e8ff]" />
                      <span>הורדה</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerPrintExhibitSheet(featuredItem)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/22 bg-white/[0.08] px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/18"
                    >
                      <Printer className="h-3.5 w-3.5 text-[#f8d478]" />
                      <span>הדפסה</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SLEEK SEARCH & DEPARTMENT FILTER BAR */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-white/12 bg-[#0a0f1c]/85 p-3 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
                  <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש מהיר (חנוכה, דפי עבודה, AI, מאמר)..."
                    className="w-full rounded-full border border-white/14 bg-white/[0.05] py-2 pr-9 pl-4 text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#f8d478]/60 sm:text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {MEDIA_FILTERS.map((mf) => {
                    const Icon = mf.icon;
                    const active = selectedMedia === mf.id;
                    return (
                      <button
                        key={mf.id}
                        type="button"
                        onClick={() => setSelectedMedia(mf.id)}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                          active
                            ? isGold
                              ? 'border-[#f8d478]/65 bg-[#f2be4e]/22 text-white'
                              : 'border-[#84e8ff]/65 bg-[#48d6fc]/22 text-white'
                            : 'border-white/10 bg-white/[0.04] text-[#cbd5e1] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{mf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {sections.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
                  <span className="ml-1 text-[11px] font-bold text-[#94a3b8]">מדורים:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSection('all')}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      selectedSection === 'all'
                        ? 'border-white/45 bg-white/16 text-white'
                        : 'border-white/10 bg-white/[0.03] text-[#cbd5e1] hover:text-white'
                    }`}
                  >
                    הכול ({domainExhibits.length})
                  </button>
                  {sections.map((sec) => {
                    const active = selectedSection === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
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

            {/* 3. LUXURY SECTION-GROUPED GALLERY GRIDS */}
            {groupedBySection.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/12 bg-white/[0.03] p-10 text-center">
                <FolderOpen className="h-9 w-9 text-[#94a3b8]" />
                <div className="text-sm font-bold text-white">לא נמצאו תכנים תואמים לסינון</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSection('all');
                    setSelectedMedia('all');
                    setSearchQuery('');
                  }}
                  className="mt-1 cursor-pointer rounded-full border border-[#84e8ff]/45 bg-[#48d6fc]/15 px-4 py-1.5 text-xs font-bold text-white hover:bg-[#48d6fc]/28"
                >
                  הצג את כל התכנים בצומת
                </button>
              </div>
            ) : (
              groupedBySection.map(([secName, items]) => (
                <div key={secName} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isGold
                            ? 'bg-[#f8d478] shadow-[0_0_12px_rgba(248,212,120,0.8)]'
                            : 'bg-[#84e8ff] shadow-[0_0_12px_rgba(132,232,255,0.8)]'
                        }`}
                      />
                      <h2 className="text-base font-extrabold text-white sm:text-lg">{secName}</h2>
                      <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#cbd5e1]">
                        {items.length === 1 ? 'פריט 1' : `${items.length} פריטים`}
                      </span>
                    </div>
                    <div className="hidden h-px flex-1 bg-gradient-to-l from-white/15 to-transparent sm:block" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => {
                      const flatIdx = filteredExhibits.findIndex((f) => f.id === item.id);
                      return (
                        <GalleryResourceCard
                          key={item.id}
                          exhibit={item}
                          accessibleMode={isEducationalNode}
                          onOpenViewer={() => setViewerIndex(flatIdx >= 0 ? flatIdx : 0)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
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
