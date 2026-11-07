import React, { useMemo, useState } from 'react';
import { Slider, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { BUDGET, DELIVERY, PRESERVE_ITEMS, PRODUCT_IDS, ROOM } from '../data/catalog.js';
import {
  clearances,
  impactFor,
  knownTotal,
  money,
  product,
  tableOf,
  tableProduct,
  validateCandidate,
} from '../core/engine.js';
import { Chip, Delta, ProductArt } from '../components/ui.jsx';

const MATERIALS = [
  { id: '白蜡木', label: '白蜡木' },
  { id: '橡木', label: '橡木' },
  { id: '浅色实木系', label: '浅色实木系' },
];

function FilterPanel({ filters, setFilters, currentProduct, onReset }) {
  return (
    <aside className="shop-filter" aria-label="替换筛选">
      <div className="filter-head">
        <div>
          <span className="eyebrow">为这次替换筛选</span>
          <h3>替换约束聚焦</h3>
        </div>
        <Tooltip title="恢复默认试摆筛选">
          <button className="icon-btn sm" onClick={onReset} aria-label="重置筛选">
            <ReloadOutlined />
          </button>
        </Tooltip>
      </div>
      <p className="filter-sub">基于方案 C v3 的现存动线与预算参数收窄范围。</p>

      <div className="filter-card">
        <div className="filter-card-title">
          <LockOutlined /> 核心不可改条件
        </div>
        <div className="filter-field">
          <span>生活场景</span>
          <b>两人日常用餐，兼顾偶尔轻办公</b>
        </div>
        <div className="filter-field">
          <span>硬装与家具</span>
          <b>保留沙发与原木地板；沙发可在西区微移</b>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-card-title">
          预算约束
          <b>≤ {money(filters.maxPrice * 100)}</b>
        </div>
        <div className="filter-current">原案单品 {money(currentProduct.price)}</div>
        <Slider
          min={1200}
          max={2600}
          step={50}
          value={filters.maxPrice}
          onChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))}
          tooltip={{ formatter: (v) => `¥${v}` }}
        />
        <div className="filter-scale">
          <span>¥1,200</span>
          <span>¥2,600</span>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-card-title">
          尺寸限制
          <b>
            {filters.len[0]}–{filters.len[1]}cm
          </b>
        </div>
        <div className="filter-sub-line">长度范围 · 原案 150cm</div>
        <Slider
          range
          min={120}
          max={160}
          step={5}
          value={filters.len}
          onChange={(v) => setFilters((f) => ({ ...f, len: v }))}
        />
        <div className="filter-sub-line">宽度范围 · 原案 80cm</div>
        <Slider
          range
          min={65}
          max={90}
          step={5}
          value={filters.wid}
          onChange={(v) => setFilters((f) => ({ ...f, wid: v }))}
        />
      </div>

      <div className="filter-card">
        <div className="filter-card-title">材质偏好</div>
        <div className="filter-chips">
          {MATERIALS.map((material) => {
            const on = filters.materials.includes(material.id);
            return (
              <button
                key={material.id}
                className={on ? 'is-on' : ''}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    materials: on
                      ? f.materials.filter((m) => m !== material.id)
                      : [...f.materials, material.id],
                  }))
                }
              >
                {on && <CheckOutlined />} {material.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-card principle">
        <div className="filter-card-title">
          <InfoCircleOutlined /> 替换原则说明
        </div>
        <ul>
          <li>系统按客厅主要通行过道宽（保留 ≥ 85cm）自动收窄尺寸。</li>
          <li>保留两把坐椅与沙发间转角，不冲突。</li>
          <li>筛选只影响本页浏览，不改动任务条件与正式金额。</li>
        </ul>
      </div>
    </aside>
  );
}

