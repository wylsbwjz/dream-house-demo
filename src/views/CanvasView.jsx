import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import {
  AimOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ExpandOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SCHEMES } from '../data/catalog.js';
import {
  CANVAS_FURNITURE,
  CANVAS_MATERIALS,
  CANVAS_PALETTE,
  CANVAS_STYLE_TAGS,
  INSPIRATIONS,
} from '../data/inspiration.js';
import { money, tableOf, product, dimsOf } from '../core/engine.js';
import { usePanZoom } from '../hooks/usePanZoom.js';
import { Chip, Delta, ObjectIcon, ProductArt } from '../components/ui.jsx';

const BOARD = { w: 2600, h: 1700 };
const INITIAL_VIEW = { x: 1250, y: 420, s: 0.78 };

function useViewportSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function VersionRail({ state, actions }) {
  const versions = state.snapshots.map((s) => s.version).filter((v, i, a) => a.indexOf(v) === i);
  return (
    <div className="version-rail">
      <div className="version-rail-line" />
      {versions.map((version) => {
        const active = version === state.version;
        const snapshot = state.snapshots.find((s) => s.version === version);
        return (
          <button
            key={version}
            className={`version-node ${active ? 'is-active' : ''}`}
            onClick={() => {
              if (version === 3) actions.openDrawer('history');
              else {
                actions.setCompareVersion(version);
                actions.setView('compare');
              }
            }}
            title={snapshot?.reason}
          >
            <span className="version-dot" />
            <b>v{version}</b>
            <i>{version === 3 ? '基线' : snapshot?.reason?.includes('撤销') ? '恢复' : '替换'}</i>
          </button>
        );
      })}
      {state.version === 3 && (
        <span className="version-next">
          <span className="version-dot is-ghost" />
          <b>v4</b>
          <i>应用后生成</i>
        </span>
      )}
    </div>
  );
}

