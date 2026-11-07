import React, { useEffect, useState } from 'react';
import { Button, Input, Popover, Select, Tooltip } from 'antd';
import {
  AimOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CompassOutlined,
  EditOutlined,
  LockOutlined,
  ReloadOutlined,
  RotateRightOutlined,
  SendOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { PRESERVE_ITEMS, PRODUCTS } from '../../data/catalog.js';
import { dimsOf, money, objectSpec, objectTitle, product } from '../../core/engine.js';
import { Chip, ObjectIcon, ProductArt, SectionTitle } from '../ui.jsx';

function CoordInput({ label, value, min, max, step = 10, onCommit }) {
  const [text, setText] = useState(String(Math.round(value)));
  useEffect(() => setText(String(Math.round(value))), [value]);
  const commit = () => {
    const n = Number(text);
    if (!Number.isFinite(n)) {
      setText(String(Math.round(value)));
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    setText(String(Math.round(clamped)));
    const result = onCommit(Math.round(clamped));
    if (result) setText(String(Math.round(value)));
  };
  return (
    <label className="coord-field">
      <span>{label}</span>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^\d.-]/g, ''))}
        onBlur={commit}
        onPressEnter={commit}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const dir = e.key === 'ArrowUp' ? 1 : -1;
            const next = Math.max(min, Math.min(max, Number(text || 0) + step * dir));
            setText(String(next));
            onCommit(next);
          }
        }}
        suffix="cm"
        aria-label={label}
      />
    </label>
  );
}

