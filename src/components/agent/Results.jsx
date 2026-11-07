import React from 'react';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { money } from '../../core/engine.js';
import { Chip } from '../ui.jsx';

export function EmptyResults({ state, actions, intent }) {
  const results = state.agent.results;
  if (!results) return null;
  const excluded = results.excluded;
  const currentMinL = intent?.minLength ?? 0;
  const currentMinW = intent?.minWidth ?? 0;
  const relaxOptions = excluded
    .map((row) => {
      const sizeDrop = row.product.l < currentMinL || row.product.w < currentMinW;
      const priceRaise = !!intent?.maxPrice && row.product.price > intent.maxPrice * 100;
      const patch = {};
      if (sizeDrop) {
        patch.minLength = Math.min(currentMinL || row.product.l, row.product.l);
        patch.minWidth = Math.min(currentMinW || row.product.w, row.product.w);
      }
      if (priceRaise) patch.maxPrice = Math.ceil(row.product.price / 100);
      const parts = [];
      if (sizeDrop) parts.push(`允许 ${row.product.l} × ${row.product.w}cm`);
      if (priceRaise) parts.push(`预算放宽到 ${money(row.product.price)}`);
      return {
        key: row.productId,
        label: parts.join(' · '),
        patch,
        note: `可加入 ${row.product.name}（${money(row.product.price)}）`,
        price: row.product.price,
      };
    })
    .filter((option) => Object.keys(option.patch).length > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);

  return (
    <div className="panel-body empty-results" data-testid="empty-results">
      <div className="empty-head">
        <span className="empty-icon">
          <CloseCircleOutlined />
        </span>
        <div>
          <span className="eyebrow">没有可应用的候选</span>
          <h2>暂时没有符合的候选</h2>
          <p>
            在 C v{state.version} 的 {intent?.minLength}×{intent?.minWidth}cm
            {intent?.maxPrice ? `、单价 ≤ ${money(intent.maxPrice * 100)}` : ''} 与“更便宜”条件下，
            示例目录没有同时满足的款式。
          </p>
        </div>
      </div>

      <div className="empty-honest">
        <WarningOutlined />
        <span>不会为了凑出结果而自动放宽条件，也不会把被排除的款伪装成可应用。</span>
      </div>

      <div className="excluded-list empty-excluded">
        {excluded.map((row) => (
          <div className="excluded-row" key={row.productId}>
            <div className="excluded-top">
              <b>{row.product.name}</b>
              <span>
                {row.product.l} × {row.product.w} cm · {money(row.product.price)}
              </span>
              <Chip tone="danger-soft">排除</Chip>
            </div>
            <ul>
              {row.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="empty-next">
        <div className="empty-next-title">可以这样继续</div>
        {relaxOptions.map((option) => (
          <button
            className="relax-option"
            key={option.key}
            onClick={() => actions.relaxConditions(option.patch)}
          >
            <span className="relax-plus">
              <PlusOutlined />
            </span>
            <span>
              <b>{option.label}</b>
              <i>{option.note}</i>
            </span>
            <ArrowRightOutlined />
          </button>
        ))}
        <button className="ghost-btn wide" onClick={() => actions.openComposer({ text: state.draft.text })}>
          修改完整条件
        </button>
      </div>

      <div className="empty-foot">
        <span>正式方案未改动，已知合计仍为 {money(state.snapshots[state.snapshots.length - 1].known)}。</span>
      </div>
    </div>
  );
}

export function AppliedResult({ state, actions }) {
  const applied = state.agent.applied;
  const undone = state.agent.phase === 'undone' || applied?.undone;
  if (!applied) return null;
  const summary = applied.summary || {};

  return (
    <div className="panel-body applied" data-testid={undone ? 'undone-result' : 'applied-success'}>
      <div className={`applied-hero ${undone ? 'is-undone' : ''}`}>
        <span className="applied-icon">{undone ? <UndoOutlined /> : <CheckCircleFilled />}</span>
        <div>
          <span className="eyebrow">{undone ? '恢复成功' : '应用成功'}</span>
          <h2>
            {undone
              ? `已撤销餐桌替换 · C v${applied.undoneVersion || state.version}`
              : `已应用到方案 C · v${applied.version}`}
          </h2>
          <p>
            {undone
              ? `${applied.restoreName || '原餐桌'} 已恢复；你在应用后的位置调整仍然保留。`
              : '空间、方案版本、对比与清单已同步。安装费仍是待确认项。'}
          </p>
        </div>
      </div>

      <div className="change-list">
        <div className="change-row">
          <span>餐桌</span>
          <b>{summary.product}</b>
        </div>
        <div className="change-row">
          <span>桌面尺寸</span>
          <b>{summary.size}</b>
        </div>
        <div className="change-row">
          <span>单品价格</span>
          <b>{summary.price}</b>
        </div>
        <div className="change-row">
          <span>已知合计</span>
          <b>{summary.known}</b>
        </div>
        <div className="change-row is-muted">
          <span>安装费</span>
          <b>待确认 · 未计入</b>
        </div>
      </div>

      {undone ? (
        <div className="restore-note">
          <CheckCircleFilled />
          <span>
            C v{applied.undoneVersion || state.version} 是恢复记录，v{applied.version} 的历史仍然保留。
            只回退这次替换，不覆盖其他改动。
          </span>
        </div>
      ) : (
        <div className="undo-note">
          <ExclamationCircleOutlined />
          <span>撤销会创建新的恢复版本，不会删除 v{applied.version} 的历史。</span>
        </div>
      )}

      <div className="applied-actions">
        {!undone && (
          <button className="primary-btn" onClick={() => actions.setView('budget')}>
            <ShoppingOutlined /> 在清单中查看
          </button>
        )}
        <button className="soft-btn" onClick={() => actions.setView('compare')}>
          <FileTextOutlined /> 查看修改对比
        </button>
        <button className="soft-btn" onClick={() => actions.openDrawer('history')}>
          <HistoryOutlined /> 版本历史
        </button>
        {!undone ? (
          <button className="danger-ghost-btn" onClick={() => actions.undoReplacement()}>
            <UndoOutlined /> 撤销这次替换
          </button>
        ) : (
          <button className="soft-btn" onClick={() => actions.openComposer()}>
            <RedoOutlined /> 再做一次替换
          </button>
        )}
      </div>

      <div className="applied-meta">
        <span>操作记录 {applied.id}</span>
        <span>模式 · 本地规则</span>
        <span>已写入版本历史</span>
      </div>
    </div>
  );
}