function SchemeCard({ scheme, kind, state, actions, style }) {
  const isC = kind === 'C';
  const previewId = isC ? state.agent.previewId : null;
  const proposal = isC ? state.agent.proposal : null;
  const stale = isC && state.agent.proposal && state.agent.phase === 'ready' && state.agent.baseRevision !== state.revision;
  const known = isC ? state.snapshots[state.snapshots.length - 1].known : scheme.price;
  const currentProduct = product(tableOf(state.objects).productId);
  const currentDims = dimsOf(tableOf(state.objects));
  const proposedDelta = isC && state.agent.selectedId
    ? product(state.agent.selectedId).price - currentProduct.price
    : -50000;

  return (
    <article className={`board-card scheme-card ${isC ? 'is-current' : ''} ${stale ? 'is-stale' : ''}`} data-no-pan style={style}>
      <div className={`card-photo photo-${scheme.tone}`}>
        <img src={scheme.image} alt={`${scheme.name} 方向的空间示例渲染`} draggable={false} />
        <span className="photo-scrim" />
        <div className="card-photo-top">
          <span className="scheme-code">
            SCHEME {scheme.letter} · V{isC ? state.version : scheme.version}
          </span>
          {isC ? (
            <span className="current-flag">
              <span className="flag-dot" /> 当前方案
            </span>
          ) : (
            <span className="ref-flag">参考方向</span>
          )}
        </div>
        <div className="card-photo-bottom">
          <span className="photo-caption">示例渲染 · 非实测</span>
          {isC && <span className="photo-metric">原貌保留率 82%</span>}
        </div>
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <div>
            <div className="card-eyebrow">{isC ? '当前工作方案' : '可查看的方向'}</div>
            <h3>
              {scheme.letter} {scheme.name}
              <span className="card-version">v{isC ? state.version : scheme.version}</span>
            </h3>
          </div>
          <Chip tone={isC ? 'teal-soft' : 'muted'}>{isC ? '平衡最优解' : scheme.tagline}</Chip>
        </div>

        <div className="card-price-row">
          <span className="card-price">{money(isC ? known : scheme.price)}</span>
          <span className="card-budget">
            {isC ? `距上限 ${money(1000000 - known)}` : `距上限 ${money(1000000 - scheme.price)}`}
          </span>
        </div>
        <div className="card-budget-track">
          <span style={{ width: `${Math.min(100, Math.round(((isC ? known : scheme.price) / 1000000) * 100))}%` }} />
        </div>

        {isC ? (
          <>
            <div className="card-facts">
              <div>
                <span>用餐安排</span>
                <b>{currentDims.l}cm 实木长桌，两人日常用餐{currentDims.l >= 150 ? '，可靠墙扩至四人' : '，拉出可延展四人'}</b>
              </div>
              <div>
                <span>办公方式</span>
                <b>餐办两用大桌面，采光充沛，坐享阳台开阔视野</b>
              </div>
              <div>
                <span>现状保留</span>
                <b>沙发与木地板保持原样；椅子、矮柜与灯位不变</b>
              </div>
            </div>

            <div className="card-focus">
              <span className="focus-pin" />
              本次只改这一张餐桌
            </div>

            <VersionRail state={state} actions={actions} />

            {proposal && (
              <div className={`card-candidate ${stale ? 'is-stale' : ''}`}>
                <span className="pulse-dot" />
                <span>
                  候选 {product(state.agent.selectedId || 'T140').name} · {stale ? '已过期' : '未应用'}
                </span>
                <Delta cents={previewId ? product(previewId).price - currentProduct.price : proposedDelta} />
                <button onClick={() => actions.setView('space')}>查看</button>
              </div>
            )}

            <div className="card-actions">
              <button className="card-primary" onClick={() => actions.setView('space')}>
                进入空间编辑 <ArrowRightOutlined />
              </button>
              <button className="card-ghost" onClick={() => actions.setView('compare')}>
                对比
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card-tags">
              {scheme.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p className="card-mini-fact">{scheme.facts[0].value}</p>
            <div className="card-actions">
              <button className="card-ghost wide" onClick={() => actions.openDrawer(`reference-${scheme.id}`)}>
                查看方向快照 <ArrowRightOutlined />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/* ---------- 画布上的灵感素材：只展示、可定位，不需打开 ---------- */

function PaletteCard() {
  return (
    <article className="board-card canvas-material-card" data-testid="canvas-palette" data-no-pan style={{ left: 60, top: 560, width: 260 }}>
      <div className="canvas-cluster-head">
        <span className="canvas-cluster-kicker">风格与配色</span>
        <span className="canvas-cluster-note">示例参考</span>
      </div>
      <div className="canvas-style-tags">
        {CANVAS_STYLE_TAGS.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="canvas-swatches">
        {CANVAS_PALETTE.map((swatch) => (
          <div className="canvas-swatch" key={swatch.hex} title={`${swatch.name} ${swatch.hex}`}>
            <span className="canvas-swatch-color" style={{ background: swatch.hex }} />
            <span className="canvas-swatch-name">{swatch.name}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MaterialCard() {
  return (
    <article className="board-card canvas-material-card" data-testid="canvas-materials" data-no-pan style={{ left: 60, top: 840, width: 260 }}>
      <div className="canvas-cluster-head">
        <span className="canvas-cluster-kicker">材质与面料</span>
        <span className="canvas-cluster-note">示例参考</span>
      </div>
      <div className="canvas-materials">
        {CANVAS_MATERIALS.map((material) => (
          <div className="canvas-material" key={material.name} title={material.name}>
            <span className="canvas-material-dot" style={{ background: material.hex }} />
            <span>{material.name}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RefCluster({ state }) {
  const favorites = INSPIRATIONS.filter((item) => state.favorites.includes(item.id));
  const items = favorites.length ? favorites.slice(0, 2) : INSPIRATIONS.slice(0, 2);
  return (
    <div className="canvas-cluster" data-testid="canvas-refs" data-no-pan>
      <div className="board-lane-label canvas-cluster-label" style={{ left: 60, top: 1036 }}>
        灵感参考 · {favorites.length ? '已收藏' : '示例'}
      </div>
      {items.map((item, index) => (
        <article
          key={item.id}
          className="board-card canvas-ref-card"
          data-no-pan
          style={{ left: 60 + index * 232, top: 1068 }}
          title={item.title}
        >
          <img src={item.cover} alt={item.title} draggable={false} />
          <div className="canvas-ref-caption">
            <b>{item.title}</b>
            <span>{item.tags.slice(0, 2).join(' · ')}</span>
          </div>
        </article>
      ))}
      {favorites.length > 2 && (
        <span className="canvas-ref-more" style={{ left: 60 + 2 * 232, top: 1068 }}>
          +{favorites.length - 2}
        </span>
      )}
    </div>
  );
}

function FurnitureCard() {
  return (
    <article className="board-card canvas-furniture-card" data-testid="canvas-furniture" data-no-pan style={{ left: 1750, top: 80, width: 320 }}>
      <div className="canvas-cluster-head">
        <span className="canvas-cluster-kicker">家具样式</span>
        <span className="canvas-cluster-note">示例目录</span>
      </div>
      <div className="canvas-furniture-list">
        {CANVAS_FURNITURE.map((item) => (
          <div className="canvas-furniture" key={item.id} title={`${item.id} · ${item.label}`}>
            <span className="canvas-furniture-art">
              <ProductArt productId={item.id} />
            </span>
            <span className="canvas-furniture-copy">
              <b>{item.id}</b>
              <i>{item.label}</i>
            </span>
          </div>
        ))}
      </div>
      <div className="canvas-object-row">
        <span className="canvas-object-chip">
          <ObjectIcon kind="sofa" size={14} /> 沙发 · 保留
        </span>
        <span className="canvas-object-chip">
          <ObjectIcon kind="plant" size={14} /> 绿植 · 点缀
        </span>
        <span className="canvas-object-chip">
          <ObjectIcon kind="lamp" size={14} /> 落地灯
        </span>
        <span className="canvas-object-chip">
          <ObjectIcon kind="cabinet" size={14} /> 矮柜
        </span>
        <span className="canvas-object-chip">
          <ObjectIcon kind="rug" size={14} /> 地毯
        </span>
      </div>
    </article>
  );
}

function NotesCluster({ state }) {
  const notes = state.notes.slice(0, 2);
  return (
    <div className="canvas-cluster" data-testid="canvas-notes" data-no-pan>
      <div className="board-lane-label canvas-cluster-label" style={{ left: 1750, top: 528 }}>
        决策笔记 · {state.notes.length ? `${state.notes.length} 篇` : '尚未保存'}
      </div>
      {notes.length > 0 ? (
        notes.map((note, index) => (
          <article
            key={note.id}
            className="board-card canvas-note-card"
            data-no-pan
            style={{ left: 1750, top: 558 + index * 118 }}
            title={`${note.title}${note.reason ? ' · ' + note.reason : ''}`}
          >
            <span className="canvas-note-pin" />
            <b>{note.title}</b>
            <span className="canvas-note-meta">
              {note.type === 'decision' ? '决策笔记' : '笔记'} ·{' '}
              {note.context?.summary || '方案记录'}
            </span>
          </article>
        ))
      ) : (
        <article className="board-card canvas-note-card is-ghost" data-no-pan style={{ left: 1750, top: 558 }}>
          <b>决策笔记</b>
          <span className="canvas-note-meta">在对比里保存决策后，会作为节点出现在这里，并连线到当前方案。</span>
        </article>
      )}
    </div>
  );
}

function FocusAnnotation() {
  return (
    <article className="board-card canvas-focus-card" data-testid="canvas-focus" data-no-pan style={{ left: 1240, top: 790, width: 240 }}>
      <span className="focus-pin" />
      <div>
        <b>本次聚焦</b>
        <span>只替换餐桌，其他不动。素材与笔记连到方案，但不直接改变正式版本。</span>
      </div>
    </article>
  );
}

export function CanvasView({ state, actions }) {
  const { containerRef, cam, panning, fit, zoomIn, zoomOut, centerOn, handlers } = usePanZoom({
    boardW: BOARD.w,
    boardH: BOARD.h,
    padding: 60,
    initialView: INITIAL_VIEW,
  });
  const size = useViewportSize(containerRef);
  const mapW = 176;
  const mapH = 115;
  const scale = Math.min(mapW / BOARD.w, mapH / BOARD.h);
  const vx = -cam.x / cam.s;
  const vy = -cam.y / cam.s;
  const vw = size.w / cam.s;
  const vh = size.h / cam.s;

  const onMiniClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const bx = (e.clientX - rect.left) / scale;
    const by = (e.clientY - rect.top) / scale;
    centerOn(bx, by, cam.s);
  };

  return (
    <section className="view canvas-view">
      <div className="view-head canvas-head">
        <div>
          <div className="eyebrow">方案画布 · 无限延伸</div>
          <h1>同一间客厅，三种取舍，一墙素材。</h1>
          <p>
            风格、配色、材质、参考图与家具样式都可以铺在画布上，连线到当前方案；右上缩略图是方案总览，点哪里就定位到哪里。
          </p>
        </div>
        <div className="view-head-actions">
          <Chip tone="muted">3 个方向</Chip>
          <Chip tone="teal-soft">1 处局部修改</Chip>
          <Chip tone="muted">画布可继续延伸</Chip>
          <button className="soft-btn" onClick={fit}>
            <AimOutlined /> 总览全图
          </button>
        </div>
      </div>

      <div
        className={`canvas-viewport ${panning ? 'is-panning' : ''}`}
        ref={containerRef}
        {...handlers}
        onDoubleClick={fit}
      >
        <div
          className="canvas-board"
          style={{
            width: BOARD.w,
            height: BOARD.h,
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
          }}
        >
          <div className="board-grid" />
          <div className="board-lane-label lane-ref" style={{ left: 350, top: 62 }}>
            参考方向 · 只读
          </div>
          <div className="board-lane-label lane-current" style={{ left: 990, top: 4 }}>
            当前工作 · C 的版本链
          </div>

          <svg className="board-connectors" width={BOARD.w} height={BOARD.h} aria-hidden="true">
            {/* 项目依据 → 三个方向 */}
            <path d="M310 340 C 330 340 332 340 350 340" />
            <path d="M310 340 C 520 340 540 360 670 360" />
            <path d="M310 340 C 700 340 760 330 990 340" />
            <circle cx="310" cy="340" r="4" />
            <circle cx="350" cy="340" r="4" />
            <circle cx="670" cy="360" r="4" />
            <circle cx="990" cy="340" r="4" />
            {/* 左侧素材：支线 → 干线 → 主要方案左下角 */}
            <path d="M760 596 V 1260" />
            <path d="M320 660 H 760" />
            <path d="M320 900 H 760" />
            <path d="M165 1232 V 1260 H 760" />
            <path d="M760 596 H 990" />
            <circle cx="320" cy="660" r="3" />
            <circle cx="320" cy="900" r="3" />
            <circle cx="165" cy="1232" r="3" />
            <circle cx="990" cy="596" r="4" />
            {/* 家具样式 / 决策笔记 → 主要方案右缘 */}
            <path d="M1420 320 H 1750" />
            <path d="M1420 557 H 1750" />
            <circle cx="1420" cy="320" r="4" />
            <circle cx="1420" cy="557" r="4" />
            <circle cx="1750" cy="320" r="3" />
            <circle cx="1750" cy="557" r="3" />
            {/* 本次聚焦 → 主要方案底缘 */}
            <path d="M1360 789 V 596" />
            <circle cx="1360" cy="596" r="4" />
          </svg>

          <article className="board-card brief-card" style={{ left: 40, top: 145 }} data-no-pan>
            <div className="brief-head">
              <span className="brief-kicker">项目依据</span>
              <Chip tone="ok">已核对</Chip>
            </div>
            <h3>两人日常用餐，<br />兼顾偶尔办公。</h3>
            <p className="brief-sub">梧桐里 · 89㎡ · 客厅约 24.6㎡ · 预算 ¥10,000</p>
            <div className="brief-facts">
              <div>
                <span>生活目标</span>
                <b>两人用餐 · 偶尔办公 · 温暖明亮</b>
              </div>
              <div>
                <span>硬装与家具</span>
                <b>保留沙发与原木地板；沙发可微移</b>
              </div>
              <div>
                <span>待补测</span>
                <b>窗边进深 · 安装费未报价</b>
              </div>
            </div>
            <button className="link-inline" onClick={() => actions.openDrawer('brief')}>
              查看完整项目依据 <ArrowRightOutlined />
            </button>
            <div className="brief-stamp">
              <span>共用空间基准</span>
              <span>三方向同源</span>
            </div>
          </article>

          <SchemeCard scheme={SCHEMES.A} kind="A" state={state} actions={actions} style={{ left: 350, top: 92 }} />
          <SchemeCard scheme={SCHEMES.B} kind="B" state={state} actions={actions} style={{ left: 670, top: 110 }} />
          <SchemeCard scheme={SCHEMES.C} kind="C" state={state} actions={actions} style={{ left: 990, top: 30 }} />

          <PaletteCard />
          <MaterialCard />
          <RefCluster state={state} />
          <FurnitureCard />
          <NotesCluster state={state} />
          <FocusAnnotation />

          <div className="board-watermark" style={{ left: 42, bottom: 26 }}>
            <span>DREAM HOUSE</span>
            <span>INFINITE CANVAS / 2026</span>
          </div>
          <div className="board-extend-hint" style={{ left: 2080, top: 1580 }}>
            画布可继续延伸 · 素材、笔记与版本都会挂在这里
          </div>
        </div>

        <div className="canvas-minimap" data-no-pan>
          <div className="minimap-map" onClick={onMiniClick} role="presentation">
            <div className="minimap-room" />
            <div className="minimap-card" style={{ left: '1.5%', top: '8.5%', width: '10.4%', height: '20%' }} />
            <div className="minimap-card" style={{ left: '13.5%', top: '5.4%', width: '11.5%', height: '24.7%' }} />
            <div className="minimap-card" style={{ left: '25.8%', top: '6.5%', width: '11.5%', height: '24.7%' }} />
            <div className="minimap-card is-accent" style={{ left: '38%', top: '1.8%', width: '16.5%', height: '37.6%' }} />
            <div className="minimap-card" style={{ left: '2.3%', top: '33%', width: '10%', height: '14%' }} />
            <div className="minimap-card" style={{ left: '2.3%', top: '49.4%', width: '10%', height: '11.2%' }} />
            <div className="minimap-card" style={{ left: '2.3%', top: '63%', width: '18.5%', height: '10%' }} />
            <div className="minimap-card" style={{ left: '67.3%', top: '4.7%', width: '12.3%', height: '25.3%' }} />
            <div className="minimap-card" style={{ left: '67.3%', top: '33%', width: '12.3%', height: '12%' }} />
            <div className="minimap-card" style={{ left: '47.7%', top: '45.9%', width: '9.2%', height: '5.3%' }} />
            <div
              className="minimap-viewport"
              style={{
                left: `${Math.max(0, (vx / BOARD.w) * 100)}%`,
                top: `${Math.max(0, (vy / BOARD.h) * 100)}%`,
                width: `${Math.min(100 - Math.max(0, (vx / BOARD.w) * 100), (vw / BOARD.w) * 100)}%`,
                height: `${Math.min(100 - Math.max(0, (vy / BOARD.h) * 100), (vh / BOARD.h) * 100)}%`,
              }}
            />
          </div>
          <div className="minimap-foot">
            <span>方案总览 · 点击定位</span>
            <span>{Math.round(cam.s * 100)}%</span>
          </div>
        </div>

        <div className="canvas-zoom" data-no-pan>
          <button onClick={zoomOut} aria-label="缩小">
            <MinusOutlined />
          </button>
          <span>{Math.round(cam.s * 100)}%</span>
          <button onClick={zoomIn} aria-label="放大">
            <PlusOutlined />
          </button>
          <button onClick={fit} aria-label="适配画布">
            <ExpandOutlined />
          </button>
        </div>

        <div className="canvas-hint">
          <span className="desktop-only">拖动空白处平移 · 滚轮缩放 · 双击总览 · 缩略图点击定位</span>
          <span className="touch-only">双指缩放 · 拖动平移</span>
        </div>
      </div>
    </section>
  );
}
