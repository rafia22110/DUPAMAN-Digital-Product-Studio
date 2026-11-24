import { useEffect, useRef, useState } from 'react';
import { Info, LayoutDashboard, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { loadProcessedOverlayImage } from './PureNeuralFlythrough';
import { CrystalButton } from './GlassPrimitives';
import { openUniversalConsentModal } from './UniversalConsentAdapter';
import { useOwnerSession } from '../data/exhibitsStore';

export type LogoDestination = 'about' | 'contact' | 'login' | 'admin';

interface FloatingLogoTriggerProps {
  mode: 'home-canvas' | 'floating-corner';
  activeSection?: LogoDestination | null;
  onNavigate: (dest: LogoDestination) => void;
}

export function FloatingLogoTrigger({
  mode,
  activeSection = null,
  onNavigate,
}: FloatingLogoTriggerProps) {
  const [open, setOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ownerSession = useOwnerSession();
  const isOwner = Boolean(ownerSession?.isOwner);

  useEffect(() => {
    if (mode !== 'floating-corner') return;
    let alive = true;
    loadProcessedOverlayImage().then((asset) => {
      if (alive && asset?.logoCanvas) {
        try {
          setLogoSrc(asset.logoCanvas.toDataURL('image/png'));
        } catch {
          setLogoSrc(null);
        }
      }
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    const onOutside = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const menuItems: Array<{ id: LogoDestination; label: string; icon: typeof Info; hue: 'cyan' | 'gold' }> = [
    { id: 'about', label: 'אודות', icon: Info, hue: 'cyan' },
    { id: 'contact', label: 'יצירת קשר', icon: Mail, hue: 'gold' },
    { id: 'login', label: 'התחברות', icon: LogIn, hue: 'cyan' },
    ...(isOwner
      ? [{ id: 'admin' as LogoDestination, label: 'לוח בקרה · תכנים', icon: LayoutDashboard, hue: 'gold' as const }]
      : []),
  ];

  if (mode === 'home-canvas') {
    return (
      <div
        ref={wrapRef}
        style={{
          top: 'max(10px, 1.8vh)',
          right: 'max(16px, 2.5vw)',
          width: 'clamp(120px, 26vmin, 260px)',
          height: 'clamp(120px, 26vmin, 260px)',
        }}
        className="fixed z-40"
      >
        {/* Completely invisible click zone aligned over the canvas-rendered DUPAMAN logo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="תפריט DUPAMAN — אודות, יצירת קשר, התחברות"
          className="h-full w-full cursor-pointer rounded-full bg-transparent outline-none"
        />

        {open && (
          <div
            dir="rtl"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(12,18,32,0.28) 52%, rgba(255,255,255,0.04) 100%)',
              boxShadow:
                'inset 0 1.5px 0 rgba(255,244,210,0.42), inset 0 -1px 0 rgba(72,214,252,0.22), 0 18px 42px rgba(0,0,0,0.62)',
              animation: 'glassCardReveal 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
            className="absolute top-[calc(100%+6px)] right-2 flex min-w-[172px] flex-col gap-2 rounded-2xl border border-white/22 p-2.5 backdrop-blur-md"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <CrystalButton
                  key={item.id}
                  hue={item.hue}
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onNavigate(item.id);
                  }}
                  className="w-full justify-start"
                >
                  <Icon className="h-3.5 w-3.5 opacity-85" />
                  <span>{item.label}</span>
                </CrystalButton>
              );
            })}
            <CrystalButton
              hue="gold"
              size="sm"
              onClick={() => {
                setOpen(false);
                openUniversalConsentModal('terms');
              }}
              className="w-full justify-start"
            >
              <ShieldCheck className="h-3.5 w-3.5 opacity-85" />
              <span>תנאים ועוגיות</span>
            </CrystalButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="fixed top-4 right-5 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט DUPAMAN — אודות, יצירת קשר, התחברות"
        className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-transparent transition-transform duration-200 hover:scale-105 outline-none sm:h-20 sm:w-20"
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="DUPAMAN"
            className="h-full w-full object-contain drop-shadow-[0_4px_18px_rgba(2,4,10,0.9)]"
          />
        ) : (
          <span className="font-serif text-lg font-semibold tracking-widest text-[#f8d478]">
            DUPAMAN
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(12,18,32,0.34) 52%, rgba(255,255,255,0.04) 100%)',
            boxShadow:
              'inset 0 1.5px 0 rgba(255,244,210,0.42), inset 0 -1px 0 rgba(72,214,252,0.22), 0 18px 42px rgba(0,0,0,0.68)',
            animation: 'glassCardReveal 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className="absolute top-[calc(100%+6px)] right-0 flex min-w-[172px] flex-col gap-2 rounded-2xl border border-white/22 p-2.5 backdrop-blur-md"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <CrystalButton
                key={item.id}
                hue={item.hue}
                active={activeSection === item.id}
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onNavigate(item.id);
                }}
                className="w-full justify-start"
              >
                <Icon className="h-3.5 w-3.5 opacity-85" />
                <span>{item.label}</span>
              </CrystalButton>
            );
          })}
          <CrystalButton
            hue="gold"
            size="sm"
            onClick={() => {
              setOpen(false);
              openUniversalConsentModal('terms');
            }}
            className="w-full justify-start"
          >
            <ShieldCheck className="h-3.5 w-3.5 opacity-85" />
            <span>תנאים ועוגיות</span>
          </CrystalButton>
        </div>
      )}
    </div>
  );
}
