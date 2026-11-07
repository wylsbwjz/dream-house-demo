import React from 'react';
import { Popover, Tooltip } from 'antd';
import { ArrowRightOutlined, CheckOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { SCHEMES } from '../data/catalog.js';
import { money, objectSpec, objectTitle, product } from '../core/engine.js';
import { Chip, ObjectIcon, SectionTitle } from './ui.jsx';

export function LeftRail({ state, actions, table, currentProduct, known }) {
  const collapsed = state.ui.railCollapsed;
  const selectedId = state.selectedObjectId;
  const proposal = state.agent.proposal;
  const previewId = state.agent.previewId;
  const staleCandidate =
    proposal &&
    ['ready', 'preview'].includes(state.agent.phase) &&
    (state.agent.baseRevision !== state.revision || state.agent.baseBriefRevision !== state.briefRevision);

  const schemeRow = (scheme) => {
    const isC = scheme.id === 'C';
    const active = isC;
    return (
      <button
        key={scheme.id}
        className={`scheme-row ${active ? 'is-active' : ''}`}
        onClick={() => (isC ? actions.setView('space') : actions.openDrawer(`reference-${scheme.id}`))}
      >
        <span className={`letter-tile tone-${scheme.tone}`}>{scheme.letter}</span>
        <span className="scheme-copy">
          <span className="scheme-name">
            {scheme.name}
            <i>{isC ? `v${state.version}` : `v${scheme.version}`}</i>
          </span>
          <span className="scheme-sub">
            {isC ? '当前编辑中 · 均衡采光' : '参考方向 · 只读'}
          </span>
        </span>
        <span className="scheme-price">
          {money(isC ? known : scheme.price)}
          {isC && previewId && <em>候选未应用</em>}
          {isC && !previewId && state.version > 3 && <em>v{state.version}</em>}
        </span>
      </button>
    );
  };

  const displayGroups = [
    { title: '现状与保留', ids: ['sofa-01', 'coffee-01'] },
    { title: '本次相关', ids: ['table-01', 'chair-01'] },
    { title: '其余物品', ids: ['cabinet-01', 'lamp-01'], decor: true },
  ];
  const decorIds = ['rug-01', 'art-01', 'plant-01'];
  const decorContent = (
    <div className="decor-pop">
      {decorIds.map((id) => {
        const object = state.objects.find((o) => o.id === id);
        if (!object) return null;
        return (
          <button key={id} onClick={() => actions.selectObject(id)}>
            <span className="object-icon">
              <ObjectIcon kind={object.kind} size={15} />
            </span>
            <span>
              <b>{object.name}</b>
              <i>{objectSpec(object)}</i>
            </span>
          </button>
        );
      })}
    </div>
  );

  if (collapsed) {
    return (
      <aside className="rail is-collapsed" aria-label="项目目录">
        <Tooltip title="展开目录" placement="right">
          <button className="rail-expand" onClick={() => actions.setRailCollapsed(false)}>
            <RightOutlined />
          </button>
        </Tooltip>
        {['A', 'B', 'C'].map((id) => (
          <Tooltip key={id} title={`${SCHEMES[id].name}`} placement="right">
            <button
              className={`rail-mini-letter ${id === 'C' ? 'is-active' : ''}`}
              onClick={() => (id === 'C' ? actions.setView('space') : actions.openDrawer(`reference-${id}`))}
            >
              {id}
            </button>
          </Tooltip>
        ))}
        <div className="rail-mini-rule" />
        {displayGroups.flatMap((g) => g.ids).map((id) => {
          const obj = state.objects.find((o) => o.id === id);
          if (!obj) return null;
          return (
            <Tooltip key={id} title={objectTitle(obj)} placement="right">
              <button
                className={`rail-mini-object ${selectedId === id ? 'is-active' : ''}`}
                onClick={() => actions.selectObject(id)}
                aria-label={objectTitle(obj)}
              >
                <ObjectIcon kind={obj.kind} size={16} />
              </button>
            </Tooltip>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="rail" aria-label="项目目录">
      <div className="rail-scroll">
        <section className="rail-block basis-block">
          <div className="basis-head">
            <span className="basis-title">空间基准</span>
            <Chip tone="ok" className="tiny">
              <CheckOutlined /> 已核对
            </Chip>
          </div>
          <div className="basis-grid">
            <div>
              <b>600 × 410</b>
              <span>cm · 约 24.6㎡</span>
            </div>
            <div>
              <b>2.8 m</b>
              <span>层高 · 西窗</span>
            </div>
          </div>
          <button className="link-row" onClick={() => actions.openDrawer('brief')}>
            查看项目依据 <ArrowRightOutlined />
          </button>
        </section>

        <section className="rail-block">
          <SectionTitle action={<span className="count">3</span>}>方案方向</SectionTitle>
          <div className="scheme-list">{[SCHEMES.A, SCHEMES.B, SCHEMES.C].map(schemeRow)}</div>
          {proposal && ['ready', 'preview'].includes(state.agent.phase) && (
            <div className="rail-candidate-note">
              <span className="rail-candidate-dot" />
              <span>
                候选 {state.agent.selectedId ? product(state.agent.selectedId).name : '待选'}{' '}
                {staleCandidate ? '已过期' : '未应用'}
              </span>
              <button onClick={() => actions.setView('space')}>查看</button>
            </div>
          )}
        </section>

        <section className="rail-block objects-block">
          <SectionTitle
            action={
              <button className="icon-text-btn" onClick={() => actions.selectObject('table-01')}>
                仅看本次
              </button>
            }
          >
            房间对象 <span className="count">{state.objects.length}</span>
          </SectionTitle>
          {displayGroups.map((group) => (
            <div className="object-group" key={group.title}>
              <div className="object-group-title">{group.title}</div>
              {group.ids.map((id) => {
                const obj = state.objects.find((o) => o.id === id);
                if (!obj) return null;
                const isTable = obj.id === 'table-01';
                const title = isTable ? currentProduct.name : objectTitle(obj);
                const selected = selectedId === id;
                return (
                  <button
                    key={id}
                    className={`object-row ${selected ? 'is-selected' : ''}`}
                    onClick={() => actions.selectObject(id)}
                  >
                    <span className={`object-icon ${isTable ? 'is-table' : ''}`}>
                      <ObjectIcon kind={obj.kind} size={16} />
                    </span>
                    <span className="object-copy">
                      <span className="object-name">{title}</span>
                      <span className="object-spec">{objectSpec(obj)}</span>
                    </span>
                    <span className="object-side">
                      {obj.existing ? <em>保留</em> : isTable ? <b>{money(product(obj.productId).price)}</b> : <em>{obj.qty > 1 ? `×${obj.qty}` : ''}</em>}
                    </span>
                  </button>
                );
              })}
              {group.decor && (
                <Popover content={decorContent} trigger="click" placement="rightTop" overlayClassName="decor-overlay">
                  <button className="object-row">
                    <span className="object-icon">
                      <ObjectIcon kind="art" size={16} />
                    </span>
                    <span className="object-copy">
                      <span className="object-name">装饰与绿植</span>
                      <span className="object-spec">地毯 · 装饰画 · 绿植</span>
                    </span>
                    <span className="object-side">
                      <em>×3</em>
                    </span>
                  </button>
                </Popover>
              )}
            </div>
          ))}
        </section>
      </div>

      <div className="rail-footer">
        <button className="rail-link" onClick={() => actions.openDrawer('brief')}>
          <span className="rail-link-icon">◎</span>
          <span>
            项目依据
            <i>保留条件与待确认项</i>
          </span>
          <ArrowRightOutlined />
        </button>
        <div className="rail-bottom-row">
          <span className="mode-label">
            <span className="mode-dot" /> 本地规则演示
          </span>
          <Tooltip title="收起目录">
            <button className="icon-btn sm" onClick={() => actions.setRailCollapsed(true)} aria-label="收起目录">
              <LeftOutlined />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
