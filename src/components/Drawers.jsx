import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Drawer, Input, Modal, Popconfirm, Switch, Timeline } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AGENT_STAGE_DEFS, PRESERVE_ITEMS, ROOM_FACTS, SCHEMES } from '../data/catalog.js';
import { DECISION_REASONS, NOTE_KINDS } from '../data/inspiration.js';
import {
  dimsOf,
  knownTotal,
  money,
  product,
  tableOf,
  timeLabel,
} from '../core/engine.js';
import { Chip } from './ui.jsx';

const drawerProps = (open, onClose, width = 520) => ({
  open,
  onClose,
  width,
  placement: 'right',
  className: 'dh-drawer',
  destroyOnClose: true,
  maskClosable: true,
  keyboard: true,
});

function Section({ title, hint, children }) {
  return (
    <section className="drawer-section">
      <div className="drawer-section-head">
        <h4>{title}</h4>
        {hint && <span>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/* ---------- 快速笔记编辑器 / 笔记查看（决策笔记链路） ---------- */

function NoteEditorDrawer({ state, actions }) {
  const prefill = state.ui.noteEditor;
  const open = !!prefill;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');
  const [draftLabel, setDraftLabel] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (open && prefill) {
      const defaultTitle =
        prefill.title ||
        (prefill.type === 'decision'
          ? `餐桌替换决策 · ${prefill.context?.leftLabel || 'C v3'} → ${prefill.context?.rightLabel || '候选'}`
          : prefill.type === 'scheme'
            ? `方案笔记 · 餐办共用 C v${state.version}`
            : '');
      setTitle(defaultTitle);
      setBody(prefill.body || '');
      setReason(prefill.reason || '');
      setDraftLabel('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const markDraft = (setter, value) => {
    setter(value);
    if (timer.current) clearTimeout(timer.current);
    setDraftLabel('保存草稿中…');
    timer.current = setTimeout(() => setDraftLabel('草稿已保存到本机'), 650);
  };

  const save = () => {
    const note = {
      id: prefill?.id,
      type: prefill?.type || 'idea',
      title: title.trim() || '未命名笔记',
      body: body.trim(),
      reason: reason || null,
      context: prefill?.context || null,
    };
    actions.saveNote(note);
  };

  return (
    <Drawer
      open={open}
      onClose={actions.closeNoteEditor}
      width={480}
      className="dh-drawer note-editor-drawer"
      title={
        <div className="drawer-title">
          <span>{prefill?.type === 'decision' ? '保存为决策笔记' : prefill?.type === 'scheme' ? '生成方案笔记' : '写笔记'}</span>
          <Chip tone="muted">自动附带上下文</Chip>
        </div>
      }
      footer={
        <div className="note-editor-footer">
          <span className={`draft-state ${draftLabel ? 'is-on' : ''}`}>{draftLabel || '草稿自动保存到本机'}</span>
          <button className="ghost-btn" onClick={actions.closeNoteEditor}>
            取消
          </button>
          <button className="primary-btn" data-testid="note-save" onClick={save}>
            <CheckOutlined /> 保存到项目笔记
          </button>
        </div>
      }
    >
      {prefill?.type === 'decision' && prefill.context && (
        <div className="note-context-card">
          <div className="note-context-head">
            <FileTextOutlined /> 自动附带的对比信息
          </div>
          <div className="note-context-rows">
            <div>
              <span>对比版本</span>
              <b>{prefill.context.summary}</b>
            </div>
            {prefill.context.productSummary && (
              <div>
                <span>餐桌</span>
                <b>{prefill.context.productSummary}</b>
              </div>
            )}
            {prefill.context.priceSummary && (
              <div>
                <span>费用</span>
                <b>{prefill.context.priceSummary}</b>
              </div>
            )}
          </div>
          <div className="note-reason-chips">
            {DECISION_REASONS.map((item) => (
              <button
                key={item}
                className={reason === item ? 'is-on' : ''}
                onClick={() => setReason(reason === item ? '' : item)}
              >
                {reason === item && <CheckOutlined />} {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <label className="note-field">
        <span>标题</span>
        <Input value={title} onChange={(e) => markDraft(setTitle, e.target.value)} placeholder="例如：餐桌替换决策" maxLength={60} />
      </label>
      <label className="note-field">
        <span>
          正文 <i>{body.length}/800</i>
        </span>
        <Input.TextArea
          value={body}
          onChange={(e) => markDraft(setBody, e.target.value)}
          autoSize={{ minRows: 5, maxRows: 12 }}
          maxLength={800}
          placeholder="写下选择理由、保留条件或还想确认的事情…"
        />
      </label>
      <div className="drawer-note">
        <InfoCircleOutlined />
        <span>
          笔记会引用保存时的方案版本；之后方案继续变化，不会悄悄改写历史笔记。可以从版本历史或笔记页互相返回。
        </span>
      </div>
    </Drawer>
  );
}

function NoteViewerDrawer({ state, actions }) {
  const noteId = state.ui.noteViewer;
  const note = state.notes.find((n) => n.id === noteId) || null;
  const kind = note ? NOTE_KINDS[note.type] || NOTE_KINDS.idea : null;
  return (
    <Drawer
      open={!!note}
      onClose={actions.closeNoteViewer}
      width={480}
      className="dh-drawer note-viewer-drawer"
      title={
        <div className="drawer-title">
          <span>{note?.title || '笔记'}</span>
          {kind && <Chip tone={kind.tone}>{kind.label}</Chip>}
        </div>
      }
    >
      {note && (
        <>
          <div className="note-viewer-meta">
            <span>{timeLabel(note.createdAt)} · 本机保存</span>
            {note.reason && <Chip tone="teal-soft">{note.reason}</Chip>}
          </div>
          <p className="note-viewer-body">{note.body || '（无正文）'}</p>
          {note.context && (
            <div className="note-context-card">
              <div className="note-context-head">
                <FileTextOutlined /> 关联的方案上下文
              </div>
              <div className="note-context-rows">
                <div>
                  <span>关联</span>
                  <b>{note.context.summary}</b>
                </div>
                {note.context.productSummary && (
                  <div>
                    <span>餐桌</span>
                    <b>{note.context.productSummary}</b>
                  </div>
                )}
                {note.context.priceSummary && (
                  <div>
                    <span>费用</span>
                    <b>{note.context.priceSummary}</b>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="drawer-actions note-viewer-actions">
            {note.context?.view === 'compare' && (
              <button
                className="primary-btn"
                onClick={() => {
                  actions.setCompareVersion(note.context.rightVersion || null);
                  actions.closeNoteViewer();
                  actions.setView('compare');
                }}
              >
                回到当时的对比 <ArrowRightOutlined />
              </button>
            )}
            <button
              className="ghost-btn"
              onClick={() => {
                actions.closeNoteViewer();
                actions.setView('space');
              }}
            >
              回到空间
            </button>
            <Popconfirm
              title="删除这篇笔记？"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => actions.removeNote(note.id)}
            >
              <Button danger>删除</Button>
            </Popconfirm>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function Drawers({ state, actions, table, currentProduct, stale }) {
  const { ui, agent } = state;
  const open = (name) => ui.drawer === name;
  const close = actions.closeDrawer;
  const known = knownTotal(state.objects);
  const canUndo = state.undoStack.some((op) => !op.undone);
  const results = agent.results;
  const run = agent.run;

  const downloadJSON = () => {
    const payload = {
      demo: 'Dream House · 方案协同 Agent',
      exportedAt: new Date().toISOString(),
      scheme: `C v${state.version}`,
      known: money(known),
      objects: state.objects,
      snapshots: state.snapshots,
      events: state.events,
      note: '概念演示数据；商品、价格与空间均为示例。',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-house-C-v${state.version}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    actions.showToast('已导出当前方案 JSON。', { tone: 'success' });
  };

  const historyContent = (
    <>
      <div className="drawer-intro">
        <p>
          保存版本单调增长：应用生成 C v4，撤销生成 C v5。恢复记录不会删除旧版本，也不会覆盖应用后的
          其他位置调整。
        </p>
      </div>
      <Section title="版本链" hint={`${state.snapshots.length} 个保存版本`}>
        <Timeline className="version-timeline">
          {[...state.snapshots].reverse().map((snapshot) => (
            <Timeline.Item
              key={snapshot.version}
              dot={
                snapshot.version === state.version ? (
                  <span className="timeline-dot is-current" />
                ) : (
                  <span className="timeline-dot" />
                )
              }
            >
              <div className="timeline-card">
                <div className="timeline-head">
                  <b>{snapshot.label}</b>
                  {snapshot.version === state.version && <Chip tone="teal-soft">当前</Chip>}
                  <span className="timeline-time">{timeLabel(snapshot.time)}</span>
                </div>
                <p>{snapshot.reason}</p>
                <div className="timeline-meta">
                  <span>餐桌 {product(snapshot.productId).name}</span>
                  <span>已知 {money(snapshot.known)}</span>
                  <span>{snapshot.objects.length} 个对象</span>
                </div>
                {snapshot.version > 3 && (
                  <button
                    className="link-inline"
                    onClick={() => {
                      actions.setCompareVersion(snapshot.version);
                      actions.setView('compare');
                    }}
                  >
                    在对比中查看 <ArrowRightOutlined />
                  </button>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      {canUndo && (
        <div className="drawer-callout">
          <WarningOutlined />
          <div>
            <b>撤销只回退本次替换</b>
            <p>若餐桌型号后来又被修改，会先说明冲突，不无条件写回旧快照。</p>
          </div>
          <Button
            danger
            onClick={() => {
              actions.undoReplacement();
              close();
            }}
          >
            <UndoOutlined /> 撤销本次替换
          </Button>
        </div>
      )}

      <Section title="操作记录" hint="最近 8 条">
        <Timeline className="event-timeline">
          {state.events.slice(0, 8).map((event) => (
            <Timeline.Item key={event.id}>
              <div className="event-row">
                <span className={`event-type type-${event.type}`}>{event.type}</span>
                <b>{event.label}</b>
                <span className="event-time">{timeLabel(event.time)}</span>
              </div>
              {event.detail && <p className="event-detail">{event.detail}</p>}
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>
    </>
  );

  const briefContent = (
    <>
      <div className="brief-hero">
        <span className="eyebrow">项目依据 · 梧桐里</span>
        <h3>两人日常用餐，兼顾偶尔轻办公。</h3>
        <p>
          89㎡住宅，客厅约 24.6㎡。本次只处理餐桌替换，其余硬装、家具与布局保持现状。
        </p>
        <div className="brief-chips">
          <Chip tone="ok">已核对</Chip>
          <Chip tone="muted">概念演示数据</Chip>
        </div>
      </div>
      <Section title="空间事实">
        <div className="drawer-kv">
          {ROOM_FACTS.map((fact) => (
            <div key={fact.key}>
              <span>{fact.key}</span>
              <b>{fact.value}</b>
              <i>{fact.note}</i>
            </div>
          ))}
        </div>
      </Section>
      <Section title="本次任务">
        <div className="drawer-kv">
          <div>
            <span>作用对象</span>
            <b>餐桌 · table-01</b>
            <i>对象实例 ID 在替换前后保持不变</i>
          </div>
          <div>
            <span>动作</span>
            <b>局部替换</b>
            <i>不生成全屋方案，不改其他物品</i>
          </div>
          <div>
            <span>预算口径</span>
            <b>¥10,000</b>
            <i>含新增家具、软装、配送与相关安装</i>
          </div>
          <div>
            <span>未知项</span>
            <b>安装费待报价</b>
            <i>未计入已知合计，也不称为可用余额</i>
          </div>
        </div>
      </Section>
      <Section title="保留条件">
        <ul className="drawer-list">
          {PRESERVE_ITEMS.map((item) => (
            <li key={item.id}>
              <LockOutlined />
              <span>
                <b>{item.label}</b>
                <i>{item.note}</i>
              </span>
            </li>
          ))}
        </ul>
      </Section>
      <div className="drawer-note">
        <InfoCircleOutlined />
        <span>
          保留沙发不自动等于锁定沙发位置；允许在西区微移。窗口进深仍待补测，不把推测写成实测。
        </span>
      </div>
    </>
  );

  const evidenceContent = (
    <>
      <div className="evidence-meta">
        <div>
          <span>请求</span>
          <b>{run?.requestId || '—'}</b>
        </div>
        <div>
          <span>模式</span>
          <b>本地规则引擎 · 不联网</b>
        </div>
        <div>
          <span>依据</span>
          <b>
            C v{state.version} · 需求修订 {state.briefRevision}
          </b>
        </div>
      </div>

      <div className="drawer-note">
        <InfoCircleOutlined />
        <span>
          这里展示任务状态、采用依据与核对结果，不是模型的隐藏思维过程。所有金额与几何由程序计算。
        </span>
      </div>

      <Section title="阶段与工具">
        <div className="evidence-stages">
          {(run?.stages || AGENT_STAGE_DEFS.map((d) => ({ ...d, status: 'waiting' }))).map((stage, i) => (
            <div className={`evidence-stage is-${stage.status}`} key={stage.key}>
              <div className="evidence-stage-head">
                <span className="evidence-index">{stage.status === 'done' ? <CheckOutlined /> : i + 1}</span>
                <b>{stage.title}</b>
                <code>{stage.tool}</code>
                <span className="evidence-status">
                  {stage.status === 'done' ? '完成' : stage.status === 'running' ? '进行中' : '未执行'}
                </span>
              </div>
              {stage.result && <p className="evidence-result">{stage.result}</p>}
              {stage.details?.length > 0 && (
                <ul>
                  {stage.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      {agent.intent && (
        <Section title="采用的意图字段">
          <div className="evidence-fields">
            <div>
              <span>对象</span>
              <b>table-01 · 餐桌</b>
            </div>
            <div>
              <span>长 / 宽</span>
              <b>
                ≥ {agent.intent.minLength ?? '—'} / ≥ {agent.intent.minWidth ?? '—'} cm
              </b>
            </div>
            <div>
              <span>单价上限</span>
              <b>{agent.intent.maxPrice ? money(agent.intent.maxPrice * 100) : '未设置'}</b>
            </div>
            <div>
              <span>保留</span>
              <b>沙发、地板、其他布局</b>
            </div>
            <div>
              <span>可妥协</span>
              <b>{agent.intent.allowSmaller ? '桌面可以略小（已确认下限）' : '无'}</b>
            </div>
            <div>
              <span>目标</span>
              <b>价格更低 · 浅木色</b>
            </div>
          </div>
        </Section>
      )}

      {results?.excluded?.length > 0 && (
        <Section title="排除依据" hint={`${results.excluded.length} 款`}>
          {results.excluded.map((row) => (
            <div className="evidence-excluded" key={row.productId}>
              <div>
                <b>{row.product.name}</b>
                <span>{money(row.product.price)}</span>
              </div>
              <ul>
                {row.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      <Section title="操作记录">
        <Timeline className="event-timeline">
          {state.events.slice(0, 6).map((event) => (
            <Timeline.Item key={event.id}>
              <div className="event-row">
                <span className={`event-type type-${event.type}`}>{event.type}</span>
                <b>{event.label}</b>
                <span className="event-time">{timeLabel(event.time)}</span>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>
    </>
  );

  const reference = ['A', 'B'].find((id) => open(`reference-${id}`))
    ? SCHEMES[['A', 'B'].find((id) => open(`reference-${id}`))]
    : null;
  const referenceContent = reference && (
    <>
      <div className="reference-hero">
        <img src={reference.image} alt={`${reference.name} 示例渲染`} />
        <div className="reference-hero-copy">
          <span className="eyebrow">
            SCHEME {reference.letter} · V{reference.version}
          </span>
          <h3>{reference.name}</h3>
          <p>{reference.tagline}</p>
          <div className="reference-price">
            {money(reference.price)}
            <span>距上限 {money(1000000 - reference.price)}</span>
          </div>
        </div>
      </div>
      <Section title="方向要点">
        <div className="drawer-kv">
          {reference.facts.map((fact) => (
            <div key={fact.key}>
              <span>{fact.key}</span>
              <b>{fact.value}</b>
            </div>
          ))}
        </div>
      </Section>
      <div className="drawer-note">
        <LockOutlined />
        <span>
          这是可查看的参考方向，不开放编辑。你的候选提案仍绑定 C；切换到这里不会预览或应用 C 的候选。
        </span>
      </div>
      <div className="drawer-actions">
        <Button onClick={close}>关闭</Button>
        <Button
          type="primary"
          onClick={() => {
            actions.setView('compare');
            close();
          }}
        >
          在对比中查看 <ArrowRightOutlined />
        </Button>
      </div>
    </>
  );

  const inspirationContent = (
    <>
      <div className="inspiration-hero">
        <img src={`${import.meta.env.BASE_URL}img/material-ref.jpg`} alt="木作与自然光材质参考" />
        <div className="inspiration-overlay">
          <span>材质与光</span>
          <b>白蜡木 / 亚麻 / 陶土</b>
        </div>
      </div>
      <Section title="美拉德配色" hint="概念演示色板">
        <div className="palette-grid">
          {[
            ['Creamy Latte', '#F3E9D7', '暖白底'],
            ['Caramel Roast', '#B08968', '焦糖点缀'],
            ['Mocha Bean', '#7A553A', '次级面'],
            ['Warm Cappuccino', '#D6BFA6', '分隔与边界'],
            ['Espresso Shot', '#3B2A22', '主文字与行动'],
          ].map(([name, hex, usage]) => (
            <div className="palette-card" key={hex}>
              <span className="palette-swatch" style={{ background: hex }} />
              <b>{name}</b>
              <code>{hex}</code>
              <i>{usage}</i>
            </div>
          ))}
        </div>
      </Section>
      <Section title="使用规则">
        <ul className="drawer-list plain">
          <li>暖白背景、深棕文字与按钮，奶油米与焦糖只做分层。</li>
          <li>青绿只用于“当前对象与占地”，蓝色只用于“候选未应用”。</li>
          <li>状态色停留在相关位置，不把工作台变成多彩控制台。</li>
          <li>数字使用等宽数字，关键金额不靠颜色单独表达。</li>
        </ul>
      </Section>
      <div className="drawer-note">
        <ExperimentOutlined />
        <span>色板来自项目既有视觉资产；本 Demo 未重新做完整的可访问性审计。</span>
      </div>
    </>
  );

  const settingsContent = (
    <>
      <div className="drawer-intro">
        <p>
          当前以“本地规则演示”运行：意图识别、筛选、计价与几何校验在本机完成，不调用真实模型，也不联网搜价。
        </p>
      </div>
      <Section title="运行模式">
        <div className="mode-card">
          <span className="mode-card-icon">
            <ThunderboltOutlined />
          </span>
          <div>
            <b>本地规则演示</b>
            <p>支持明确尺寸、预算与浅木色条件；自由语言的理解范围有限，不假装实时推理。</p>
          </div>
          <Chip tone="ok">当前</Chip>
        </div>
        <div className="mode-card is-off">
          <span className="mode-card-icon">
            <ExperimentOutlined />
          </span>
          <div>
            <b>真实模型</b>
            <p>未接入密钥与工具代理，本版本不提供；不会静默切换模式。</p>
          </div>
          <Chip tone="muted">未接入</Chip>
        </div>
      </Section>
      <Section title="视图与显示">
        <div className="switch-row">
          <div>
            <b>10cm 网格吸附</b>
            <span>拖动与数值调整使用同一坐标</span>
          </div>
          <Switch checked={state.ui.grid} onChange={actions.toggleGrid} />
        </div>
        <div className="switch-row">
          <div>
            <b>尺寸标注</b>
            <span>显示长、宽与占地</span>
          </div>
          <Switch checked={state.ui.dims} onChange={actions.toggleDims} />
        </div>
      </Section>
      <Section title="键盘与焦点">
        <div className="shortcut-list">
          <div><kbd>⌘ / Ctrl</kbd><kbd>K</kbd><span>搜索与跳转</span></div>
          <div><kbd>← ↑ ↓ →</kbd><span>餐桌每次移动 10cm</span></div>
          <div><kbd>R</kbd><span>旋转餐桌 90°</span></div>
          <div><kbd>Esc</kbd><span>关闭当前浮层</span></div>
        </div>
      </Section>
      <Section title="界面视觉规范">
        <div className="data-row">
          <div>
            <b>美拉德色板与使用规则</b>
            <span>品牌色、状态色与可读性说明，来自项目视觉资产。</span>
          </div>
          <button className="soft-btn" onClick={() => actions.openDrawer('inspiration')}>
            打开视觉规范 <ArrowRightOutlined />
          </button>
        </div>
      </Section>
      <Section title="数据">
        <div className="data-row">
          <div>
            <b>本机保存</b>
            <span>工作副本与保存版本存在当前浏览器 localStorage。</span>
          </div>
          <button className="soft-btn" onClick={downloadJSON}>
            <DownloadOutlined /> 导出 JSON
          </button>
        </div>
        <div className="data-row">
          <div>
            <b>重置演示</b>
            <span>回到 C v3 起点，清除本机保存与历史。</span>
          </div>
          <button className="danger-ghost-btn" onClick={() => actions.openDrawer('reset')}>
            <ReloadOutlined /> 重置
          </button>
        </div>
      </Section>
      <div className="drawer-note">
        <InfoCircleOutlined />
        <span>
          商品、价格、材质与空间均为虚构示例；安装费未知；几何检查只覆盖边界与部分遮挡，不代表施工或通行合规。
        </span>
      </div>
    </>
  );

  const guideSteps = [
    {
      id: 'start',
      title: '从 C v3 开始',
      desc: '在自由画布选择餐办共用 C v3，进入空间；食桌已被选中，右侧显示真实规格与约束。',
      done: true,
    },
    {
      id: 'input',
      title: '选择输入方式',
      desc: '点击「寻找更合适的替代」，使用模板或示例填入一句可编辑的话。示例只填入，不执行。',
      done: agent.phase !== 'idle',
    },
    {
      id: 'review',
      title: '核对识别摘要',
      desc: '修改硬条件，确认保留项与可妥协项；待确认项必须回答后才能继续。',
      done: ['review', 'running', 'ready', 'preview', 'empty', 'applied', 'undone'].includes(agent.phase),
    },
    {
      id: 'run',
      title: '观察渐进式执行',
      desc: 'L1 阶段、L2 关键结果立即出现，L3 依据按需展开；失败与取消都有真实状态。',
      done: !!agent.run?.finishedAt || !!results,
    },
    {
      id: 'preview',
      title: '切换候选并预览',
      desc: '对比规格、通道与费用；预览只改工作副本，正式金额仍为 C v3。',
      done: !!agent.previewId || state.version > 3,
    },
    {
      id: 'apply',
      title: '应用并定位清单',
      desc: '应用生成 C v4；在商品预算里保留 table-01 行并高亮，回到空间仍是同一对象。',
      done: state.version > 3,
    },
    {
      id: 'undo',
      title: '对比与撤销',
      desc: '对照 C v3 与 C v4 的几何和金额；撤销生成 C v5，只回退餐桌替换。',
      done: state.snapshots.some((s) => s.reason?.includes('撤销')),
    },
    {
      id: 'stale',
      title: '异常保护（可选 B 段）',
      desc: '在候选就绪后移动餐桌，候选标记过期；重新校验保留新位置，再预览应用。',
      done: state.events.some((e) => e.type === 'manual' && e.label?.includes('餐桌')),
    },
  ];
  const currentStep = guideSteps.find((step) => !step.done);

  return (
    <>
      <NoteEditorDrawer state={state} actions={actions} />
      <NoteViewerDrawer state={state} actions={actions} />
      <Drawer
        {...drawerProps(open('history'), close, 560)}
        title={
          <div className="drawer-title">
            <span>版本历史</span>
            <Chip tone="muted">C v{state.version}</Chip>
          </div>
        }
      >
        {historyContent}
      </Drawer>

      <Drawer
        {...drawerProps(open('brief'), close, 520)}
        title={
          <div className="drawer-title">
            <span>项目依据</span>
            <Chip tone="ok">已核对</Chip>
          </div>
        }
      >
        {briefContent}
        <div className="drawer-actions">
          <Button onClick={close}>关闭</Button>
          <Button
            type="primary"
            onClick={() => {
              actions.setView('space');
              close();
            }}
          >
            回到空间 <ArrowRightOutlined />
          </Button>
        </div>
      </Drawer>

      <Drawer
        {...drawerProps(open('evidence'), close, 560)}
        title={
          <div className="drawer-title">
            <span>执行依据与记录</span>
            <Chip tone="muted">L3 详细依据</Chip>
          </div>
        }
      >
        {evidenceContent}
      </Drawer>

      <Drawer
        {...drawerProps(open('inspiration'), close, 520)}
        title={
          <div className="drawer-title">
            <span>界面视觉规范</span>
            <Chip tone="muted">美拉德色板</Chip>
          </div>
        }
      >
        {inspirationContent}
      </Drawer>

      <Drawer
        {...drawerProps(!!reference, close, 520)}
        title={
          <div className="drawer-title">
            <span>方案方向 · {reference?.name || ''}</span>
            <Chip tone="muted">只读参考</Chip>
          </div>
        }
      >
        {referenceContent}
      </Drawer>

      <Drawer
        {...drawerProps(open('settings'), close, 520)}
        title={
          <div className="drawer-title">
            <span>演示设置</span>
            <Chip tone="muted">v0.9</Chip>
          </div>
        }
      >
        {settingsContent}
      </Drawer>

      <Drawer
        {...drawerProps(open('export'), close, 420)}
        title={
          <div className="drawer-title">
            <span>导出方案</span>
            <Chip tone="muted">JSON</Chip>
          </div>
        }
      >
        <div className="drawer-intro">
          <p>导出当前工作对象、保存版本与操作记录，便于复盘或换机继续。文件只包含示例数据。</p>
        </div>
        <Section title="将包含">
          <ul className="drawer-list plain">
            <li>当前对象与位置（{state.objects.length} 个）</li>
            <li>{state.snapshots.length} 个保存版本</li>
            <li>最近 {Math.min(120, state.events.length)} 条操作记录</li>
            <li>正式版本 C v{state.version} · 已知合计 {money(known)}</li>
          </ul>
        </Section>
        <div className="drawer-actions">
          <Button onClick={close}>取消</Button>
          <Button type="primary" onClick={downloadJSON}>
            <DownloadOutlined /> 下载 JSON
          </Button>
        </div>
      </Drawer>

      <Drawer
        {...drawerProps(ui.guideOpen, () => actions.setGuideOpen(false), 560)}
        title={
          <div className="drawer-title">
            <span>演示指引</span>
            <Chip tone="muted">A 段 3.5–4 分钟</Chip>
          </div>
        }
      >
        <div className="guide-intro">
          <p>
            主线聚焦一次完整局部修改：说清条件 → 核对理解 → 渐进执行 → 预览候选 → 应用 C v4 →
            对比与撤销。B 段单独演示候选过期与重新校验。
          </p>
          <div className="guide-mode">
            <span className="mode-dot" /> 本地规则演示 · 不联网、不伪装实时模型
          </div>
        </div>
        <div className="guide-steps">
          {guideSteps.map((step, index) => (
            <div
              className={`guide-step ${step.done ? 'is-done' : ''} ${currentStep?.id === step.id ? 'is-current' : ''}`}
              key={step.id}
            >
              <span className="guide-index">
                {step.done ? <CheckOutlined /> : String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <b>{step.title}</b>
                <p>{step.desc}</p>
              </div>
              {currentStep?.id === step.id && <span className="guide-now">现在</span>}
            </div>
          ))}
        </div>
        <div className="guide-extras">
          <div className="guide-extras-title">
            <ThunderboltOutlined /> 本轮新增的两条链路
          </div>
          <div className="guide-extra">
            <b>链路 A · 灵感进入方案</b>
            <p>
              灵感 → 案例详情 → 勾选「提取设计要素」→ 生成修改要求 → 进入同一套摘要确认、候选预览与应用流程。
            </p>
          </div>
          <div className="guide-extra">
            <b>链路 B · 决策笔记与版本回溯</b>
            <p>
              方案对比 → 「保存为决策笔记」→ 自动附带版本、餐桌与费用差异 → 在灵感「我的笔记」中找回，并跳回当时的对比。
            </p>
          </div>
        </div>
        <div className="guide-foot">
          <button className="soft-btn" onClick={() => actions.setView('space')}>
            <ArrowRightOutlined /> 回到空间
          </button>
          <button className="danger-ghost-btn" onClick={() => actions.openDrawer('reset')}>
            <ReloadOutlined /> 重置演示
          </button>
        </div>
      </Drawer>

      <Modal
        open={open('reset')}
        title="重置演示到 C v3？"
        okText="重置并回到起点"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onCancel={close}
        onOk={() => {
          actions.resetDemo();
          close();
          actions.setView('home');
          actions.setGuideOpen(false);
        }}
        className="dh-modal"
      >
        <div className="modal-copy">
          <p>会清除当前浏览器保存的工作副本、C v4 / v5 版本与操作记录。</p>
          <p className="modal-warn">
            <ExclamationCircleOutlined /> 演示数据可随时重置；如果你已导出 JSON，之后可以重新导入复盘。
          </p>
        </div>
      </Modal>
    </>
  );
}
