import { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Eye, Layers, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import type { StudioExhibitSample } from '../data/studioSamples';

interface ExhibitLiveStageProps {
  exhibit: StudioExhibitSample;
}

/**
 * Interactive 3D wireframe canvas stage for Node 03 (Meet3D / Zume Class)
 */
function Live3DClassroomCanvas({ mode }: { mode: 'cube' | 'orbit' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let angle = 0;

    const render = () => {
      angle += 0.014;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const size = Math.min(w, h) * 0.27;

      const cosY = Math.cos(angle);
      const sinY = Math.sin(angle);
      const cosX = Math.cos(angle * 0.6);
      const sinX = Math.sin(angle * 0.6);

      const project = (x: number, y: number, z: number) => {
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const scale = 2.6 / (3.4 + z2);
        return {
          sx: cx + x1 * size * scale,
          sy: cy + y2 * size * scale,
          z: z2,
        };
      };

      if (mode === 'cube') {
        const verts: Array<[number, number, number]> = [
          [-1, -1, -1],
          [1, -1, -1],
          [1, 1, -1],
          [-1, 1, -1],
          [-1, -1, 1],
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
        ];
        const edges: Array<[number, number]> = [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 0],
          [4, 5],
          [5, 6],
          [6, 7],
          [7, 4],
          [0, 4],
          [1, 5],
          [2, 6],
          [3, 7],
        ];
        const pts = verts.map(([x, y, z]) => project(x, y, z));

        ctx.strokeStyle = 'rgba(248, 212, 120, 0.72)';
        ctx.lineWidth = 1.5;
        for (const [a, b] of edges) {
          ctx.beginPath();
          ctx.moveTo(pts[a].sx, pts[a].sy);
          ctx.lineTo(pts[b].sx, pts[b].sy);
          ctx.stroke();
        }
        for (const p of pts) {
          ctx.fillStyle = '#fff3cf';
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Multi-ring 3D spatial classroom nodes
        for (let ring = 0; ring < 3; ring++) {
          const r = 0.65 + ring * 0.35;
          const count = 8;
          ctx.strokeStyle = ring === 1 ? 'rgba(132, 232, 255, 0.55)' : 'rgba(248, 212, 120, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i <= count; i++) {
            const a = (i / count) * Math.PI * 2 + angle * (ring % 2 === 0 ? 1 : -1);
            const p = project(Math.cos(a) * r, (ring - 1) * 0.48, Math.sin(a) * r);
            if (i === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  return <canvas ref={canvasRef} width={360} height={210} className="h-full w-full" />;
}

/**
 * Rich, interactive visual showcase stage tailored specifically to each node (01–06).
 * Turns static titles into a live, luxury Studio presentation inside the glass card.
 */
export function ExhibitLiveStage({ exhibit }: ExhibitLiveStageProps) {
  // Node 01: Live Banking Agent State
  const [bankAction, setBankAction] = useState<'liquidity' | 'fx' | 'transfer'>('liquidity');
  // Node 02: Alveare Multi-Agent Pipeline step
  const [activeAgentIdx, setActiveAgentIdx] = useState(0);
  // Node 03: 3D Classroom mode
  const [threeMode, setThreeMode] = useState<'cube' | 'orbit'>('orbit');
  // Node 04: Attention Architecture cognitive mode
  const [cogMode, setCogMode] = useState<'hyperfocus' | 'divergent'>('hyperfocus');
  // Node 05: 170-Source Consciousness Research layer
  const [researchLayer, setResearchLayer] = useState(0);
  // Node 06: Bio-Oracle scan layer
  const [scanLayer, setScanLayer] = useState<'ocular' | 'regulatory'>('ocular');

  if (exhibit.nodeCode === '01') {
    const scenarios = {
      liquidity: {
        label: 'איזון נזילות',
        metric: '+4.85% APY',
        title: 'אופטימיזציית תיק פרטי בזמן אמת',
        detail: 'הסוכן זיהה ₪420,000 פנויים והכין העברה שקופה למסלול נזיל נושא ריבית.',
      },
      fx: {
        label: 'גידור מט״ח',
        metric: '28% USD',
        title: 'בקרת חשיפה ומטבעות',
        detail: 'מוצגת הצעת גידור מיידית בלחיצה — ללא צורך בחיפוש בתוך תפריטים.',
      },
      transfer: {
        label: 'ביצוע ישיר',
        metric: '0.18s Auth',
        title: 'פקודת סוכן מאומתת',
        detail: 'אימות ביומטרי וביצוע פקודה פיננסית ישירות מתוך חלון הספוט.',
      },
    };
    const active = scenarios[bankAction];

    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-[#84e8ff]/25 bg-gradient-to-br from-[#0a1728]/80 to-[#040710]/90 p-4">
        <div className="flex items-center justify-between text-[11px] text-[#84e8ff]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>תצוגת סוכן פעילה</span>
          </span>
          <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[#fff1c7]">
            {active.metric}
          </span>
        </div>

        <div className="my-3 rounded-xl border border-white/12 bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] text-[#9ceeff]">
            <Terminal className="h-3 w-3" />
            <span>SPOTLIGHT RESPONSE</span>
          </div>
          <div className="mt-1 text-sm font-bold text-white">{active.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-[#d7e2f5]">{active.detail}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setBankAction(k)}
              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                bankAction === k
                  ? 'border-[#84e8ff]/60 bg-[#48d6fc]/20 text-white'
                  : 'border-white/14 bg-white/[0.03] text-[#b9c5db] hover:text-white'
              }`}
            >
              {scenarios[k].label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (exhibit.nodeCode === '02') {
    const pipeline = [
      { name: 'קליטת פנייה', role: 'Router Agent', desc: 'מיפוי כוונת הלקוח וזיהוי הקשר עסקי תוך מילי-שניות.' },
      { name: 'תיאום מומחים', role: 'Orchestrator', desc: 'הפעלה מקבילה של סוכני מחקר, תמחור וזמינות שירות.' },
      { name: 'ביצוע ואוטומציה', role: 'Action Layer', desc: 'סגירת פעולה ב-CRM ושליחת סיכום מאושר בזמן אמת.' },
    ];
    const current = pipeline[activeAgentIdx];

    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-[#84e8ff]/25 bg-gradient-to-br from-[#091522]/80 to-[#040710]/90 p-4">
        <div className="flex items-center justify-between text-[11px] text-[#84e8ff]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Cpu className="h-3.5 w-3.5" />
            <span>ארכיטקטורת Alveare חיה</span>
          </span>
          <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-emerald-300">
            LIVE · 3 NODES
          </span>
        </div>

        <div className="my-3 grid grid-cols-3 gap-2">
          {pipeline.map((step, i) => (
            <button
              key={step.role}
              type="button"
              onClick={() => setActiveAgentIdx(i)}
              className={`cursor-pointer rounded-xl border p-2.5 text-right transition-all ${
                activeAgentIdx === i
                  ? 'border-[#84e8ff]/60 bg-[#48d6fc]/16 shadow-[0_0_20px_rgba(72,214,252,0.18)]'
                  : 'border-white/12 bg-white/[0.03] hover:bg-white/[0.07]'
              }`}
            >
              <div
                dir="ltr"
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-[10px] text-[#84e8ff]"
              >
                0{i + 1}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white">{step.name}</div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3">
          <div dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] text-[#84e8ff]">
            {current.role}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#dce5f5]">{current.desc}</p>
        </div>
      </div>
    );
  }

  if (exhibit.nodeCode === '03') {
    return (
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#f8d478]/25 bg-gradient-to-br from-[#171207]/75 via-[#070a14]/85 to-[#061620]/80 p-4">
        <div className="flex items-center justify-between text-[11px] text-[#f8d478]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>סצנת WebGL 3D חיה</span>
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setThreeMode('orbit')}
              className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
                threeMode === 'orbit'
                  ? 'border-[#f8d478]/60 bg-[#f2be4e]/20 text-white'
                  : 'border-white/15 text-[#c7d2e6]'
              }`}
            >
              כיתה מרחבית
            </button>
            <button
              type="button"
              onClick={() => setThreeMode('cube')}
              className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
                threeMode === 'cube'
                  ? 'border-[#f8d478]/60 bg-[#f2be4e]/20 text-white'
                  : 'border-white/15 text-[#c7d2e6]'
              }`}
            >
              מודל גיאומטרי
            </button>
          </div>
        </div>

        <div className="my-1 h-40 w-full">
          <Live3DClassroomCanvas mode={threeMode} />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#dce4f4]">
          <span>אינטראקציית כיתה בתלת-ממד מעל Google Meet</span>
          <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[#f8d478]">
            60 FPS
          </span>
        </div>
      </div>
    );
  }

  if (exhibit.nodeCode === '04') {
    const bars =
      cogMode === 'hyperfocus'
        ? [38, 52, 88, 96, 92, 64, 48]
        : [74, 86, 62, 90, 78, 94, 82];

    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-[#84e8ff]/25 bg-gradient-to-br from-[#0b1426]/80 to-[#050811]/90 p-4">
        <div className="flex items-center justify-between text-[11px] text-[#84e8ff]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Activity className="h-3.5 w-3.5" />
            <span>מפת קשב אדפטיבית</span>
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setCogMode('hyperfocus')}
              className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
                cogMode === 'hyperfocus'
                  ? 'border-[#84e8ff]/60 bg-[#48d6fc]/20 text-white'
                  : 'border-white/15 text-[#c7d2e6]'
              }`}
            >
              מיקוד-על
            </button>
            <button
              type="button"
              onClick={() => setCogMode('divergent')}
              className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
                cogMode === 'divergent'
                  ? 'border-[#84e8ff]/60 bg-[#48d6fc]/20 text-white'
                  : 'border-white/15 text-[#c7d2e6]'
              }`}
            >
              חשיבה מסתעפת
            </button>
          </div>
        </div>

        <div className="my-3 flex h-28 items-end justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          {bars.map((val, idx) => (
            <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                style={{ height: `${val}%` }}
                className="w-full rounded-t-md bg-gradient-to-t from-[#48d6fc]/35 via-[#84e8ff]/75 to-white transition-all duration-300"
              />
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-[#d7e2f5]">
          {cogMode === 'hyperfocus'
            ? 'מצב מיקוד-על: מסנן רעש סביבתי ומאיר משימה אחת עמוקה לחיזוק היתרון הקוגניטיבי.'
            : 'מצב חשיבה מסתעפת: מחבר קשרים יצירתיים בין רעיונות ופורש מפת הקשרים צלולה.'}
        </p>
      </div>
    );
  }

  if (exhibit.nodeCode === '05') {
    const layers = [
      { title: 'שכבה 01 · מקורות ראשוניים', note: '170 מקורות מחקר מאומתים בתודעה, פילוסופיה והיסטוריה.' },
      { title: 'שכבה 02 · מחזורי ציוויליזציה', note: 'מיפוי דפוסים חוצי-תקופות של עלייה, משבר והתחדשות.' },
      { title: 'שכבה 03 · תכנון התודעה', note: 'חיבור בין חכמה עתיקה למודלים קוגניטיביים עכשוויים.' },
    ];

    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-[#84e8ff]/25 bg-gradient-to-br from-[#0b1322]/80 to-[#04060e]/90 p-4">
        <div className="flex items-center justify-between text-[11px] text-[#84e8ff]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Layers className="h-3.5 w-3.5" />
            <span>שכבות המחקר (170 מקורות)</span>
          </span>
          <span dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[#f8d478]">
            SYNAPSE MAP
          </span>
        </div>

        <div className="my-3 flex flex-col gap-2">
          {layers.map((l, idx) => (
            <button
              key={l.title}
              type="button"
              onClick={() => setResearchLayer(idx)}
              className={`cursor-pointer rounded-xl border p-2.5 text-right transition-all ${
                researchLayer === idx
                  ? 'border-[#84e8ff]/55 bg-[#48d6fc]/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-[#c7d3e6] hover:bg-white/[0.06]'
              }`}
            >
              <div className="text-xs font-semibold">{l.title}</div>
              {researchLayer === idx && (
                <p className="mt-1 text-[11px] leading-relaxed text-[#dce6f7]">{l.note}</p>
              )}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-[#b9c5db]">
          לחץ על כל שכבה לבחינת המבנה — או פתח את המחברת המלאה.
        </div>
      </div>
    );
  }

  // Node 06: Bio-Oracle Venture Visual Telemetry
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[#f8d478]/28 bg-gradient-to-br from-[#171208]/75 to-[#05070e]/92 p-4">
      <div className="flex items-center justify-between text-[11px] text-[#f8d478]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Eye className="h-3.5 w-3.5" />
          <span>סימולציית Bio-Oracle</span>
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setScanLayer('ocular')}
            className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
              scanLayer === 'ocular'
                ? 'border-[#f8d478]/60 bg-[#f2be4e]/20 text-white'
                : 'border-white/15 text-[#c7d2e6]'
            }`}
          >
            סריקת עין/פנים
          </button>
          <button
            type="button"
            onClick={() => setScanLayer('regulatory')}
            className={`cursor-pointer rounded-md border px-2 py-0.5 text-[10px] ${
              scanLayer === 'regulatory'
                ? 'border-[#f8d478]/60 bg-[#f2be4e]/20 text-white'
                : 'border-white/15 text-[#c7d2e6]'
            }`}
          >
            מסלול רגולציה
          </button>
        </div>
      </div>

      <div className="my-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3">
          <div dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] text-[#f8d478]">
            {scanLayer === 'ocular' ? 'OCULAR BIOMARKERS' : 'CLINICAL PATHWAY'}
          </div>
          <div className="mt-1 text-lg font-bold text-white">
            {scanLayer === 'ocular' ? '94.2%' : 'Phase Ready'}
          </div>
          <div className="text-[11px] text-[#cfd7e6]">
            {scanLayer === 'ocular' ? 'דיוק זיהוי מיקרו-תבניות' : 'תיק השקעה ורגולציה ממופה'}
          </div>
        </div>

        <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3">
          <div dir="ltr" style={{ fontFamily: 'var(--font-display)' }} className="text-[10px] text-[#84e8ff]">
            {scanLayer === 'ocular' ? 'FACIAL SYMMETRY' : 'VENTURE STATUS'}
          </div>
          <div className="mt-1 text-lg font-bold text-white">
            {scanLayer === 'ocular' ? 'Non-Invasive' : 'Seed / Angel'}
          </div>
          <div className="text-[11px] text-[#cfd7e6]">
            {scanLayer === 'ocular' ? 'אבחון מהיר ממצלמה רגילה' : 'מוכן להצגה למשקיעים'}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-[#e6d6b0]">
        חדר המיזמים · נתוני תצוגה אינטראקטיביים לבחינת המיזם.
      </div>
    </div>
  );
}
