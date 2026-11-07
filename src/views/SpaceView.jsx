import React from 'react';
import { Tooltip } from 'antd';
import {
  AimOutlined,
  BorderOutlined,
  CheckOutlined,
  CompassOutlined,
  ExpandOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  RotateRightOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { dimsOf, money, product, tableOf } from '../core/engine.js';
import { RoomScene } from '../components/RoomScene.jsx';
import { usePanZoom } from '../hooks/usePanZoom.js';
import { Chip, Delta, ObjectIcon } from '../components/ui.jsx';

const MODES = [
  { id: 'iso', label: '结构 3D', hint: '等轴测' },
  { id: 'plan', label: '平面 2D', hint: '尺寸与动线' },
  { id: 'photo', label: '实拍参考', hint: '氛围' },
];

function PhotoStage({ state, actions, onSwitchToIso }) {
  return (
    <div className="photo-stage">
      <img src="/img/room-c.jpg" alt="客厅实拍参考" draggable={false} />
      <div className="photo-overlay" />
      <div className="photo-flag">
        <InfoCircleOutlined /> 实拍参考 · 不参与几何校验与费用
      </div>
      <div className="photo-hotspot hotspot-window">
        <span className="hotspot-dot" />
        <span className="hotspot-label">
          西窗采光
          <i>窗边进深 105cm · 待补测</i>
        </span>
      </div>
      <div className="photo-hotspot hotspot-sofa" onClick={() => actions.selectObject('sofa-01')}>
        <span className="hotspot-dot" />
        <span className="hotspot-label">
          三人位浅米沙发
          <i>现状保留 · 可在西区微移</i>
        </span>
      </div>
      <div className="photo-hotspot hotspot-shelf">
        <span className="hotspot-dot" />
        <span className="hotspot-label">
          餐边矮柜与置物
          <i>收纳笔记本与常备文具</i>
        </span>
      </div>
      <button className={`photo-hotspot hotspot-table ${state.selectedObjectId === 'table-01' ? 'is-selected' : ''}`} onClick={onSwitchToIso}>
        <span className="photo-table-outline" />
        <span className="hotspot-label">
          栖木 T150 长桌
          <i>150 × 80 × 74cm · 点击回到结构视图编辑</i>
        </span>
        <span className="photo-edit">
          <BorderOutlined /> 结构视图
        </span>
      </button>
      <div className="photo-caption">DREAM HOUSE / 实拍氛围参考 · 示例数据</div>
    </div>
  );
}

export function SpaceView({ state, actions, stale }) {
  const { ui, agent } = state;
  const mode = ui.roomMode;
  const table = tableOf(state.objects);
  const currentProduct = product(table.productId);
  const dims = dimsOf(table);
  const previewId = agent.previewId;
  const previewProduct = previewId ? product(previewId) : null;
  const previewDims = previewId ? dimsOf(table, previewId) : null;
  const boardW = mode === 'plan' ? 724 : 900;
  const boardH = mode === 'plan' ? 526 : 690;
  const { containerRef, cam, panning, fit, zoomIn, zoomOut, handlers } = usePanZoom({
    boardW,
    boardH,
    padding: 14,
    min: 0.55,
    max: 2.4,
  });

  const isPreview = !!previewId;
  const sofa = state.objects.find((o) => o.kind === 'sofa');

  return (
    <section className={`view space-view mode-${mode}`}>
      <div className="space-toolbar">
        <div className="mode-switch" role="tablist" aria-label="空间视图">
          {MODES.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={mode === item.id}
              className={mode === item.id ? 'is-active' : ''}
              onClick={() => actions.setRoomMode(item.id)}
              title={item.hint}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="perspective-pill">
          <CompassOutlined /> 东南透视 <span className="perspective-angle">32°</span>
        </span>
        <div className="space-toolbar-spacer" />
        <Tooltip title="10cm 网格吸附">
          <button className={`icon-toggle ${ui.grid ? 'is-on' : ''}`} onClick={actions.toggleGrid}>
            <span className="grid-icon" /> 网格吸附
          </button>
        </Tooltip>
        <Tooltip title="尺寸标注">
          <button className={`icon-toggle ${ui.dims ? 'is-on' : ''}`} onClick={actions.toggleDims}>
            <BorderOutlined /> 尺寸标注
          </button>
        </Tooltip>
        <Tooltip title="适配视图">
          <button className="icon-btn sm" onClick={fit} aria-label="适配视图">
            <ExpandOutlined />
          </button>
        </Tooltip>
      </div>

      {(isPreview || stale) && (
        <div className="stage-banners">
          {isPreview && (
            <div className="preview-banner" data-testid="preview-banner">
              <span className="preview-banner-dot" />
              <div>
                <b>候选预览 · {previewProduct.name}</b>
                <span>
                  {previewDims.l} × {previewDims.w} cm · 未应用到方案 · 正式金额仍为 {money(state.snapshots[state.snapshots.length - 1].known)}
                </span>
              </div>
              <Delta cents={previewProduct.price - currentProduct.price} />
              <button onClick={actions.exitPreview}>退出预览</button>
            </div>
          )}
          {stale && (
            <div className="stale-strip">
              <WarningOutlined />
              <span>{stale.detail}</span>
              <button onClick={actions.recheck}>
                <ReloadOutlined /> 重新检查
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-stage-wrap">
        {mode === 'photo' ? (
          <PhotoStage state={state} actions={actions} onSwitchToIso={() => actions.setRoomMode('iso')} />
        ) : (
          <div
            className={`space-stage ${panning ? 'is-panning' : ''}`}
            ref={containerRef}
            {...handlers}
            onDoubleClick={fit}
          >
            <div
              className="scene-board"
              style={{
                width: boardW,
                height: boardH,
                transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
              }}
            >
              <RoomScene
                objects={state.objects}
                tableProductId={table.productId}
                selectedId={state.selectedObjectId}
                previewId={previewId}
                mode={mode}
                interactive
                showGrid={ui.grid}
                showDims={ui.dims}
                onSelect={actions.selectObject}
                onMoveTable={actions.moveTable}
                onRotate={actions.rotateTable}
              />
            </div>

            <div className="zoom-cluster" data-no-pan>
              <button onClick={zoomOut} aria-label="缩小">
                <MinusOutlined />
              </button>
              <span>{Math.round(cam.s * 100)}%</span>
              <button onClick={zoomIn} aria-label="放大">
                <PlusOutlined />
              </button>
              <button onClick={fit} aria-label="适配视图">
                <AimOutlined />
              </button>
            </div>

            <div className="space-note">
              <span className="note-grid" />
              10 cm 网格吸附 · 示例空间，非实测
            </div>
          </div>
        )}
      </div>

      <div className="space-bottom">
        <div className="space-object-tabs">
          <button className="is-active">
            <ObjectIcon kind="table" size={15} /> 餐桌 {currentProduct.id}
            <em>{dims.l} × {dims.w} cm</em>
          </button>
          <button onClick={() => actions.selectObject('sofa-01')}>
            <ObjectIcon kind="sofa" size={15} /> 沙发 <em>保留 · 可微移</em>
          </button>
          <button onClick={() => actions.setView('budget')}>
            <ObjectIcon kind="chair" size={15} /> 查看全部物品 <em>{state.objects.length}</em>
          </button>
        </div>
        <div className="space-hints">
          <span>拖动餐桌移动 · 方向键 10cm · R 旋转</span>
          <span className="hint-sep">·</span>
          <span>Esc 退出预览</span>
        </div>
        <div className="space-meta">
          <Chip tone={isPreview ? 'info' : 'muted'}>{isPreview ? '候选未应用' : `C v${state.version}`}</Chip>
          <button className="icon-btn sm" onClick={actions.rotateTable} aria-label="旋转餐桌">
            <RotateRightOutlined />
          </button>
        </div>
      </div>
    </section>
  );
}
