import { type FormEvent, useState } from 'react';
import { ArrowUpRight, Bot, Box, Play, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';
import { CrystalButton, CrystalCard3D, CrystalLinkButton } from './GlassPrimitives';

interface StudioExhibitCardProps {
  exhibit: StudioExhibitSample;
  onOpenInBot?: (prompt: string, topic: string) => void;
  compact?: boolean;
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
        detail: 'חשיפה נוכחית 28% USD. הסוכן מציג גידור אוטומטי ללא צורך בחיפוש בתפריטים.',
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
 * Luxury single-exhibit crystal-glass showcase template for nodes 01–06
 * and for the 00 Spotlight Runtime.
 */
export function StudioExhibitCard({
  exhibit,
  onOpenInBot,
  compact = false,
}: StudioExhibitCardProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const isGold = exhibit.hue === 'gold';

  return (
    <>
      <CrystalCard3D hue={exhibit.hue} className="w-full">
        <div
          dir="rtl"
          className={`relative flex flex-col justify-between ${
            compact ? 'gap-3 p-4' : 'gap-5 p-6 sm:p-8'
          }`}
        >
          {/* Ambient Luxury Accent Aura */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -top-12 left-8 h-32 w-48 rounded-full blur-3xl ${
              isGold ? 'bg-[#f2be4e]/12' : 'bg-[#48d6fc]/12'
            }`}
          />

          <div className="relative">
            {/* Top row: node code + live status badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#dce0ea]/90">
                <span
                  dir="ltr"
                  style={{ fontFamily: 'var(--font-display)' }}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider ${
                    isGold
                      ? 'border-[#f8d478]/35 bg-[#f2be4e]/12 text-[#f8d478]'
                      : 'border-[#84e8ff]/35 bg-[#48d6fc]/12 text-[#84e8ff]'
                  }`}
                >
                  {exhibit.nodeCode}
                </span>
                <span className="font-medium">{exhibit.nodeTitle}</span>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium backdrop-blur-md ${
                  isGold
                    ? 'border-[#f8d478]/45 bg-[#f2be4e]/14 text-[#fff1c7]'
                    : 'border-[#84e8ff]/45 bg-[#48d6fc]/14 text-[#dcf8ff]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                    isGold ? 'bg-[#f8d478]' : 'bg-[#84e8ff]'
                  }`}
                />
                <span>{exhibit.status}</span>
              </span>
            </div>

            {/* Crisp Display Title */}
            <h2
              className={`mt-3.5 bg-gradient-to-l from-white via-[#f5f8ff] to-[#dce6f7] bg-clip-text font-bold tracking-tight text-transparent ${
                compact ? 'text-base sm:text-lg' : 'text-2xl sm:text-[28px]'
              }`}
            >
              {exhibit.title}
            </h2>

            {/* Synaptic Accent Hairline */}
            <div
              aria-hidden="true"
              className={`mt-2 h-px w-24 bg-gradient-to-l to-transparent ${
                isGold ? 'from-[#f8d478]/75' : 'from-[#84e8ff]/75'
              }`}
            />

            {/* Concise <=18 words summary */}
            <p
              className={`mt-2.5 leading-relaxed text-[#e9eef7]/94 ${
                compact ? 'text-xs' : 'text-sm sm:text-[15px]'
              }`}
            >
              {exhibit.summary}
            </p>
          </div>

          {/* Bottom row: 3 tech tags + interactive action */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-3.5">
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

            <div className="flex items-center gap-2">
              {!compact && exhibit.actionType === 'bot' && (
                <CrystalButton
                  hue={exhibit.hue}
                  size="md"
                  onClick={() => setDemoOpen(true)}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>הפעל הדגמה חיה</span>
                </CrystalButton>
              )}

              {exhibit.actionType === 'external' && exhibit.url ? (
                <CrystalLinkButton
                  href={exhibit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  hue={exhibit.hue}
                  size={compact ? 'sm' : 'md'}
                >
                  <Sparkles className="h-3.5 w-3.5 opacity-85" />
                  <span>{exhibit.actionLabel}</span>
                </CrystalLinkButton>
              ) : (
                <CrystalButton
                  hue={compact ? exhibit.hue : 'neutral'}
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
        </div>
      </CrystalCard3D>

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
