import React from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { money } from '../core/engine.js';

/**
 * 起始页：只展示 logo 与一句产品命题，字少、留白、高级。
 */
export function WelcomeView({ state, actions, known }) {
  const base = import.meta.env.BASE_URL || '/';
  return (
    <div className="welcome">
      <div className="welcome-grain" aria-hidden="true" />
      <div className="welcome-light" aria-hidden="true" />

      <div className="welcome-inner">
        <div className="welcome-logo-wrap">
          <img
            src={`${base}logo.png`}
            alt="Dream House 几何标志"
            className="welcome-logo"
            data-testid="welcome-logo"
            draggable={false}
          />
        </div>

        <div className="welcome-eyebrow">A HOME TO IMAGINE. A PLAN TO UNDERSTAND.</div>
        <h1 className="welcome-brand">
          Dream <span>House</span>
        </h1>
        <p className="welcome-line">让 AI 推进设计，让用户掌握变更。</p>

        <button className="primary-btn welcome-enter" data-testid="welcome-enter" onClick={() => actions.setView('home')}>
          进入 Dream House <ArrowRightOutlined />
        </button>

        <div className="welcome-meta">
          <span>概念演示 · 本地规则运行</span>
          <span className="welcome-sep">·</span>
          <span>示例数据 · 非真实商品</span>
          <span className="welcome-sep">·</span>
          <span>当前方案 C v{state.version} · {money(known)}</span>
        </div>
      </div>

      <div className="welcome-palette" aria-hidden="true">
        {['#F3E9D7', '#EADCC8', '#D6BFA6', '#B08968', '#7A553A', '#5B3A2E', '#3B2A22'].map((hex) => (
          <span key={hex} style={{ background: hex }} />
        ))}
      </div>
    </div>
  );
}
