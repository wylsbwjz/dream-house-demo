import React, { useCallback, useEffect, useState } from 'react';
import { useDreamHouse } from './hooks/useDreamHouse.js';
import { TopBar, StageBar, ShopBar, HomeBar, InspirationBar } from './components/TopBar.jsx';
import { LeftRail } from './components/LeftRail.jsx';
import { AgentPanel } from './components/AgentPanel.jsx';
import { FooterBar } from './components/FooterBar.jsx';
import { HomeView } from './views/HomeView.jsx';
import { InspirationView } from './views/InspirationView.jsx';
import { CanvasView } from './views/CanvasView.jsx';
import { SpaceView } from './views/SpaceView.jsx';
import { CompareView } from './views/CompareView.jsx';
import { ShopView } from './views/ShopView.jsx';
import { BudgetView } from './views/BudgetView.jsx';
import { Drawers } from './components/Drawers.jsx';
import { CommandPalette, Toast } from './components/Overlays.jsx';
import { RightOutlined } from '@ant-design/icons';

export default function App() {
  const { state, table, currentProduct, known, stale, actions } = useDreamHouse();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      actions.showToast('当前浏览器不允许进入全屏，可以用浏览器自身的全屏。', { tone: 'warn' });
    }
  }, [actions]);

  useEffect(() => {
    const onKey = (event) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        actions.setCommandOpen(true);
      }
      if (
        event.key === 'Escape' &&
        state.agent.previewId &&
        !state.ui.drawer &&
        !state.ui.commandOpen &&
        !state.ui.guideOpen
      ) {
        actions.exitPreview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, state.agent.previewId, state.ui.drawer, state.ui.commandOpen, state.ui.guideOpen]);

  const wide =
    state.view === 'compare' ||
    state.view === 'shop' ||
    state.view === 'canvas' ||
    state.view === 'home' ||
    state.view === 'inspiration';
  const showRail = !wide && !state.ui.railCollapsed;
  const showPanel = !wide;
  const workspaceViews = ['canvas', 'space', 'compare', 'budget'];

  return (
    <div className={`app-shell ${fullscreen ? 'is-fullscreen' : ''} ${wide ? 'is-wide' : ''}`}>
      <TopBar state={state} actions={actions} onFullscreen={toggleFullscreen} fullscreen={fullscreen} />
      {state.view === 'shop' ? (
        <ShopBar state={state} actions={actions} known={known} />
      ) : state.view === 'home' ? (
        <HomeBar state={state} actions={actions} />
      ) : state.view === 'inspiration' ? (
        <InspirationBar state={state} actions={actions} />
      ) : (
        <StageBar state={state} actions={actions} onOpenGuide={() => actions.setGuideOpen(true)} />
      )}

      <div className={`workspace ${showRail ? '' : 'no-rail'} ${showPanel ? '' : 'no-panel'}`}>
        {showRail && <LeftRail state={state} actions={actions} table={table} currentProduct={currentProduct} known={known} />}
        {!wide && state.ui.railCollapsed && (
          <button
            className="rail-reopen"
            onClick={() => actions.setRailCollapsed(false)}
            aria-label="展开目录"
          >
            <RightOutlined />
          </button>
        )}

        <main className={`center ${state.view}`}>
          {state.view === 'home' && <HomeView state={state} actions={actions} known={known} />}
          {state.view === 'inspiration' && <InspirationView state={state} actions={actions} />}
          {state.view === 'canvas' && <CanvasView state={state} actions={actions} />}
          {state.view === 'space' && <SpaceView state={state} actions={actions} stale={stale} />}
          {state.view === 'compare' && <CompareView state={state} actions={actions} />}
          {state.view === 'shop' && <ShopView state={state} actions={actions} stale={stale} />}
          {state.view === 'budget' && <BudgetView state={state} actions={actions} />}
        </main>

        {showPanel && (
          <AgentPanel
            state={state}
            actions={actions}
            table={table}
            currentProduct={currentProduct}
            stale={stale}
          />
        )}
      </div>

      <FooterBar state={state} actions={actions} known={known} />
      <Drawers state={state} actions={actions} table={table} currentProduct={currentProduct} stale={stale} />
      <CommandPalette state={state} actions={actions} />
      <Toast toast={state.ui.toast} onClose={actions.dismissToast} />
    </div>
  );
}
