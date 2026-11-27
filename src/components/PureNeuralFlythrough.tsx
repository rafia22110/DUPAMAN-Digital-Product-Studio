import { useEffect, useRef, useState } from 'react';
import type { AspectRatio } from '../types/studio';
import { BRAIN_NODES, type BrainNodeSpec } from '../data/brainNodes';
import { usePublicLanguage, translateText } from '../i18n';
import {
  type AnchorPoint,
  type EntranceMetrics,
  type WowRuntimeState,
  createWowState,
  renderWowOpticalOverlay,
  resetWowEntrance,
  stepWowState,
  triggerWowRipple,
} from './WowOpticalLayer';

export const OVERLAY_IMAGE_SRC = '/assets/aistudio/Illustrative_Image2_956e8c1e.jpg';
export const LOGO_IMAGE_SRC = '/assets/aistudio/Main_Logo___________fb356143.jpg';

interface PureNeuralFlythroughProps {
  videoUrl: string | null;
  aspectRatio: AspectRatio;
  paused: boolean;
  entranceReplayKey?: number;
  onSelectBrain?: (node: BrainNodeSpec) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  onVideosReady?: (videos: { a: HTMLVideoElement | null; b: HTMLVideoElement | null }) => void;
}

type NeuronHue = 'gold' | 'cyan' | 'violet' | 'magenta' | 'emerald' | 'amber';

interface PaletteColors {
  outer: string;
  mid: string;
  core: string;
  flare: string;
}

const NEURON_PALETTE: Record<NeuronHue, PaletteColors> = {
  cyan: {
    outer: '38, 206, 255',
    mid: '108, 232, 255',
    core: '226, 252, 255',
    flare: '96, 232, 255',
  },
  gold: {
    outer: '246, 182, 48',
    mid: '255, 212, 108',
    core: '255, 248, 214',
    flare: '255, 210, 102',
  },
  violet: {
    outer: '154, 78, 255',
    mid: '198, 136, 255',
    core: '242, 224, 255',
    flare: '190, 126, 255',
  },
  magenta: {
    outer: '242, 68, 168',
    mid: '255, 132, 204',
    core: '255, 224, 244',
    flare: '255, 118, 198',
  },
  emerald: {
    outer: '36, 226, 168',
    mid: '108, 246, 204',
    core: '220, 255, 244',
    flare: '86, 244, 196',
  },
  amber: {
    outer: '255, 116, 56',
    mid: '255, 168, 108',
    core: '255, 236, 216',
    flare: '255, 158, 96',
  },
};

const ALL_NEURON_HUES: NeuronHue[] = ['cyan', 'gold', 'violet', 'magenta', 'emerald', 'amber'];

function toAnchorHue(hue: NeuronHue): 'gold' | 'cyan' {
  return hue === 'gold' || hue === 'amber' || hue === 'magenta' ? 'gold' : 'cyan';
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  hue: NeuronHue;
  phase: number;
  isHero: boolean;
}

interface Branch3D {
  from: number;
  to: number;
  ctrlX: number;
  ctrlY: number;
  ctrlZ: number;
  thickness: number;
  myelinated: boolean;
  midHue: NeuronHue;
  wavePhase: number;
  waveCycles: number;
  swayAmp: number;
}

interface Pulse3D {
  branchIdx: number;
  offset: number;
  cycles: number;
  dir: 1 | -1;
  hue: NeuronHue;
  intensity: number;
}

interface Bokeh3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  hue: NeuronHue;
  alpha: number;
}

interface ImageSparkle {
  nx: number; // normalized 0..1 inside the square overlay image
  ny: number;
  phase: number;
  cycles: number; // integer cycles per 10s loop
  size: number;
  hue: 'gold' | 'cyan';
  maxAlpha: number;
}

export interface ProcessedOverlayAsset {
  canvas: HTMLCanvasElement;
  logoCanvas: HTMLCanvasElement | null;
  sparkles: ImageSparkle[];
}

const LOOP_DURATION = 10.0; // seconds — exact seamless loop period
const Z_SPAN = 1400;
const NEAR_CLIP = 55;
const FAR_CLIP = 1380;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build subtle sparkle points mapped precisely onto the brains & golden neuron filaments of Illustrative_Image2
function createImageNeuronSparkles(): ImageSparkle[] {
  const rand = mulberry32(956812);
  const sparkles: ImageSparkle[] = [];

  // Coordinates of the central brain & 6 satellite brains in Illustrative_Image2_956e8c1e.jpg
  const center = { x: 0.50, y: 0.54 };
  const satellites = [
    { x: 0.105, y: 0.185 }, // top-left
    { x: 0.055, y: 0.555 }, // mid-left
    { x: 0.285, y: 0.905 }, // bottom-left
    { x: 0.905, y: 0.165 }, // top-right
    { x: 0.945, y: 0.535 }, // mid-right
    { x: 0.765, y: 0.895 }, // bottom-right
  ];

  // Delicate golden sparkles along each of the 6 neural filament bridges
  for (const sat of satellites) {
    const count = 6;
    for (let i = 1; i <= count; i++) {
      const t = 0.18 + (i / (count + 1)) * 0.68;
      const jitterX = (rand() - 0.5) * 0.036;
      const jitterY = (rand() - 0.5) * 0.036;
      sparkles.push({
        nx: center.x + (sat.x - center.x) * t + jitterX,
        ny: center.y + (sat.y - center.y) * t + jitterY,
        phase: rand() * Math.PI * 2,
        cycles: rand() < 0.5 ? 2 : 3,
        size: 3.5 + rand() * 5.5,
        hue: 'gold',
        maxAlpha: 0.45 + rand() * 0.35,
      });
    }

    // Soft cyan/white shimmer right on each satellite brain node
    for (let k = 0; k < 2; k++) {
      sparkles.push({
        nx: sat.x + (rand() - 0.5) * 0.04,
        ny: sat.y + (rand() - 0.5) * 0.04,
        phase: rand() * Math.PI * 2,
        cycles: 2,
        size: 4 + rand() * 5,
        hue: 'cyan',
        maxAlpha: 0.42 + rand() * 0.28,
      });
    }
  }

  // Delicate internal synaptic glints inside the central glowing brain
  for (let i = 0; i < 12; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 0.02 + rand() * 0.095;
    sparkles.push({
      nx: center.x + Math.cos(angle) * dist * 0.9,
      ny: center.y + Math.sin(angle) * dist * 1.05,
      phase: rand() * Math.PI * 2,
      cycles: rand() < 0.6 ? 2 : 3,
      size: 3.5 + rand() * 5.5,
      hue: i % 3 === 0 ? 'gold' : 'cyan',
      maxAlpha: 0.48 + rand() * 0.32,
    });
  }

  return sparkles;
}

let cachedOverlayPromise: Promise<ProcessedOverlayAsset | null> | null = null;

/**
 * Loads Main_Logo___________fb356143.jpg and removes its dark background cleanly (alpha = 0),
 * leaving only the glowing glass rings, central starburst, and DUPAMAN metallic typography.
 */
function loadTransparentLogoCanvas(): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 1024;
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const ctx = off.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Sample dark navy background reference color from corners
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dr = r - bgR;
        const dg = g - bgG;
        const db = b - bgB;
        const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);
        const peak = Math.max(r, g, b);
        const signal = Math.max(colorDist, peak - 14);

        if (signal <= 16) {
          // 100% transparent background
          data[i + 3] = 0;
        } else {
          // Smooth anti-aliased alpha transition preserving luminous glass halos & serif edges
          const t = Math.min(1, (signal - 16) / 68);
          const smoothA = t * t * (3 - 2 * t);
          data[i + 3] = Math.round(smoothA * 255);

          // Gently un-multiply dark navy spill on semi-transparent glow edges
          if (smoothA < 0.98 && smoothA > 0.05) {
            const lift = 1 / Math.max(0.32, smoothA);
            data[i] = Math.min(255, Math.round(Math.max(0, r - bgR * (1 - smoothA)) * Math.min(1.6, lift)));
            data[i + 1] = Math.min(255, Math.round(Math.max(0, g - bgG * (1 - smoothA)) * Math.min(1.6, lift)));
            data[i + 2] = Math.min(255, Math.round(Math.max(0, b - bgB * (1 - smoothA)) * Math.min(1.6, lift)));
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(off);
    };

    img.onerror = () => resolve(null);
    img.src = LOGO_IMAGE_SRC;
  });
}

