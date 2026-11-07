import React from 'react';
import { Badge, Dropdown, Popover, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  BellOutlined,
  CompressOutlined,
  DownOutlined,
  EditOutlined,
  ExpandOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  SearchOutlined,
  SettingOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Chip, Dot } from './ui.jsx';
import { money } from '../core/engine.js';

function Logo() {
  return (
    <div className="brand">
      <svg viewBox="0 0 40 40" className="brand-mark" aria-hidden="true">
        <path d="M6 20.5 20 8l14 12.5" fill="none" stroke="#5B3A2E" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10 19v13h20V19" fill="none" stroke="#5B3A2E" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M16 32v-8h8v8" fill="none" stroke="#B08968" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="20" cy="17" r="1.6" fill="#299F91" />
      </svg>
      <div className="brand-text">
        <span className="brand-name">Dream House</span>
        <span className="brand-sub">家居共创与决策</span>
      </div>
    </div>
  );
}

export function TopBar({ state, actions, onFullscreen, fullscreen }) {
  const notifications = (
    <div className="notice-pop">
      <div className="notice-head">通知</div>
      {[
        ['自动保存', '工作副本与正式版本已同步到本机。'],
        ['待确认', '餐桌安装费尚未报价，不计入已知合计。'],
        ['示例数据', '本演示不联网、不连接商城或支付。'],
      ].map(([title, text]) => (
        <div className="notice-item" key={title}>
          <span className="notice-dot" />
          <div>
            <div className="notice-title">{title}</div>
            <div className="notice-text">{text}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const menuItems = [
    { key: 'guide', label: '演示指引' },
    { key: 'history', label: '版本历史' },
    { key: 'brief', label: '项目依据' },
    { type: 'divider' },
    { key: 'export', label: '导出方案 JSON' },
    { key: 'reset', label: '重置演示', danger: true },
  ];

  const onMenu = ({ key }) => {
    if (key === 'guide') actions.setGuideOpen(true);
    if (key === 'history') actions.openDrawer('history');
    if (key === 'brief') actions.openDrawer('brief');
    if (key === 'reset') actions.openDrawer('reset');
    if (key === 'export') actions.openDrawer('export');
  };

  const workspaceViews = ['canvas', 'space', 'compare', 'budget'];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="brand-click" onClick={() => actions.setView('home')} aria-label="回到我的家">
          <Logo />
        </button>
      </div>
      <nav className="main-nav" aria-label="主导航">
        <button
          className={workspaceViews.includes(state.view) || state.view === 'home' ? 'is-active' : ''}
          onClick={() => actions.setView('home')}
        >
          我的家
        </button>
        <button className={state.view === 'inspiration' ? 'is-active' : ''} onClick={() => actions.setView('inspiration')}>
          灵感
        </button>
        <button
          className={state.view === 'shop' ? 'is-active' : ''}
          onClick={() => actions.setView('shop')}
          title="任务驱动的替代选品池"
        >
          选物
        </button>
      </nav>
      <div className="topbar-right">
        <button className="search-pill" onClick={() => actions.setCommandOpen(true)} aria-label="搜索">
          <SearchOutlined />
          <span>搜索空间、材质、物件…</span>
          <kbd>⌘K</kbd>
        </button>
        <Popover content={notifications} trigger="click" placement="bottomRight" overlayClassName="notice-overlay">
          <button className="icon-btn has-dot" aria-label="通知">
            <Badge dot offset={[-2, 2]}>
              <BellOutlined />
            </Badge>
          </button>
        </Popover>
        <Dropdown menu={{ items: menuItems, onClick: onMenu }} trigger={['click']} placement="bottomRight">
          <button className="account-btn">
            <span className="avatar">GH</span>
            <span className="account-copy">
              <b>我的账户</b>
              <i>个人家庭</i>
            </span>
            <DownOutlined className="account-caret" />
          </button>
        </Dropdown>
        <Tooltip title={fullscreen ? '退出沉浸模式' : '沉浸模式'}>
          <button className="icon-btn" onClick={onFullscreen} aria-label="切换沉浸模式">
            {fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
          </button>
        </Tooltip>
      </div>
    </header>
  );
}

export function HomeBar({ state, actions }) {
  return (
    <div className="stagebar homebar">
      <div className="crumbs">
        <span className="crumb-project">我的家</span>
        <span className="crumb-sep">/</span>
        <span>梧桐里</span>
        <span className="crumb-dim">· 89㎡</span>
        <span className="crumb-sep">/</span>
        <span className="scheme-chip">
          餐办共用 C v{state.version}
          <span className="scheme-chip-dot" />
        </span>
        <span className="saved-state">
          <Dot tone="teal" /> 项目总览
        </span>
      </div>
      <div className="stage-tools" style={{ marginLeft: 'auto' }}>
        <Tooltip title="返回工作台继续任务">
          <button className="text-btn" onClick={() => actions.setView('space')}>
            继续方案 <ArrowRightOutlined />
          </button>
        </Tooltip>
        <Tooltip title="演示指引">
          <button className="icon-btn sm" onClick={() => actions.setGuideOpen(true)} aria-label="演示指引">
            <QuestionCircleOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function InspirationBar({ state, actions }) {
  return (
    <div className="stagebar homebar">
      <div className="crumbs">
        <span className="crumb-project">灵感</span>
        <span className="crumb-sep">/</span>
        <span>发现 · 收藏 · 我的笔记</span>
        <span className="saved-state">
          <Dot tone="teal" /> 收藏 {state.favorites.length} · 笔记 {state.notes.length}
        </span>
      </div>
      <div className="stage-tools" style={{ marginLeft: 'auto' }}>
        <button className="soft-btn" onClick={() => actions.openNoteEditor({ type: 'idea', title: '', body: '' })}>
          <EditOutlined /> 写笔记
        </button>
        <Tooltip title="演示指引">
          <button className="icon-btn sm" onClick={() => actions.setGuideOpen(true)} aria-label="演示指引">
            <QuestionCircleOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function StageBar({ state, actions, onOpenGuide }) {
  const tabs = [
    { id: 'canvas', label: '方案画布' },
    { id: 'space', label: '空间编辑' },
    { id: 'compare', label: '方案对比' },
    { id: 'budget', label: '商品与预算' },
  ];
  const canUndo = state.undoStack.some((op) => !op.undone);
  return (
    <div className="stagebar">
      <div className="crumbs">
        <span className="crumb-project">梧桐里</span>
        <span className="crumb-dim">· 89㎡</span>
        <span className="crumb-sep">/</span>
        <span>客厅</span>
        <span className="crumb-dim">· 约 24.6㎡</span>
        <span className="crumb-sep">/</span>
        <span className="scheme-chip">
          餐办共用 C v{state.version}
          <span className="scheme-chip-dot" />
        </span>
        <span className="saved-state">
          <Dot tone="teal" /> 工作副本已保存
        </span>
        {state.agent.previewId && (
          <Chip tone="info" className="stagebar-preview-chip">
            候选预览 · 未应用
          </Chip>
        )}
      </div>
      <div className="stage-tabs" role="tablist" aria-label="工作视图">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={state.view === tab.id}
            className={state.view === tab.id ? 'is-active' : ''}
            data-testid={`nav-${tab.id}`}
            onClick={() => actions.setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="stage-tools">
        <Tooltip title={canUndo ? '撤销餐桌替换' : '没有可撤销的替换'}>
          <button className="icon-btn sm" disabled={!canUndo} onClick={() => actions.undoReplacement()} aria-label="撤销">
            <UndoOutlined />
          </button>
        </Tooltip>
        <Tooltip title="演示不提供重做；可再次发起替换">
          <button className="icon-btn sm" disabled aria-label="重做">
            <RedoOutlined />
          </button>
        </Tooltip>
        <Tooltip title="版本历史">
          <button className="icon-btn sm" onClick={() => actions.openDrawer('history')} aria-label="版本历史">
            <HistoryOutlined />
          </button>
        </Tooltip>
        <Tooltip title="演示指引">
          <button className="icon-btn sm" onClick={onOpenGuide} aria-label="演示指引">
            <QuestionCircleOutlined />
          </button>
        </Tooltip>
        <Tooltip title="演示设置">
          <button className="icon-btn sm" onClick={() => actions.openDrawer('settings')} aria-label="设置">
            <SettingOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function ShopBar({ state, actions, known }) {
  return (
    <div className="shopbar">
      <div className="shopbar-crumbs">
        <span className="focus-eyebrow">
          <span className="focus-dot" /> 替换约束聚焦
        </span>
        <span className="crumb-sep">/</span>
        <span>替换餐桌 · 梧桐里 / 客厅</span>
        <span className="crumb-sep">/</span>
        <span className="scheme-chip">餐办共用 C v{state.version}</span>
        <span className="shopbar-formal">正式方案 · {money(known)}</span>
      </div>
      <div className="shopbar-actions">
        <span className="shopbar-note">所有操作均为临时预演，不改动正式方案</span>
        <button className="text-btn" onClick={() => actions.setView('space')}>
          返回空间 <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
