import { ArrowUpRight, Bot, Sparkles } from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';

interface StudioExhibitCardProps {
  exhibit: StudioExhibitSample;
  onOpenInBot?: (prompt: string, topic: string) => void;
  compact?: boolean;
}

/**
 * Luxury single-exhibit crystal-glass showcase template for nodes 01–06
 * and for the 00 Spotlight Runtime.
 */
export function StudioExhibitCard({
  exhibit,
  onOpenInBot,
  compact = false,
}: StudioExhibitCardProps) {
  const isGold = exhibit.hue === 'gold';

  return (
    <CrystalCard3D hue={exhibit.hue} className="w-full">
      <div
        dir="rtl"
        className={`flex flex-col justify-between ${
          compact ? 'gap-3 p-4' : 'gap-5 p-6 sm:p-8'
        }`}
      >
        <div>
          {/* Top row: node code + status pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#dce0ea]/85">
              <span
                dir="ltr"
                style={{ fontFamily: 'var(--font-display)' }}
                className={`font-semibold tracking-wider ${
                  isGold ? 'text-[#f8d478]' : 'text-[#84e8ff]'
                }`}
              >
                {exhibit.nodeCode}
              </span>
              <span className="opacity-40">·</span>
              <span className="font-medium">{exhibit.nodeTitle}</span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium backdrop-blur-md ${
                isGold
                  ? 'border-[#f8d478]/45 bg-[#f2be4e]/14 text-[#fff1c7]'
                  : 'border-[#84e8ff]/45 bg-[#48d6fc]/14 text-[#dcf8ff]'
              }`}
            >
              <Sparkles className="h-3 w-3 opacity-85" />
              <span>{exhibit.status}</span>
            </span>
          </div>

          {/* Crisp Display Title */}
          <h2
            className={`mt-3 font-bold tracking-tight text-white ${
              compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
            }`}
          >
            {exhibit.title}
          </h2>

          {/* Concise <=18 words summary */}
          <p
            className={`mt-2 leading-relaxed text-[#e6eaf3]/92 ${
              compact ? 'text-xs' : 'text-sm sm:text-base'
            }`}
          >
            {exhibit.summary}
          </p>
        </div>

        {/* Bottom row: 3 tech tags + single CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-3.5">
          <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
            {exhibit.techTags.map((tag) => (
              <span
                key={tag}
                style={{ fontFamily: 'var(--font-display)' }}
                className="rounded-lg border border-white/14 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#d7e0f2]"
              >
                {tag}
              </span>
            ))}
          </div>

          {exhibit.actionType === 'external' && exhibit.url ? (
            <CrystalLinkButton
              href={exhibit.url}
              target="_blank"
              rel="noopener noreferrer"
              hue={exhibit.hue}
              size={compact ? 'sm' : 'md'}
            >
              <span>{exhibit.actionLabel}</span>
            </CrystalLinkButton>
          ) : (
            <CrystalButton
              hue={exhibit.hue}
              size={compact ? 'sm' : 'md'}
              onClick={() =>
                onOpenInBot?.(
                  exhibit.botPrompt || `ספר לי על ${exhibit.title}`,
                  exhibit.nodeTitle
                )
              }
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{exhibit.actionLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            </CrystalButton>
          )}
        </div>
      </div>
    </CrystalCard3D>
  );
}