/**
 * Loads the background-free DUPAMAN logo (static constellation overlay image removed).
 */
export function loadProcessedOverlayImage(): Promise<ProcessedOverlayAsset | null> {
  if (cachedOverlayPromise) return cachedOverlayPromise;

  cachedOverlayPromise = loadTransparentLogoCanvas().then((logoCanvas) => {
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = 1;
    emptyCanvas.height = 1;
    return {
      canvas: emptyCanvas,
      logoCanvas,
      sparkles: createImageNeuronSparkles(),
    };
  });

  return cachedOverlayPromise;
}

/**
 * Renders the overlaid neural image (with 75% transparent background),
 * subtle sparkling glints on its neurons, and a thin, light translucent glass cover on top.
 */
export function renderOverlayImageLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  overlay: ProcessedOverlayAsset | null,
  wow?: { state: WowRuntimeState; entrance: EntranceMetrics } | null
): { drawX: number; drawY: number; baseSize: number } {
  const loopPhase = ((timeSec % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION;
  const loopNorm = loopPhase / LOOP_DURATION;
  const twoPi = Math.PI * 2;

  const entranceScale = wow ? wow.entrance.constellationScale : 1;
  const entranceAlpha = wow ? wow.entrance.constellationAlpha : 1;
  const parallaxX = wow ? (wow.state.smoothX - 0.5) * Math.min(w, h) * 0.022 : 0;
  const parallaxY = wow ? (wow.state.smoothY - 0.5) * Math.min(w, h) * 0.018 : 0;

  // Spread increased by +30% (0.86 * 1.30 = 1.118) with gentle organic breathing + entrance bloom
  const breathe = 1 + Math.sin(loopNorm * twoPi) * 0.012;
  const baseSize = Math.min(w, h) * 1.118 * breathe * entranceScale;
  const drawX = (w - baseSize) * 0.5 - parallaxX;
  const drawY = (h - baseSize) * 0.5 - parallaxY;

  if (!overlay) {
    return { drawX, drawY, baseSize };
  }

  ctx.save();

  // Delicate, light sparkle/twinkle effect on the synaptic constellation points
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (0.14 + 0.05 * Math.sin(loopNorm * twoPi * 2)) * entranceAlpha;
  const scaleFactor = baseSize / 720;
  for (const sp of overlay.sparkles) {
    const wave = Math.sin(loopNorm * twoPi * sp.cycles + sp.phase);
    // Crisp, gentle twinkle envelope (spends most time quiet, flares softly at peaks)
    const twinkle = Math.pow(Math.max(0, wave), 3);
    if (twinkle < 0.03) continue;

    const sx = drawX + sp.nx * baseSize;
    const sy = drawY + sp.ny * baseSize;
    const r = sp.size * scaleFactor * (0.75 + twinkle * 0.75);
    const alpha = sp.maxAlpha * twinkle;

    // Soft radial starlight glow
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.1);
    if (sp.hue === 'gold') {
      glow.addColorStop(0, `rgba(255, 248, 224, ${alpha.toFixed(3)})`);
      glow.addColorStop(0.32, `rgba(248, 200, 92, ${(alpha * 0.55).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(248, 200, 92, 0)');
    } else {
      glow.addColorStop(0, `rgba(238, 253, 255, ${alpha.toFixed(3)})`);
      glow.addColorStop(0.32, `rgba(92, 224, 255, ${(alpha * 0.52).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(92, 224, 255, 0)');
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 3.1, 0, twoPi);
    ctx.fill();

    // Delicate 4-point crystalline star glint (thin & light)
    const rayLen = r * 2.4;
    const rayColor =
      sp.hue === 'gold'
        ? `rgba(255, 244, 205, ${(alpha * 0.75).toFixed(3)})`
        : `rgba(224, 250, 255, ${(alpha * 0.75).toFixed(3)})`;
    ctx.strokeStyle = rayColor;
    ctx.lineWidth = Math.max(0.65, 0.9 * scaleFactor);
    ctx.beginPath();
    ctx.moveTo(sx - rayLen, sy);
    ctx.lineTo(sx + rayLen, sy);
    ctx.moveTo(sx, sy - rayLen * 0.85);
    ctx.lineTo(sx, sy + rayLen * 0.85);
    ctx.stroke();

    // Tiny bright center point
    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.92).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.9, r * 0.24), 0, twoPi);
    ctx.fill();
  }

  // 3. Thin, light translucent glass cover / optical membrane over the frame
  ctx.globalCompositeOperation = 'screen';

  // Ultra-delicate frosted-clear glass surface sheen (top-left grazing reflection)
  const glassSheen = ctx.createLinearGradient(0, 0, w, h);
  glassSheen.addColorStop(0, 'rgba(215, 238, 255, 0.055)');
  glassSheen.addColorStop(0.28, 'rgba(255, 255, 255, 0.015)');
  glassSheen.addColorStop(0.58, 'rgba(180, 224, 250, 0.006)');
  glassSheen.addColorStop(0.84, 'rgba(246, 214, 146, 0.025)');
  glassSheen.addColorStop(1, 'rgba(205, 234, 255, 0.048)');
  ctx.fillStyle = glassSheen;
  ctx.fillRect(0, 0, w, h);

  // Subtle moving diagonal optical glass reflection ribbon (seamless 10s periodic sweep)
  const sweepPos = (loopNorm * 1.8 - 0.4) * (w + h);
  const ribbonGrad = ctx.createLinearGradient(
    sweepPos - w * 0.22,
    0,
    sweepPos + w * 0.22,
    h * 0.55
  );
  ribbonGrad.addColorStop(0, 'rgba(220, 244, 255, 0)');
  ribbonGrad.addColorStop(0.45, 'rgba(225, 245, 255, 0.032)');
  ribbonGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.055)');
  ribbonGrad.addColorStop(0.55, 'rgba(255, 236, 188, 0.028)');
  ribbonGrad.addColorStop(1, 'rgba(220, 244, 255, 0)');
  ctx.fillStyle = ribbonGrad;
  ctx.fillRect(0, 0, w, h);

  // Thin curved glass Fresnel reflection arc framing the central neural glass dome
  const domeR = Math.min(w, h) * 0.48;
  const domeCx = w * 0.5;
  const domeCy = h * 0.5;

  const rimGrad = ctx.createRadialGradient(
    domeCx - domeR * 0.22,
    domeCy - domeR * 0.28,
    domeR * 0.62,
    domeCx,
    domeCy,
    domeR * 1.04
  );
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  rimGrad.addColorStop(0.86, 'rgba(195, 232, 255, 0.022)');
  rimGrad.addColorStop(0.96, 'rgba(232, 246, 255, 0.09)');
  rimGrad.addColorStop(1, 'rgba(195, 232, 255, 0)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(domeCx, domeCy, domeR * 1.04, 0, twoPi);
  ctx.fill();

  // Whisper-thin specular glass highlight arc along the upper-left edge of the glass layer
  ctx.strokeStyle = 'rgba(232, 246, 255, 0.14)';
  ctx.lineWidth = Math.max(1, 1.3 * scaleFactor);
  ctx.beginPath();
  ctx.arc(domeCx, domeCy, domeR * 0.985, Math.PI * 1.08, Math.PI * 1.48);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(248, 218, 148, 0.09)';
  ctx.lineWidth = Math.max(0.8, 1.0 * scaleFactor);
  ctx.beginPath();
  ctx.arc(domeCx, domeCy, domeR * 0.985, Math.PI * 0.08, Math.PI * 0.36);
  ctx.stroke();

  // 4. Background-free DUPAMAN logo anchored in the top-right obsidian corner (X mark) with holographic parallax + entrance glide
  if (overlay.logoCanvas) {
    const logoAlpha = wow ? wow.entrance.logoAlpha : 1;
    const logoLiftPx = wow ? wow.entrance.logoLiftNorm * Math.min(w, h) * 0.024 : 0;
    const logoParallaxX = wow ? (wow.state.smoothX - 0.5) * Math.min(w, h) * 0.012 : 0;
    const logoParallaxY = wow ? (wow.state.smoothY - 0.5) * Math.min(w, h) * 0.01 : 0;

    if (logoAlpha > 0.01) {
      const logoBreathe = 1 + Math.sin(loopNorm * twoPi) * 0.008;
      const logoSize = Math.min(w, h) * 0.27 * logoBreathe;
      const marginRight = Math.max(16, w * 0.025);
      const marginTop = Math.max(10, h * 0.018);
      const logoX = w - logoSize - marginRight + logoParallaxX;
      const logoY = marginTop + logoParallaxY + logoLiftPx;

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.96 * logoAlpha;
      ctx.shadowColor = 'rgba(2, 3, 8, 0.85)';
      ctx.shadowBlur = Math.max(10, logoSize * 0.045);
      ctx.drawImage(overlay.logoCanvas, logoX, logoY, logoSize, logoSize);
      ctx.shadowBlur = 0;

      // Specular entrance glint sweeping across the DUPAMAN logo on arrival
      const sweep = wow ? wow.entrance.logoSweepProgress : 0;
      if (sweep > 0.01 && sweep < 0.99) {
        const sweepFade = Math.sin(sweep * Math.PI);
        const sx = logoX + logoSize * (sweep * 1.2 - 0.1);
        const sy = logoY + logoSize * 0.5;
        const sw = logoSize * 0.28;
        ctx.globalCompositeOperation = 'screen';
        const lg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sw);
        lg.addColorStop(0, `rgba(255, 248, 224, ${(sweepFade * 0.42).toFixed(3)})`);
        lg.addColorStop(0.45, `rgba(116, 226, 255, ${(sweepFade * 0.18).toFixed(3)})`);
        lg.addColorStop(1, 'rgba(116, 226, 255, 0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(sx, sy, sw, 0, twoPi);
        ctx.fill();
      }

      // Gentle synchronized glint on the logo's central starburst (x=0.50, y=0.502 in logo)
      const starPulse = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(loopNorm * twoPi * 2), 2);
      const starX = logoX + logoSize * 0.5;
      const starY = logoY + logoSize * 0.502;
      const starR = logoSize * 0.055 * (0.85 + starPulse * 0.35);

      ctx.globalCompositeOperation = 'screen';
      const starGlow = ctx.createRadialGradient(starX, starY, 0, starX, starY, starR);
      starGlow.addColorStop(0, `rgba(255, 250, 232, ${(0.52 * starPulse * logoAlpha).toFixed(3)})`);
      starGlow.addColorStop(0.4, `rgba(245, 206, 118, ${(0.22 * starPulse * logoAlpha).toFixed(3)})`);
      starGlow.addColorStop(1, 'rgba(245, 206, 118, 0)');
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(starX, starY, starR, 0, twoPi);
      ctx.fill();
    }
  }

  ctx.restore();
  return { drawX, drawY, baseSize };
}

