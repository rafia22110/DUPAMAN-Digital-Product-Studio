import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  FileText,
  Film,
  Layers,
  Link2,
  Lock,
  PlusCircle,
  Presentation,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { DUPAMAN_DOMAINS } from '../data/dupamanCatalog';
import {
  type ExhibitMediaType,
  type StudioExhibitSample,
} from '../data/studioSamples';
import {
  STUDIO_OWNER_EMAIL,
  STUDIO_OWNER_NAME,
  STUDIO_SHEET_URL,
  deleteStudioExhibit,
  getLocalCustomExhibits,
  getSavedSheetScriptUrl,
  isOwnerEmail,
  refreshExhibitsFromServer,
  saveSheetScriptUrl,
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
  defaultSection: string;
}> = [
  { code: '01', domainId: 'brain-top-left', label: '01 · ממשקי מחר', hue: 'cyan', defaultSection: 'מדור ממשקי סוכן' },
  { code: '02', domainId: 'brain-mid-left', label: '02 · מוח מכונה', hue: 'cyan', defaultSection: 'מדור מערכות AI' },
  { code: '03', domainId: 'brain-bottom-left', label: '03 · למידה חיה', hue: 'gold', defaultSection: 'מדור מצגות ופעילויות לכיתה' },
  { code: '04', domainId: 'brain-top-right', label: '04 · אדריכלות הקשב', hue: 'cyan', defaultSection: 'מדור קשב וכלים קוגניטיביים' },
  { code: '05', domainId: 'brain-mid-right', label: '05 · רוח ומקור', hue: 'cyan', defaultSection: 'מדור מחקר עומק ומורשת' },
  { code: '06', domainId: 'brain-bottom-right', label: '06 · חדר המיזמים', hue: 'gold', defaultSection: 'מדור מיזמים להאצה' },
];

const MEDIA_OPTIONS: Array<{
  id: ExhibitMediaType;
  label: string;
  badge: string;
  icon: typeof Film;
}> = [
  { id: 'presentation', label: 'מצגת', badge: 'מצגת', icon: Presentation },
  { id: 'pdf', label: 'PDF / דף פעילות', badge: 'PDF', icon: FileText },
  { id: 'video', label: 'וידאו', badge: 'וידאו', icon: Film },
  { id: 'live-app', label: 'אפליקציה / אתר חי', badge: 'מוצר חי', icon: Link2 },
];

const APPS_SCRIPT_SNIPPET = `const SPREADSHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const CMS_SHEET_NAME = 'Studio_CMS';
const ALLOWED_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
const HEADERS = ['id','code','nodeCode','sectionLabel','mediaType','mediaBadge','status','readinessPct','title','summary','highlights','techTags','liveUrl','liveLabel','githubUrl','audienceNote','isEducational','updatedAt'];

function getOrCreateCmsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CMS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CMS_SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  }
  return sheet;
}
function jsonOut(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet(){
  const sheet = getOrCreateCmsSheet();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return jsonOut({ ok: true, exhibits: [] });
  const h = rows[0];
  const exhibits = rows.slice(1).filter(r => String(r[0]||'').trim() && String(r[8]||'').trim()).map(r => {
    const obj = {}; h.forEach((k,i) => obj[String(k)] = r[i]); return obj;
  });
  return jsonOut({ ok: true, exhibits });
}
function doPost(e){
  const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if (String(p.ownerEmail||'').trim().toLowerCase() !== ALLOWED_OWNER_EMAIL) return jsonOut({ ok: false, error: 'Unauthorized' });
  const sheet = getOrCreateCmsSheet();
  if (p.action === 'delete') {
    const rows = sheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) if (String(rows[i][0]) === String(p.id||'')) { sheet.deleteRow(i+1); return jsonOut({ ok: true }); }
    return jsonOut({ ok: false, error: 'Not found' });
  }
  const ex = p.exhibit || {};
  const id = String(ex.id || 'cms-' + Date.now());
  const vals = [id, String(ex.code||''), String(ex.nodeCode||'03'), String(ex.sectionLabel||''), String(ex.mediaType||'pdf'), String(ex.mediaBadge||'PDF'), String(ex.status||''), Number(ex.readinessPct||90), String(ex.title||''), String(ex.summary||''), Array.isArray(ex.highlights)?ex.highlights.join(' || '):'', Array.isArray(ex.techTags)?ex.techTags.join(', '):'', String(ex.liveUrl||''), String(ex.liveLabel||'פתיחה'), String(ex.githubUrl||''), String(ex.audienceNote||''), ex.isEducational?'TRUE':'FALSE', new Date().toISOString()];
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) if (String(rows[i][0]) === id) { sheet.getRange(i+1,1,1,vals.length).setValues([vals]); return jsonOut({ ok: true, id }); }
  sheet.appendRow(vals);
  return jsonOut({ ok: true, id });
}`;