function ShopCard({ product: p, row, current, state, actions, known, stale, onPreview, onRelax }) {
  const isCurrent = current.id === p.id;
  const isSelected = state.agent.selectedId === p.id;
  const isPreview = state.agent.previewId === p.id;
  const eligible = row ? row.eligible : null;
  const impact = row ? row.impact : impactFor(state, p.id);
  const clear = row ? row.clearance : clearances(state, p.id);
  const ratio = Math.round((p.price / known) * 1000) / 10;
  const savePct = Math.round(((current.price - p.price) / current.price) * 100);

  return (
    <article className={`shop-card ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''} ${isPreview ? 'is-preview' : ''} ${row && !row.eligible ? 'is-excluded' : ''} ${!row ? 'is-unchecked' : ''}`}>
      <div className="shop-card-top">
        <span className={`shop-tag ${isCurrent ? 'is-current' : eligible ? 'is-good' : 'is-bad'}`}>
          {isCurrent ? '当前方案使用' : eligible ? '符合约束' : row ? '低于约束' : '未校验'}
        </span>
        <span className="shop-card-hint">
          {isCurrent ? '基准参照' : isPreview ? '预览中' : eligible ? '可试摆' : row ? '不可应用' : '先发起替换'}
        </span>
      </div>

      <div className="shop-art">
        <ProductArt productId={p.id} />
        <span className="shop-size-badge">
          {p.l} × {p.w} × {p.h} cm
        </span>
        {eligible && <span className="shop-check"><CheckCircleFilled /></span>}
        {row && !row.eligible && <span className="shop-cross"><CloseCircleOutlined /></span>}
      </div>

      <div className="shop-card-body">
        <div className="shop-title-row">
          <h3>{p.full}</h3>
          {isCurrent ? (
            <Chip tone="muted">现状</Chip>
          ) : (
            <span className="shop-price">{money(p.price)}</span>
          )}
        </div>
        <div className="shop-price-row">
          {isCurrent ? (
            <span className="shop-price">{money(p.price)}</span>
          ) : (
            <>
              <Delta cents={impact.delta} />
              <span className="shop-save">单件节省 {money(Math.abs(impact.delta))} · {savePct}%</span>
            </>
          )}
          <span className="shop-ratio">占预算 {ratio}%</span>
        </div>

        <div className="shop-facts">
          <div>
            <span>空间占用</span>
            <b>
              右墙净距 {clear.right}cm · 前侧 {clear.front}cm
            </b>
          </div>
          <div>
            <span>尺寸与视觉</span>
            <b>
              {row
                ? row.tradeoff.notes[0]
                : p.l >= current.l
                  ? '与当前桌面同宽，比例接近'
                  : '桌面更小，视觉更轻'}
            </b>
          </div>
          <div>
            <span>费用影响</span>
            <b>
              {isCurrent
                ? `当前已知合计 ${money(known)}`
                : `预计 ${money(impact.nextKnown)}（安装费待确认）`}
            </b>
          </div>
        </div>

        {row && !row.eligible && (
          <ul className="shop-reasons">
            {row.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}

        <div className="shop-card-foot">
          {isCurrent ? (
            <button className="shop-cta is-disabled" disabled>
              当前选用 · 未被替换
            </button>
          ) : eligible ? (
            <button
              className="shop-cta"
              onClick={() => onPreview(p.id)}
              disabled={stale}
              data-testid={`shop-preview-${p.id}`}
            >
              在方案中试摆 <ArrowRightOutlined />
            </button>
          ) : row ? (
            <button className="shop-cta is-relax" onClick={() => onRelax(row)}>
              放宽到 {p.l}×{p.w}cm 并重新校验 <ArrowRightOutlined />
            </button>
          ) : (
            <button className="shop-cta is-ghost" onClick={() => actions.openComposer()}>
              先发起一次替换 <ArrowRightOutlined />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ShopView({ state, actions, stale }) {
  const current = tableProduct(state);
  const table = tableOf(state.objects);
  const known = knownTotal(state.objects);
  const results = state.agent.results;
  const [filters, setFilters] = useState({
    maxPrice: 2400,
    len: [120, 160],
    wid: [65, 90],
    materials: ['白蜡木', '橡木', '浅色实木系'],
  });

  const rowsById = useMemo(() => {
    const map = {};
    (results?.rows || []).forEach((row) => {
      map[row.productId] = row;
    });
    return map;
  }, [results]);

  const altProducts = useMemo(() => {
    return PRODUCT_IDS.map((id) => product(id))
      .filter((p) => p.id !== current.id)
      .filter((p) => p.price <= filters.maxPrice * 100)
      .filter((p) => p.l >= filters.len[0] && p.l <= filters.len[1])
      .filter((p) => p.w >= filters.wid[0] && p.w <= filters.wid[1])
      .filter((p) => filters.materials.length === 0 || filters.materials.includes(p.material));
  }, [current.id, filters]);

  const eligibleProducts = results
    ? altProducts.filter((p) => rowsById[p.id]?.eligible)
    : altProducts.slice(0, 3);
  const excludedProducts = results
    ? altProducts.filter((p) => rowsById[p.id] && !rowsById[p.id].eligible)
    : [];

  const selectedRow =
    results?.rows.find((r) => r.productId === (state.agent.selectedId || results.recommendedId)) ||
    results?.eligible[0] ||
    null;

  const analysisProduct = selectedRow ? product(selectedRow.productId) : current;
  const analysisClear = selectedRow ? selectedRow.clearance : clearances(state, current.id);

  const onPreview = (id) => {
    if (stale) {
      actions.showToast('候选已过期，先回到空间重新校验。', { tone: 'warn' });
      actions.setView('space');
      return;
    }
    const check = validateCandidate(state, id, state.agent.intent);
    if (!check.ok) {
      actions.showToast(check.text, { tone: 'warn' });
      return;
    }
    actions.selectCandidate(id);
    actions.setView('space');
  };

  const onRelax = (row) => {
    actions.relaxConditions({
      minLength: row.product.l,
      minWidth: row.product.w,
      ...(state.agent.intent?.maxPrice ? {} : {}),
    });
    actions.setView('space');
  };

  return (
    <section className="view shop-view">
      <div className="shop-head">
        <div>
          <div className="eyebrow">选物 · 替代选品池</div>
          <h1>
            餐桌替代选品池
            <span className="shop-count">
              {results ? `${results.count} 个符合约束` : '等待任务'}
            </span>
          </h1>
          <p>
            对比规格容差与预算差异。所有操作均为临时预演，当前正式方案与金额锁定为 C v{state.version}（{money(known)}）。
          </p>
        </div>
        <div className="shop-head-side">
          <span className={`verify-badge ${results ? 'is-ok' : ''}`}>
            <CheckCircleFilled />
            几何与材质校验{results ? '已通过' : '待任务'}
          </span>
          <button className="soft-btn" onClick={() => actions.setView('space')}>
            返回空间 <ArrowRightOutlined />
          </button>
        </div>
      </div>

      {stale && (
        <div className="stale-strip shop-stale">
          <WarningOutlined />
          <span>{stale.detail}</span>
          <button onClick={actions.recheck}>
            <ReloadOutlined /> 重新检查
          </button>
        </div>
      )}

      {!results && (
        <div className="shop-notice">
          <InfoCircleOutlined />
          <span>
            还没有经过校验的候选。可以先浏览示例目录；从空间发起一次替换后，这里会显示符合与排除的真实结果。
          </span>
          <button className="link-inline" onClick={() => actions.openComposer()}>
            从餐桌发起平替 <ArrowRightOutlined />
          </button>
        </div>
      )}

      <div className="shop-layout">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          currentProduct={current}
          onReset={() =>
            setFilters({ maxPrice: 2400, len: [120, 160], wid: [65, 90], materials: ['白蜡木', '橡木', '浅色实木系'] })
          }
        />

        <div className="shop-main">
          <div className="shop-toolbar">
            <span>
              <FilterOutlined /> 试摆筛选
            </span>
            <span className="shop-toolbar-count">
              {altProducts.length} 款可浏览 · {results ? `${eligibleProducts.length} 款符合任务` : '尚未校验'}
            </span>
            <span className="shop-toolbar-note">筛选不改动任务条件</span>
          </div>

          <div className="shop-grid">
            <ShopCard
              product={current}
              row={null}
              current={current}
              state={state}
              actions={actions}
              known={known}
              stale={stale}
              onPreview={onPreview}
              onRelax={onRelax}
            />
            {eligibleProducts.map((p) => (
              <ShopCard
                key={p.id}
                product={p}
                row={rowsById[p.id] || null}
                current={current}
                state={state}
                actions={actions}
                known={known}
                stale={stale}
                onPreview={onPreview}
                onRelax={onRelax}
              />
            ))}
            {eligibleProducts.length === 0 && (
              <div className="shop-empty">
                <FilterOutlined />
                <b>{results ? '当前筛选内没有可试摆的候选' : '试摆筛选内没有款式'}</b>
                <p>
                  {results
                    ? '符合任务的款可能被本页筛选隐藏了；重置筛选即可继续浏览。任务条件本身没有被改动。'
                    : '放宽价格或尺寸范围即可继续浏览；任务条件本身没有被改动。'}
                </p>
                <button
                  className="soft-btn"
                  onClick={() =>
                    setFilters({ maxPrice: 2400, len: [120, 160], wid: [65, 90], materials: ['白蜡木', '橡木', '浅色实木系'] })
                  }
                >
                  重置筛选
                </button>
              </div>
            )}
          </div>

          {excludedProducts.length > 0 && (
            <div className="shop-excluded">
              <div className="shop-excluded-head">
                <b>被排除的款式</b>
                <span>{excludedProducts.length} 款低于你确认的硬条件，不能绕过应用</span>
              </div>
              <div className="shop-excluded-grid">
                {excludedProducts.map((p) => {
                  const row = rowsById[p.id];
                  return (
                    <div className="shop-excluded-card" key={p.id}>
                      <div className="shop-excluded-title">
                        <b>{p.name}</b>
                        <span>
                          {p.l} × {p.w} × {p.h} cm · {money(p.price)}
                        </span>
                      </div>
                      <ul>
                        {row.reasons.slice(0, 2).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      <button onClick={() => onRelax(row)}>
                        放宽到 {p.l}×{p.w}cm <ArrowRightOutlined />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="shop-analysis">
            <div className="analysis-icon">
              <span />
            </div>
            <div className="analysis-copy">
              <span className="analysis-kicker">平替尺寸容差分析</span>
              <b>
                {analysisProduct.name} 保留 {analysisClear.left ?? '—'}cm 完整双向回流动线；
                右墙净距 {analysisClear.right}cm，前侧 {analysisClear.front}cm。
                {analysisProduct.w < current.w
                  ? ' 桌面更窄，双人电脑陈设需采用紧凑型支架。'
                  : ' 桌面宽度保持，办公陈设无需调整。'}
              </b>
            </div>
            <div className="analysis-scores">
              {results && selectedRow ? (
                <>
                  <span>
                    结构匹配度 <b>{selectedRow.score.structure}%</b>
                  </span>
                  <span>
                    材质色系匹配度 <b>{selectedRow.score.material}%</b>
                  </span>
                </>
              ) : (
                <span className="analysis-pending">
                  <InfoCircleOutlined /> 校验结果待任务生成
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