function buildSeamless3DNetwork() {
  const rand = mulberry32(732391);

  const pickHue = (): NeuronHue => {
    const r = rand();
    if (r < 0.22) return 'cyan';
    if (r < 0.42) return 'gold';
    if (r < 0.62) return 'violet';
    if (r < 0.78) return 'magenta';
    if (r < 0.90) return 'emerald';
    return 'amber';
  };

  const nodes: Node3D[] = [];
  const nodeCount = 60;

  for (let i = 0; i < nodeCount; i++) {
    const z = (i / nodeCount) * Z_SPAN;
    const angle = i * 2.39996 + (rand() - 0.5) * 0.5;
    const radialDist = 90 + rand() * 345;
    const x = Math.cos(angle) * radialDist * 1.25;
    const y = Math.sin(angle) * radialDist * 0.88;
    nodes.push({
      x,
      y,
      z,
      radius: 4.5 + rand() * 9.5,
      hue: pickHue(),
      phase: Math.floor(rand() * 3 + 1),
      isHero: rand() < 0.3,
    });
  }

  const branches: Branch3D[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const candidates: Array<{ j: number; dz: number; dist: number }> = [];

    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dz = b.z - a.z;
      if (dz > Z_SPAN * 0.5) dz -= Z_SPAN;
      if (dz < -Z_SPAN * 0.5) dz += Z_SPAN;

      const dist = Math.hypot(b.x - a.x, b.y - a.y, dz);
      if (dist > 68 && dist < 395) {
        candidates.push({ j, dz, dist });
      }
    }

    candidates.sort((u, v) => u.dist - v.dist);
    const maxLinks = a.isHero ? 4 : 2;
    for (let k = 0; k < Math.min(maxLinks, candidates.length); k++) {
      const { j, dz } = candidates[k];
      const b = nodes[j];
      const midX = (a.x + b.x) * 0.5 + (rand() - 0.5) * 115;
      const midY = (a.y + b.y) * 0.5 + (rand() - 0.5) * 98;
      const midZ = a.z + dz * 0.5 + (rand() - 0.5) * 35;
      branches.push({
        from: i,
        to: j,
        ctrlX: midX,
        ctrlY: midY,
        ctrlZ: midZ,
        thickness: 1.15 + rand() * 2.15,
        myelinated: rand() < 0.42,
        midHue: pickHue(),
        wavePhase: rand() * Math.PI * 2,
        waveCycles: Math.floor(rand() * 2) + 1,
        swayAmp: 5 + rand() * 11,
      });
    }
  }

  const pulses: Pulse3D[] = [];
  for (let i = 0; i < branches.length; i++) {
    const br = branches[i];
    const count = i % 2 === 0 ? 2 : 1;
    for (let c = 0; c < count; c++) {
      const pulseHue =
        c === 0
          ? nodes[br.from].hue
          : ALL_NEURON_HUES[(i + c * 2) % ALL_NEURON_HUES.length];
      pulses.push({
        branchIdx: i,
        offset: rand(),
        cycles: rand() < 0.45 ? 1 : 2,
        dir: (i + c) % 2 === 0 ? 1 : -1,
        hue: pulseHue,
        intensity: 0.82 + rand() * 0.48,
      });
    }
  }

  const bokeh: Bokeh3D[] = [];
  for (let i = 0; i < 68; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 60 + rand() * 680;
    bokeh.push({
      x: Math.cos(angle) * dist * 1.35,
      y: Math.sin(angle) * dist * 0.95,
      z: rand() * Z_SPAN,
      radius: 4 + rand() * 26,
      hue: pickHue(),
      alpha: 0.055 + rand() * 0.14,
    });
  }

  return { nodes, branches, pulses, bokeh };
}

