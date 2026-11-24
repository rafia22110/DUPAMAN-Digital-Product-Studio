import { useCallback, useEffect, useState } from 'react';
import type { BrainNodeSpec } from './data/brainNodes';
import { findDomainById } from './data/dupamanCatalog';
import { useOwnerSession } from './data/exhibitsStore';
import { PureNeuralFlythrough } from './components/PureNeuralFlythrough';
import { FloatingLogoTrigger, type LogoDestination } from './components/FloatingLogoTrigger';
import { DomainIndexView } from './components/DomainIndexView';
import { BotAndSubsView } from './components/BotAndSubsView';
import { LogoModalViews } from './components/LogoModalViews';
import { StudioAdminPanel } from './components/StudioAdminPanel';
import { UniversalConsentAdapter } from './components/UniversalConsentAdapter';

type ActiveRoute =
  | { kind: 'home' }
  | { kind: 'domain'; domainId: string }
  | { kind: 'bot'; prefillPrompt?: string | null; prefillTopic?: string | null }
  | { kind: 'logo'; section: LogoDestination }
  | { kind: 'admin' };

export default function App() {
  const ownerSession = useOwnerSession();
  const isOwner = Boolean(ownerSession?.isOwner);
  const [route, setRoute] = useState<ActiveRoute>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#studio-admin') {
      return { kind: 'logo', section: 'login' };
    }
    return { kind: 'home' };
  });

  // Secret owner shortcut (Ctrl+Shift+D) or #studio-admin hash — invisible to regular users
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#studio-admin') {
        setRoute(isOwner ? { kind: 'admin' } : { kind: 'logo', section: 'login' });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setRoute(isOwner ? { kind: 'admin' } : { kind: 'logo', section: 'login' });
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOwner]);

  const handleSelectBrain = useCallback((node: BrainNodeSpec) => {
    if (node.isMain) {
      setRoute({ kind: 'bot' });
    } else {
      setRoute({ kind: 'domain', domainId: node.id });
    }
  }, []);

  const goHome = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#studio-admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setRoute({ kind: 'home' });
  }, []);

  const openDomain = useCallback((domainId: string) => setRoute({ kind: 'domain', domainId }), []);

  const openLogoSection = useCallback(
    (section: LogoDestination) => {
      if (section === 'admin') {
        if (isOwner) {
          setRoute({ kind: 'admin' });
        } else {
          setRoute({ kind: 'logo', section: 'login' });
        }
        return;
      }
      setRoute({ kind: 'logo', section });
    },
    [isOwner]
  );

  const openBot = useCallback((prefillPrompt?: string, prefillTopic?: string) => {
    setRoute({
      kind: 'bot',
      prefillPrompt: prefillPrompt ?? null,
      prefillTopic: prefillTopic ?? null,
    });
  }, []);

  if (route.kind === 'admin' && isOwner) {
    return (
      <div
        key="owner-admin-view"
        style={{ animation: 'spatialPageEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="fixed inset-0 h-screen w-screen overflow-hidden"
      >
        <StudioAdminPanel
          onGoHome={goHome}
          onOpenDomain={openDomain}
          onOpenLogoSection={openLogoSection}
        />
      </div>
    );
  }

  if (route.kind === 'domain') {
    const dom = findDomainById(route.domainId);
    if (dom) {
      return (
        <div
          key={`domain-${dom.id}`}
          style={{ animation: 'spatialPageEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          className="fixed inset-0 h-screen w-screen overflow-hidden"
        >
          <DomainIndexView
            domain={dom}
            onSelectDomain={openDomain}
            onGoHome={goHome}
            onOpenBot={openBot}
            onOpenLogoSection={openLogoSection}
          />
          <UniversalConsentAdapter />
        </div>
      );
    }
  }

  if (route.kind === 'bot') {
    return (
      <div
        key="bot-view"
        style={{ animation: 'spatialPageEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="fixed inset-0 h-screen w-screen overflow-hidden"
      >
        <BotAndSubsView
          prefillPrompt={route.prefillPrompt}
          prefillTopic={route.prefillTopic}
          onGoHome={goHome}
          onOpenDomain={openDomain}
          onOpenLogoSection={openLogoSection}
        />
        <UniversalConsentAdapter />
      </div>
    );
  }

  if (route.kind === 'logo') {
    return (
      <div
        key={`logo-${route.section}`}
        style={{ animation: 'spatialPageEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        className="fixed inset-0 h-screen w-screen overflow-hidden"
      >
        <LogoModalViews
          section={route.section}
          onSwitchSection={openLogoSection}
          onGoHome={goHome}
          onOpenBot={(p) => openBot(p)}
        />
        <UniversalConsentAdapter />
      </div>
    );
  }

  // HOME SCREEN: 100% Pure Zero-Scroll 7-Brain Constellation (No Studio Bottom Banner)
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#020204] select-none">
      <PureNeuralFlythrough
        videoUrl={null}
        aspectRatio="16:9"
        paused={false}
        onSelectBrain={handleSelectBrain}
      />

      {/* Completely invisible click zone on the top-right DUPAMAN logo (opens About / Contact / Login) */}
      <FloatingLogoTrigger mode="home-canvas" onNavigate={openLogoSection} />

      {/* Universal Glass Consent Pill, Terms Form & Design Adapter */}
      <UniversalConsentAdapter />
    </div>
  );
}