export function Inspector({ state, actions, table, currentProduct }) {
  const selectedId = state.selectedObjectId;
  const selected = state.objects.find((o) => o.id === selectedId) || table;
  const isTable = selected.id === 'table-01';
  const [quick, setQuick] = useState('');
  const dims = isTable ? dimsOf(selected) : null;
  const proposal = state.agent.proposal;
  const previewId = state.agent.previewId;

  if (!isTable) {
    return (
      <div className="panel-body inspector">
        <div className="object-head">
          <div>
            <div className="eyebrow">选中对象 · {selected.kind === 'sofa' ? '沙发' : '房间物品'}</div>
            <h2>{objectTitle(selected)}</h2>
            <p>{selected.note || '本次任务不改动这件物品，位置与数量保持现状。'}</p>
          </div>
          <Chip tone="muted">{selected.id}</Chip>
        </div>
        <div className="object-hero-icon">
          <ObjectIcon kind={selected.kind} size={40} />
        </div>
        <div className="kv-list">
          <div>
            <span>规格</span>
            <b>{objectSpec(selected)}</b>
          </div>
          <div>
            <span>状态</span>
            <b>{selected.stateLabel || '现状'}</b>
          </div>
          <div>
            <span>位置</span>
            <b>
              X {Math.round(selected.x)} · Y {Math.round(selected.y)} cm
            </b>
          </div>
          <div>
            <span>金额</span>
            <b>{selected.existing ? '现状保留，不计入新增' : money((selected.price || 0) * (selected.qty || 1))}</b>
          </div>
        </div>
        <div className="soft-callout">
          <LockOutlined />
          <div>
            <b>本地修改只开放餐桌</b>
            <p>沙发可以微移，但替换与尺寸调整不在本次范围。选中餐桌后可以发起一次平替。</p>
          </div>
        </div>
        <Button block className="ant-btn-strong" onClick={() => actions.selectObject('table-01')}>
          返回餐桌 <ArrowRightOutlined />
        </Button>
      </div>
    );
  }

  const setCoord = (patch) => actions.moveTable(patch);
  const currentDims = dimsOf(table);

  return (
    <div className="panel-body inspector">
      <div className="object-head">
        <div>
          <div className="eyebrow">
            选中对象 · 餐桌
            <span className="head-mode">仅这一件</span>
          </div>
          <h2>{currentProduct.full}</h2>
          <p>{currentProduct.note}</p>
        </div>
        <Chip tone="outline">{currentProduct.sku}</Chip>
      </div>

      <div className="product-hero">
        <div className="product-hero-art">
          <ProductArt productId={currentProduct.id} />
        </div>
        <div className="product-hero-meta">
          <div className="product-hero-name">
            {currentProduct.name}
            <span>{currentProduct.finish}</span>
          </div>
          <div className="product-hero-price">
            {money(currentProduct.price)}
            <small>/ 张 · 数量 1</small>
          </div>
          <div className="product-tags">
            <Chip tone="teal-soft">
              <CheckOutlined /> 型号已选定
            </Chip>
            <Chip tone="muted">{currentProduct.look?.toneName || currentProduct.finish}</Chip>
          </div>
        </div>
      </div>
      <p className="micro-copy">当前空间为几何近似示意；实拍材质与天然矿物线不等同于渲染结果。</p>

      <div className="dim-grid">
        {[
          ['长 L', currentDims.l],
          ['宽 W', currentDims.w],
          ['高 H', currentProduct.h],
        ].map(([label, value]) => (
          <div className="dim-box" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <i>cm</i>
          </div>
        ))}
      </div>

      <SectionTitle hint={<span className="hint-inline">10cm 网格吸附</span>}>空间定位与调整</SectionTitle>
      <div className="coord-grid">
        <CoordInput label="X" value={table.x} min={0} max={600} onCommit={(x) => setCoord({ x })} />
        <CoordInput label="Y" value={table.y} min={0} max={410} onCommit={(y) => setCoord({ y })} />
        <label className="coord-field">
          <span>角度</span>
          <Select
            value={table.rotation}
            onChange={(rotation) => setCoord({ rotation })}
            options={[0, 90, 180, 270].map((v) => ({ value: v, label: `${v}°` }))}
            popupClassName="dh-select-popup"
          />
        </label>
      </div>
      <div className="mini-actions">
        <button className="soft-btn" onClick={actions.rotateTable}>
          <RotateRightOutlined /> 旋转 90°
        </button>
        <button
          className="soft-btn"
          onClick={() => setCoord({ x: 348, y: 188, rotation: 0 })}
          disabled={table.x === 348 && table.y === 188 && table.rotation === 0}
        >
          <AimOutlined /> 复位到基准位
        </button>
      </div>

      <button className="primary-cta" onClick={() => actions.openComposer()}>
        <span className="cta-orb">
          <SwapOutlined />
        </span>
        <span>
          寻找更合适的替代
          <i>锁定餐桌 · 先生成可核对的条件</i>
        </span>
        <ArrowRightOutlined className="cta-arrow" />
      </button>
      <button
        className="secondary-cta"
        onClick={() =>
          actions.openComposer({
            text: '只换这张餐桌，找便宜一点的浅木色款。尺寸可以比 150×80cm 小，但长至少 140cm、宽至少 75cm，其他物品和位置保持不变。',
          })
        }
      >
        <EditOutlined /> 更换规格尺寸（如 140 / 160cm）
        <Tooltip title="尺寸调整也通过“条件 → 候选 → 预览”完成，不会直接改写正式方案。">
          <span className="help-dot">?</span>
        </Tooltip>
      </button>

      {previewId && (
        <div className="inline-preview-note">
          <span className="pulse-dot" />
          正在预览 {product(previewId).name}，正式方案仍为 C v{state.version}。
          <button onClick={actions.exitPreview}>退出预览</button>
        </div>
      )}

      <div className="constraint-card">
        <div className="constraint-head">
          <LockOutlined />
          当前方案约束条件
        </div>
        <ul>
          <li>保留浅米色沙发（允许西区微移）</li>
          <li>原木地板保持现状</li>
          <li>椅子、灯与矮柜位置不变，不占用阳台推拉门动线</li>
        </ul>
        <button className="link-inline" onClick={() => actions.openDrawer('brief')}>
          查看依据 <ArrowRightOutlined />
        </button>
      </div>

      <div className="inline-agent">
        <div className="inline-agent-head">
          <span>
            <CompassOutlined /> 就近智能协同
          </span>
          <Chip tone="muted">范围 · 仅这张餐桌</Chip>
        </div>
        <div className="inline-agent-input">
          <Input.TextArea
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="换便宜一些，其他物品保持不变…"
            autoSize={{ minRows: 1, maxRows: 3 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                if (!quick.trim()) return;
                actions.quickIntent(quick.trim());
                setQuick('');
              }
            }}
          />
          <button
            className="send-btn"
            disabled={!quick.trim()}
            onClick={() => {
              if (!quick.trim()) return;
              actions.quickIntent(quick.trim());
              setQuick('');
            }}
            aria-label="发送给协同 Agent"
          >
            <SendOutlined />
          </button>
        </div>
        <div className="inline-agent-foot">
          <span>发送后可先核对识别摘要，再开始检索</span>
          <span className="kbd">Enter</span>
        </div>
      </div>

      {proposal && (
        <div className="proposal-mini">
          <span className="pulse-dot" /> 已有一组候选在等你确认
          <button onClick={() => actions.setView('space')}>回到候选</button>
        </div>
      )}
    </div>
  );
}
