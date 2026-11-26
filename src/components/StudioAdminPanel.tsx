import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  Edit3,
  ExternalLink,
  EyeOff,
  Layers,
  Lock,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { DUPAMAN_DOMAINS } from '../data/dupamanCatalog';
import { STUDIO_EXHIBITS, type StudioExhibitSample } from '../data/studioSamples';
import {
  STUDIO_CMS_TAB_URL,
  STUDIO_OWNER_EMAIL,
  STUDIO_OWNER_NAME,
  STUDIO_SHEET_URL,
  getHiddenExhibitIds,
  isOwnerEmail,
  refreshExhibitsFromServer,
  removeOrHideExhibit,
  restoreHiddenExhibit,
  upsertStudioExhibit,
  useOwnerSession,
  useStudioExhibits,
  type SheetInboxRow,
} from '../data/exhibitsStore';
import { CrystalButton, CrystalCard3D } from './GlassPrimitives';
import { FloatingLogoTrigger, type LogoDestination } from './FloatingLogoTrigger';
import { SubtleBrainBackdrop } from './SubtleBrainBackdrop';

interface StudioAdminPanelProps {
  onGoHome: () => void;
  onOpenDomain: (domainId: string) => void;
  onOpenLogoSection: (dest: LogoDestination) => void;
}

const NODE_OPTIONS: Array<{
  code: StudioExhibitSample['nodeCode'];
  domainId: string;
  label: string;
  hue: 'gold' | 'cyan';
}> = [
  { code: '01', domainId: 'brain-top-left', label: '01 · ממשקי מחר', hue: 'cyan' },
  { code: '02', domainId: 'brain-mid-left', label: '02 · מוח מכונה', hue: 'cyan' },
  { code: '03', domainId: 'brain-bottom-left', label: '03 · למידה חיה', hue: 'gold' },
  { code: '04', domainId: 'brain-top-right', label: '04 · אדריכלות הקשב', hue: 'cyan' },
  { code: '05', domainId: 'brain-mid-right', label: '05 · רוח ומקור', hue: 'cyan' },
  { code: '06', domainId: 'brain-bottom-right', label: '06 · חדר המיזמים', hue: 'gold' },
];