export function renderNeuralFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timeSec: number,
  scene: ReturnType<typeof buildSeamless3DNetwork>,
  pointer: { x: number; y: number; active: boolean },
  overlay: ProcessedOverlayAsset | null = null,
  wow: { state: WowRuntimeState; entrance: EntranceMetrics } | null = null
) {
  const loopPhase = ((timeSec % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION;
  const loopNorm = loopPhase / LOOP_DURATION;
  const twoPi = Math.PI * 2;

  // 1. Deep darkened obsidian space backdrop so mouse optical effects pop cleanly
  ctx.globalCompositeOperation = 'source-over';
  const bgGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    w * 0.02,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.65
  );
  bgGrad.addColorStop(0, '#050912');
  bgGrad.addColorStop(0.38, '#020408');
  bgGrad.addColorStop(0.75, '#010204');
  bgGrad.addColorStop(1, '#010102');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle chromatic deep-space atmospheric nebula core (kept dark so mouse effects pop)
  const ambX = w * (0.5 + Math.sin(loopNorm * twoPi) * 0.045);
  const ambY = h * (0.5 + Math.cos(loopNorm * twoPi) * 0.035);
  const amb = ctx.createRadialGradient(ambX, ambY, 0, ambX, ambY, Math.min(w, h) * 0.5);
  amb.addColorStop(0, 'rgba(116, 62, 188, 0.075)');
  amb.addColorStop(0.36, 'rgba(32, 128, 178, 0.05)');
  amb.addColorStop(0.68, 'rgba(182, 112, 42, 0.028)');
  amb.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = amb;
  ctx.fillRect(0, 0, w, h);

  // Smooth 3D forward warp on entrance + holographic mouse parallax tilt
  const warpOffset = wow ? wow.entrance.warpZOffset : 0;
  const mouseCamX = wow ? (wow.state.smoothX - 0.5) * 68 : 0;
  const mouseCamY = wow ? (wow.state.smoothY - 0.5) * 52 : 0;

  const camZ = (loopNorm * Z_SPAN - warpOffset + Z_SPAN * 4) % Z_SPAN;
  const camX = Math.sin(loopNorm * twoPi) * 34 + mouseCamX;
  const camY = Math.cos(loopNorm * twoPi) * 24 + mouseCamY;
  const focal = Math.min(w, h) * 0.78;
  const cx = w * 0.5;
  const cy = h * 0.5;

  const project = (wx: number, wy: number, wz: number) => {
    let rz = wz - camZ;
    while (rz < NEAR_CLIP) rz += Z_SPAN;
    while (rz > NEAR_CLIP + Z_SPAN) rz -= Z_SPAN;

    const scale = focal / rz;
    const sx = cx + (wx - camX) * scale;
    const sy = cy + (wy - camY) * scale;
    const farFade = Math.max(0, Math.min(1, (FAR_CLIP - rz) / 420));
    const nearFade = Math.max(0, Math.min(1, (rz - NEAR_CLIP) / 145));
    const depthAlpha = farFade * nearFade;

    return { sx, sy, rz, scale, depthAlpha };
  };

  // 2. Background drifting volumetric chromatic bokeh particles
  ctx.globalCompositeOperation = 'screen';
  for (const b of scene.bokeh) {
    const p = project(b.x, b.y, b.z);
    if (p.depthAlpha <= 0.01) continue;
    const r = Math.max(1.5, b.radius * p.scale * 0.92);
    if (p.sx + r < 0 || p.sx - r > w || p.sy + r < 0 || p.sy - r > h) continue;

    const pal = NEURON_PALETTE[b.hue];
    const a = b.alpha * p.depthAlpha;
    const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r);
    grad.addColorStop(0, `rgba(${pal.mid}, ${(a * 1.45).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${pal.outer}, ${(a * 0.48).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${pal.outer}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, twoPi);
    ctx.fill();
  }

  const projectedNodes = scene.nodes.map((n, idx) => {
    const swayX = Math.sin(loopNorm * twoPi * n.phase + idx) * 8;
    const swayY = Math.cos(loopNorm * twoPi * n.phase + idx * 1.3) * 8;
    return project(n.x + swayX, n.y + swayY, n.z);
  });

  const sortedBranches = scene.branches
    .map((br, idx) => {
      const pa = projectedNodes[br.from];
      const pb = projectedNodes[br.to];
      const valid = Math.abs(pa.rz - pb.rz) < Z_SPAN * 0.42;
      return { br, idx, pa, pb, avgZ: (pa.rz + pb.rz) * 0.5, valid };
    })
    .filter((item) => item.valid && item.pa.depthAlpha > 0.02 && item.pb.depthAlpha > 0.02)
    .sort((u, v) => v.avgZ - u.avgZ);

  const px = pointer.x * w;
  const py = pointer.y * h;
  const flashRadius = Math.min(w, h) * 0.36;

  // 3. Living Multi-Chromatic Translucent Glass Axon Branches
  for (const { br, pa, pb } of sortedBranches) {
    // Subtle living organic sway along each fiber (seamless over LOOP_DURATION)
    const waveAngle = loopNorm * twoPi * br.waveCycles + br.wavePhase;
    const liveCtrlX = br.ctrlX + Math.sin(waveAngle) * br.swayAmp;
    const liveCtrlY = br.ctrlY + Math.cos(waveAngle) * br.swayAmp * 0.85;
    const pc = project(liveCtrlX, liveCtrlY, br.ctrlZ);

    const alpha = Math.min(pa.depthAlpha, pb.depthAlpha);
    const avgScale = (pa.scale + pb.scale) * 0.5;
    const baseWidth = Math.max(0.65, br.thickness * avgScale * 1.18);

    // Living energy breath along each axon
    const aliveBreath = 0.78 + 0.32 * Math.sin(waveAngle);

    let flashBoost = 0;
    if (pointer.active) {
      const dist = Math.hypot((pa.sx + pb.sx) * 0.5 - px, (pa.sy + pb.sy) * 0.5 - py);
      flashBoost = Math.max(0, 1 - dist / flashRadius) * 0.72;
    }

    const palA = NEURON_PALETTE[scene.nodes[br.from].hue];
    const palMid = NEURON_PALETTE[br.midHue];
    const palB = NEURON_PALETTE[scene.nodes[br.to].hue];

    // Pass 1: Wide bioluminescent chromatic aura gradient
    const auraAlpha = alpha * (0.17 * aliveBreath + flashBoost * 0.28);
    const auraGrad = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
    auraGrad.addColorStop(0, `rgba(${palA.outer}, ${auraAlpha.toFixed(3)})`);
    auraGrad.addColorStop(0.5, `rgba(${palMid.outer}, ${(auraAlpha * 1.15).toFixed(3)})`);
    auraGrad.addColorStop(1, `rgba(${palB.outer}, ${auraAlpha.toFixed(3)})`);

    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.quadraticCurveTo(pc.sx, pc.sy, pb.sx, pb.sy);
    ctx.strokeStyle = auraGrad;
    ctx.lineWidth = baseWidth * 4.6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Pass 2: Saturated translucent stained-glass fiber body gradient
    const bodyAlpha = alpha * (0.34 * aliveBreath + flashBoost * 0.4);
    const bodyGrad = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
    bodyGrad.addColorStop(0, `rgba(${palA.mid}, ${bodyAlpha.toFixed(3)})`);
    bodyGrad.addColorStop(0.5, `rgba(${palMid.mid}, ${(bodyAlpha * 1.12).toFixed(3)})`);
    bodyGrad.addColorStop(1, `rgba(${palB.mid}, ${bodyAlpha.toFixed(3)})`);

    ctx.beginPath();
    ctx.moveTo(pa.sx, pa.sy);
    ctx.quadraticCurveTo(pc.sx, pc.sy, pb.sx, pb.sy);
    ctx.strokeStyle = bodyGrad;
    ctx.lineWidth = baseWidth * 1.65;
    ctx.stroke();

    // Pass 3: Luminous prismatic specular core filament
    const coreAlpha = alpha * (0.46 * aliveBreath + flashBoost * 0.45);
    const coreGrad = ctx.createLinearGradient(pa.sx, pa.sy, pb.sx, pb.sy);
    if (flashBoost > 0.1) {
      coreGrad.addColorStop(0, `rgba(${palA.core}, ${coreAlpha.toFixed(3)})`);
      coreGrad.addColorStop(0.5, `rgba(255, 240, 192, ${Math.min(1, coreAlpha * 1.2).toFixed(3)})`);
      coreGrad.addColorStop(1, `rgba(${palB.core}, ${coreAlpha.toFixed(3)})`);
    } else {
      coreGrad.addColorStop(0, `rgba(${palA.core}, ${coreAlpha.toFixed(3)})`);
      coreGrad.addColorStop(0.5, `rgba(${palMid.core}, ${coreAlpha.toFixed(3)})`);
      coreGrad.addColorStop(1, `rgba(${palB.core}, ${coreAlpha.toFixed(3)})`);
    }

    ctx.beginPath();
    ctx.moveTo(pa.sx - 0.6, pa.sy - 0.6);
    ctx.quadraticCurveTo(pc.sx - 0.6, pc.sy - 0.6, pb.sx - 0.6, pb.sy - 0.6);
    ctx.strokeStyle = coreGrad;
    ctx.lineWidth = Math.max(0.5, baseWidth * 0.46);
    ctx.stroke();

    // Jewel-like shimmering chromatic myelin beads along the living curve
    if (br.myelinated && avgScale > 0.62) {
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const inv = 1 - t;
        const mx = inv * inv * pa.sx + 2 * inv * t * pc.sx + t * t * pb.sx;
        const my = inv * inv * pa.sy + 2 * inv * t * pc.sy + t * t * pb.sy;
        const beadPulse = 0.75 + 0.35 * Math.sin(waveAngle + s * 1.1);
        const beadR = baseWidth * 1.75 * (0.9 + 0.18 * beadPulse);
        const beadPal = s <= 2 ? palA : s >= 4 ? palB : palMid;
        const beadGrad = ctx.createRadialGradient(
          mx - beadR * 0.25,
          my - beadR * 0.25,
          0,
          mx,
          my,
          beadR
        );
        beadGrad.addColorStop(0, `rgba(${beadPal.core}, ${(alpha * 0.56 * beadPulse).toFixed(3)})`);
        beadGrad.addColorStop(0.52, `rgba(${beadPal.mid}, ${(alpha * 0.32 * beadPulse).toFixed(3)})`);
        beadGrad.addColorStop(1, `rgba(${beadPal.outer}, 0)`);
        ctx.fillStyle = beadGrad;
        ctx.beginPath();
        ctx.arc(mx, my, beadR, 0, twoPi);
        ctx.fill();
      }
    }
  }

  // 4. Lively Bidirectional Multi-Color Synaptic Light Pulses
  for (const pulse of scene.pulses) {
    const br = scene.branches[pulse.branchIdx];
    const pa = projectedNodes[br.from];
    const pb = projectedNodes[br.to];
    if (Math.abs(pa.rz - pb.rz) >= Z_SPAN * 0.42) continue;

    const alpha = Math.min(pa.depthAlpha, pb.depthAlpha);
    if (alpha <= 0.04) continue;

    const waveAngle = loopNorm * twoPi * br.waveCycles + br.wavePhase;
    const pc = project(
      br.ctrlX + Math.sin(waveAngle) * br.swayAmp,
      br.ctrlY + Math.cos(waveAngle) * br.swayAmp * 0.85,
      br.ctrlZ
    );

    const rawT = (pulse.offset + loopNorm * pulse.cycles) % 1;
    const tHead = pulse.dir === 1 ? rawT : 1 - rawT;
    const avgScale = (pa.scale + pb.scale) * 0.5;
    const pal = NEURON_PALETTE[pulse.hue];

    const trailSteps = 6;
    for (let s = trailSteps; s >= 0; s--) {
      const t = Math.min(1, Math.max(0, tHead - pulse.dir * s * 0.022));
      const inv = 1 - t;
      const x = inv * inv * pa.sx + 2 * inv * t * pc.sx + t * t * pb.sx;
      const y = inv * inv * pa.sy + 2 * inv * t * pc.sy + t * t * pb.sy;
      const falloff = 1 - s / (trailSteps + 1);
      const r = Math.max(2.2, (s === 0 ? 16.5 : 8.8) * avgScale * pulse.intensity * falloff);

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${pal.core}, ${(alpha * falloff * 0.96).toFixed(3)})`);
      grad.addColorStop(0.32, `rgba(${pal.mid}, ${(alpha * falloff * 0.7).toFixed(3)})`);
      grad.addColorStop(0.68, `rgba(${pal.outer}, ${(alpha * falloff * 0.28).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${pal.outer}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, twoPi);
      ctx.fill();
    }

    if (avgScale > 0.98) {
      const inv = 1 - tHead;
      const hx = inv * inv * pa.sx + 2 * inv * tHead * pc.sx + tHead * tHead * pb.sx;
      const hy = inv * inv * pa.sy + 2 * inv * tHead * pc.sy + tHead * tHead * pb.sy;
      const flareW = 50 * avgScale;
      const flareGrad = ctx.createLinearGradient(hx - flareW, hy, hx + flareW, hy);
      flareGrad.addColorStop(0, `rgba(${pal.flare}, 0)`);
      flareGrad.addColorStop(0.5, `rgba(${pal.flare}, ${(alpha * 0.42).toFixed(3)})`);
      flareGrad.addColorStop(1, `rgba(${pal.flare}, 0)`);
      ctx.strokeStyle = flareGrad;
      ctx.lineWidth = Math.max(1, 1.65 * avgScale);
      ctx.beginPath();
      ctx.moveTo(hx - flareW, hy);
      ctx.lineTo(hx + flareW, hy);
      ctx.stroke();
    }
  }

  // 5. Vibrant Multi-Chromatic Glowing Glass Synaptic Nodes
  const sortedNodes = scene.nodes
    .map((n, i) => ({ n, p: projectedNodes[i], i }))
    .filter(({ p }) => p.depthAlpha > 0.02)
    .sort((u, v) => v.p.rz - u.p.rz);

  for (const { n, p, i } of sortedNodes) {
    const r = Math.max(1.6, n.radius * p.scale);
    if (p.sx + r * 6 < 0 || p.sx - r * 6 > w || p.sy + r * 6 < 0 || p.sy - r * 6 > h) continue;

    const shimmer = 0.76 + 0.28 * Math.sin(loopNorm * twoPi * n.phase + i);
    const alpha = p.depthAlpha * shimmer;
    const pal = NEURON_PALETTE[n.hue];

    const haloR = r * (n.isHero ? 6.0 : 4.2);
    const halo = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, haloR);
    halo.addColorStop(0, `rgba(${pal.core}, ${(alpha * 0.9).toFixed(3)})`);
    halo.addColorStop(0.28, `rgba(${pal.mid}, ${(alpha * 0.48).toFixed(3)})`);
    halo.addColorStop(0.62, `rgba(${pal.outer}, ${(alpha * 0.18).toFixed(3)})`);
    halo.addColorStop(1, `rgba(${pal.outer}, 0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, haloR, 0, twoPi);
    ctx.fill();

    ctx.strokeStyle = `rgba(${pal.core}, ${(alpha * 0.64).toFixed(3)})`;
    ctx.lineWidth = Math.max(0.65, r * 0.15);
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r * 0.92, 0, twoPi);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.94).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.sx - r * 0.22, p.sy - r * 0.22, Math.max(0.85, r * 0.27), 0, twoPi);
    ctx.fill();
  }

  // 6. Overlaid Neural Image (75% transparent background) + Sparkling Neurons + Thin Glass Cover + Logo
  const constellationFrame = renderOverlayImageLayer(ctx, w, h, timeSec, overlay, wow);

  // 7. Deep Obsidian Dimming Veil & Perimeter Vignette so the mouse optical layer pops dramatically
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.22,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.68
  );
  vig.addColorStop(0, 'rgba(2, 3, 6, 0.26)');
  vig.addColorStop(0.68, 'rgba(2, 3, 5, 0.62)');
  vig.addColorStop(1, 'rgba(2, 2, 4, 0.95)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // 8. Interactive WOW Optical Layer (Entrance Ignition + Caustic Ripples + Magnetic Synaptic Mouse Arcs + Stardust)
  if (wow) {
    const anchors: AnchorPoint[] = [];
    // Add the 7 glowing brains from the overlaid constellation as prime magnetic targets
    const brainAnchors: Array<{ nx: number; ny: number; hue: 'gold' | 'cyan' }> = [
      { nx: 0.5, ny: 0.54, hue: 'gold' },
      { nx: 0.105, ny: 0.185, hue: 'cyan' },
      { nx: 0.055, ny: 0.555, hue: 'cyan' },
      { nx: 0.285, ny: 0.905, hue: 'gold' },
      { nx: 0.905, ny: 0.165, hue: 'cyan' },
      { nx: 0.945, ny: 0.535, hue: 'cyan' },
      { nx: 0.765, ny: 0.895, hue: 'gold' },
    ];
    for (const ba of brainAnchors) {
      anchors.push({
        x: constellationFrame.drawX + constellationFrame.baseSize * ba.nx,
        y: constellationFrame.drawY + constellationFrame.baseSize * ba.ny,
        hue: ba.hue,
      });
    }
    // Also add bright visible 3D glass nodes
    for (const { n, p } of sortedNodes) {
      if (p.depthAlpha > 0.35 && p.sx > 0 && p.sx < w && p.sy > 0 && p.sy < h) {
        anchors.push({ x: p.sx, y: p.sy, hue: toAnchorHue(n.hue) });
      }
    }

    renderWowOpticalOverlay(ctx, w, h, wow.state, wow.entrance, anchors, constellationFrame);
  }

  return constellationFrame;
}

