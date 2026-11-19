import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useState,
} from 'react';

interface CrystalCard3DProps {
  children: ReactNode;
  hue?: 'gold' | 'cyan';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

/**
 * Exact 3D transparent crystal-glass slab matching the Home Screen's 7-brain hover cards.
 */
export function CrystalCard3D({
  children,
  hue = 'cyan',
  className = '',
  interactive = true,
  onClick,
}: CrystalCard3DProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 36, hovered: false });

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
    setTilt({
      rx: -(ny - 0.5) * 9,
      ry: (nx - 0.5) * 11,
      gx: Math.round(nx * 100),
      gy: Math.round(ny * 100),
      hovered: true,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 36, hovered: false });
  };

  return (
    <div
      style={{ perspective: '960px' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={onClick}
      className={`group relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: tilt.hovered
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(12px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative h-full w-full"
      >
        {/* 3D Extruded Back Glass Bezel Slab */}
        <div
          aria-hidden="true"
          style={{
            transform: 'translateZ(-14px) translateY(5px)',
            boxShadow:
              hue === 'gold'
                ? '0 24px 55px rgba(0, 0, 0, 0.65), 0 0 32px rgba(242, 190, 78, 0.14)'
                : '0 24px 55px rgba(0, 0, 0, 0.65), 0 0 32px rgba(72, 214, 252, 0.14)',
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl border border-white/12 bg-white/[0.025]"
        />

        {/* Primary Ultra-Transparent 3D Liquid Glass Face */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.105) 0%, rgba(12,18,32,0.20) 50%, rgba(255,255,255,0.035) 100%)',
            boxShadow:
              hue === 'gold'
                ? 'inset 0 1.5px 0 rgba(255, 244, 210, 0.40), inset 0 -1px 0 rgba(242, 190, 78, 0.22), inset 1px 0 0 rgba(255,255,255,0.15), 0 14px 36px rgba(0,0,0,0.42)'
                : 'inset 0 1.5px 0 rgba(220, 248, 255, 0.40), inset 0 -1px 0 rgba(72, 214, 252, 0.22), inset 1px 0 0 rgba(255,255,255,0.15), 0 14px 36px rgba(0,0,0,0.42)',
          }}
          className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/22 backdrop-blur-md transition-colors duration-200 group-hover:border-white/36"
        >
          {/* Live cursor-angle specular reflection */}
          <div
            aria-hidden="true"
            style={{
              opacity: tilt.hovered ? 1 : 0.4,
              background: `radial-gradient(220px circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.20), rgba(180,232,255,0.05) 45%, transparent 72%)`,
              transition: 'opacity 180ms ease',
            }}
            className="pointer-events-none absolute inset-0"
          />

          {/* Sharp top-bevel crystal refraction edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/65 to-transparent"
          />

          <div
            style={{
              textShadow: '0 2px 12px rgba(2, 4, 10, 0.85)',
            }}
            className="relative flex h-full w-full flex-col"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const CRYSTAL_BTN_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border backdrop-blur-md transition-all duration-200 active:scale-[0.98] disabled:opacity-45 whitespace-nowrap';

function getCrystalBtnColors(hue: 'gold' | 'cyan' | 'neutral', active: boolean): string {
  if (hue === 'gold') {
    return active
      ? 'border-[#f8d478]/60 bg-[#f2be4e]/18 text-[#fff5d8] shadow-[inset_0_1px_0_rgba(255,248,220,0.45),0_0_22px_rgba(242,190,78,0.22)]'
      : 'border-white/22 bg-white/[0.06] text-[#f8f3e6] hover:border-[#f8d478]/55 hover:bg-[#f2be4e]/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]';
  }
  if (hue === 'cyan') {
    return active
      ? 'border-[#84e8ff]/60 bg-[#48d6fc]/18 text-[#ebfbff] shadow-[inset_0_1px_0_rgba(220,248,255,0.45),0_0_22px_rgba(72,214,252,0.22)]'
      : 'border-white/22 bg-white/[0.06] text-[#edf8ff] hover:border-[#84e8ff]/55 hover:bg-[#48d6fc]/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]';
  }
  return active
    ? 'border-white/45 bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]'
    : 'border-white/20 bg-white/[0.05] text-[#e6eaf2] hover:border-white/38 hover:bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]';
}

interface CrystalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hue?: 'gold' | 'cyan' | 'neutral';
  active?: boolean;
  size?: 'sm' | 'md';
}

export function CrystalButton({
  hue = 'cyan',
  active = false,
  size = 'sm',
  className = '',
  children,
  ...rest
}: CrystalButtonProps) {
  const sizeCls = size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm';
  return (
    <button
      type="button"
      className={`${CRYSTAL_BTN_BASE} ${sizeCls} ${getCrystalBtnColors(hue, active)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface CrystalLinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  hue?: 'gold' | 'cyan' | 'neutral';
  size?: 'sm' | 'md';
}

export function CrystalLinkButton({
  hue = 'cyan',
  size = 'sm',
  className = '',
  children,
  ...rest
}: CrystalLinkButtonProps) {
  const sizeCls = size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm';
  return (
    <a
      className={`${CRYSTAL_BTN_BASE} ${sizeCls} ${getCrystalBtnColors(hue, false)} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
