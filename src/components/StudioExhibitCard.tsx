import { useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Github,
  Globe,
  Pause,
  Play,
  Presentation,
  Printer,
  Share2,
} from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';
import { resolveExhibitMedia } from '../utils/mediaEmbed';
import {
  ExhibitContentViewerModal,
  triggerPrintExhibitSheet,
  triggerSmartDownloadExhibit,
} from './ExhibitContentViewerModal';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';

interface GalleryResourceCardProps {
  exhibit: StudioExhibitSample;
  onOpenViewer: () => void;
  accessibleMode?: boolean;
}

/**
 * Clean, practical Gallery Card faithfully modeled on Rafael's Google Doc wireframe sketch:
 * - Video card: tall rounded "וידאו" media tile with ▶ / ⏸ controls underneath + high-contrast summary box + 4 bottom pill buttons
 * - Presentation / PDF / Live-App card: top rounded media tile ("מצגת" / "PDF" / "אתר חי") + high-contrast summary box + 4 bottom pill buttons
 * Clicking the preview or description immediately opens the real PDF / Slides / Video / Live App viewer.
 */
export function GalleryResourceCard({
  exhibit,
  onOpenViewer,
  accessibleMode = false,
}: GalleryResourceCardProps) {
  const [shared, setShared] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const isVideo = exhibit.mediaType === 'video';
  const isGold = exhibit.hue === 'gold';
  const primaryUrl = exhibit.liveUrl || exhibit.url;
  const media = resolveExhibitMedia(primaryUrl);

  const MediaIcon =
    exhibit.mediaType === 'video'
      ? Film
      : exhibit.mediaType === 'presentation'
        ? Presentation
        : exhibit.mediaType === 'pdf'
          ? FileText
          : Globe;

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
      setTimeout(() => setShared(false), 2200);
    } catch {
      // cancelled
    }
  };

  // Visual theme: extra-clear high-contrast repository card for educational/teacher galleries
  const cardSurfaceClass = accessibleMode
    ? 'border-white/18 bg-[#0e1524]/92 hover:border-[#f8d478]/55 shadow-[0_14px_38px_rgba(0,0,0,0.45)]'
    : 'border-white/14 bg-[#0b101d]/88 hover:border-[#84e8ff]/50 shadow-[0_14px_38px_rgba(0,0,0,0.45)]';

  const previewTileTone = isGold
    ? 'border-[#f8d478]/40 bg-gradient-to-br from-[#2b210c]/90 via-[#15120a]/95 to-[#0b0e17] text-[#fff2cf]'
    : 'border-[#84e8ff]/40 bg-gradient-to-br from-[#0e2438]/90 via-[#0a1424]/95 to-[#080c15] text-[#e6f9ff]';

  return (
    <article
      dir="rtl"
      className={`group flex h-full flex-col justify-between gap-3.5 rounded-[24px] border p-4 transition-all duration-200 backdrop-blur-md sm:p-5 ${cardSurfaceClass}`}
    >
      {isVideo ? (
        /* VIDEO WIREFRAME ARCHETYPE (Horizontal: Tall Video Tile + ▶ ⏸ controls beside Summary) */
        <div className="grid flex-1 grid-cols-1 gap-3.5 sm:grid-cols-12">
          {/* Tall Rounded Video Box + Play/Pause Controls */}
          <div className="flex flex-col gap-2 sm:col-span-5">
            <button
              type="button"
              onClick={onOpenViewer}
              className={`flex min-h-[126px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all hover:scale-[1.01] ${previewTileTone}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Film className="h-5 w-5" />
              </div>
              <span className="text-sm font-extrabold tracking-wide">{exhibit.mediaBadge}</span>
              <span className="text-[10px] opacity-80">לחץ לצפייה מלאה</span>
            </button>

            {/* ▶ / ⏸ Controls directly under the video box (exact sketch match!) */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVideoPlaying(true);
                  onOpenViewer();
                }}
                aria-label="נגן וידאו"
                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  videoPlaying
                    ? 'border-[#f8d478]/65 bg-[#f2be4e]/25 text-white'
                    : 'border-white/16 bg-white/[0.06] text-white hover:bg-white/15'
                }`}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>נגן</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoPlaying(false)}
                aria-label="השהה"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/16 bg-white/[0.05] px-2.5 py-1.5 text-white/80 hover:bg-white/14 hover:text-white"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right/Beside High-Contrast Description Box */}
          <div className="flex flex-col justify-between gap-2.5 sm:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {exhibit.code && (
                  <span
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-[#dce6f7]"
                  >
                    {exhibit.code}
                  </span>
                )}
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                  {exhibit.readiness}
                </span>
              </div>
              {exhibit.githubUrl && (
                <a
                  href={exhibit.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="קוד מקור GitHub"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/14 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#cbd5e1] hover:border-white/30 hover:text-white"
                >
                  <Github className="h-3 w-3" />
                  <span dir="ltr">GitHub</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenViewer}
              className="flex flex-1 cursor-pointer flex-col justify-between rounded-2xl border border-white/12 bg-[#070b13]/90 p-4 text-right transition-colors hover:border-white/30"
            >
              <div>
                <h3 className="text-base font-bold text-white transition-colors group-hover:text-[#f8d478] sm:text-lg">
                  {exhibit.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#dce5f5] sm:text-sm">
                  {exhibit.summary}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-[#9eb2d1]">
                <span>לחץ לפתיחת התוכן המלא</span>
                <Eye className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* PRESENTATION / PDF / LIVE-APP WIREFRAME ARCHETYPE (Top Media Tile + Dark Summary Bar + 4 Bottom Pills) */
        <div className="flex flex-1 flex-col gap-3">
          {/* Top Row: Rounded Media Preview Box ("מצגת" / "PDF") + Readiness & GitHub */}
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onOpenViewer}
              className={`flex min-h-[72px] min-w-[132px] cursor-pointer flex-col items-start justify-between rounded-2xl border px-3.5 py-2.5 text-right transition-all hover:scale-[1.02] ${previewTileTone}`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <MediaIcon className="h-4 w-4" />
                {exhibit.code && (
                  <span
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-[10px] font-bold opacity-80"
                  >
                    {exhibit.code}
                  </span>
                )}
              </div>
              <span className="mt-1 text-sm font-extrabold">{exhibit.mediaBadge}</span>
            </button>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                  exhibit.readinessPct >= 95
                    ? 'border-emerald-400/45 bg-emerald-500/18 text-emerald-200'
                    : isGold
                      ? 'border-[#f8d478]/45 bg-[#f2be4e]/15 text-[#fff1c7]'
                      : 'border-[#84e8ff]/45 bg-[#48d6fc]/15 text-[#dcf8ff]'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>{exhibit.readiness}</span>
              </span>
              {exhibit.githubUrl && (
                <a
                  href={exhibit.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="פתיחת קוד מקור ב-GitHub"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/14 bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#cbd5e1] hover:border-white/30 hover:text-white"
                >
                  <Github className="h-3 w-3" />
                  <span dir="ltr">GitHub</span>
                </a>
              )}
            </div>
          </div>

          {/* Middle High-Contrast Clear Content Box (Click to view real PDF / Presentation!) */}
          <button
            type="button"
            onClick={onOpenViewer}
            className="flex flex-1 cursor-pointer flex-col justify-between rounded-2xl border border-white/12 bg-[#070b13]/92 p-4 text-right transition-colors hover:border-white/30"
          >
            <div>
              <h3 className="text-base font-bold text-white transition-colors group-hover:text-[#f8d478] sm:text-lg">
                {exhibit.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#e2eaf7] sm:text-sm">
                {exhibit.summary}
              </p>
              {exhibit.audienceNote && accessibleMode && (
                <p className="mt-2 text-[11px] font-medium text-[#f8d478]/90">
                  {exhibit.audienceNote}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] font-semibold text-[#9eb2d1]">
              <span>לחצו לצפייה ישירה בתוכן המלא</span>
              <span className="inline-flex items-center gap-1 text-[#84e8ff]">
                <Eye className="h-3.5 w-3.5" />
                <span>פתח תצוגה</span>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Row: EXACTLY 4 Clean Rounded Pill Action Buttons (matching sketch!) */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        <button
          type="button"
          onClick={onOpenViewer}
          className={`inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${
            isGold
              ? 'border-[#f8d478]/55 bg-[#f2be4e]/20 text-[#fff4d4] hover:bg-[#f2be4e]/32'
              : 'border-[#84e8ff]/55 bg-[#48d6fc]/20 text-[#ebfbff] hover:bg-[#48d6fc]/32'
          }`}
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span>צפייה</span>
        </button>

        <button
          type="button"
          onClick={() => triggerSmartDownloadExhibit(exhibit)}
          title={media.downloadLabel}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/16 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/16"
        >
          <Download className="h-3.5 w-3.5 shrink-0 text-[#84e8ff]" />
          <span>הורדה</span>
        </button>

        <button
          type="button"
          onClick={() => triggerPrintExhibitSheet(exhibit)}
          title="הדפסת דף פעילות"
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/16 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/16"
        >
          <Printer className="h-3.5 w-3.5 shrink-0 text-[#f8d478]" />
          <span>הדפסה</span>
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          title="שיתוף קישור"
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/16 bg-white/[0.06] px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/16"
        >
          {shared ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
          ) : (
            <Share2 className="h-3.5 w-3.5 shrink-0 text-[#84e8ff]" />
          )}
          <span>{shared ? 'הועתק' : 'שיתוף'}</span>
        </button>
      </div>
    </article>
  );
}

interface StudioExhibitCardProps {
  exhibit: StudioExhibitSample;
  onOpenInBot?: (prompt: string, topic: string) => void;
  compact?: boolean;
}

/**
 * Compact Spotlight Exhibit Card used inside the 00 Central Brain Bot Runtime.
 */
export function StudioExhibitCard({
  exhibit,
  onOpenInBot,
  compact = true,
}: StudioExhibitCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const isGold = exhibit.hue === 'gold';
  const primaryUrl = exhibit.liveUrl || exhibit.url;
  const primaryLabel = exhibit.liveLabel || exhibit.actionLabel.replace(/\s*↗$/, '');

  return (
    <>
      <CrystalCard3D hue={exhibit.hue} className="w-full">
        <div dir="rtl" className={`flex flex-col gap-3 ${compact ? 'p-4' : 'p-5'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span
                dir="ltr"
                style={{ fontFamily: 'var(--font-display)' }}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                  isGold
                    ? 'border-[#f8d478]/40 bg-[#f2be4e]/15 text-[#f8d478]'
                    : 'border-[#84e8ff]/40 bg-[#48d6fc]/15 text-[#84e8ff]'
                }`}
              >
                {exhibit.code || exhibit.nodeCode}
              </span>
              <span className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-0.5 text-[11px] text-[#e6eefc]">
                {exhibit.mediaBadge} · {exhibit.sectionLabel}
              </span>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
              {exhibit.readiness}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">{exhibit.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#dce5f5]">{exhibit.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5">
            <CrystalButton hue={exhibit.hue} size="sm" onClick={() => setViewerOpen(true)}>
              <Eye className="h-3.5 w-3.5" />
              <span>צפייה מלאה בתוכן</span>
            </CrystalButton>

            {primaryUrl && (
              <CrystalLinkButton
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                hue="neutral"
                size="sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{primaryLabel}</span>
                <ArrowUpRight className="h-3 w-3 opacity-80" />
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
                <span dir="ltr">GitHub</span>
              </CrystalLinkButton>
            )}

            {onOpenInBot && (
              <CrystalButton
                hue="neutral"
                size="sm"
                onClick={() =>
                  onOpenInBot(exhibit.botPrompt || `ספר לי על ${exhibit.title}`, exhibit.nodeTitle)
                }
              >
                <Bot className="h-3.5 w-3.5" />
                <span>לגלריית הצומת</span>
              </CrystalButton>
            )}
          </div>
        </div>
      </CrystalCard3D>

      {viewerOpen && (
        <ExhibitContentViewerModal
          exhibits={[exhibit]}
          activeIndex={0}
          onChangeIndex={() => {}}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
