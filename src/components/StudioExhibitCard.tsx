import { useState } from 'react';
import {
  ArrowLeft,
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

const DEFAULT_COVER_BY_NODE: Record<StudioExhibitSample['nodeCode'], string> = {
  '01': '/covers/cover-ai-systems.jpg',
  '02': '/covers/cover-ai-systems.jpg',
  '03': '/covers/cover-education-3d.jpg',
  '04': '/covers/cover-neuro-mind.jpg',
  '05': '/covers/cover-neuro-mind.jpg',
  '06': '/covers/cover-ventures-bio.jpg',
};

export function getExhibitCover(exhibit: StudioExhibitSample): string {
  return exhibit.thumbnail || DEFAULT_COVER_BY_NODE[exhibit.nodeCode] || '/covers/cover-ai-systems.jpg';
}

interface GalleryResourceCardProps {
  exhibit: StudioExhibitSample;
  onOpenViewer: () => void;
  accessibleMode?: boolean;
}

/**
 * Luxury Editorial Gallery Card inspired by dark Obsidian + Gold/Cyan Pinterest references:
 * - Crisp 16:9 cover visual with smooth dark vignette overlay
 * - Floating frosted-glass media & readiness pills
 * - Clean typography, high-contrast summary, and refined action bar (View / Download / Print / Share)
 */
export function GalleryResourceCard({
  exhibit,
  onOpenViewer,
  accessibleMode = false,
}: GalleryResourceCardProps) {
  const [shared, setShared] = useState(false);

  const isGold = exhibit.hue === 'gold';
  const primaryUrl = exhibit.liveUrl || exhibit.url;
  const media = resolveExhibitMedia(primaryUrl);
  const coverSrc = getExhibitCover(exhibit);

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

  return (
    <article
      dir="rtl"
      className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] border bg-[#090d16]/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
        isGold
          ? 'border-[#f8d478]/20 shadow-[0_18px_45px_rgba(0,0,0,0.55)] hover:border-[#f8d478]/55 hover:shadow-[0_22px_55px_rgba(248,212,120,0.14)]'
          : 'border-[#84e8ff]/18 shadow-[0_18px_45px_rgba(0,0,0,0.55)] hover:border-[#84e8ff]/55 hover:shadow-[0_22px_55px_rgba(72,214,252,0.14)]'
      }`}
    >
      {/* Top Luxury Cover Media Area */}
      <button
        type="button"
        onClick={onOpenViewer}
        className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden bg-[#050811] text-right"
      >
        <img
          src={coverSrc}
          alt={exhibit.title}
          loading="lazy"
          className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/35 to-black/25" />

        {/* Top Floating Glass Pills */}
        <div className="absolute inset-x-3.5 top-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
              isGold
                ? 'border-[#f8d478]/45 bg-[#120e06]/75 text-[#fff1c7]'
                : 'border-[#84e8ff]/45 bg-[#06121f]/75 text-[#dcf8ff]'
            }`}
          >
            <MediaIcon className="h-3 w-3" />
            <span>{exhibit.mediaBadge}</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-[#061612]/80 px-2.5 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{exhibit.readiness}</span>
          </span>
        </div>

        {/* Center Play Trigger for Video cards */}
        {exhibit.mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f8d478]/65 bg-[#0a0d14]/75 text-[#f8d478] shadow-[0_0_25px_rgba(248,212,120,0.3)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </div>
        )}

        {/* Bottom-left Code Chip */}
        {exhibit.code && (
          <span
            dir="ltr"
            style={{ fontFamily: 'var(--font-display)' }}
            className="absolute bottom-2.5 left-3.5 rounded-md border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/85 backdrop-blur-md"
          >
            {exhibit.code}
          </span>
        )}
      </button>

      {/* Card Body: Crisp Title, Summary & Luxury Actions */}
      <div className="flex flex-1 flex-col justify-between gap-3.5 p-4 sm:p-5">
        <button
          type="button"
          onClick={onOpenViewer}
          className="cursor-pointer text-right outline-none"
        >
          <div className="text-[11px] font-semibold text-[#94a3b8]">{exhibit.sectionLabel}</div>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-[#f8d478] sm:text-lg">
            {exhibit.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#cbd5e1] sm:text-[13px]">
            {exhibit.summary}
          </p>
          {accessibleMode && exhibit.audienceNote && (
            <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-[#f8d478]/90">
              {exhibit.audienceNote}
            </p>
          )}
        </button>

        {/* Bottom Luxury Action Dock: Primary Pill + Clean Utility Icons */}
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onOpenViewer}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all ${
              isGold
                ? 'bg-gradient-to-l from-[#f8d478] to-[#eab308] text-[#0b0e14] shadow-[0_6px_20px_rgba(248,212,120,0.22)] hover:brightness-110'
                : 'bg-gradient-to-l from-[#84e8ff] to-[#38bdf8] text-[#06101b] shadow-[0_6px_20px_rgba(72,214,252,0.22)] hover:brightness-110'
            }`}
          >
            <span>פתיחה וצפייה</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => triggerSmartDownloadExhibit(exhibit)}
              title={media.downloadLabel}
              aria-label={media.downloadLabel}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-[#cbd5e1] transition-colors hover:border-[#84e8ff]/50 hover:bg-white/15 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => triggerPrintExhibitSheet(exhibit)}
              title="הדפסה"
              aria-label="הדפסה"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-[#cbd5e1] transition-colors hover:border-[#f8d478]/50 hover:bg-white/15 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              title="שיתוף"
              aria-label="שיתוף"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-[#cbd5e1] transition-colors hover:border-emerald-400/50 hover:bg-white/15 hover:text-white"
            >
              {shared ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
            </button>

            {exhibit.githubUrl && (
              <a
                href={exhibit.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-[#cbd5e1] transition-colors hover:border-white/40 hover:bg-white/15 hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
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
