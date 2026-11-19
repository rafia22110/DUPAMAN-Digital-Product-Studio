import { useCallback, useState } from 'react';
import type { BrainNodeSpec } from './data/brainNodes';
import { findDomainById } from './data/dupamanCatalog';
import { PureNeuralFlythrough } from './components/PureNeuralFlythrough';
import { FloatingLogoTrigger, type LogoDestination } from './components/FloatingLogoTrigger';
import { DomainIndexView } from './components/DomainIndexView';
import { BotAndSubsView } from './components/BotAndSubsView';
import { LogoModalViews } from './components/LogoModalViews';

type ActiveRoute =
  | { kind: 'home' }
  | { kind: 'domain'; domainId: string }
  | { kind: 'bot'; prefillPrompt?: string | null; prefillTopic?: string | null }
  | { kind: 'logo'; section: LogoDestination };

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>({ kind: 'home' });

  const handleSelectBrain = useCallback((node: BrainNodeSpec) => {
    if (node.isMain) {
      setRoute({ kind: 'bot' });
    } else {
      setRoute({ kind: 'domain', domainId: node.id });
    }
  }, []);

  const goHome = useCallback(() => setRoute({ kind: 'home' }), []);
  const openDomain = useCallback((domainId: string) => setRoute({ kind: 'domain', domainId }), []);
  const openLogoSection = useCallback(
    (section: LogoDestination) => setRoute({ kind: 'logo', section }),
    []
  );
  const openBot = useCallback((prefillPrompt?: string, prefillTopic?: string) => {
    setRoute({
      kind: 'bot',
      prefillPrompt: prefillPrompt ?? null,
      prefillTopic: prefillTopic ?? null,
    });
  }, []);

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
    </div>
  );
}
