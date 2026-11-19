import { useEffect, useRef } from 'react';
import {
  createExportScene,
  loadProcessedOverlayImage,
  renderNeuralFrame,
  type ProcessedOverlayAsset,
} from './PureNeuralFlythrough';

interface SubtleBrainBackdropProps {
  accent?: 'cyan' | 'gold';
}

/**
 * Calm, refined active-brain background for all inner pages — reuses the exact
 * DUPAMAN living neural network at slow breathing speed and soft low contrast
 * so floating 3D crystal-glass cards feel native to the Home Screen.
 */
export function SubtleBrainBackdrop({ accent = 'cyan' }: SubtleBrainBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef(createExportScene());
  const overlayRef = useRef<ProcessedOverlayAsset | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    let mounted = true;
    loadProcessedOverlayImage().then((asset) => {
      if (mounted) overlayRef.current = asset;
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const tw = Math.max(1, Math.round(window.innerWidth * dpr));
      const th = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
    };

    const onMove = (e: PointerEvent) => {
      pointerRef.current = {
        x: e.clientX / Math.max(1, window.innerWidth),
        y: e.clientY / Math.max(1, window.innerHeight),
        active: true,
      };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });

    let rafId = 0;
    let last = performance.now();
    let elapsed = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Gentle, meditative active-brain pace
      elapsed += dt * 0.42;

      const w = canvas.width;
      const h = canvas.height;

      // Render the authentic 3D neural network without the top-right logo (logo is rendered crisply in UI)
      const subtleOverlay = overlayRef.current
        ? { ...overlayRef.current, logoCanvas: null }
        : null;

      renderNeuralFrame(
        ctx,
        w,
        h,
        elapsed,
        sceneRef.current,
        pointerRef.current,
        subtleOverlay,
        null
      );

      // Soft obsidian calm veil so the living brain pulses gently behind crystal-glass cards
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const veil = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        Math.min(w, h) * 0.08,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.72
      );
      veil.addColorStop(0, accent === 'gold' ? 'rgba(6, 5, 9, 0.50)' : 'rgba(3, 6, 12, 0.50)');
      veil.addColorStop(0.65, 'rgba(2, 4, 8, 0.68)');
      veil.addColorStop(1, 'rgba(1, 2, 4, 0.86)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, w, h);

      // Gentle reactive cursor aura
      if (pointerRef.current.active) {
        const px = pointerRef.current.x * w;
        const py = pointerRef.current.y * h;
        const r = Math.min(w, h) * 0.28;
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r);
        const rgb = accent === 'gold' ? '245, 200, 96' : '84, 218, 255';
        glow.addColorStop(0, `rgba(${rgb}, 0.12)`);
        glow.addColorStop(0.5, 'rgba(160, 110, 255, 0.04)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [accent]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 block h-full w-full"
    />
  );
}