export function StudioAdminPanel({
  onGoHome,
  onOpenDomain,
  onOpenLogoSection,
}: StudioAdminPanelProps) {
  const session = useOwnerSession();
  const allExhibits = useStudioExhibits();
  const isOwner = Boolean(session && isOwnerEmail(session.email));

  const [activeTab, setActiveTab] = useState<'create' | 'sheet' | 'manage' | 'connect'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create / Edit Form state
  const [nodeCode, setNodeCode] = useState<StudioExhibitSample['nodeCode']>('03');
  const [sectionLabel, setSectionLabel] = useState('מדור מצגות ופעילויות לכיתה');
  const [mediaType, setMediaType] = useState<ExhibitMediaType>('presentation');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveLabel, setLiveLabel] = useState('פתיחת התוכן');
  const [githubUrl, setGithubUrl] = useState('');
  const [readinessPct, setReadinessPct] = useState(95);
  const [tagsInput, setTagsInput] = useState('פעילות לכיתה, מוכן להדפסה, DUPAMAN');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [audienceNote, setAudienceNote] = useState('');
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; domainId?: string } | null>(null);

  // Google Sheet Inbox state
  const [sheetRows, setSheetRows] = useState<SheetInboxRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetConnected, setSheetConnected] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');

  // Manage filter
  const [filterNode, setFilterNode] = useState<string>('all');

  // Script connector settings
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getSavedSheetScriptUrl());
  const [copiedScript, setCopiedScript] = useState(false);

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
    const res = await refreshExhibitsFromServer(true);
    setSheetRows(res.sheetInbox);
    setSheetConnected(res.sheetConnected);
    setSheetLoading(false);
  };

  useEffect(() => {
    if (isOwner && (activeTab === 'sheet' || activeTab === 'connect')) {
      void loadSheetInbox();
    }
  }, [isOwner, activeTab]);

  const filteredSheetRows = useMemo(() => {
    const q = sheetSearch.trim().toLowerCase();
    if (!q) return sheetRows;
    return sheetRows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.subtopic.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
    );
  }, [sheetRows, sheetSearch]);

  const customIds = useMemo(
    () => new Set(getLocalCustomExhibits().map((e) => e.id)),
    [allExhibits]
  );

  const visibleExhibits = useMemo(() => {
    if (filterNode === 'all') return allExhibits;
    return allExhibits.filter((e) => e.nodeCode === filterNode);
  }, [allExhibits, filterNode]);

  if (!isOwner) {
    return null;
  }

  const handleNodeChange = (nextCode: StudioExhibitSample['nodeCode']) => {
    setNodeCode(nextCode);
    const opt = NODE_OPTIONS.find((n) => n.code === nextCode);
    if (opt && !editingId) {
      setSectionLabel(opt.defaultSection);
    }
  };

  const applyDetectedFile = (file: File) => {
    setDroppedFileName(file.name);
    const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (!title.trim()) setTitle(cleanName);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm'].includes(ext)) {
      setMediaType('video');
      setLiveLabel('צפייה בווידאו');
    } else if (['ppt', 'pptx', 'key'].includes(ext)) {
      setMediaType('presentation');
      setLiveLabel('פתיחת המצגת');
    } else {
      setMediaType('pdf');
      setLiveLabel('פתיחת הקובץ');
    }

    if (['md', 'txt'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '').trim();
        if (text) {
          const lines = text
            .split(/\r?\n/)
            .map((l) => l.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').trim())
            .filter(Boolean);
          if (!summary.trim() && lines[0]) setSummary(lines[0].slice(0, 180));
          if (!highlightsInput.trim() && lines.length > 1) {
            setHighlightsInput(lines.slice(1, 5).join('\n'));
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyDetectedFile(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setTitle('');
    setSummary('');
    setLiveUrl('');
    setLiveLabel('פתיחת התוכן');
    setGithubUrl('');
    setReadinessPct(95);
    setHighlightsInput('');
    setAudienceNote('');
    setDroppedFileName(null);
  };

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    setSaving(true);

    const nodeOpt = NODE_OPTIONS.find((n) => n.code === nodeCode) || NODE_OPTIONS[2];
    const mediaOpt = MEDIA_OPTIONS.find((m) => m.id === mediaType) || MEDIA_OPTIONS[0];
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const techTags: [string, string, string] = [
      parsedTags[0] || mediaOpt.badge,
      parsedTags[1] || nodeOpt.label.split('·')[1]?.trim() || 'Studio',
      parsedTags[2] || 'DUPAMAN',
    ];
    const highlights = highlightsInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const cleanUrl = liveUrl.trim();
    const exhibit: StudioExhibitSample = {
      id: editingId || `cms-${Date.now()}`,
      code: code.trim() || `DUP-${String(Math.floor(100 + Math.random() * 899))}`,
      nodeCode,
      nodeTitle: DUPAMAN_DOMAINS.find((d) => d.id === nodeOpt.domainId)?.title || nodeOpt.label,
      domainId: nodeOpt.domainId,
      sectionLabel: sectionLabel.trim() || nodeOpt.defaultSection,
      mediaType,
      mediaBadge: mediaOpt.badge,
      status: `${readinessPct}% מוכן להפעלה`,
      readiness: `${readinessPct}% מוכן להפעלה`,
      readinessPct,
      title: title.trim(),
      subtitle: summary.trim(),
      summary: summary.trim(),
      highlights: highlights.length > 0 ? highlights : undefined,
      techTags,
      hue: nodeOpt.hue,
      actionType: cleanUrl ? 'external' : 'bot',
      actionLabel: cleanUrl ? `${liveLabel.trim() || 'פתיחה'} ↗` : 'פתח בבוט',
      url: cleanUrl || undefined,
      liveUrl: cleanUrl || undefined,
      liveLabel: liveLabel.trim() || 'פתיחת התוכן',
      githubUrl: githubUrl.trim() || undefined,
      isEducational: nodeCode === '03',
      audienceNote:
        audienceNote.trim() ||
        (nodeCode === '03'
          ? 'מוכן להקרנה, הדפסה ושיתוף מיידי למורות, הורים ותלמידים.'
          : undefined),
      botPrompt: `האר לי את ${title.trim()}`,
    };

    const result = await upsertStudioExhibit(exhibit, session);
    setSaving(false);
    setToast({ text: result.message, domainId: exhibit.domainId });
    resetForm();
  };

  const handleImportSheetRowToForm = (row: SheetInboxRow) => {
    setEditingId(null);
    handleNodeChange(row.suggestedNodeCode);
    setSectionLabel(row.subtopic ? `מדור ${row.subtopic}` : `מדור ${row.topic || 'תוכן'}`);
    setMediaType(row.mediaType);
    setCode(`SHEET-${row.rowIndex}`);
    setTitle(row.title);
    setSummary(row.summary);
    setLiveUrl(row.url);
    setLiveLabel(row.mediaType === 'video' ? 'צפייה בווידאו' : 'קריאת המקור');
    setTagsInput([row.topic || 'DUPAMAN', row.source || 'Google Sheet', row.date || '2026'].join(', '));
    setHighlightsInput(row.highlights.join('\n'));
    setReadinessPct(100);
    setActiveTab('create');
    setToast({ text: `נטען מהגיליון (שורה ${row.rowIndex}) — בדוק צומת ולחץ "פרסם עכשיו"!` });
  };

  const handleQuickPublishSheetRow = async (row: SheetInboxRow) => {
    const nodeOpt = NODE_OPTIONS.find((n) => n.code === row.suggestedNodeCode) || NODE_OPTIONS[1];
    const exhibit: StudioExhibitSample = {
      id: `sheet-row-${row.rowIndex}`,
      code: `SH-${row.rowIndex}`,
      nodeCode: row.suggestedNodeCode,
      nodeTitle: DUPAMAN_DOMAINS.find((d) => d.id === nodeOpt.domainId)?.title || nodeOpt.label,
      domainId: nodeOpt.domainId,
      sectionLabel: row.subtopic ? `מדור ${row.subtopic}` : nodeOpt.defaultSection,
      mediaType: row.mediaType,
      mediaBadge: row.mediaBadge,
      status: '100% מוכן להפעלה',
      readiness: '100% מוכן להפעלה',
      readinessPct: 100,
      title: row.title,
      subtitle: row.summary,
      summary: row.summary,
      highlights: row.highlights.length > 0 ? row.highlights : undefined,
      techTags: [row.topic || 'Studio', row.source || 'Sheet', row.date || '2026'],
      hue: nodeOpt.hue,
      actionType: row.url ? 'external' : 'bot',
      actionLabel: row.url ? 'פתיחת המקור ↗' : 'פתח בבוט',
      url: row.url || undefined,
      liveUrl: row.url || undefined,
      liveLabel: row.mediaType === 'video' ? 'צפייה בווידאו' : 'פתיחת המקור',
      isEducational: row.suggestedNodeCode === '03',
      botPrompt: `האר לי את ${row.title}`,
    };
    const res = await upsertStudioExhibit(exhibit, session);
    setToast({ text: `השורה פורסמה לצומת ${row.suggestedNodeCode}! ${res.message}`, domainId: exhibit.domainId });
  };

  const handleEditExhibit = (ex: StudioExhibitSample) => {
    setEditingId(ex.id);
    setNodeCode(ex.nodeCode);
    setSectionLabel(ex.sectionLabel);
    setMediaType(ex.mediaType);
    setCode(ex.code || '');
    setTitle(ex.title);
    setSummary(ex.summary);
    setLiveUrl(ex.liveUrl || ex.url || '');
    setLiveLabel(ex.liveLabel || 'פתיחת התוכן');
    setGithubUrl(ex.githubUrl || '');
    setReadinessPct(ex.readinessPct);
    setTagsInput(ex.techTags.join(', '));
    setHighlightsInput((ex.highlights || []).join('\n'));
    setAudienceNote(ex.audienceNote || '');
    setActiveTab('create');
  };

  const handleSaveScriptUrl = async (e: FormEvent) => {
    e.preventDefault();
    saveSheetScriptUrl(scriptUrlInput);
    await loadSheetInbox();
    setToast({ text: 'כתובת ה-Apps Script נשמרה ונבדקה מול הגיליון.' });
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#020204] text-[#f3f5fa]"
    >
      <SubtleBrainBackdrop accent="gold" />

      <FloatingLogoTrigger mode="floating-corner" onNavigate={onOpenLogoSection} />

      {/* Top-left private header controls */}
      <div className="fixed top-5 left-5 z-40 flex items-center gap-2">
        <CrystalButton hue="neutral" size="sm" onClick={onGoHome}>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>חזרה לסטודיו</span>
        </CrystalButton>
        <a
          href={STUDIO_SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25"
        >
          <Database className="h-3.5 w-3.5" />
          <span>פתח גיליון Google Sheets ↗</span>
        </a>
      </div>

      <main className="relative z-20 flex h-full w-full max-w-6xl flex-col gap-3 px-5 pt-16 pb-5 sm:px-8 sm:pt-14">
        {/* Owner Badge Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f8d478]/35 bg-[#120f08]/75 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f8d478]/45 bg-[#f2be4e]/15 text-[#f8d478]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#f8d478]">
                <Lock className="h-3 w-3" />
                <span>לוח בקרה פרטי · גלוי לך בלבד ({STUDIO_OWNER_NAME})</span>
              </div>
              <div className="text-[11px] text-[#cfd8ea]" dir="ltr">
                {STUDIO_OWNER_EMAIL} · Google Sheet Connected
              </div>
            </div>
          </div>

          {/* 4 Clean Admin Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'border-[#f8d478]/65 bg-[#f2be4e]/22 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{editingId ? 'עריכת תוכן' : 'העלאת תוכן / קובץ'}</span>
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
              <span>שורות מהגיליון ({sheetRows.length || 'טען'})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'manage'
                  ? 'border-[#84e8ff]/65 bg-[#48d6fc]/20 text-white'
                  : 'border-white/12 bg-white/[0.04] text-[#cfd8ea] hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>ניהול תכנים ({allExhibits.length})</span>
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

        {/* Live Feedback Banner */}
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
                  צפה עכשיו בצומת ↗
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

        {/* Main Scrollable Control Body inside Zero-Scroll Frame */}
        <section className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {activeTab === 'create' && (
            <CrystalCard3D hue="gold" interactive={false} className="w-full">
              <form onSubmit={handlePublish} className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-12">
                {/* Right Column: File Drop + Core Fields */}
                <div className="flex flex-col gap-3 lg:col-span-7">
                  {/* Drag & Drop Quick File Detector */}
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
                            : 'גרור קובץ (PDF / מצגת / MD / וידאו) למילוי אוטומטי — או הדבק קישור למטה'}
                        </div>
                        <div className="text-[11px] text-[#aeb9cf]">
                          לקבצים גדולים מומלץ להדביק קישור Google Drive / Slides / YouTube בשדה הקישור
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node + Section */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        לאיזה צומת לשייך?
                      </label>
                      <select
                        value={nodeCode}
                        onChange={(e) =>
                          handleNodeChange(e.target.value as StudioExhibitSample['nodeCode'])
                        }
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
                        שם המדור
                      </label>
                      <input
                        type="text"
                        value={sectionLabel}
                        onChange={(e) => setSectionLabel(e.target.value)}
                        placeholder="למשל: מדור מצגות ופעילויות לכיתה"
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                      />
                    </div>
                  </div>

                  {/* Media Type Selector (matching Rafael's sketch!) */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                      סוג כרטיסייה (לפי הסקיצה)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {MEDIA_OPTIONS.map((m) => {
                        const Icon = m.icon;
                        const active = mediaType === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMediaType(m.id)}
                            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all ${
                              active
                                ? 'border-[#f8d478]/65 bg-[#f2be4e]/20 text-white'
                                : 'border-white/12 bg-white/[0.03] text-[#c7d3e6] hover:text-white'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title + Code */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        כותרת התוכן / הפעילות *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="למשל: דף עבודה לחנוכה — כיתות ב׳–ד׳"
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        קוד (אופציונלי)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="DUP-041"
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                      />
                    </div>
                  </div>

                  {/* Concise Summary */}
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                      תיאור קצר (1–2 שורות שיופיעו בכרטיסייה) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="תיאור ברור ונקי של התוכן, למי הוא מתאים ומה מקבלים ממנו..."
                      className="w-full resize-none rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#f8d478]/60"
                    />
                  </div>
                </div>

                {/* Left Column: Links, Highlights, Readiness & Publish */}
                <div className="flex flex-col justify-between gap-3 lg:col-span-5">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        קישור ישיר (Google Drive / Slides / YouTube / אתר חי)
                      </label>
                      <input
                        type="url"
                        dir="ltr"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                          טקסט כפתור הפתיחה
                        </label>
                        <input
                          type="text"
                          value={liveLabel}
                          onChange={(e) => setLiveLabel(e.target.value)}
                          placeholder="פתיחת המצגת / הדגמה"
                          className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#84e8ff]/60"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                          GitHub (אופציונלי)
                        </label>
                        <input
                          type="url"
                          dir="ltr"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/rafia22110/..."
                          className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                          אחוז מוכנות ({readinessPct}%)
                        </label>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          step={5}
                          value={readinessPct}
                          onChange={(e) => setReadinessPct(Number(e.target.value))}
                          className="w-full accent-[#f8d478]"
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
                          className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-[#84e8ff]/60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#cfd8ea]">
                        נקודות מפתח לצפייה מלאה והדפסה (שורה לכל נקודה)
                      </label>
                      <textarea
                        rows={3}
                        value={highlightsInput}
                        onChange={(e) => setHighlightsInput(e.target.value)}
                        placeholder={'נקודה 1: מה לומדים בפעילות\nנקודה 2: הנחיות קצרות למורה\nנקודה 3: קישור לתרגול'}
                        className="w-full resize-none rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <CrystalButton
                      hue="gold"
                      size="md"
                      type="submit"
                      disabled={saving || !title.trim() || !summary.trim()}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {saving
                          ? 'שומר ומפרסם...'
                          : editingId
                            ? 'עדכן תוכן עכשיו'
                            : 'פרסם עכשיו לסטודיו ולגיליון'}
                      </span>
                    </CrystalButton>
                    {editingId && (
                      <CrystalButton hue="neutral" size="md" type="button" onClick={resetForm}>
                        <span>ביטול עריכה</span>
                      </CrystalButton>
                    )}
                  </div>
                </div>
              </form>
            </CrystalCard3D>
          )}

          {activeTab === 'sheet' && (
            <CrystalCard3D hue="cyan" interactive={false} className="w-full">
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      ייבוא ישיר מהגיליון המחובר שלך (Google Sheets)
                    </h2>
                    <p className="text-xs text-[#c7d3e6]">
                      בחר כל שורה מהגיליון ולחץ &quot;פרסם מיד&quot; או &quot;ערוך לפני פרסום&quot; — בלי להעתיק ידנית!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      placeholder="חפש כותרת או נושא בגיליון..."
                      className="rounded-xl border border-white/18 bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/60"
                    />
                    <CrystalButton
                      hue="cyan"
                      size="sm"
                      onClick={() => void loadSheetInbox()}
                      disabled={sheetLoading}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${sheetLoading ? 'animate-spin' : ''}`} />
                      <span>רענן גיליון</span>
                    </CrystalButton>
                  </div>
                </div>

                {sheetLoading ? (
                  <div className="py-10 text-center text-xs text-[#cfd8ea]">
                    טוען שורות חיות מ-Google Sheets...
                  </div>
                ) : filteredSheetRows.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#cfd8ea]">
                    לא נמצאו שורות תואמות — לחץ &quot;רענן גיליון&quot; או פתח את הגיליון ישירות.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {filteredSheetRows.map((row) => (
                      <div
                        key={row.rowIndex}
                        className="flex flex-col justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-3.5"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                            <span className="rounded-md border border-[#84e8ff]/35 bg-[#48d6fc]/12 px-2 py-0.5 font-semibold text-[#dcf8ff]">
                              צומת מוצע: {row.suggestedNodeCode} · {row.topic || 'כללי'}
                            </span>
                            <span className="text-[#9eb0cc]">
                              שורה {row.rowIndex} · {row.date}
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-sm font-bold text-white">{row.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#d7e2f5]">
                            {row.summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleQuickPublishSheetRow(row)}
                              className="cursor-pointer rounded-lg border border-[#f8d478]/50 bg-[#f2be4e]/18 px-2.5 py-1 text-[11px] font-bold text-[#fff2cf] hover:bg-[#f2be4e]/30"
                            >
                              פרסם מיד לצומת {row.suggestedNodeCode}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleImportSheetRowToForm(row)}
                              className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] text-[#e6edf9] hover:bg-white/15"
                            >
                              ערוך לפני פרסום
                            </button>
                          </div>
                          {row.url && (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#84e8ff] hover:underline"
                            >
                              <span>מקור</span>
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

          {activeTab === 'manage' && (
            <CrystalCard3D hue="cyan" interactive={false} className="w-full">
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-white">
                    כל התכנים המוצגים כעת באתר ({visibleExhibits.length})
                  </h2>
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
                      הכול
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

                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {visibleExhibits.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex flex-col justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-3.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-semibold text-[#f8d478]">
                            {ex.nodeCode} · {ex.nodeTitle} · {ex.mediaBadge}
                          </span>
                          <span className="text-emerald-300">{ex.readiness}</span>
                        </div>
                        <div className="mt-1 text-sm font-bold text-white">{ex.title}</div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#cfd8ea]">{ex.summary}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditExhibit(ex)}
                            className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white hover:bg-white/15"
                          >
                            ערוך
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDomain(ex.domainId)}
                            className="cursor-pointer rounded-lg border border-[#84e8ff]/40 bg-[#48d6fc]/14 px-2.5 py-1 text-[11px] text-[#dcf8ff] hover:bg-[#48d6fc]/25"
                          >
                            צפה בצומת ↗
                          </button>
                        </div>
                        {customIds.has(ex.id) && (
                          <button
                            type="button"
                            onClick={() => void deleteStudioExhibit(ex.id, session)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11px] text-rose-200 hover:bg-rose-500/30"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>מחק</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CrystalCard3D>
          )}

          {activeTab === 'connect' && (
            <CrystalCard3D hue="gold" interactive={false} className="w-full">
              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      חיבור כתיבה ישירה דו-כיוונית לגיליון Google Sheets שלך
                    </h2>
                    <p className="mt-0.5 text-xs text-[#cfd8ea]">
                      קריאה מהגיליון שלך כבר עובדת אוטומטית! כדי שכל תוכן שתעלה כאן ייכתב ישירות לגיליון ויופיע מיד לכל המבקרים בעולם (בלי צורך ב-Deploy), בצע פעם אחת את 3 השלבים הקצרים:
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      sheetConnected
                        ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-200'
                        : 'border-amber-400/45 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {sheetConnected ? 'מחובר לכתיבה חיה ✓' : 'מצב קריאה חיה (ממתין ל-Apps Script לכתיבה)'}
                  </span>
                </div>

                <ol className="space-y-1.5 rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-xs leading-relaxed text-[#e6edf9]">
                  <li>
                    <strong>1.</strong> פתח את{' '}
                    <a
                      href={STUDIO_SHEET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#84e8ff] underline"
                    >
                      הגיליון שלך ב-Google Sheets ↗
                    </a>{' '}
                    → תפריט <strong>Extensions → Apps Script</strong>.
                  </li>
                  <li>
                    <strong>2.</strong> העתק את הקוד המוכן למטה (כבר מכוון לגיליון ולמייל שלך), שמור ולחץ{' '}
                    <strong>Deploy → New deployment → Web app</strong> (Execute as: Me, Access: Anyone).
                  </li>
                  <li>
                    <strong>3.</strong> הדבק כאן את ה-<strong>Web App URL</strong> (וגם ב-Vercel תחת{' '}
                    <code dir="ltr">DUPAMAN_EXHIBITS_SCRIPT_URL</code> לסנכרון לכל המבקרים).
                  </li>
                </ol>

                <form onSubmit={handleSaveScriptUrl} className="flex flex-wrap items-center gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="min-w-[260px] flex-1 rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2 text-left text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-emerald-400/60"
                  />
                  <CrystalButton hue="cyan" size="sm" type="submit">
                    <Check className="h-3.5 w-3.5" />
                    <span>שמור ובדוק חיבור</span>
                  </CrystalButton>
                  <CrystalButton hue="gold" size="sm" type="button" onClick={() => void handleCopyScript()}>
                    {copiedScript ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedScript ? 'קוד ה-Apps Script הועתק!' : 'העתק קוד Apps Script מוכן'}</span>
                  </CrystalButton>
                </form>
              </div>
            </CrystalCard3D>
          )}
        </section>
      </main>
    </div>
  );
}
