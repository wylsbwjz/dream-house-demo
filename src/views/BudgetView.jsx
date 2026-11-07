import React, { useState } from 'react';
import { Tooltip } from 'antd';
import {
  AimOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { DELIVERY } from '../data/catalog.js';
import {
  dimsOf,
  knownTotal,
  money,
  objectSpec,
  objectTitle,
  product,
  tableOf,
  unitPrice,
} from '../core/engine.js';
import { Chip, Delta, ObjectIcon, ProductArt } from '../components/ui.jsx';

const STATUS_LABEL = {
  'table-01': '本次替换',
  'sofa-01': '现状保留',
  'coffee-01': '现状保留',
  'chair-01': '计划购买',
  'cabinet-01': '计划购买',
  'lamp-01': '计划购买',
  'rug-01': '计划购买',
  'art-01': '计划购买',
  'plant-01': '计划购买',
};

export function BudgetView({ state, actions }) {
  const table = tableOf(state.objects);
  const currentProduct = product(table.productId);
  const known = knownTotal(state.objects);
  const previewId = state.agent.previewId;
  const previewProduct = previewId ? product(previewId) : null;
  const previewKnown = previewProduct
    ? known - currentProduct.price + previewProduct.price
    : null;
  const selectedId = state.selectedObjectId;

  const planned = state.objects.filter((o) => !o.existing && (o.price || o.productId));
  const existing = state.objects.filter((o) => o.existing);
  const groups = [
    { title: '计划购买', ids: planned.map((o) => o.id), note: '新增家具、软装与配送' },
    { title: '现状保留', ids: existing.map((o) => o.id), note: '不计入新增金额' },
  ];
  const [filter, setFilter] = useState('all');
  const pendingOnly = filter === 'pending';
  const visibleGroups = pendingOnly
    ? []
    : groups.filter(
        (group) =>
          filter === 'all' ||
          (filter === 'planned' && group.title === '计划购买') ||
          (filter === 'existing' && group.title === '现状保留')
      );
  const FILTERS = [
    { key: 'all', label: `全部 ${planned.length + existing.length} 项` },
    { key: 'planned', label: `计划购买 ${planned.length} 项` },
    { key: 'existing', label: `现状保留 ${existing.length} 项` },
    { key: 'pending', label: '待确认 1 项', testid: 'budget-filter-pending' },
  ];

  const rowFor = (object) => {
    const isTable = object.id === 'table-01';
    const unit = isTable ? currentProduct.price : unitPrice(object);
    const amount = unit * (object.qty || 1);
    return (
      <tr
        key={object.id}
        className={`${selectedId === object.id ? 'is-selected' : ''} ${isTable ? 'is-table-row' : ''}`}
        onClick={() => actions.selectObject(object.id, { keepView: true })}
        data-testid={`budget-row-${object.id}`}
      >
        <td>
          <div className="budget-item">
            <span className={`budget-thumb ${isTable ? 'is-product' : ''}`}>
              {isTable ? (
                <ProductArt productId={object.productId} />
              ) : (
                <ObjectIcon kind={object.kind} size={20} />
              )}
            </span>
            <div>
              <b>{isTable ? currentProduct.full : objectTitle(object)}</b>
              <span>
                {object.id} · {isTable ? `${currentProduct.material} · ${currentProduct.finish}` : objectSpec(object)}
              </span>
            </div>
          </div>
        </td>
        <td>
          <Chip
            tone={
              isTable
                ? 'teal-soft'
                : object.existing
                  ? 'muted'
                  : state.version > 3 && isTable
                    ? 'teal-soft'
                    : 'neutral'
            }
          >
            {STATUS_LABEL[object.id] || '计划购买'}
          </Chip>
        </td>
        <td className="num">{unit ? money(unit) : '—'}</td>
        <td className="num">{object.qty || 1}</td>
        <td className="num strong">{amount ? money(amount) : '现状'}</td>
        <td className="ops">
          {isTable ? (
            <Tooltip title="在空间中定位这同一件餐桌">
              <button
                className="link-inline"
                onClick={(e) => {
                  e.stopPropagation();
                  actions.setView('space');
                  actions.selectObject('table-01');
                }}
              >
                <AimOutlined /> 定位空间
              </button>
            </Tooltip>
          ) : (
            <span className="ops-muted">{object.existing ? '保留' : '—'}</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <section className="view budget-view">
      <div className="view-head budget-head">
        <div>
          <div className="eyebrow">商品与预算 · 同一份数据</div>
          <h1>商品与预算</h1>
          <p>对象行使用实例 ID；替换餐桌不会让清单失去定位。金额由同一入口派生。</p>
        </div>
        <div className="view-head-actions">
          <Chip tone="muted">C v{state.version}</Chip>
          <Chip tone={previewId ? 'info' : 'ok'}>
            {previewId ? '候选未应用' : '正式金额'}
          </Chip>
          <button className="soft-btn" onClick={() => actions.setView('shop')}>
            <ShoppingOutlined /> 选品池
          </button>
        </div>
      </div>

      {previewId && (
        <div className="budget-preview-banner" data-testid="budget-preview-banner">
          <InfoCircleOutlined />
          <span>
            正在预览 {previewProduct.name}（{previewProduct.l} × {previewProduct.w} cm）。
            正式金额仍为 {money(known)}；候选影响单独显示，不作正式写入。
          </span>
          <Delta cents={previewProduct.price - currentProduct.price} />
          <button className="link-inline" onClick={actions.exitPreview}>
            退出预览
          </button>
        </div>
      )}

      <div className="budget-stats">
        <div className="stat-card">
          <span>已知合计</span>
          <b data-testid="budget-known">{money(known)}</b>
          <i>家具软装 {money(known - DELIVERY)} + 配送 ¥400</i>
        </div>
        <div className="stat-card">
          <span>距上限</span>
          <b>{money(1000000 - known)}</b>
          <i>上限 ¥10,000 · 不含未报价安装</i>
        </div>
        <div className="stat-card is-warn">
          <span>待确认</span>
          <b>1 项</b>
          <i>餐边矮柜上楼安装费</i>
        </div>
        <div className="stat-card">
          <span>版本</span>
          <b>C v{state.version}</b>
          <i>对象实例与版本绑定</i>
        </div>
      </div>

      <div className="budget-filters" role="tablist" aria-label="清单筛选">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={filter === item.key}
            className={filter === item.key ? 'is-active' : ''}
            data-testid={item.testid}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
        <span className="budget-filters-note">筛选只改变本页展示，不改动方案数据</span>
      </div>

      <div className="budget-table-wrap">
        <div className="budget-table-head">
          <div>
            <b>方案清单</b>
            <span>点击行选中对象；餐桌行可回到空间定位</span>
          </div>
          <div className="budget-legend">
            <span>
              <CheckOutlined /> 已知
            </span>
            <span>
              <ExclamationCircleOutlined /> 待确认
            </span>
          </div>
        </div>
        <table className="budget-table">
          <thead>
            <tr>
              <th>物品</th>
              <th>状态</th>
              <th className="num">单价</th>
              <th className="num">数量</th>
              <th className="num">金额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {visibleGroups.map((group) => (
              <React.Fragment key={group.title}>
                <tr className="budget-group-row">
                  <td colSpan={6}>
                    <span>{group.title}</span>
                    <i>{group.note}</i>
                  </td>
                </tr>
                {group.ids.map((id) => {
                  const object = state.objects.find((o) => o.id === id);
                  return object ? rowFor(object) : null;
                })}
                {group.title === '计划购买' && previewProduct && (
                  <tr className="budget-candidate-row" data-testid="budget-candidate-row">
                    <td>
                      <div className="budget-item">
                        <span className="budget-thumb is-product">
                          <ProductArt productId={previewProduct.id} />
                        </span>
                        <div>
                          <b>
                            候选 · {previewProduct.full}
                            <Chip tone="info">未应用</Chip>
                          </b>
                          <span>
                            table-01 · 同一实例的临时规格 · {previewProduct.l} × {previewProduct.w} cm
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Chip tone="info">候选</Chip>
                    </td>
                    <td className="num">{money(previewProduct.price)}</td>
                    <td className="num">1</td>
                    <td className="num strong">{money(previewProduct.price)}</td>
                    <td className="ops">
                      <button className="link-inline" onClick={actions.exitPreview}>
                        退出预览
                      </button>
                    </td>
                  </tr>
                )}
                {group.title === '计划购买' && (
                  <tr className="budget-unknown-row">
                    <td>
                      <div className="budget-item">
                        <span className="budget-thumb is-unknown">?</span>
                        <div>
                          <b>餐边矮柜上楼安装费</b>
                          <span>待报价 · 未计入已知合计</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Chip tone="warn-soft">待确认</Chip>
                    </td>
                    <td className="num">—</td>
                    <td className="num">1</td>
                    <td className="num">未计</td>
                    <td className="ops">
                      <span className="ops-muted">不影响本次替换</span>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {pendingOnly && (
              <React.Fragment>
                <tr className="budget-group-row">
                  <td colSpan={6}>
                    <span>待确认</span>
                    <i>未计入已知合计的费用</i>
                  </td>
                </tr>
                <tr className="budget-unknown-row" data-testid="budget-pending-row">
                  <td>
                    <div className="budget-item">
                      <span className="budget-thumb is-unknown">?</span>
                      <div>
                        <b>餐边矮柜上楼安装费</b>
                        <span>待报价 · 未计入已知合计</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Chip tone="warn-soft">待确认</Chip>
                  </td>
                  <td className="num">—</td>
                  <td className="num">1</td>
                  <td className="num">未计</td>
                  <td className="ops">
                    <span className="ops-muted">不影响本次替换</span>
                  </td>
                </tr>
              </React.Fragment>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>
                <div className="budget-total-label">
                  已知合计
                  <span>含配送 ¥400 · 安装待确认</span>
                </div>
              </td>
              <td className="num budget-total">{money(known)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="budget-foot-note">
        <InfoCircleOutlined />
        <span>
          候选行只存在于预览状态；应用后它才会成为正式对象价格，并同步到空间、画布与对比。差额不是可自由支配的余额。
        </span>
        <button className="link-inline" onClick={() => actions.setView('space')}>
          返回空间 <ArrowRightOutlined />
        </button>
      </div>
    </section>
  );
}
