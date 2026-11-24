import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Film,
  Github,
  MessageCircle,
  Presentation,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';
import { buildWhatsAppShareUrl, resolveExhibitMedia } from '../utils/mediaEmbed';

export function triggerPrintExhibitSheet(exhibit: StudioExhibitSample): void {
  const highlightsList = (exhibit.highlights ?? [])
    .map((h) => `<li style="margin-bottom:8px;">${h}</li>`)
    .join('');

  const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${exhibit.title} · DUPAMAN Studio</title>
    <style>
      body { font-family: 'Heebo', Arial, sans-serif; color: #0f172a; padding: 36px; max-width: 780px; margin: 0 auto; line-height: 1.7; }
      .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; }
      h1 { font-size: 28px; margin: 10px 0 8px; }
      .summary { font-size: 16px; color: #334155; margin-bottom: 20px; }
      .box { border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; background: #f8fafc; }
      a { color: #0284c7; word-break: break-all; }
      footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="meta">
      <span class="badge">${exhibit.sectionLabel}</span>
      <span class="badge">${exhibit.mediaBadge}</span>
      <span class="badge">${exhibit.readiness}</span>
      ${exhibit.code ? `<span class="badge" dir="ltr">${exhibit.code}</span>` : ''}
    </div>
    <h1>${exhibit.title}</h1>
    <p class="summary">${exhibit.summary}</p>
    ${exhibit.audienceNote ? `<div class="box"><strong>הנגשה והתאמה:</strong> ${exhibit.audienceNote}</div>` : ''}
    ${highlightsList ? `<div class="box"><strong>מה כולל התוכן / הפעילות:</strong><ul style="margin:10px 0 0;padding-right:20px;">${highlightsList}</ul></div>` : ''}
    <div class="box">
      <strong>קישורים ישירים:</strong>
      ${exhibit.liveUrl || exhibit.url ? `<p>${exhibit.liveLabel || 'קישור ישיר'}: <a href="${exhibit.liveUrl || exhibit.url}">${exhibit.liveUrl || exhibit.url}</a></p>` : ''}
      ${exhibit.githubUrl ? `<p>קוד מקור GitHub: <a href="${exhibit.githubUrl}">${exhibit.githubUrl}</a></p>` : ''}
    </div>
    <footer>DUPAMAN Digital Product Studio · https://dupaman.vercel.app/</footer>
  </body>
</html>`;

  const popup = window.open('', '_blank', 'width=860,height=720');
  if (!popup) {
    window.print();
    return;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
}

export function triggerSmartDownloadExhibit(exhibit: StudioExhibitSample): void {
  const media = resolveExhibitMedia(exhibit.liveUrl || exhibit.url);
  if (media.directDownloadUrl) {
    window.open(media.directDownloadUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const lines = [
    `# ${exhibit.title}`,
    exhibit.code ? `קוד: ${exhibit.code}` : '',
    `מדור: ${exhibit.sectionLabel} (${exhibit.nodeCode} · ${exhibit.nodeTitle})`,
    `סוג: ${exhibit.mediaBadge} · ${exhibit.readiness}`,
    '',
    exhibit.summary,
    '',
    exhibit.audienceNote ? `למי זה מתאים: ${exhibit.audienceNote}` : '',
    '',
    ...(exhibit.highlights?.length
      ? ['## נקודות מפתח', ...exhibit.highlights.map((h) => `- ${h}`), '']
      : []),
    '## קישורים',
    exhibit.liveUrl || exhibit.url
      ? `- ${exhibit.liveLabel || 'פתיחה'}: ${exhibit.liveUrl || exhibit.url}`
      : '',
    exhibit.githubUrl ? `- GitHub: ${exhibit.githubUrl}` : '',
    '',
    'מתוך מאגר DUPAMAN Studio — https://dupaman.vercel.app/',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${exhibit.code || exhibit.id}-dupaman.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

interface ExhibitContentViewerModalProps {
  exhibits: StudioExhibitSample[];
  activeIndex: number;
  onChangeIndex: (nextIndex: number) => void;
  onClose: () => void;
}

/**
 * Full-Content Practical Document / Presentation / Video / Live-App Viewer.
 * Clicking any gallery card opens the REAL document/slides/video right here,
 * with immediate Download (real PDF export), Print, Share (Copy + WhatsApp),
 * and smooth "מתאים לוקח / לא מתאים? הבא" flipping across all items in the gallery.
 */
export function ExhibitContentViewerModal({
  exhibits,
  activeIndex,
  onChangeIndex,
  onClose,
}: ExhibitContentViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const safeIdx = exhibits.length > 0 ? ((activeIndex % exhibits.length) + exhibits.length) % exhibits.length : 0;
  const exhibit = exhibits[safeIdx];
  const primaryUrl = exhibit?.liveUrl || exhibit?.url;
  const media = resolveExhibitMedia(primaryUrl);
  const hasMultiple = exhibits.length > 1;

  useEffect(() => {
    setIframeLoaded(false);
    setCopied(false);
  }, [exhibit?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (hasMultiple && e.key === 'ArrowLeft') onChangeIndex((safeIdx + 1) % exhibits.length);
      else if (hasMultiple && e.key === 'ArrowRight')
        onChangeIndex((safeIdx - 1 + exhibits.length) % exhibits.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, hasMultiple, safeIdx, exhibits.length, onChangeIndex]);

  if (!exhibit) return null;

  const handleCopyShare = async () => {
    const shareUrl = primaryUrl || 'https://dupaman.vercel.app/';
    const shareText = `${exhibit.title} — ${exhibit.summary}\n${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: exhibit.title, text: exhibit.summary, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // user cancelled
    }
  };

  const MediaIcon =
    exhibit.mediaType === 'video'
      ? Film
      : exhibit.mediaType === 'presentation'
        ? Presentation
        : FileText;

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040a]/88 p-2.5 backdrop-blur-md sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'glassCardReveal 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/18 bg-[#0b101b] text-[#f4f7fc] shadow-[0_28px_90px_rgba(0,0,0,0.82)]"
      >
        {/* Top Clean Practical Header Bar */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/12 bg-[#0f1625] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#f8d478]/40 bg-[#f2be4e]/14 text-[#f8d478]">
              <MediaIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 font-semibold text-[#e6eefc]">
                  {exhibit.sectionLabel}
                </span>
                <span className="rounded-full border border-[#84e8ff]/35 bg-[#48d6fc]/12 px-2.5 py-0.5 font-semibold text-[#dcf8ff]">
                  {exhibit.mediaBadge}
                </span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 font-bold text-emerald-200">
                  {exhibit.readiness}
                </span>
              </div>
              <h2 className="mt-1 truncate text-base font-bold text-white sm:text-xl">
                {exhibit.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {primaryUrl && (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#84e8ff]/45 bg-[#48d6fc]/16 px-3 py-2 text-xs font-bold text-[#ebfbff] transition-colors hover:bg-[#48d6fc]/28"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>פתח במסך מלא ↗</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור תצוגה"
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-white/18 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white hover:bg-white/16"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">סגור</span>
            </button>
          </div>
        </header>

        {/* Main Content Area: REAL Embedded Document / Slides / Video / Website + Clear Sidebar Info */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
          {/* Primary Visual Document Canvas (8 cols on desktop) */}
          <div className="relative flex min-h-[44vh] flex-col bg-[#060910] lg:col-span-8 lg:border-l lg:border-white/10">
            {media.embedUrl ? (
              <>
                {!iframeLoaded && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#070b14]/90 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f8d478]/30 border-t-[#f8d478]" />
                    <div className="text-xs font-semibold text-[#dce6f7]">
                      טוען את התוכן המלא ({exhibit.mediaBadge})...
                    </div>
                  </div>
                )}
                <iframe
                  key={media.embedUrl}
                  src={media.embedUrl}
                  title={exhibit.title}
                  onLoad={() => setIframeLoaded(true)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full border-0 bg-white"
                />
              </>
            ) : (
              /* Clean accessible preview page when host forbids third-party iframes (e.g. NotebookLM / YouTube channel) */
              <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center sm:p-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#f8d478]/45 bg-[#f2be4e]/15 text-[#f8d478]">
                  <MediaIcon className="h-8 w-8" />
                </div>
                <div className="max-w-lg space-y-2">
                  <div className="text-xs font-bold text-[#84e8ff]">
                    {exhibit.sectionLabel} · {exhibit.mediaBadge}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{exhibit.title}</h3>
                  <p className="text-sm leading-relaxed text-[#dce6f7]">{exhibit.summary}</p>
                </div>
                {primaryUrl && (
                  <a
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#f8d478]/65 bg-[#f2be4e]/22 px-6 py-3 text-sm font-bold text-[#fff4d4] transition-all hover:bg-[#f2be4e]/35"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{exhibit.liveLabel || 'פתיחת התוכן המלא'} ↗</span>
                  </a>
                )}
                <p className="text-[11px] text-[#94a3b8]">
                  התוכן מתארח בשירות חיצוני שנפתח בלשונית ייעודית לתצוגה מיטבית.
                </p>
              </div>
            )}
          </div>

          {/* Right/Side Practical Details & Highlights Panel (4 cols on desktop) */}
          <aside className="flex min-h-0 flex-col justify-between gap-4 overflow-y-auto bg-[#0d1422] p-5 lg:col-span-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-[#f8d478]">מה רואים כאן?</div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#edf2fc]">{exhibit.summary}</p>
              </div>

              {exhibit.audienceNote && (
                <div className="rounded-2xl border border-[#f8d478]/30 bg-[#f2be4e]/10 p-3.5 text-xs leading-relaxed text-[#fff3cf]">
                  <strong>מתאים במיוחד ל: </strong>
                  {exhibit.audienceNote}
                </div>
              )}

              {exhibit.highlights && exhibit.highlights.length > 0 && (
                <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
                  <div className="text-xs font-bold text-[#84e8ff]">נקודות מרכזיות לשימוש מיידי:</div>
                  <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#e6eefc]">
                    {exhibit.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f8d478]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5" dir="ltr">
                {exhibit.techTags.map((tag) => (
                  <span
                    key={tag}
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="rounded-lg border border-white/14 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#cbd5e1]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Secondary Code / External Links */}
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              {exhibit.githubUrl && (
                <a
                  href={exhibit.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white hover:bg-white/14"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span dir="ltr">GitHub</span>
                </a>
              )}
              <a
                href={buildWhatsAppShareUrl(exhibit.title, exhibit.summary, primaryUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>שיתוף בווטסאפ</span>
              </a>
            </div>
          </aside>
        </div>

        {/* Bottom Practical Action Dock: מתאים? הורד / הדפס / שתף · לא מתאים? הבא! */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-white/12 bg-[#0f1625] px-4 py-3 sm:px-6">
          {/* Take / Use Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => triggerSmartDownloadExhibit(exhibit)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#f8d478]/60 bg-[#f2be4e]/22 px-4 py-2 text-xs font-bold text-[#fff4d4] transition-colors hover:bg-[#f2be4e]/35 sm:text-sm"
            >
              <Download className="h-4 w-4" />
              <span>{media.downloadLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => triggerPrintExhibitSheet(exhibit)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/18 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/16 sm:text-sm"
            >
              <Printer className="h-4 w-4 text-[#f8d478]" />
              <span>הדפסה</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyShare()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/18 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/16 sm:text-sm"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-300" />
              ) : (
                <Share2 className="h-4 w-4 text-[#84e8ff]" />
              )}
              <span>{copied ? 'הקישור הועתק!' : 'שיתוף'}</span>
            </button>
          </div>

          {/* Flip to Next / Previous item right inside viewer ("לא מתאים? מה הבא!") */}
          {hasMultiple && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChangeIndex((safeIdx - 1 + exhibits.length) % exhibits.length)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-white/18 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-white hover:bg-white/16"
              >
                <ChevronRight className="h-4 w-4" />
                <span>הקודם</span>
              </button>
              <span className="px-1 text-xs font-semibold text-[#aeb9cf]">
                {safeIdx + 1} / {exhibits.length}
              </span>
              <button
                type="button"
                onClick={() => onChangeIndex((safeIdx + 1) % exhibits.length)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#84e8ff]/55 bg-[#48d6fc]/20 px-4 py-2 text-xs font-bold text-white hover:bg-[#48d6fc]/32 sm:text-sm"
              >
                <span>הבא במאגר</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
