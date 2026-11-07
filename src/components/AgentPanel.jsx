import React, { useEffect, useRef } from 'react';
import { Tooltip } from 'antd';
import { ArrowLeftOutlined, InfoCircleOutlined, LockOutlined, ShoppingOutlined } from '@ant-design/icons';
import { AgentMark, Chip } from './ui.jsx';
import { Inspector } from './agent/Inspector.jsx';
import { Composer } from './agent/Composer.jsx';
import { IntentReview } from './agent/IntentReview.jsx';
import { Running } from './agent/Running.jsx';
import { Candidates } from './agent/Candidates.jsx';
import { AppliedResult, EmptyResults } from './agent/Results.jsx';
import { money, knownTotal } from '../core/engine.js';

function phaseTitle(phase) {
  switch (phase) {
    case 'compose':
      return '说出你的修改';
    case 'review':
      return '核对修改要求';
    case 'running':
      return '执行中';
    case 'ready':
    case 'preview':
      return '候选与影响';
    case 'empty':
      return '没有符合的候选';
    case 'applied':
      return '变更已应用';
    case 'undone':
      return '恢复记录';
    default:
      return '选中对象';
  }
}

function BudgetAside({ state, actions, known }) {
  const goods = known - 40000;
  const pct = Math.round((known / 1000000) * 100);
  return (
    <div className="panel-body budget-aside">
      <div className="object-head">
        <div>
          <div className="eyebrow">本方案 · 已知费用</div>
          <h2>预算摘要</h2>
          <p>金额由同一计算入口派生，空间、清单与底部费用条保持一致。</p>
        </div>
        <Chip tone="outline">C v{state.version}</Chip>
      </div>

      <div className="budget-big">
        <span>已知合计</span>
        <strong>{money(known)}</strong>
        <div className="budget-big-meta">
          <span>上限 ¥10,000</span>
          <span>余 {money(1000000 - known)}</span>
        </div>
        <div className="budget-track big">
          <span className="budget-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="breakdown">
        <div className="breakdown-row">
          <span>家具与软装</span>
          <b>{money(goods)}</b>
        </div>
        <div className="breakdown-row">
          <span>配送</span>
          <b>¥400</b>
        </div>
        <div className="breakdown-row is-warn">
          <span>安装</span>
          <b>待确认</b>
        </div>
      </div>

      <div className="soft-callout">
        <InfoCircleOutlined />
        <div>
          <b>差额不是可用余额</b>
          <p>安装费尚未报价，距上限的金额不能当作可自由支配的预算。</p>
        </div>
      </div>

      <div className="aside-actions">
        <button className="primary-btn" onClick={() => actions.setView('space')}>
          返回空间
        </button>
        <button className="ghost-btn" onClick={() => actions.setView('shop')}>
          <ShoppingOutlined /> 查看选品池
        </button>
      </div>

      <div className="aside-note">
        <LockOutlined /> 选择餐桌行可在空间中定位；正式版本与工作副本分区保存。
      </div>
    </div>
  );
}

export function AgentPanel({ state, actions, table, currentProduct, stale }) {
  const { agent } = state;
  const selectedId = state.selectedObjectId;
  const isTable = selectedId === 'table-01';
  const phase = agent.phase;
  const active = isTable && phase !== 'idle';
  const taskRunning = !isTable && phase !== 'idle';
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [phase, selectedId]);

  let title = !isTable && phase !== 'idle' ? '任务进行中' : phaseTitle(phase);
  let scope = null;
  if (active) {
    scope = '仅餐桌';
  }

  const body = () => {
    if (state.view === 'budget' && phase === 'idle' && isTable) {
      return <BudgetAside state={state} actions={actions} known={knownTotal(state.objects)} />;
    }
    if (!isTable) {
      return <Inspector state={state} actions={actions} table={table} currentProduct={currentProduct} />;
    }
    switch (phase) {
      case 'compose':
        return <Composer state={state} actions={actions} />;
      case 'review':
        return (
          <IntentReview
            state={state}
            actions={actions}
            summary={agent.summary}
            issues={agent.issues}
            scope={agent.scope}
            unsupported={agent.unsupported}
            notes={agent.notes}
            parseText={agent.parseText}
          />
        );
      case 'running':
        return <Running state={state} actions={actions} />;
      case 'ready':
      case 'preview':
        return <Candidates state={state} actions={actions} stale={stale} />;
      case 'empty':
        return <EmptyResults state={state} actions={actions} intent={agent.intent} />;
      case 'applied':
      case 'undone':
        return <AppliedResult state={state} actions={actions} />;
      default:
        return <Inspector state={state} actions={actions} table={table} currentProduct={currentProduct} />;
    }
  };

  return (
    <aside className={`agent-panel phase-${phase}`} aria-label="协同 Agent 侧栏">
      <div className="panel-head">
        <span className={`agent-mark ${active ? 'is-active' : ''}`}>
          <AgentMark />
        </span>
        <div className="panel-head-copy">
          <div className="panel-kicker">
            协同 Agent
            <span className="mode-badge">
              <span className="mode-badge-dot" /> 本地规则演示
            </span>
          </div>
          <div className="panel-title">
            {title}
            {scope && (
              <span className="scope-pill">
                <LockOutlined /> {scope}
              </span>
            )}
          </div>
        </div>
        {active ? (
          <Tooltip title="退出当前任务，保留正式方案">
            <button className="icon-btn sm" onClick={actions.closeAgent} aria-label="退出任务">
              <ArrowLeftOutlined />
            </button>
          </Tooltip>
        ) : (
          <Tooltip title="了解边界与数据说明">
            <button className="icon-btn sm" onClick={() => actions.openDrawer('settings')} aria-label="说明">
              <InfoCircleOutlined />
            </button>
          </Tooltip>
        )}
      </div>

      {taskRunning && (
        <div className="task-strip">
          <span className="pulse-dot" />
          <span>
            任务进行中 · 仅替换餐桌
            <i>{phase === 'running' ? '正在校验' : '已保留候选'}</i>
          </span>
          <button onClick={() => actions.selectObject('table-01')}>回到任务</button>
        </div>
      )}

      {active && (
        <div className="panel-context">
          <span className="context-item">
            <b>餐办共用 C v{state.version}</b>
          </span>
          <span className="context-sep">·</span>
          <span className="context-item">{currentProduct.name}</span>
          <span className="context-sep">·</span>
          <span className="context-item is-quiet">
            {phase === 'applied' ? '已写入版本历史' : phase === 'undone' ? '恢复记录已保存' : '未应用前不改正式方案'}
          </span>
        </div>
      )}

      <div className="panel-scroll" ref={scrollRef}>{body()}</div>
    </aside>
  );
}
