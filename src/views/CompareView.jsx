import React from 'react';
import { Input, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  BulbOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CheckOutlined,
  CompassOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { SCHEMES, ROOM } from '../data/catalog.js';
import { dimsOf, money, product, tableOf, knownTotal, findSnapshot } from '../core/engine.js';
import { RoomScene } from '../components/RoomScene.jsx';
import { Chip, ObjectIcon } from '../components/ui.jsx';

function cFacts(state, productId) {
  const p = product(productId);
  return [
    {
      key: '用餐安排',
      value:
        p.l >= 150
          ? `${p.l}cm 实木长桌，两人日常用餐，可靠墙临时加一把椅子`
          : `${p.l}cm 实木长桌，舒适两人日常用餐，拉出可延展四人聚餐`,
    },
    {
      key: '办公方式',
      value: '餐办两用大桌面，采光充沛通透，坐享阳台开阔视野',
    },
    {
      key: '使用前收纳',
      value: '用餐前将笔记本与常备文具收纳至东侧餐边柜抽屉',
    },
    {
      key: '客厅公共区',
      value: '保留旧沙发（西窗区微移 15cm）、木地板完全保持原样',
    },
    {
      key: '现状保留物',
      value: '餐边柜、窗边绿植、落地灯',
    },
  ];
}

function SchemeColumn({ scheme, state, actions, previewId, cProduct }) {
  const isC = scheme.id === 'C';
  const version = isC ? state.version : scheme.version;
  const currentKnown = knownTotal(state.objects);
  const previewKnown = previewId
    ? currentKnown - cProduct.price + product(previewId).price
    : null;
  const price = isC ? (previewKnown ?? currentKnown) : scheme.price;
  const facts = isC ? cFacts(state, previewId || cProduct.id) : scheme.facts;
  const pct = Math.min(100, Math.round((price / 1000000) * 100));

  return (
    <article className={`compare-card ${isC ? 'is-focus' : ''} tone-${scheme.tone}`}>
      <div className="compare-photo">
        <img src={scheme.image} alt={`${scheme.name} 示例渲染`} draggable={false} />
        <span className="compare-photo-scrim" />
        <div className="compare-photo-top">
          <span className="compare-scheme-label">
            SCHEME {scheme.letter} · V{version}
          </span>
          {scheme.recommended && (
            <span className="recommend-flag">
              {previewId ? '推荐考虑 · 正在决策' : state.version > 3 ? '当前正式方案' : '推荐考虑'}
            </span>
          )}
          {!isC && <span className="ref-flag">参考</span>}
        </div>
        <div className="compare-photo-bottom">
          <span>{isC && previewId ? `候选 ${product(previewId).name} · 未应用` : '示例渲染 · 同角度'}</span>
          <span>{isC ? '北墙长桌' : scheme.tone === 'a' ? '南窗留白' : '独立工作区'}</span>
        </div>
      </div>

      <div className="compare-body">
        <div className="compare-title-row">
          <div>
            <h3>
              {scheme.letter} {scheme.name}
              <span className="compare-version">v{version}</span>
            </h3>
            <p>{scheme.tagline}</p>
          </div>
          {isC && <Chip tone="teal-soft">{previewId ? '预览中' : '平衡最优解'}</Chip>}
        </div>

        <div className="compare-price-row">
          {isC && previewId ? (
            <>
              <span className="compare-price is-muted">
                <i>原</i>
                {money(currentKnown)}
              </span>
              <ArrowRightOutlined className="compare-arrow" />
              <span className="compare-price">{money(previewKnown)}</span>
            </>
          ) : (
            <span className="compare-price">{money(price)}</span>
          )}
          <span className="compare-gap">距上限 {money(1000000 - price)}</span>
        </div>
        <div className="compare-track">
          <span style={{ width: `${pct}%` }} />
        </div>

        <div className="compare-facts">
          {facts.map((fact) => (
            <div className="compare-fact" key={fact.key}>
              <span className="fact-icon">
                <ObjectIcon kind={fact.key === '用餐安排' ? 'table' : fact.key === '办公方式' ? 'cabinet' : fact.key === '现状保留物' ? 'sofa' : 'rug'} size={14} />
              </span>
              <div>
                <span>{fact.key}</span>
                <b>{fact.value}</b>
              </div>
            </div>
          ))}
        </div>

        <div className="compare-pending">
          <ExclamationCircleOutlined />
          <div>
            <span>{isC ? '费用未决项' : '费用未决项'}</span>
            <b>
              {isC
                ? '仅余 1 项餐边矮柜上楼安装费待确认（约 ¥120）'
                : scheme.pending}
            </b>
          </div>
        </div>

        <div className="compare-foot-note">
          {isC
            ? previewId
              ? '当前聚焦比对方案 · 候选未正式采用'
              : state.version > 3
                ? `当前正式版本 C v${state.version}`
                : '当前聚焦比对方案（未正式采用）'
            : '参考方向 · 可查看完整快照'}
        </div>

        <button
          className={`compare-cta ${isC ? 'is-primary' : ''}`}
          onClick={() =>
            isC ? actions.setView('space') : actions.openDrawer(`reference-${scheme.id}`)
          }
        >
          {isC ? (
            <>
              {previewId ? '返回空间确认候选' : '进入 C 空间'} <ArrowRightOutlined />
            </>
          ) : (
            <>
              查看 {scheme.letter} 空间快照 <ArrowRightOutlined />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function MiniSnapshot({ title, subtitle, objects, productId, badge }) {
  return (
    <div className="mini-snapshot">
      <div className="mini-snapshot-head">
        <span>{title}</span>
        <Chip tone={badge?.tone || 'muted'}>{badge?.label || subtitle}</Chip>
      </div>
      <div className="mini-snapshot-scene">
        <RoomScene
          objects={objects}
          tableProductId={productId}
          selectedId="none"
          mode="iso"
          interactive={false}
          mini
          showGrid={false}
          showDims={false}
        />
      </div>
      <div className="mini-snapshot-foot">{subtitle}</div>
    </div>
  );
}

export function CompareView({ state, actions }) {
  const table = tableOf(state.objects);
  const currentProduct = product(table.productId);
  const previewId = state.agent.previewId;
  const currentKnown = knownTotal(state.objects);
  const v3 = state.snapshots.find((s) => s.version === 3) || state.snapshots[0];
  const latest = state.snapshots[state.snapshots.length - 1];
  const previous = state.snapshots.length > 1 ? state.snapshots[state.snapshots.length - 2] : latest;
  const defaultRight =
    latest.reason?.includes('撤销') && previous.version > 3 ? previous : latest;
  const selectedVersion = state.ui.compareVersion;
  const rightSnapshot = selectedVersion ? findSnapshot(state, selectedVersion) : defaultRight;
  const rightRestored = rightSnapshot.reason?.includes('撤销');
  const rightIsCandidate = !!previewId;
  const rightIsSameAsLeft = !rightIsCandidate && rightSnapshot.version === v3.version;
  const rightProductId = rightIsCandidate ? previewId : rightSnapshot.productId;
  const rightObjects = rightIsCandidate
    ? state.objects
    : rightSnapshot.objects;
  const rightKnown = rightIsCandidate
    ? currentKnown - currentProduct.price + product(previewId).price
    : rightSnapshot.known;
  const rightDims = dimsOf(
    rightIsCandidate ? table : rightSnapshot.objects.find((o) => o.id === 'table-01'),
    rightProductId
  );
  const leftDims = dimsOf(v3.objects.find((o) => o.id === 'table-01'));

  const applyCta = () => {
    if (previewId) {
      actions.applyCandidate(state.agent.selectedId || previewId);
      return;
    }
    if (state.agent.results && state.agent.selectedId) {
      actions.selectCandidate(state.agent.selectedId);
      actions.setView('space');
      actions.showToast('已进入候选预览，确认后可在侧栏应用。', { tone: 'info' });
      return;
    }
    actions.openComposer();
  };

  const rightLabel = rightIsCandidate ? '候选预览' : `C v${rightSnapshot.version}`;
  const productSummary = `${product(v3.productId).name} → ${product(rightProductId).name}（${leftDims.l}×${leftDims.w} → ${rightDims.l}×${rightDims.w}cm）`;
  const priceSummary = `已知合计 ${money(v3.known)} → ${money(rightKnown)}（安装费待确认）`;
  const conclusion = rightIsSameAsLeft
    ? null
    : rightIsCandidate
      ? `正在预览 ${product(rightProductId).name}：桌面 ${leftDims.l}×${leftDims.w} → ${rightDims.l}×${rightDims.w}cm，已知合计 ${money(v3.known)} → ${money(rightKnown)}；安装费仍待确认。`
      : rightRestored
        ? `C v${rightSnapshot.version} 是撤销记录：餐桌已恢复为 ${product(rightProductId).name}，v${previous.version > 3 ? previous.version : rightSnapshot.version} 的历史仍保留。`
        : `餐桌 ${product(v3.productId).name} → ${product(rightProductId).name}：桌面 ${leftDims.l}×${leftDims.w} → ${rightDims.l}×${rightDims.w}cm，已知合计 ${money(v3.known)} → ${money(rightKnown)}；安装费仍待确认。`;

  const saveDecisionNote = () => {
    actions.openNoteEditor({
      type: 'decision',
      title: '',
      body: state.ui.compareNote,
      context: {
        view: 'compare',
        leftVersion: v3.version,
        rightVersion: rightIsCandidate ? null : rightSnapshot.version,
        leftLabel: `C v${v3.version}`,
        rightLabel,
        summary: `餐办共用 C v${v3.version} → ${rightLabel}`,
        productSummary,
        priceSummary,
      },
    });
  };

  const ctaLabel = previewId
    ? `采用 ${product(previewId).name}，核对清单明细`
    : state.version > 3
      ? '查看清单'
      : '先生成可应用的候选';

  return (
    <section className="view compare-view">
      <div className="compare-banner">
        <div className="compare-banner-left">
          <CameraOutlined />
          <span>
            相同空间基准：客厅约 24.6㎡ · 相同相机东南透视角度 · 预算范围：新增家具、软装、配送安装（上限 ¥10,000）
          </span>
        </div>
        <div className="compare-banner-right">
          <CompassOutlined /> CAM_PERS_SE_01
          <span className="banner-sep" />
          快照锁定差 14:00
        </div>
      </div>

      {conclusion && (
        <div className="compare-conclusion" data-testid="compare-conclusion">
          <CheckCircleFilled />
          <span>{conclusion}</span>
          <button className="link-inline" onClick={saveDecisionNote}>
            保存为决策笔记 <ArrowRightOutlined />
          </button>
        </div>
      )}

      <div className="compare-grid">
        <SchemeColumn scheme={SCHEMES.A} state={state} actions={actions} previewId={previewId} cProduct={currentProduct} />
        <SchemeColumn scheme={SCHEMES.B} state={state} actions={actions} previewId={previewId} cProduct={currentProduct} />
        <SchemeColumn scheme={SCHEMES.C} state={state} actions={actions} previewId={previewId} cProduct={currentProduct} />
      </div>

      <div className="version-compare" data-testid="compare-versions">
        <div className="version-compare-head">
          <div>
            <span className="eyebrow">同一对象的版本对照</span>
            <h3>
              餐办共用 C v{v3.version} <ArrowRightOutlined /> {rightIsCandidate ? '候选预览' : `C v${rightSnapshot.version}`}
            </h3>
          </div>
          <div className="version-compare-meta">
            <Chip tone="muted">几何核对</Chip>
            <span>餐桌实例 table-01 在替换前后保持不变</span>
          </div>
        </div>

        {rightIsSameAsLeft ? (
          <div className="version-empty">
            <InfoCircleOutlined />
            <div>
              <b>应用后会在这里生成同视角对照</b>
              <p>当前只有 C v3。选中候选预览或应用后，可并排核对桌面尺寸、占地与已知合计。</p>
            </div>
            <button className="soft-btn" onClick={() => actions.setView('space')}>
              回到空间
            </button>
          </div>
        ) : (
          <div className="version-compare-body">
            <MiniSnapshot
              title={`C v${v3.version}`}
              subtitle={`原方案 · ${v3.productId} · ${money(v3.known)}`}
              objects={v3.objects}
              productId={v3.productId}
              badge={{ label: '基准', tone: 'muted' }}
            />
            <div className="version-diff">
              <div className="version-diff-row">
                <span>餐桌</span>
                <b>
                  {product(v3.productId).name} → {product(rightProductId).name}
                </b>
              </div>
              <div className="version-diff-row">
                <span>桌面</span>
                <b>
                  {leftDims.l} × {leftDims.w} cm → {rightDims.l} × {rightDims.w} cm
                </b>
              </div>
              <div className="version-diff-row">
                <span>已知合计</span>
                <b>
                  {money(v3.known)} → {money(rightKnown)}
                </b>
              </div>
              <div className="version-diff-row is-muted">
                <span>安装费</span>
                <b>两版均待确认 · 未计入</b>
              </div>
              <div className="version-diff-note">
                <CheckOutlined />{' '}
                {rightRestored
                  ? '撤销记录：餐桌与占地恢复到 v3，v4 的历史仍保留'
                  : rightDims.l === leftDims.l && rightDims.w === leftDims.w
                    ? '占地与 v3 一致 · 只有价格或材质变化'
                    : `占地随 ${leftDims.l}×${leftDims.w} → ${rightDims.l}×${rightDims.w} 实际缩小`}
              </div>
            </div>
            <MiniSnapshot
              title={rightIsCandidate ? '候选预览' : rightRestored ? `C v${rightSnapshot.version} · 已撤销` : `C v${rightSnapshot.version}`}
              subtitle={
                rightIsCandidate
                  ? `${product(rightProductId).name} · 预计 ${money(rightKnown)} · 未应用`
                  : `${rightSnapshot.reason} · ${money(rightKnown)}`
              }
              objects={rightObjects}
              productId={rightProductId}
              badge={
                rightIsCandidate
                  ? { label: '未应用', tone: 'info' }
                  : { label: state.version === rightSnapshot.version ? '当前' : '历史', tone: 'teal-soft' }
              }
            />
          </div>
        )}
      </div>

      <div className="compare-footer">
        <div className="compare-note">
          <span className="compare-note-icon">
            <BulbOutlined />
          </span>
          <div className="compare-note-copy">
            <span>选择依据与生活权衡</span>
            <Input.TextArea
              value={state.ui.compareNote}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onChange={(e) => actions.setCompareNote(e.target.value)}
            />
          </div>
        </div>
        <div className="compare-actions">
          <button className="ghost-btn" data-testid="save-decision-note" onClick={saveDecisionNote}>
            <FileTextOutlined /> 保存为决策笔记
          </button>
          <button className="ghost-btn" onClick={() => actions.setView('space')}>
            返回空间微调
          </button>
          {state.version > 3 && !previewId && (
            <span className="current-version-chip" data-testid="current-version-chip">
              <CheckCircleFilled /> 当前正式版本 C v{state.version}
            </span>
          )}
          <button
            className="primary-btn"
            data-testid="compare-apply"
            onClick={() =>
              state.version > 3 && !previewId
                ? actions.setView('budget')
                : applyCta()
            }
          >
            {ctaLabel} <ArrowRightOutlined />
          </button>
        </div>
      </div>
    </section>
  );
}