export function StudioAdminPanel({
  onGoHome,
  onOpenDomain,
  onOpenLogoSection,
}: StudioAdminPanelProps) {
  const session = useOwnerSession();
  const activeExhibits = useStudioExhibits();
  const isOwner = Boolean(session && isOwnerEmail(session.email));

  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'sheet' | 'connect'>('manage');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterNode, setFilterNode] = useState<string>('all');

  // Form state
  const [nodeCode, setNodeCode] = useState<StudioExhibitSample['nodeCode']>('03');
  const [statusLabel, setStatusLabel] = useState('מוצר חי');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('צפה בדמו ↗');
  const [tagsInput, setTagsInput] = useState('DUPAMAN, Studio, AI');
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sheet inbox state (strictly read-only preview until Rafael clicks Approve!)
  const [sheetRows, setSheetRows] = useState<SheetInboxRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetReadConnected, setSheetReadConnected] = useState(false);
  const [sheetWriteConfigured, setSheetWriteConfigured] = useState(false);
  const [sheetConnectionError, setSheetConnectionError] = useState<string | null>(null);
  const [sheetSearch, setSheetSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; domainId?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOwner) {
      onGoHome();
    }
  }, [isOwner, onGoHome]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onGoHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGoHome]);

  const loadSheetInbox = async () => {
    setSheetLoading(true);
    const res = await refreshExhibitsFromServer(true, session);
    setSheetRows(res.sheetInbox);
    setSheetReadConnected(res.sheetConnected);
    setSheetWriteConfigured(res.writeConfigured);
    setSheetConnectionError(res.error ?? null);
    setSheetLoading(false);
  };

  useEffect(() => {
    if (isOwner && (activeTab === 'sheet' || activeTab === 'connect')) {
      void loadSheetInbox();
    }
  }, [isOwner, activeTab]);

  const hiddenIds = useMemo(() => getHiddenExhibitIds(), [activeExhibits]);

  const hiddenBuiltinItems = useMemo(
    () => STUDIO_EXHIBITS.filter((b) => hiddenIds.has(b.id)),
    [hiddenIds]
  );

  const visibleList = useMemo(() => {
    if (filterNode === 'all') return activeExhibits;
    return activeExhibits.filter((e) => e.nodeCode === filterNode);
  }, [activeExhibits, filterNode]);

  const filteredSheetRows = useMemo(() => {
    const q = sheetSearch.trim().toLowerCase();
    if (!q) return sheetRows;
    return sheetRows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.tabLabel.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
    );
  }, [sheetRows, sheetSearch]);

  if (!isOwner) return null;

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setUrl('');
    setStatusLabel('מוצר חי');
    setActionLabel('צפה בדמו ↗');
    setTagsInput('DUPAMAN, Studio, AI');
    setDroppedFileName(null);
  };

  const applyDetectedFile = (file: File) => {
    setDroppedFileName(file.name);
    const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (!title.trim()) setTitle(cleanName);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx'].includes(ext)) {
      setStatusLabel('מצגת');
      setActionLabel('פתיחת המצגת ↗');
    } else if (['mp4', 'mov', 'webm'].includes(ext)) {
      setStatusLabel('וידאו');
      setActionLabel('צפייה בסרטון ↗');
    } else if (ext === 'pdf') {
      setStatusLabel('PDF / דף פעילות');
      setActionLabel('פתיחת הקובץ ↗');
    }

    if (['md', 'txt'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '').trim();
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.replace(/^#+\s*/, '').trim())
          .filter(Boolean);
        if (!summary.trim() && lines[0]) setSummary(lines[0].slice(0, 180));
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyDetectedFile(f);
  };

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    setSaving(true);

    const nodeOpt = NODE_OPTIONS.find((n) => n.code === nodeCode) || NODE_OPTIONS[2];
    const dom = DUPAMAN_DOMAINS.find((d) => d.id === nodeOpt.domainId);
    const cleanUrl = url.trim();
    const rawTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const techTags: [string, string, string] = [
      rawTags[0] || 'DUPAMAN',
      rawTags[1] || dom?.title || 'Studio',
      rawTags[2] || `Node ${nodeCode}`,
    ];

    const exhibit: StudioExhibitSample = {
      id: editingId || `cms-${Date.now()}`,
      nodeCode,
      nodeTitle: dom?.title || nodeOpt.label,
      domainId: nodeOpt.domainId,
      status: statusLabel.trim() || 'מוצר חי',
      title: title.trim(),
      summary: summary.trim(),
      techTags,
      hue: nodeOpt.hue,
      actionType: cleanUrl ? 'external' : 'bot',
      actionLabel: cleanUrl
        ? actionLabel.trim() || 'צפה בדמו ↗'
        : 'פתח בבוט',
      url: cleanUrl || undefined,
      botPrompt: `האר לי את ${dom?.title || ''} — ${title.trim()}`,
    };

    const res = await upsertStudioExhibit(exhibit, session);
    setSaving(false);
    setToast({ text: res.message, domainId: exhibit.domainId });
    resetForm();
    setActiveTab('manage');
  };

  const handleEditExhibit = (ex: StudioExhibitSample) => {
    setEditingId(ex.id);
    setNodeCode(ex.nodeCode);
    setStatusLabel(ex.status);
    setTitle(ex.title);
    setSummary(ex.summary);
    setUrl(ex.url || '');
    setActionLabel(ex.actionLabel);
    setTagsInput(ex.techTags.join(', '));
    setActiveTab('create');
  };

  const handleLoadSheetRowIntoEditor = (row: SheetInboxRow) => {
    setEditingId(row.id);
    setNodeCode(row.suggestedNodeCode);
    setStatusLabel(row.tabLabel.includes('מאמר') ? 'מאמר' : 'מוכן להפעלה');
    setTitle(row.title);
    setSummary(row.summary);
    setUrl(row.url);
    setActionLabel(row.url ? 'פתיחת התוכן ↗' : 'פתח בבוט');
    setTagsInput(`${row.topic || 'DUPAMAN'}, Studio, ${row.suggestedNodeCode}`);
    setActiveTab('create');
    setToast({ text: 'נטען לעריכה שלך — בדוק את הפרטים ולחץ "אשר והצג באתר" רק כשתרצה לפרסם.' });
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#020204] text-[#f3f5fa]"
    >
      <SubtleBrainBackdrop accent="gold" />

      <FloatingLogoTrigger mode="floating-corner" onNavigate={onOpenLogoSection} />

      {/* סרגל עליון שמאלי */}
      <div className="fixed top-5 left-5 z-40 flex items-center gap-2">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>חזרה לאתר</span>
        </CrystalButton>
        <a
          href={STUDIO_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
        >
          <Database className="h-3.5 w-3.5" />
          <span>גיליון מאמרים ↗</span>
        </a>
        <a
          href={STUDIO_CMS_TAB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-xl border border-[#f8d478]/45 bg-[#f2be4e]/15 px-3 py-1.5 text-xs font-semibold text-[#fff1c7] transition-colors hover:bg-[#f2be4e]/25 sm:inline-flex"
        >
          <Database className="h-3.5 w-3.5" />
          <span>לשונית Studio_CMS ↗</span>
        </a>
      </div>

      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col gap-3 px-5 pt-16 pb-5 sm:px-8 sm:pt-14">
        {/* כותרת לוח הבקרה הפרטי */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f8d478]/35 bg-[#120f08]/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f8d478]/45 bg-[#f2be4e]/15 text-[#f8d478]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#f8d478]">
                <Lock className="h-3 w-3" />
                <span>לוח בקרה פרטי · {STUDIO_OWNER_NAME} בלבד (נסתר משאר המשתמשים)</span>
              </div>
              <div className="text-[11px] text-[#cfd8ea]">
                שום תוכן לא עולה לאתר מעצמו — רק אישור סופי שלך בלוח הבקרה מפרסם אותו.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'manage'
                  ? 'border-[#f8d478]/65 bg-[#f2be4e]/22 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>מוצג כרגע באתר ({activeExhibits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'border-[#f8d478]/65 bg-[#f2be4e]/22 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{editingId ? 'עריכת תוכן' : 'הוספת תוכן / קובץ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'sheet'
                  ? 'border-[#84e8ff]/65 bg-[#48d6fc]/20 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>בחירה מהגיליון שלך</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('connect')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'connect'
                  ? 'border-emerald-400/65 bg-emerald-500/20 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>חיבור כתיבה לגיליון</span>
            </button>
          </div>
        </header>

        {/* הודעת משוב חיה */}
        {toast && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/45 bg-emerald-500/15 px-4 py-2.5 text-xs text-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
              <span>{toast.text}</span>
            </div>
            <div className="flex items-center gap-2">
              {toast.domainId && (
                <button
                  type="button"
                  onClick={() => onOpenDomain(toast.domainId!)}
                  className="cursor-pointer rounded-lg border border-emerald-300/45 bg-emerald-500/25 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-500/40"
                >
                  צפה בצומת באתר ↗
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="cursor-pointer text-[11px] text-emerald-200 hover:text-white"
              >
                סגור
              </button>
            </div>
          </div>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {/* לשונית 1: ניהול מלא של מה שמופיע כרגע באתר (הצגה / עריכה / הסרה / שחזור) */}
          {activeTab === 'manage' && (
            <CrystalCard3D hue="cyan" interactive={false} className="w-full">
              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      התכנים המוצגים כעת באתר ({visibleList.length})
                    </h2>
                    <p className="text-xs text-[#cfd8ea]">
                      כאן אתה שולט ב-100%: ערוך כל כרטיסייה, הסר אותה מהאתר בלחיצה, או הוסף תוכן חדש לכל צומת.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterNode('all')}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] ${
                        filterNode === 'all'
                          ? 'border-[#84e8ff]/60 bg-[#48d6fc]/20 text-white'
                          : 'border-white/12 text-[#c7d3e6]'
                      }`}
                    >
                      כל הצמתים
                    </button>
                    {NODE_OPTIONS.map((n) => (
                      <button
                        key={n.code}
                        type="button"
                        onClick={() => setFilterNode(n.code)}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] ${
                          filterNode === n.code
                            ? 'border-[#f8d478]/60 bg-[#f2be4e]/20 text-white'
                            : 'border-white/12 text-[#c7d3e6]'
                        }`}
                      >
                        {n.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {visibleList.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between gap-2.5 rounded-2xl border border-white/14 bg-white/[0.04] p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-[#f8d478]">
                            צומת {ex.nodeCode} · {ex.nodeTitle}
                          </span>
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                            מוצג באתר · {ex.status}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-bold text-white sm:text-base">{ex.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#cfd8ea]">
                          {ex.summary}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditExhibit(ex)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/18 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>ערוך</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDomain(ex.domainId)}
                            className="cursor-pointer rounded-lg border border-[#84e8ff]/40 bg-[#48d6fc]/14 px-2.5 py-1 text-[11px] font-semibold text-[#dcf8ff] hover:bg-[#48d6fc]/25"
                          >
                            צפה בצומת ↗
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const res = await removeOrHideExhibit(ex, session);
                            setToast({ text: res.message });
                          }}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/30"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>הסר מהאתר</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* פריטי בסיס שהוסתרו — ניתן להחזיר בלחיצה */}
                {hiddenBuiltinItems.length > 0 && (
                  <div className="mt-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5">
                    <div className="mb-2 text-xs font-bold text-amber-200">
                      תכנים שהסתרת מהאתר ({hiddenBuiltinItems.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hiddenBuiltinItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={async () => {
                            await restoreHiddenExhibit(item.id, session);
                            setToast({ text: `"${item.title}" הוחזר לתצוגה באתר.`, domainId: item.domainId });
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300/40 bg-black/30 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/20"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>החזר את: {item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CrystalCard3D>
          )}

          {/* לשונית 2: הוספת / עריכת תוכן וקובץ */}
          {activeTab === 'create' && (
            <CrystalCard3D hue="gold" interactive={false} className="w-full">
              <form onSubmit={handlePublish} className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-12">
                <div className="flex flex-col gap-3 lg:col-span-7">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed px-4 py-3 transition-colors ${
                      isDragging
                        ? 'border-[#f8d478] bg-[#f2be4e]/18'
                        : 'border-white/20 bg-white/[0.03] hover:border-[#84e8ff]/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.md,.txt,.mp4,.png,.jpg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) applyDetectedFile(f);
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-[#f8d478]" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {droppedFileName
                            ? `זוהה קובץ: ${droppedFileName}`
                            : 'בחירת קובץ / גרירה (PDF, מצגת, וידאו, MD) למילוי אוטומטי'}
                        </div>
                        <div className="text-[11px] text-[#aeb9cf]">
                          הדבק למטה את הקישור לקובץ ב-Google Drive / מצגת / אתר חי
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        בחר צומת באתר *
                      </label>
                      <select
                        value={nodeCode}
                        onChange={(e) => setNodeCode(e.target.value as StudioExhibitSample['nodeCode'])}
                        className="w-full rounded-xl border border-white/18 bg-[#0b101d] px-3 py-2 text-xs text-white outline-none focus:border-[#f8d478]/60"
                      >
                        {NODE_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        תגית סטטוס (למשל: מוצר חי / מצגת / דף עבודה)
                      </label>
                      <input
                        type="text"
                        value={statusLabel}
                        onChange={(e) => setStatusLabel(e.target.value)}
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#f8d478]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                      כותרת התוכן *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="הזן כותרת ברורה שתוצג בכרטיסייה..."
                      className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                      תיאור תמציתי *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="תיאור נקי ומדויק של התוכן או הפעילות..."
                      className="w-full resize-none rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 lg:col-span-5">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        קישור לתוכן / קובץ (Google Drive / Slides / אתר / YouTube)
                      </label>
                      <input
                        type="url"
                        dir="ltr"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        טקסט כפתור הפעולה
                      </label>
                      <input
                        type="text"
                        value={actionLabel}
                        onChange={(e) => setActionLabel(e.target.value)}
                        placeholder="צפה בדמו ↗"
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#84e8ff]/60"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        3 תגיות (מופרדות בפסיק)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#84e8ff]/60"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <CrystalButton
                      hue="gold"
                      size="md"
                      type="submit"
                      disabled={saving || !title.trim() || !summary.trim()}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{saving ? 'שומר...' : editingId ? 'שמור שינויים באתר' : 'אשר והצג באתר'}</span>
                    </CrystalButton>
                    {editingId && (
                      <CrystalButton
                        hue="neutral"
                        size="md"
                        type="button"
                        onClick={() => {
                          resetForm();
                          setActiveTab('manage');
                        }}
                      >
                        <span>ביטול</span>
                      </CrystalButton>
                    )}
                  </div>
                </div>
              </form>
            </CrystalCard3D>
          )}

          {/* לשונית 3: בחירה מבוקרת מתוך הגיליון (שום דבר מכאן לא מוצג באתר עד שתלחץ לאשר!) */}
          {activeTab === 'sheet' && (
            <CrystalCard3D hue="cyan" interactive={false} className="w-full">
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      תכנים מהגיליון שלך — לעריכה ואישור שלך בלבד ({filteredSheetRows.length})
                    </h2>
                    <p className="text-xs text-[#c7d3e6]">
                      שום פריט כאן אינו מופיע באתר הציבורי. לחץ &quot;ערוך ובדוק&quot; על כל שורה שתרצה להכין לפרסום.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      placeholder="חפש בשורות הגיליון..."
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                    />
                    <CrystalButton
                      hue="cyan"
                      size="sm"
                      onClick={() => void loadSheetInbox()}
                      disabled={sheetLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${sheetLoading ? 'animate-spin' : ''}`} />
                      <span>רענן מהגיליון</span>
                    </CrystalButton>
                  </div>
                </div>

                {sheetLoading ? (
                  <div className="py-10 text-center text-xs text-[#cfd8ea]">
                    קורא שורות מהגיליון שלך...
                  </div>
                ) : filteredSheetRows.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#cfd8ea]">
                    לא נמצאו שורות תואמות — לחץ &quot;רענן מהגיליון&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {filteredSheetRows.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-col justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-3.5"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                            <span className="rounded-md border border-[#84e8ff]/35 bg-[#48d6fc]/12 px-2 py-0.5 font-semibold text-[#dcf8ff]">
                              {row.tabLabel} · צומת מוצע {row.suggestedNodeCode}
                            </span>
                            <span className="text-amber-300">טיוטה (לא באתר)</span>
                          </div>
                          <h3 className="mt-1.5 text-sm font-bold text-white">{row.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#d7e2f5]">
                            {row.summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
                          <button
                            type="button"
                            onClick={() => handleLoadSheetRowIntoEditor(row)}
                            className="cursor-pointer rounded-lg border border-[#f8d478]/50 bg-[#f2be4e]/18 px-3 py-1 text-[11px] font-bold text-[#fff2cf] hover:bg-[#f2be4e]/30"
                          >
                            ערוך ובדוק לפני אישור
                          </button>
                          {row.url && (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#84e8ff] hover:underline"
                            >
                              <span>פתח קישור מקור</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CrystalCard3D>
          )}

          {/* לשונית 4: מצב החיבור המרכזי */}
          {activeTab === 'connect' && (
            <CrystalCard3D hue="gold" interactive={false} className="w-full">
              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white">חיבור מרכזי לאתר ולגיליון</h2>
                    <p className="mt-1 max-w-3xl text-xs leading-6 text-[#cfd8ea]">
                      כתובת החיבור והסודות מוגדרים בשרת Vercel בלבד. שמירת קישור בדפדפן אינה מחברת את האתר לכל המשתמשים.
                      פריטים מהגיליון נשארים בתיבת הבדיקה; רק אישור שלך בלוח הבקרה מעביר פריט לפרסום.
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    sheetReadConnected && sheetWriteConfigured
                      ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-200'
                      : 'border-amber-400/45 bg-amber-500/15 text-amber-200'
                  }`}>
                    {sheetReadConnected && sheetWriteConfigured
                      ? 'שרת הגיליון מחובר לקריאה ולכתיבה'
                      : sheetReadConnected
                        ? 'קריאה פעילה · הגדרת כתיבה חסרה'
                        : 'החיבור המרכזי טרם אומת'}
                  </span>
                </div>

                {sheetConnectionError && (
                  <div role="status" className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {sheetConnectionError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a
                    href={STUDIO_CMS_TAB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    פתח את Studio_CMS
                  </a>
                  <a
                    href="https://github.com/rafia22110/DUPAMAN-Digital-Product-Studio/blob/main/apps-script/README.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    הוראות חיבור השרת
                  </a>
                  <CrystalButton hue="cyan" size="sm" type="button" onClick={() => void loadSheetInbox()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>בדוק חיבור מחדש</span>
                  </CrystalButton>
                </div>
              </div>
            </CrystalCard3D>
          )}
        </section>
      </main>
    </div>
  );
}