function renderHoveredBrainRing(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  constellationFrame: { drawX: number; drawY: number; baseSize: number },
  hoveredBrainId: string | null
) {
  if (!hoveredBrainId) return;
  const node = BRAIN_NODES.find((b) => b.id === hoveredBrainId);
  if (!node) return;

  const bx = constellationFrame.drawX + constellationFrame.baseSize * node.nx;
  const by = constellationFrame.drawY + constellationFrame.baseSize * node.ny;
  const r = constellationFrame.baseSize * (node.isMain ? 0.145 : 0.068);
  const pulse = 0.86 + 0.14 * Math.sin(timeSec * 3.8);
  const twoPi = Math.PI * 2;
  const rot = timeSec * 0.7;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Soft translucent radiance around the hovered brain
  const glow = ctx.createRadialGradient(bx, by, r * 0.4, bx, by, r * 1.55);
  if (node.hue === 'gold') {
    glow.addColorStop(0, 'rgba(255, 242, 200, 0.18)');
    glow.addColorStop(0.55, 'rgba(242, 190, 78, 0.16)');
    glow.addColorStop(1, 'rgba(242, 190, 78, 0)');
  } else {
    glow.addColorStop(0, 'rgba(224, 250, 255, 0.18)');
    glow.addColorStop(0.55, 'rgba(72, 214, 252, 0.16)');
    glow.addColorStop(1, 'rgba(72, 214, 252, 0)');
  }
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(bx, by, r * 1.55, 0, twoPi);
  ctx.fill();

  // Whisper-thin refractive glass orbital ring
  ctx.strokeStyle =
    node.hue === 'gold'
      ? `rgba(255, 232, 168, ${(0.55 * pulse).toFixed(3)})`
      : `rgba(176, 242, 255, ${(0.55 * pulse).toFixed(3)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(bx, by, r, 0, twoPi);
  ctx.stroke();

  // Subtle rotating specular caustic arc on the glass ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(bx, by, r * 1.04, rot, rot + Math.PI * 0.42);
  ctx.stroke();

  ctx.restore();
}

export function createExportScene() {
  return buildSeamless3DNetwork();
}

export function PureNeuralFlythrough({
  videoUrl,
  aspectRatio,
  paused,
  entranceReplayKey = 0,
  onSelectBrain,
  onCanvasReady,
  onVideosReady,
}: PureNeuralFlythroughProps) {
  const language = usePublicLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef(buildSeamless3DNetwork());
  const overlayRef = useRef<ProcessedOverlayAsset | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const wowStateRef = useRef(createWowState());
  const pausedRef = useRef(paused);
  const hoveredBrainIdRef = useRef<string | null>(null);
  const cssFrameRef = useRef({ drawX: 0, drawY: 0, baseSize: 0, cw: 1, ch: 1 });

  const [hoveredCard, setHoveredCard] = useState<{
    node: BrainNodeSpec;
    anchorX: number;
    anchorY: number;
    cw: number;
    ch: number;
    tiltX: number;
    tiltY: number;
  } | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (entranceReplayKey > 0) {
      resetWowEntrance(wowStateRef.current);
      hoveredBrainIdRef.current = null;
      setHoveredCard(null);
    }
  }, [entranceReplayKey]);

  useEffect(() => {
    let active = true;
    loadProcessedOverlayImage().then((asset) => {
      if (active) overlayRef.current = asset;
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onVideosReady?.({ a: videoARef.current, b: videoBRef.current });
  }, [videoUrl, onVideosReady]);

  // Live 60 FPS canvas (renders full 3D neural fly-through + overlay when no AI video,
  // or renders transparent overlay image + sparkles + thin glass cover on top when AI video plays)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCanvasReady?.(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastNow = performance.now();
    let elapsedSec = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const tw = Math.max(1, Math.round(rect.width * dpr));
      const th = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
    };

    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      if (!pausedRef.current) {
        elapsedSec += dt;
      }

      const entrance = stepWowState(
        wowStateRef.current,
        pausedRef.current ? 0 : dt,
        pointerRef.current,
        canvas.width,
        canvas.height
      );
      const wowPack = { state: wowStateRef.current, entrance };

      let cFrame: { drawX: number; drawY: number; baseSize: number };
      if (!videoUrl) {
        cFrame = renderNeuralFrame(
          ctx,
          canvas.width,
          canvas.height,
          elapsedSec,
          sceneRef.current,
          pointerRef.current,
          overlayRef.current,
          wowPack
        );
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cFrame = renderOverlayImageLayer(
          ctx,
          canvas.width,
          canvas.height,
          elapsedSec,
          overlayRef.current,
          wowPack
        );
        const anchors: AnchorPoint[] = BRAIN_NODES.map((b) => ({
          x: cFrame.drawX + cFrame.baseSize * b.nx,
          y: cFrame.drawY + cFrame.baseSize * b.ny,
          hue: b.hue,
        }));
        renderWowOpticalOverlay(
          ctx,
          canvas.width,
          canvas.height,
          wowStateRef.current,
          entrance,
          anchors,
          cFrame
        );
      }

      // Draw translucent glass highlight ring around whichever of the 7 brains is hovered
      renderHoveredBrainRing(ctx, elapsedSec, cFrame, hoveredBrainIdRef.current);

      // Record CSS-pixel constellation bounds for exact hover hit-testing
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const scaleToCss = rect.width / canvas.width;
        cssFrameRef.current = {
          drawX: cFrame.drawX * scaleToCss,
          drawY: cFrame.drawY * scaleToCss,
          baseSize: cFrame.baseSize * scaleToCss,
          cw: rect.width,
          ch: rect.height,
        };
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
      onCanvasReady?.(null);
    };
  }, [videoUrl, onCanvasReady]);

  // Dual-video 1-second seamless crossfade engine when AI video is active
  useEffect(() => {
    const vA = videoARef.current;
    const vB = videoBRef.current;
    if (!videoUrl || !vA || !vB) return;

    let active: 'A' | 'B' = 'A';
    let crossfadeStarted = false;
    vA.style.opacity = '1';
    vB.style.opacity = '0';

    if (!paused) {
      vA.currentTime = 0;
      vA.play().catch(() => {});
      vB.pause();
      vB.currentTime = 0;
    } else {
      vA.pause();
      vB.pause();
    }

    let rafId = 0;
    const tick = () => {
      const cur = active === 'A' ? vA : vB;
      const next = active === 'A' ? vB : vA;
      const dur = Number.isFinite(cur.duration) && cur.duration > 0 ? cur.duration : 10;
      const cf = Math.min(1.0, dur * 0.4);
      const remaining = dur - cur.currentTime;

      if (!paused && remaining <= cf && dur > 1.5) {
        if (!crossfadeStarted) {
          crossfadeStarted = true;
          next.currentTime = 0;
          next.play().catch(() => {});
        }
        const p = Math.min(1, Math.max(0, 1 - remaining / cf));
        const eased = p * p * (3 - 2 * p);
        cur.style.opacity = String(1 - eased);
        next.style.opacity = String(eased);

        if (remaining <= 0.05) {
          cur.pause();
          cur.currentTime = 0;
          active = active === 'A' ? 'B' : 'A';
          crossfadeStarted = false;
          vA.style.opacity = active === 'A' ? '1' : '0';
          vB.style.opacity = active === 'B' ? '1' : '0';
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [videoUrl, paused]);

  const findBrainAtCssPoint = (px: number, py: number) => {
    const cf = cssFrameRef.current;
    if (cf.baseSize <= 10) return null;

    let best: {
      node: BrainNodeSpec;
      ax: number;
      ay: number;
      ratio: number;
      tiltX: number;
      tiltY: number;
    } | null = null;
    for (const node of BRAIN_NODES) {
      const ax = cf.drawX + cf.baseSize * node.nx;
      const ay = cf.drawY + cf.baseSize * node.ny;
      const radiusPx = Math.max(36, cf.baseSize * node.hitRadius);
      const dist = Math.hypot(px - ax, py - ay);
      if (dist <= radiusPx) {
        const ratio = dist / radiusPx;
        if (!best || ratio < best.ratio) {
          const tiltY = Math.max(-1, Math.min(1, (px - ax) / radiusPx));
          const tiltX = Math.max(-1, Math.min(1, -(py - ay) / radiusPx));
          best = { node, ax, ay, ratio, tiltX, tiltY };
        }
      }
    }
    return best
      ? {
          node: best.node,
          anchorX: best.ax,
          anchorY: best.ay,
          cw: cf.cw,
          ch: cf.ch,
          tiltX: best.tiltX,
          tiltY: best.tiltY,
        }
      : null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointerRef.current = {
      x: Math.min(1, Math.max(0, px / rect.width)),
      y: Math.min(1, Math.max(0, py / rect.height)),
      active: true,
    };

    const hit = findBrainAtCssPoint(px, py);
    const nextId = hit ? hit.node.id : null;
    if (nextId !== hoveredBrainIdRef.current) {
      hoveredBrainIdRef.current = nextId;
      setHoveredCard(hit);
    } else if (hit) {
      setHoveredCard((prev) =>
        prev &&
        (Math.abs(prev.tiltX - hit.tiltX) > 0.04 ||
          Math.abs(prev.tiltY - hit.tiltY) > 0.04 ||
          Math.abs(prev.anchorX - hit.anchorX) > 4 ||
          Math.abs(prev.anchorY - hit.anchorY) > 4)
          ? hit
          : prev
      );
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nx = Math.min(1, Math.max(0, px / rect.width));
    const ny = Math.min(1, Math.max(0, py / rect.height));
    pointerRef.current = { x: nx, y: ny, active: true };
    triggerWowRipple(wowStateRef.current, nx, ny, 1.0);

    const hit = findBrainAtCssPoint(px, py);
    hoveredBrainIdRef.current = hit ? hit.node.id : null;
    setHoveredCard(hit);

    if (hit && onSelectBrain) {
      onSelectBrain(hit.node);
    }
  };

  const handlePointerLeave = () => {
    pointerRef.current = { ...pointerRef.current, active: false };
    hoveredBrainIdRef.current = null;
    setHoveredCard(null);
  };

  const isPortrait = aspectRatio === '9:16';

  // Compute safe, viewport-clamped position for the transparent glass card
  const getGlassCardPosition = (card: NonNullable<typeof hoveredCard>) => {
    const isMain = Boolean(card.node.isMain);
    const cardW = isMain ? Math.min(580, card.cw - 40) : Math.min(288, card.cw - 32);
    const cardH = isMain ? 344 : 156;
    const pad = 20;
    const offset = isMain ? 0 : 68;

    let left = card.anchorX - cardW * 0.5;
    let top = card.anchorY - cardH * 0.5;

    if (isMain) {
      // Open the Big Brain luxury welcome card right in the optical center (~30% higher than bottom placement)
      left = card.cw * 0.5 - cardW * 0.5;
      top = card.ch * 0.46 - cardH * 0.5;
    } else {
      switch (card.node.cardPlacement) {
        case 'right':
          left = card.anchorX + offset;
          top = card.anchorY - cardH * 0.5;
          break;
        case 'left':
          left = card.anchorX - offset - cardW;
          top = card.anchorY - cardH * 0.5;
          break;
        case 'top-right':
          left = card.anchorX + 34;
          top = card.anchorY - cardH - 36;
          break;
        case 'top-left':
          left = card.anchorX - cardW - 34;
          top = card.anchorY - cardH - 36;
          break;
        case 'bottom':
          left = card.anchorX - cardW * 0.5;
          top = card.anchorY + offset;
          break;
      }
    }

    // Clamp cleanly inside viewport
    left = Math.max(pad, Math.min(card.cw - cardW - pad, left));
    top = Math.max(pad, Math.min(card.ch - cardH - pad, top));

    return { left, top, width: cardW };
  };

  const cardPos = hoveredCard ? getGlassCardPosition(hoveredCard) : null;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#020204]">
      <div
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
        className={`relative overflow-hidden bg-[#020204] ${
          hoveredCard ? 'cursor-pointer' : 'cursor-crosshair'
        } ${isPortrait ? 'aspect-[9/16] h-full max-w-full' : 'h-full w-full'}`}
      >
        {videoUrl && (
          <>
            <video
              ref={videoARef}
              src={videoUrl}
              muted
              playsInline
              preload="auto"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'brightness(0.65) contrast(1.15)' }}
            />
            <video
              ref={videoBRef}
              src={videoUrl}
              muted
              playsInline
              preload="auto"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'brightness(0.65) contrast(1.15)', opacity: 0 }}
            />
          </>
        )}

        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 block h-full w-full"
          style={videoUrl ? undefined : { filter: 'brightness(0.84) contrast(1.18)' }}
        />

        {/* True 3D Transparent Crystal-Glass Card reacting live to pointer angle over any of the 7 brains */}
        {hoveredCard && cardPos && (
          <div
            key={hoveredCard.node.id}
            style={{
              left: `${cardPos.left}px`,
              top: `${cardPos.top}px`,
              width: `${cardPos.width}px`,
              perspective: '960px',
            }}
            className="pointer-events-none absolute z-30"
          >
            <div
              dir={language === "he" ? "rtl" : "ltr"}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${(hoveredCard.tiltX * 10 + 3).toFixed(2)}deg) rotateY(${(
                  hoveredCard.tiltY * 12
                ).toFixed(2)}deg) translateZ(14px)`,
                transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'glassCardReveal 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
              className="relative"
            >
              {/* 3D Extruded Back Glass Bezel Slab (gives tangible crystal thickness in 3D space) */}
              <div
                aria-hidden="true"
                style={{
                  transform: 'translateZ(-14px) translateY(5px)',
                  boxShadow:
                    hoveredCard.node.hue === 'gold'
                      ? '0 24px 55px rgba(0, 0, 0, 0.72), 0 0 34px rgba(242, 190, 78, 0.16)'
                      : '0 24px 55px rgba(0, 0, 0, 0.72), 0 0 34px rgba(72, 214, 252, 0.16)',
                }}
                className={`pointer-events-none absolute inset-0 border border-white/12 bg-white/[0.03] ${
                  hoveredCard.node.isMain ? 'rounded-3xl' : 'rounded-2xl'
                }`}
              />

              {/* Primary Ultra-Transparent 3D Liquid Glass Face */}
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  background: hoveredCard.node.isMain
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.105) 0%, rgba(8,12,24,0.22) 52%, rgba(242,190,78,0.045) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(12,18,32,0.22) 48%, rgba(255,255,255,0.04) 100%)',
                  boxShadow:
                    hoveredCard.node.hue === 'gold'
                      ? 'inset 0 1.5px 0 rgba(255, 246, 218, 0.48), inset 0 -1px 0 rgba(242, 190, 78, 0.26), inset 1px 0 0 rgba(255,255,255,0.18), 0 22px 58px rgba(0,0,0,0.55)'
                      : 'inset 0 1.5px 0 rgba(220, 248, 255, 0.42), inset 0 -1px 0 rgba(72, 214, 252, 0.22), inset 1px 0 0 rgba(255,255,255,0.16), 0 14px 36px rgba(0,0,0,0.45)',
                }}
                className={`relative overflow-hidden border border-white/24 backdrop-blur-md ${
                  hoveredCard.node.isMain
                    ? 'rounded-3xl px-8 py-7 text-center sm:px-10 sm:py-8'
                    : 'rounded-2xl px-5 py-4 text-right'
                }`}
              >
                {/* Delicate translucent optical image ghost inside the Big Brain glass card (screen-blended so background shines cleanly through) */}
                {hoveredCard.node.isMain && (
                  <div
                    aria-hidden="true"
                    style={{
                      backgroundImage: "url('/assets/aistudio/Illustrative_Image1_52befb19.jpg')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      mixBlendMode: 'screen',
                      opacity: 0.15,
                      maskImage:
                        'radial-gradient(ellipse 80% 78% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 56%, transparent 100%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 80% 78% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 56%, transparent 100%)',
                    }}
                    className="pointer-events-none absolute inset-0"
                  />
                )}

                {/* Subtle inner architectural luxury frame hairline for the Big Brain welcome slab */}
                {hoveredCard.node.isMain && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 rounded-2xl border border-white/[0.09]"
                  />
                )}

                {/* Live cursor-angle specular reflection sweeping across the transparent glass face */}
                <div
                  aria-hidden="true"
                  style={{
                    background: `radial-gradient(${
                      hoveredCard.node.isMain ? '360px' : '220px'
                    } circle at ${(50 + hoveredCard.tiltY * 36).toFixed(1)}% ${(
                      40 -
                      hoveredCard.tiltX * 32
                    ).toFixed(1)}%, rgba(255,255,255,0.22), rgba(248,212,120,0.05) 45%, transparent 72%)`,
                  }}
                  className="pointer-events-none absolute inset-0"
                />

                {/* Sharp top-bevel crystal refraction edge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/75 to-transparent"
                />

                {/* Floating 3D Elevated Content Plane */}
                <div
                  style={{
                    transform: 'translateZ(24px)',
                    textShadow: '0 2px 16px rgba(2, 4, 10, 0.92)',
                  }}
                  className="relative"
                >
                  {hoveredCard.node.isMain ? (
                    <div className="flex flex-col items-center">
                      {/* Luxury Maison Eyebrow */}
                      <div className="flex items-center gap-3 font-serif text-[11px] font-medium tracking-[0.34em] text-[#f5d584]/90 uppercase">
                        <span>DUPAMAN</span>
                        <span aria-hidden="true" className="text-white/35">
                          ·
                        </span>
                        <span className="font-sans text-[10px] tracking-[0.22em] text-[#dce6f5]/80">
                          {language === 'en' ? 'INTELLIGENCE · CREATIVITY · HUMANITY' : 'HERITAGE · EDUCATION · AI'}
                        </span>
                      </div>

                      {/* Architectural Diamond Hairline Ornament */}
                      <div className="mt-3 flex w-44 items-center gap-2.5">
                        <span className="h-px flex-1 bg-gradient-to-l from-[#f8d478]/65 to-transparent" />
                        <span className="h-1.5 w-1.5 rotate-45 border border-[#f8d478]/85 bg-[#f8d478]/30" />
                        <span className="h-px flex-1 bg-gradient-to-r from-[#f8d478]/65 to-transparent" />
                      </div>

                      {/* Welcome Greeting & Main Display Title */}
                      <p className="mt-3 text-[11px] font-medium tracking-[0.22em] text-[#9de6ff]/90">
                        {language === 'en' ? 'WELCOME TO THE LIVING STUDIO' : 'ברוכים הבאים אל המרחב החי'}
                      </p>

                      <h3 className="mt-1.5 bg-gradient-to-b from-white via-[#fff7e2] to-[#ebc46c] bg-clip-text font-sans text-2xl font-light tracking-tight text-transparent sm:text-[30px]">
                        {language === 'en' ? (
                          <><span className="font-semibold">DUPAMAN</span> — A Space for Knowledge, Creation & Inspiration</>
                        ) : (
                          <><span className="font-semibold">דופמין</span> — מרחב ידע, יצירה והשראה</>
                        )}
                      </h3>

                      {/* Refined Editorial Welcome Copy */}
                      <p className="mt-3 max-w-md text-xs leading-7 font-light text-[#edf2fa]/92 sm:text-[13.5px]">
                        {language === 'en'
                          ? 'An immersive, zero-scroll environment bringing together curated insights, innovation and learning resources, and a living academy — shaped in lucid glass to preserve focus, curiosity and depth.'
                          : 'בית מרחבי נקי ללא גלילה המאחד חדשות ומדריכים נבחרים, מאגרי חדשנות וחינוך, ואקדמיה חיה — בעיצוב זכוכית צלול השומר על הקשב, הסקרנות והעומק.'}
                      </p>

                      {/* Three Luxury Architectural Pillars */}
                      <div className="mt-5 grid w-full grid-cols-3 divide-x divide-x-reverse divide-white/14 border-y border-white/12 py-2.5">
                        <div className="px-2">
                          <div className="font-serif text-xs tracking-widest text-[#f8d478] uppercase">
                            01 — 06
                          </div>
                          <div className="mt-0.5 text-[11px] font-light text-[#dce4f2]">
                            {language === 'en' ? 'Six Worlds of Discovery' : 'שישה עולמות תוכן'}
                          </div>
                        </div>
                        <div className="px-2">
                          <div className="font-serif text-xs tracking-widest text-[#8ae8ff] uppercase">
                            Zero-G
                          </div>
                          <div className="mt-0.5 text-[11px] font-light text-[#dce4f2]">
                            {language === 'en' ? 'Zero-Scroll Experience' : 'חוויה ללא גלילה'}
                          </div>
                        </div>
                        <div className="px-2">
                          <div className="font-serif text-xs tracking-widest text-[#f8d478] uppercase">
                            Concierge AI
                          </div>
                          <div className="mt-0.5 text-[11px] font-light text-[#dce4f2]">
                            {language === 'en' ? 'AI Concierge & Membership' : 'בוט חכם ומנויים'}
                          </div>
                        </div>
                      </div>

                      {/* Subtle Luxury Footer / Click Invitation */}
                      <div className="mt-4 flex w-full items-center justify-between text-[11px] tracking-wide">
                        <span className="font-light text-[#cfd7e6]/75">{language === 'en' ? 'Rafael Argenti · DUPAMAN' : 'רפאל ארגנטי · DUPAMAN'}</span>
                        <span className="inline-flex items-center gap-2 font-medium text-[#ffe8ac]">
                          <span>{translateText("לחץ לכניסה לבוט ולמנהל המנויים", language)}</span>
                          <span aria-hidden="true">←</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-[#dce0ea]">
                        <span
                          className={`font-mono tabular-nums ${
                            hoveredCard.node.hue === 'gold' ? 'text-[#f8d478]' : 'text-[#84e8ff]'
                          }`}
                        >
                          {hoveredCard.node.indexLabel}
                        </span>
                        <span aria-hidden="true" className="text-white/40">
                          ·
                        </span>
                        <span>{translateText(hoveredCard.node.kicker, language)}</span>
                      </div>

                      <h3 className="mt-1.5 font-sans text-base font-semibold tracking-tight text-white">
                        {translateText(hoveredCard.node.title, language)}
                      </h3>

                      <p className="mt-1.5 text-xs leading-relaxed text-[#e6e9f0]/92">
                        {translateText(hoveredCard.node.description, language)}
                      </p>

                      <div
                        className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-medium ${
                          hoveredCard.node.hue === 'gold' ? 'text-[#f8d478]' : 'text-[#84e8ff]'
                        }`}
                      >
                        <span>{translateText(hoveredCard.node.ctaLabel, language)}</span>
                        <span aria-hidden="true">←</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
