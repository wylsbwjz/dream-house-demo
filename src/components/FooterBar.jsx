import React from 'react';
import { ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { money, knownTotal, tableOf, product, dimsOf } from '../core/engine.js';
import { Delta } from './ui.jsx';

export function FooterBar({ state, actions, known }) {
  const { agent } = state;
  const previewId = agent.previewId;
  const previewKnown = previewId
    ? known - product(tableOf(state.objects).productId).price + product(previewId).price
    : null;
  const previewDelta = previewId ? product(previewId).price - product(tableOf(state.objects).productId).price : null;
  const pct = Math.min(100, Math.round((known / 1000000) * 100));
  const nextPct = previewKnown ? Math.min(100, Math.round((previewKnown / 1000000) * 100)) : null;

  return (
    <footer className="footerbar">
      <div className="cost-left">
        <div className="cost-summary">
          <span className="cost-label">已知合计</span>
          <strong className="cost-value" data-testid="official-cost">
            {money(known)}
          </strong>
          <span className="cost-limit">/ 上限 ¥10,000</span>
          <span className="cost-left-gap">
            距上限余 <b>{money(1000000 - known)}</b>
          </span>
          <span className="cost-pending">
            <ExclamationCircleOutlined /> 1 项安装费待确认
          </span>
        </div>
        <div className="budget-track" aria-hidden="true">
          <span className="budget-fill" style={{ width: `${pct}%` }} />
          {nextPct != null && nextPct < pct && (
            <span className="budget-preview" style={{ width: `${pct - nextPct}%`, left: `${nextPct}%` }} />
          )}
          <span className="budget-ticks" />
        </div>
      </div>
      <div className="cost-right">
        {previewId && (
          <div className="preview-cost" data-testid="preview-cost">
            <span className="preview-eyebrow">候选影响 · 未应用</span>
            <span className="preview-amount">{money(previewKnown)}</span>
            <Delta cents={previewDelta} />
          </div>
        )}
        {!previewId && state.version > 3 && (
          <span className="version-flag">正式版本 C v{state.version}</span>
        )}
        <button className="text-btn" onClick={() => actions.setView('budget')}>
          查看明细 <ArrowRightOutlined />
        </button>
      </div>
    </footer>
  );
}
