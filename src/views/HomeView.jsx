import React from 'react';
import { Progress, Tag, Timeline, Tooltip } from 'antd';
import {
  AimOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CompassOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { ROOM } from '../data/catalog.js';
import { INSPIRATIONS, NOTE_KINDS } from '../data/inspiration.js';
import { knownTotal, money, product, tableOf, timeLabel } from '../core/engine.js';
import { Chip, ObjectIcon } from '../components/ui.jsx';

function RoomCard({ active, name, thumb, status, note, actions }) {
  const card = (
    <button
      className={`home-room-card ${active ? 'is-active' : 'is-planned'}`}
      onClick={active ? () => actions.setView('space') : undefined}
      data-testid={active ? 'home-room-living' : undefined}
    >
      <div className="home-room-thumb">
        {thumb ? (
          <img src={thumb} alt={`${name} 空间示例`} draggable={false} />
        ) : (
          <div className="home-room-sketch">
            <span className="sketch-door" />
            <span className="sketch-bed" />
            <span className="sketch-window" />
          </div>
        )}
        <span className="home-room-area">{active ? '约 24.6㎡' : '未录入'}</span>
      </div>
      <div className="home-room-body">
        <div className="home-room-title">
          <b>{name}</b>
          {active ? <Chip tone="teal-soft">进行中</Chip> : <Chip tone="muted">概念占位</Chip>}
        </div>
        <p>{active ? status : note}</p>
        {active && (
          <span className="home-room-cta">
            进入空间 <ArrowRightOutlined />
          </span>
        )}
      </div>
    </button>
  );
  return active ? card : (
    <Tooltip title="房间录入与多房间方案在后续版本开放；本轮聚焦客厅的一次局部修改。">
      {card}
    </Tooltip>
  );
}

export function HomeView({ state, actions, known }) {
  const table = tableOf(state.objects);
  const currentProduct = product(table.productId);
  const knownValue = knownTotal(state.objects);
  const pct = Math.min(100, Math.round((knownValue / 1000000) * 100));
  const latest = state.snapshots[state.snapshots.length - 1];
  const { agent } = state;
  const notes = state.notes;
  const favorites = state.favorites;
  const inspiration = INSPIRATIONS;

  const phaseSummary = () => {
    if (agent.previewId) {
      return {
        title: `候选 ${product(agent.previewId).name} 正在预览`,
        text: '正式方案未变；可以切换候选或直接应用。',
        action: { label: '回到候选', view: 'space' },
        tone: 'info',
      };
    }
    if (agent.phase === 'running') {
      return {
        title: '任务执行中',
        text: '正在按确认的条件检索与校验，完成后会自动预览最符合的候选。',
        action: { label: '查看进度', view: 'space' },
        tone: 'teal',
      };
    }
    if (agent.phase === 'applied' || (state.version > 3 && !agent.proposal)) {
      return {
        title: `当前正式版本 C v${state.version}`,
        text: `餐桌 ${currentProduct.name} · 已知合计 ${money(knownValue)} · 安装费仍待确认。`,
        action: { label: '查看修改对比', view: 'compare' },
        tone: 'ok',
      };
    }
    if (agent.proposal && ['ready', 'preview'].includes(agent.phase) && !agent.previewId) {
      return {
        title: '候选已就绪',
        text: '还有一组候选在等你确认，输入与条件都保留着。',
        action: { label: '回到候选', view: 'space' },
        tone: 'info',
      };
    }
    return {
      title: '从一张餐桌开始',
      text: `客厅里有 ${state.objects.length} 件物品；只有餐桌开放本次替换。选中它，说清条件，再看候选。`,
      action: { label: '进入空间编辑', view: 'space' },
      tone: 'teal',
    };
  };

  const summary = phaseSummary();
  const recentEvents = state.events.slice(0, 4);

  return (
    <section className="view home-view">
      <div className="home-scroll">
        <div className="home-inner">
          {/* Hero */}
          <div className="home-hero">
            <div className="home-hero-copy">
              <div className="eyebrow">我的家 · 梧桐里</div>
              <h1>客厅里的一张桌子，<br />值得慢慢决定。</h1>
              <p className="home-hero-sub">
                89㎡ 住宅里的客厅约 {ROOM.area}㎡。保留沙发与地板，让 AI 只推进一处局部修改：
                说清条件、核对理解、预览影响，最后再由你决定是否应用。
              </p>
              <div className="home-hero-actions">
                <button className="primary-btn" data-testid="home-enter-space" onClick={() => actions.setView('space')}>
                  进入客厅方案 <ArrowRightOutlined />
                </button>
                <button className="ghost-btn" onClick={() => actions.setView('budget')}>
                  <ShoppingOutlined /> 查看预算
                </button>
                <button className="ghost-btn" onClick={() => actions.openDrawer('history')}>
                  <HistoryOutlined /> 版本历史
                </button>
              </div>
              <div className="home-hero-meta">
                <Chip tone="teal-soft">
                  <CheckCircleFilled /> 当前方案 餐办共用 C v{state.version}
                </Chip>
                <Chip tone="muted">工作副本已自动保存</Chip>
                <Chip tone="warn-soft">1 项安装费待确认</Chip>
              </div>
            </div>
            <div className="home-hero-visual">
              <img src="/img/room-c.jpg" alt="客厅示例渲染" draggable={false} />
              <span className="home-hero-scrim" />
              <div className="home-hero-flags">
                <span>客厅 · 约 24.6㎡</span>
                <span>西窗采光 · 阳台在侧</span>
                <span>保留沙发与原木地板</span>
              </div>
              <div className="home-hero-note">
                <InfoCircleOutlined /> 示例渲染 · 空间为几何模型，非实测
              </div>
            </div>
          </div>

          {/* 状态条 */}
          <div className="home-stats">
            <div className="home-stat">
              <span>已知合计</span>
              <b>{money(knownValue)}</b>
              <div className="budget-track big">
                <span className="budget-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="home-stat">
              <span>预算上限</span>
              <b>¥10,000</b>
              <i>距上限 {money(1000000 - knownValue)}</i>
            </div>
            <div className="home-stat is-warn">
              <span>待确认</span>
              <b>1 项</b>
              <button className="link-inline" onClick={() => actions.setView('budget')}>
                在清单中查看 <ArrowRightOutlined />
              </button>
            </div>
            <div className="home-stat">
              <span>房间对象</span>
              <b>{state.objects.length} 件</b>
              <i>仅餐桌开放本次替换</i>
            </div>
          </div>

          {/* 房间 */}
          <div className="home-section">
            <div className="home-section-head">
              <div>
                <span className="eyebrow">房间</span>
                <h2>这间屋子</h2>
              </div>
              <button className="link-inline" onClick={() => actions.setView('space')}>
                进入空间 <ArrowRightOutlined />
              </button>
            </div>
            <div className="home-rooms">
              <RoomCard
                active
                name="客厅"
                thumb="/img/room-a.jpg"
                status={`方案 C v${state.version} · 餐桌 ${currentProduct.name}`}
                actions={actions}
              />
              <RoomCard active={false} name="主卧" note="尚未录入 · 多房间规划在后续版本开放" actions={actions} />
              <RoomCard active={false} name="次卧" note="尚未录入 · 可先为客厅积累灵感" actions={actions} />
            </div>
          </div>

          {/* 继续任务 + 灵感笔记 */}
          <div className="home-columns">
            <div className="home-section home-continue">
              <div className="home-section-head">
                <div>
                  <span className="eyebrow">继续上次</span>
                  <h2>{summary.title}</h2>
                </div>
                <span className={`pulse-dot tone-${summary.tone}`} />
              </div>
              <p className="home-continue-text">{summary.text}</p>
              <button className="soft-btn" onClick={() => actions.setView(summary.view)}>
                {summary.action.label} <ArrowRightOutlined />
              </button>
              <div className="home-events">
                <div className="home-events-title">
                  <CompassOutlined /> 最近活动
                </div>
                <Timeline className="event-timeline home-timeline">
                  {recentEvents.map((event) => (
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
                <button className="link-inline" onClick={() => actions.openDrawer('history')}>
                  查看完整版本历史 <ArrowRightOutlined />
                </button>
              </div>
            </div>

            <div className="home-section home-side">
              <div className="home-section-head">
                <div>
                  <span className="eyebrow">灵感与决策</span>
                  <h2>收藏会进入方案</h2>
                </div>
                <button className="link-inline" data-testid="home-inspiration" onClick={() => actions.setView('inspiration')}>
                  去灵感 <ArrowRightOutlined />
                </button>
              </div>
              <div className="home-inspo-row">
                {inspiration.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    className="home-inspo-card"
                    onClick={() => {
                      actions.openInspirationDetail(item.id);
                    }}
                  >
                    <img src={item.cover} alt={item.title} draggable={false} />
                    <span>
                      <b>{item.title}</b>
                      <i>{item.tags.slice(0, 2).join(' · ')}</i>
                    </span>
                  </button>
                ))}
              </div>
              <div className="home-note-summary">
                <FileTextOutlined />
                <div>
                  <b>
                    {notes.length > 0
                      ? `项目笔记 ${notes.length} 篇，最近一篇：${notes[0].title}`
                      : '还没有项目笔记'}
                  </b>
                  <p>
                    {notes.length > 0
                      ? '决策笔记与当时的方案版本互相引用，可以随时回到那一刻的对比。'
                      : '在方案对比里“保存为决策笔记”，或在灵感里写一篇想法，都会沉淀到这里。'}
                  </p>
                </div>
                <button
                  className="soft-btn"
                  data-testid="home-notes"
                  onClick={() => {
                    actions.setInspirationTab(notes.length ? 'notes' : 'discover');
                    actions.setView('inspiration');
                  }}
                >
                  {notes.length ? '查看笔记' : '写一篇'} <ArrowRightOutlined />
                </button>
              </div>
              <div className="home-side-principle">
                <BulbOutlined />
                <span>这轮演示验证：可控的局部修改 · 跨视图联动 · 灵感如何进入方案。</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
