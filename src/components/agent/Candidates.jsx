import React from 'react';
import {
  ArrowRightOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { money, product, tableOf } from '../../core/engine.js';
import { Chip, Delta, ProductArt } from '../ui.jsx';

export function Candidates({ state, actions, stale }) {
  const { agent } = state;
  const results = agent.results;
  if (!results) return null;
  const selectedId = agent.selectedId || results.recommendedId;
  const selected = results.rows.find((r) => r.productId === selectedId) || results.eligible[0];
  const previewId = agent.previewId;
  const stages = agent.run?.stages || [];
  const currentProduct = product(tableOf(state.objects).productId);
  const impact = selected?.impact;
  const staleBlocked = !!stale;

  const previewCandidate = () => {
    if (!selected) return;
    if (previewId) {
      actions.exitPreview();
    } else {
      actions.selectCandidate(selected.productId);
    }
  };

  return (
    <div className="panel-body candidates" data-testid="candidates">
      <div className="cand-head">
        <div>
          <span className="eyebrow">候选 · 基于 C v{state.version}</span>
          <h2>
            找到 {results.count} 个符合项
            <span className="cand-head-sub"> · 已按你的硬条件筛选</span>
          </h2>
        </div>
        <Chip tone={staleBlocked ? 'warn-soft' : previewId ? 'info' : 'teal-soft'}>
          {staleBlocked ? '候选已过期' : previewId ? '预览未应用' : '待选择'}
        </Chip>
      </div>

      {staleBlocked && (
        <div className="stale-banner" data-testid="stale-banner" role="alert">
          <span className="stale-icon">
            <WarningOutlined />
          </span>
          <div className="stale-copy">
            <b>{stale.title}</b>
            <p>{stale.detail}</p>
            <div className="stale-keep">
              <span>
                <CheckOutlined /> 已保留 {results.count} 款候选
              </span>
              <span>
                <CheckOutlined /> 已保留你的输入与工作副本
              </span>
            </div>
          </div>
          <div className="stale-actions">
            <button className="primary-btn" onClick={actions.recheck} data-testid="recheck">
              <ReloadOutlined /> 按最新布局重新检查
            </button>
            <button className="ghost-btn" onClick={actions.dropProposal}>
              放弃提案
            </button>
          </div>
        </div>
      )}

      <div className="run-recap">
        <div className="run-recap-head">
          <span className="recap-check">
            <CheckOutlined />
          </span>
          <span>执行完成 · {stages.length || 4} 个阶段</span>
          <button className="link-inline" onClick={() => actions.openDrawer('evidence')}>
            查看依据
          </button>
        </div>
        <div className="recap-stages">
          {stages.map((stage) => (
            <div className="recap-stage" key={stage.key} title={stage.result || ''}>
              <span>{stage.title}</span>
              <b>{stage.result || '—'}</b>
            </div>
          ))}
        </div>
      </div>

      {impact && (
        <div className="impact-card">
          <div className="impact-top">
            <div className="impact-price">
              <span>当前</span>
              <b>{money(impact.currentPrice)}</b>
            </div>
            <ArrowRightOutlined className="impact-arrow" />
            <div className="impact-price">
              <span>候选 · {selected.product.name}</span>
              <b>{money(impact.nextPrice)}</b>
            </div>
            <Delta cents={impact.delta} className="impact-delta" />
          </div>
          <div className="impact-bottom">
            <span>已知合计</span>
            <b>{money(impact.currentKnown)}</b>
            <span className="impact-to">→</span>
            <b>{money(impact.nextKnown)}</b>
            <span className="impact-pending">安装费仍待确认</span>
          </div>
        </div>
      )}

      <div className="candidate-list">
        {results.eligible.map((row) => {
          const isSelected = row.productId === selectedId;
          const isPreview = row.productId === previewId;
          const isRecommended = row.productId === results.recommendedId;
          return (
            <button
              key={row.productId}
              className={`candidate-card ${isSelected ? 'is-selected' : ''} ${isPreview ? 'is-preview' : ''} ${staleBlocked ? 'is-disabled' : ''}`}
              onClick={() => actions.selectCandidate(row.productId)}
              data-testid={`candidate-${row.productId}`}
              aria-pressed={isSelected}
              disabled={staleBlocked}
            >
              <span className="candidate-radio" aria-hidden="true">
                {isSelected && <span />}
              </span>
              <span className="candidate-art">
                <ProductArt productId={row.productId} />
              </span>
              <span className="candidate-body">
                <span className="candidate-title">
                  {row.product.name}
                  {isRecommended && <em className="cand-tag">系统推荐</em>}
                  {row.product.l === currentProduct.l && row.product.w === currentProduct.w && (
                    <em className="cand-tag is-quiet">保持桌面</em>
                  )}
                </span>
                <span className="candidate-spec">
                  {row.product.l} × {row.product.w} × {row.product.h} cm · {row.product.material} ·{' '}
                  {row.product.look?.toneName || row.product.finish}
                </span>
                <span className="candidate-price-row">
                  <b>{money(row.product.price)}</b>
                  <Delta cents={row.impact.delta} />
                  <span className="candidate-known">新合计 {money(row.impact.nextKnown)}</span>
                </span>
                <span className="candidate-points">
                  <span>{row.tradeoff.notes[0]}</span>
                  <span>
                    右墙净距 {row.clearance.right}cm · 桌面面积 {row.tradeoff.areaDelta}%
                  </span>
                </span>
              </span>
              <span className={`candidate-preview ${isPreview ? 'is-on' : ''} ${staleBlocked ? 'is-stale' : ''}`}>
                {staleBlocked ? '已过期' : <><EyeOutlined /> {isPreview ? '预览中' : '预览'}</>}
              </span>
            </button>
          );
        })}
      </div>

      {results.excluded.length > 0 && (
        <details className="excluded-block" data-testid="excluded">
          <summary>
            <span>为什么没有更便宜？</span>
            <span className="excluded-count">排除 {results.excluded.length} 款</span>
            <ArrowRightOutlined />
          </summary>
          <div className="excluded-list">
            {results.excluded.map((row) => (
              <div className="excluded-row" key={row.productId}>
                <div className="excluded-top">
                  <b>{row.product.name}</b>
                  <span>
                    {row.product.l} × {row.product.w} cm · {money(row.product.price)}
                  </span>
                  <Chip tone="danger-soft">不可应用</Chip>
                </div>
                <ul>
                  {row.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      {staleBlocked ? (
        <div className="stale-foot">
          <ExclamationCircleOutlined />
          <span>候选已暂停应用。重新校验会保留你的新位置，并从最新布局继续。</span>
        </div>
      ) : (
        <div className="cand-footer">
          <div className="cand-footer-note">
            {previewId ? (
              <>
                <span className="dot" /> 正在预览 {product(previewId).name}，正式方案仍为 C v{state.version}
              </>
            ) : (
              <>选择候选后即可在空间中预览，不会改动正式方案。</>
            )}
          </div>
          <div className="cand-actions">
            <button className="ghost-btn" onClick={previewCandidate}>
              {previewId ? (
                <>
                  <CloseOutlined /> 退出预览
                </>
              ) : (
                <>
                  <EyeOutlined /> 预览此候选
                </>
              )}
            </button>
            <button
              className="primary-btn"
              data-testid="apply-button"
              disabled={!previewId || staleBlocked}
              onClick={() => actions.applyCandidate(selectedId)}
            >
              应用并生成 C v{state.version + 1} <ArrowRightOutlined />
            </button>
          </div>
          <div className="cand-meta">
            <button className="link-inline" onClick={() => actions.setView('shop')}>
              查看完整选品池 · 筛选与容差分析
            </button>
            <span>应用会生成 C v{state.version + 1} · 可撤销</span>
          </div>
        </div>
      )}
    </div>
  );
}
