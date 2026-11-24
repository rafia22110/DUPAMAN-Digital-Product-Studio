import { type FormEvent, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Box,
  Check,
  Download,
  ExternalLink,
  Eye,
  Github,
  Play,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';
import { ExhibitLiveStage } from './ExhibitLiveStage';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';

interface StudioExhibitCardProps {
  exhibit: StudioExhibitSample;
  onOpenInBot?: (prompt: string, topic: string) => void;
  compact?: boolean;
}

function buildPrintableHtml(exhibit: StudioExhibitSample): string {
  const highlightsList = (exhibit.highlights ?? [])
    .map((h) => `<li style="margin-bottom:8px;">${h}</li>`)
    .join('');

  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${exhibit.title} · DUPAMAN Studio</title>
    <style>
      body { font-family: 'Heebo', Arial, sans-serif; color: #111827; padding: 36px; max-width: 780px; margin: 0 auto; line-height: 1.65; }
      .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eef2ff; color: #1e3a8a; font-size: 12px; font-weight: 700; margin-left: 8px; }
      h1 { font-size: 26px; margin: 14px 0 8px; }
      .summary { font-size: 16px; color: #374151; margin-bottom: 20px; }
      .box { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; background: #f9fafb; }
      .links a { color: #0369a1; word-break: break-all; }
      footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div>
      <span class="badge">${exhibit.sectionLabel}</span>
      <span class="badge">${exhibit.readiness}</span>
      ${exhibit.code ? `<span class="badge" dir="ltr">${exhibit.code}</span>` : ''}
    </div>
    <h1>${exhibit.title}</h1>
    <p class="summary">${exhibit.summary}</p>
    ${
      exhibit.audienceNote
        ? `<div class="box"><strong>למי זה מתאים:</strong> ${exhibit.audienceNote}</div>`
        : ''
    }
    ${
      highlightsList
        ? `<div class="box"><strong>מה כולל התוצר:</strong><ul style="margin:10px 0 0;padding-right:20px;">${highlightsList}</ul></div>`
        : ''
    }
    <div class="box links">
      <strong>קישורים ישירים להפעלה בכיתה:</strong>
      <p>${exhibit.liveLabel || 'קישור חי'}: <a href="${exhibit.liveUrl || exhibit.url || '#'}">${exhibit.liveUrl || exhibit.url || ''}</a></p>
      ${exhibit.githubUrl ? `<p>קוד מקור GitHub: <a href="${exhibit.githubUrl}">${exhibit.githubUrl}</a></p>` : ''}
    </div>
    <footer>DUPAMAN Digital Product Studio · https://dupaman.vercel.app/</footer>
  </body>
</html>`;
}

function triggerPrintExhibit(exhibit: StudioExhibitSample) {
  const popup = window.open('', '_blank', 'width=840,height=700');
  if (!popup) {
    window.print();
    return;
  }
  popup.document.open();
  popup.document.write(buildPrintableHtml(exhibit));
  popup.document.close();
  popup.focus();
  setTimeout(() => {
    popup.print();
  }, 250);
}

function triggerDownloadExhibit(exhibit: StudioExhibitSample) {
  const lines = [
    `# ${exhibit.title}`,
    exhibit.code ? `קוד סטודיו: ${exhibit.code}` : '',
    `מדור: ${exhibit.sectionLabel} (${exhibit.nodeCode} · ${exhibit.nodeTitle})`,
    `מוכנות: ${exhibit.readiness}`,
    '',
    exhibit.summary,
    '',
    exhibit.audienceNote ? `קהל יעד: ${exhibit.audienceNote}` : '',
    '',
    ...(exhibit.highlights?.length
      ? ['## מה כולל התוצר', ...exhibit.highlights.map((h) => `- ${h}`), '']
      : []),
    '## קישורים ישירים',
    exhibit.liveUrl ? `- ${exhibit.liveLabel || 'תצוגה חיה'}: ${exhibit.liveUrl}` : '',
    exhibit.githubUrl ? `- GitHub: ${exhibit.githubUrl}` : '',
    '',
    'מתוך DUPAMAN Digital Product Studio — https://dupaman.vercel.app/',
  ].filter((line) => line !== undefined);

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exhibit.code || exhibit.id}-dupaman.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Accessible Full-Content Preview Modal (especially clear for teachers & visitors)
 */
function FullExhibitReaderModal({
  exhibit,
  onClose,
  onOpenInBot,
  onShare,
  shared,
}: {
  exhibit: StudioExhibitSample;
  onClose: () => void;
  onOpenInBot?: (prompt: string, topic: string) => void;
  onShare: () => void;
  shared: boolean;
}) {
  const primaryUrl = exhibit.liveUrl || exhibit.url;
  const primaryLabel = exhibit.liveLabel || exhibit.actionLabel.replace(/\s*↗$/, '');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#010205]/80 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'glassCardReveal 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="w-full max-w-2xl"
      >
        <CrystalCard3D hue={exhibit.hue} interactive={false}>
          <div dir="rtl" className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 border-b border-white/12 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-white/18 bg-white/[0.06] px-2.5 py-0.5 font-medium text-[#e9eef8]">
                    {exhibit.sectionLabel}
                  </span>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 font-semibold text-emerald-200">
                    {exhibit.readiness}
                  </span>
                  {exhibit.code && (
                    <span
                      dir="ltr"
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#cfd8ea]"
                    >
                      {exhibit.code}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{exhibit.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגור תצוגה מלאה"
                className="cursor-pointer rounded-xl border border-white/18 bg-white/[0.05] p-2 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#edf2fb] sm:text-base">{exhibit.summary}</p>

            {exhibit.audienceNote && (
              <div className="rounded-xl border border-[#f8d478]/30 bg-[#f2be4e]/10 px-4 py-3 text-xs leading-relaxed text-[#fff2cf] sm:text-sm">
                <strong>התאמה והנגשה: </strong>
                {exhibit.audienceNote}
              </div>
            )}

            {exhibit.highlights && exhibit.highlights.length > 0 && (
              <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
                <div className="text-xs font-bold text-[#84e8ff]">מה מקבלים בתוך הכרטיסייה:</div>
                <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#e6edf9] sm:text-sm">
                  {exhibit.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f8d478]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Teacher / Accessibility Quick Bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] p-3">
              <button
                type="button"
                onClick={() => triggerPrintExhibit(exhibit)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/18 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              >
                <Printer className="h-3.5 w-3.5 text-[#f8d478]" />
                <span>הדפסת דף פעילות</span>
              </button>
              <button
                type="button"
                onClick={() => triggerDownloadExhibit(exhibit)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/18 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              >
                <Download className="h-3.5 w-3.5 text-[#84e8ff]" />
                <span>הורדת תקציר (MD)</span>
              </button>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/18 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              >
                {shared ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Share2 className="h-3.5 w-3.5 text-[#84e8ff]" />
                )}
                <span>{shared ? 'הקישור הועתק לשיתוף!' : 'שיתוף קישור'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/12 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                {primaryUrl && (
                  <CrystalLinkButton
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    hue={exhibit.hue}
                    size="sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{primaryLabel}</span>
                  </CrystalLinkButton>
                )}
                {exhibit.githubUrl && (
                  <CrystalLinkButton
                    href={exhibit.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    hue="neutral"
                    size="sm"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>GitHub</span>
                  </CrystalLinkButton>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onOpenInBot && (
                  <CrystalButton
                    hue="gold"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenInBot(
                        exhibit.botPrompt || `ספר לי עוד על ${exhibit.title}`,
                        exhibit.nodeTitle
                      );
                    }}
                  >
                    <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
                    <span>שאל את הבוט</span>
                  </CrystalButton>
                )}
                <CrystalButton hue="neutral" size="sm" onClick={onClose}>
                  <span>סגור</span>
                </CrystalButton>
              </div>
            </div>
          </div>
        </CrystalCard3D>
      </div>
    </div>
  );
}

/**
 * Interactive in-viewport Spotlight Demo for concept exhibits (01 Banking Agent & 03 Meet3D)
 */
function LiveConceptDemoModal({
  exhibit,
  onClose,
  onOpenInBot,
}: {
  exhibit: StudioExhibitSample;
  onClose: () => void;
  onOpenInBot?: (prompt: string, topic: string) => void;
}) {
  const [agentQuery, setAgentQuery] = useState('');
  const [agentResult, setAgentResult] = useState<{
    action: string;
    detail: string;
    metric: string;
  } | null>(
    exhibit.nodeCode === '01'
      ? {
          action: 'איזון תיק נזילות פרטית',
          detail: 'זוהתה יתרה פנויה של ₪420,000 בעו״ש. הומלצה העברה אוטומטית למסלול מק״מ צמוד.',
          metric: '+4.85% תשואה שנתית צפויה',
        }
      : {
          action: 'סצנת כיתה תלת-ממדית פעילה',
          detail: '14 תלמידים מחוברים במרחב מרחף · מודל לב אנושי מסתובב במרכז החדר.',
          metric: '60 FPS · WebGL Classroom',
        }
  );

  const handleBankingSim = (e: FormEvent) => {
    e.preventDefault();
    const q = agentQuery.trim();
    if (!q) return;
    if (q.includes('העבר') || q.includes('שלח') || q.includes('תשלום')) {
      setAgentResult({
        action: 'אימות פעולת סוכן בזמן אמת',
        detail: `הפקודה "${q}" זוהתה ואושרה בשכבת אימות ביומטרית — מוכנה לביצוע בלחיצה.`,
        metric: '0.18s · Zero-Menu Execution',
      });
    } else if (q.includes('מט״ח') || q.includes('דולר') || q.includes('השקע')) {
      setAgentResult({
        action: 'ניתוח חשיפת מט״ח והשקעות',
        detail: 'חשיפה נוכחית 28% USD. הסוכן מציג גידור אוטומטי ללא צורך בחיפוש בתוך תפריטים.',
        metric: 'Risk Score: Optimal',
      });
    } else {
      setAgentResult({
        action: `תגובת סוכן ישירה: "${q}"`,
        detail: 'חלון ה-Spotlight האיר את המידע הפיננסי הרלוונטי והפיק תובנה מיידית.',
        metric: 'Agentic Banking UI',
      });
    }
    setAgentQuery('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#010205]/75 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'glassCardReveal 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="w-full max-w-2xl"
      >
        <CrystalCard3D hue={exhibit.hue} interactive={false}>
          <div dir="rtl" className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3 border-b border-white/12 pb-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-[#84e8ff]">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span>הדגמה אינטראקטיבית חיה · {exhibit.nodeTitle}</span>
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">{exhibit.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="סגור הדגמה"
                className="cursor-pointer rounded-xl border border-white/18 bg-white/[0.05] p-2 text-white/80 hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {exhibit.nodeCode === '01' ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-[#84e8ff]/30 bg-gradient-to-br from-[#0d1c2e]/70 to-[#060913]/85 p-4">
                  <div className="flex items-center justify-between text-xs text-[#9ceeff]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Private Banking Spotlight</span>
                    </span>
                    <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }}>
                      {agentResult?.metric}
                    </span>
                  </div>
                  <div className="mt-2.5 text-base font-bold text-white">{agentResult?.action}</div>
                  <p className="mt-1 text-xs leading-relaxed text-[#dce6f7]">
                    {agentResult?.detail}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['בדוק חשיפת מט״ח', 'העבר ₪15,000 לחיסכון', 'נתח תזרים חודשי'].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => {
                        setAgentQuery(cmd);
                      }}
                      className="cursor-pointer rounded-lg border border-white/14 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#dce4f5] hover:border-[#84e8ff]/45 hover:text-white"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleBankingSim} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={agentQuery}
                    onChange={(e) => setAgentQuery(e.target.value)}
                    placeholder="הקלד פקודה בנקאית לסוכן (במקום תפריטים)..."
                    className="w-full rounded-xl border border-white/18 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-[#8e9bb2] outline-none focus:border-[#84e8ff]/55"
                  />
                  <CrystalButton hue="cyan" size="sm" type="submit">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>בצע</span>
                  </CrystalButton>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative flex h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#f8d478]/30 bg-gradient-to-br from-[#191408]/65 via-[#070a14]/85 to-[#061822]/75 p-4 text-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(248,212,120,0.18),transparent_62%)]" />
                  <Box className="relative h-10 w-10 animate-spin text-[#f8d478] [animation-duration:9s]" />
                  <div className="relative mt-2.5 text-sm font-bold text-white">
                    {agentResult?.action}
                  </div>
                  <p className="relative mt-1 max-w-md text-xs text-[#e6ecf8]">
                    {agentResult?.detail}
                  </p>
                  <span
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="relative mt-2 rounded-full border border-[#f8d478]/35 bg-[#f2be4e]/12 px-3 py-0.5 text-[10px] text-[#fff1c7]"
                  >
                    {agentResult?.metric}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/12 pt-3">
              <CrystalButton
                hue="gold"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenInBot?.(
                    exhibit.botPrompt || `ספר לי עוד על ${exhibit.title}`,
                    exhibit.nodeTitle
                  );
                }}
              >
                <Bot className="h-3.5 w-3.5 text-[#f8d478]" />
                <span>המשך שיחה בבוט</span>
              </CrystalButton>
              <CrystalButton hue="neutral" size="sm" onClick={onClose}>
                <span>סגור הדגמה</span>
              </CrystalButton>
            </div>
          </div>
        </CrystalCard3D>
      </div>
    </div>
  );
}

/**
 * Luxury exhibit crystal-glass showcase template for nodes 01–06
 * and for the 00 Spotlight Runtime.
 */
export function StudioExhibitCard({
  exhibit,
  onOpenInBot,
  compact = false,
}: StudioExhibitCardProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const isGold = exhibit.hue === 'gold';

  const primaryUrl = exhibit.liveUrl || exhibit.url;
  const primaryLabel = exhibit.liveLabel || exhibit.actionLabel.replace(/\s*↗$/, '');

  const handleShare = async () => {
    const shareUrl = primaryUrl || 'https://dupaman.vercel.app/';
    const shareText = `${exhibit.title} — ${exhibit.summary}\n${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: exhibit.title, text: exhibit.summary, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2400);
    } catch {
      // user cancelled native share dialog
    }
  };

  return (
    <>
      <CrystalCard3D hue={exhibit.hue} className="w-full">
        <div
          dir="rtl"
          className={`relative grid grid-cols-1 ${
            compact ? 'gap-3 p-4' : 'gap-5 p-5 sm:p-7 lg:grid-cols-12'
          }`}
        >
          {/* Ambient Luxury Accent Aura */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -top-12 left-8 h-32 w-48 rounded-full blur-3xl ${
              isGold ? 'bg-[#f2be4e]/12' : 'bg-[#48d6fc]/12'
            }`}
          />

          {/* Right/Main Info Column */}
          <div
            className={`relative flex flex-col justify-between ${
              compact ? '' : 'gap-4 lg:col-span-6'
            }`}
          >
            <div>
              {/* Top row: node code + section label + readiness pill badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#dce0ea]/90">
                  <span
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-display)' }}
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider ${
                      isGold
                        ? 'border-[#f8d478]/35 bg-[#f2be4e]/12 text-[#f8d478]'
                        : 'border-[#84e8ff]/35 bg-[#48d6fc]/12 text-[#84e8ff]'
                    }`}
                  >
                    {exhibit.code || exhibit.nodeCode}
                  </span>
                  <span className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#e4ebf8]">
                    {exhibit.sectionLabel}
                  </span>
                </div>

                {/* Readiness Pill Badge (% מוכן להפעלה) */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-semibold backdrop-blur-md ${
                    exhibit.readinessPct >= 95
                      ? 'border-emerald-400/50 bg-emerald-500/16 text-emerald-200'
                      : isGold
                        ? 'border-[#f8d478]/45 bg-[#f2be4e]/14 text-[#fff1c7]'
                        : 'border-[#84e8ff]/45 bg-[#48d6fc]/14 text-[#dcf8ff]'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                      exhibit.readinessPct >= 95
                        ? 'bg-emerald-300'
                        : isGold
                          ? 'bg-[#f8d478]'
                          : 'bg-[#84e8ff]'
                    }`}
                  />
                  <span>{exhibit.readiness}</span>
                </span>
              </div>

              {/* Crisp Display Title */}
              <h2
                className={`mt-3 bg-gradient-to-l from-white via-[#f5f8ff] to-[#dce6f7] bg-clip-text font-bold tracking-tight text-transparent ${
                  compact ? 'text-base sm:text-lg' : 'text-xl sm:text-[26px]'
                }`}
              >
                {exhibit.title}
              </h2>

              {/* Synaptic Accent Hairline */}
              <div
                aria-hidden="true"
                className={`mt-1.5 h-px w-24 bg-gradient-to-l to-transparent ${
                  isGold ? 'from-[#f8d478]/75' : 'from-[#84e8ff]/75'
                }`}
              />

              {/* Concise 1–2 line studio description */}
              <p
                className={`mt-2.5 leading-relaxed text-[#e9eef7]/95 ${
                  compact ? 'text-xs' : 'text-sm sm:text-[15px]'
                }`}
              >
                {exhibit.summary}
              </p>

              {/* Educational Accessibility Quick Actions (Print / Download / Share / Full View) */}
              {!compact && exhibit.isEducational && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReaderOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#f8d478]/40 bg-[#f2be4e]/14 px-2.5 py-1 text-[11px] font-semibold text-[#fff3cf] transition-colors hover:bg-[#f2be4e]/25"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>תצוגה מלאה</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPrintExhibit(exhibit)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#edf2fc] transition-colors hover:bg-white/15"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#f8d478]" />
                    <span>הדפסה</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDownloadExhibit(exhibit)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#edf2fc] transition-colors hover:bg-white/15"
                  >
                    <Download className="h-3.5 w-3.5 text-[#84e8ff]" />
                    <span>הורדה</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-[#edf2fc] transition-colors hover:bg-white/15"
                  >
                    {shared ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5 text-[#84e8ff]" />
                    )}
                    <span>{shared ? 'הועתק!' : 'שיתוף'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom row: 3 tech tags + 2 clickable external buttons (Live + GitHub) */}
            <div className="relative flex flex-col gap-3 border-t border-white/12 pt-3">
              <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
                {exhibit.techTags.map((tag) => (
                  <span
                    key={tag}
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="rounded-lg border border-white/14 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-[#d7e0f2]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Button 1: Live / Resource Link */}
                {primaryUrl && (
                  <CrystalLinkButton
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    hue={exhibit.hue}
                    size={compact ? 'sm' : 'md'}
                  >
                    <Sparkles className="h-3.5 w-3.5 opacity-85" />
                    <span>{primaryLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
                  </CrystalLinkButton>
                )}

                {/* Button 2: GitHub Repository Link */}
                {exhibit.githubUrl && (
                  <CrystalLinkButton
                    href={exhibit.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    hue="neutral"
                    size={compact ? 'sm' : 'md'}
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }}>
                      GitHub
                    </span>
                  </CrystalLinkButton>
                )}

                {/* Optional interactive spotlight demo for Node 01 */}
                {!compact && exhibit.actionType === 'bot' && (
                  <CrystalButton
                    hue="cyan"
                    size="sm"
                    onClick={() => setDemoOpen(true)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>הדגמה חיה</span>
                  </CrystalButton>
                )}

                {/* Non-educational full content view button */}
                {!compact && !exhibit.isEducational && (
                  <CrystalButton
                    hue="neutral"
                    size="sm"
                    onClick={() => setReaderOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>פרטים מלאים</span>
                  </CrystalButton>
                )}

                {/* Compact mode jump to node in bot */}
                {compact && onOpenInBot && (
                  <CrystalButton
                    hue="neutral"
                    size="sm"
                    onClick={() =>
                      onOpenInBot(
                        exhibit.botPrompt || `ספר לי על ${exhibit.title}`,
                        exhibit.nodeTitle
                      )
                    }
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>פתח בגלריה</span>
                  </CrystalButton>
                )}
              </div>
            </div>
          </div>

          {/* Live Interactive Visual Stage Column (shown on nodes 01-06) */}
          {!compact && (
            <div className="relative lg:col-span-6">
              <ExhibitLiveStage exhibit={exhibit} />
            </div>
          )}
        </div>
      </CrystalCard3D>

      {readerOpen && (
        <FullExhibitReaderModal
          exhibit={exhibit}
          onClose={() => setReaderOpen(false)}
          onOpenInBot={onOpenInBot}
          onShare={() => void handleShare()}
          shared={shared}
        />
      )}

      {demoOpen && (
        <LiveConceptDemoModal
          exhibit={exhibit}
          onClose={() => setDemoOpen(false)}
          onOpenInBot={onOpenInBot}
        />
      )}
    </>
  );
}
