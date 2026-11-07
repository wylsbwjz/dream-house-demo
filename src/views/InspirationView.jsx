import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Drawer, Empty, Input, Tabs, Tooltip } from 'antd';
import {
  ArrowRightOutlined,
  BulbOutlined,
  CheckOutlined,
  CloseOutlined,
  CompassOutlined,
  EditOutlined,
  FileTextOutlined,
  HeartFilled,
  HeartOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  SelectOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { INSPIRATIONS } from '../data/inspiration.js';
import { timeLabel } from '../core/engine.js';
import { Chip } from '../components/ui.jsx';
import { NOTE_KINDS } from '../data/inspiration.js';

const { TabPane } = Tabs;

function InspirationCard({ item, state, actions }) {
  const isFavorite = state.favorites.includes(item.id);
  return (
    <article className="insp-card" data-testid={`insp-${item.id}`}>
      <button className="insp-cover" onClick={() => actions.openInspirationDetail(item.id)}>
        <img src={item.cover} alt={item.title} draggable={false} />
        <span className="insp-style">{item.style}</span>
      </button>
      <Tooltip title={isFavorite ? '取消收藏' : '收藏到灵感板'}>
        <button
          className={`insp-heart ${isFavorite ? 'is-on' : ''}`}
          data-testid={`fav-${item.id}`}
          onClick={(e) => {
            e.stopPropagation();
            actions.toggleFavorite(item.id);
          }}
          aria-label={isFavorite ? '取消收藏' : '收藏'}
        >
          {isFavorite ? <HeartFilled /> : <HeartOutlined />}
        </button>
      </Tooltip>
      <div className="insp-body">
        <h3 onClick={() => actions.openInspirationDetail(item.id)}>{item.title}</h3>
        <div className="insp-tags">
          {item.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} tone="muted">
              {tag}
            </Chip>
          ))}
        </div>
        <div className="insp-meta">
          <span>{item.space}</span>
          <span className="insp-budget">{item.budget}</span>
          <span className="insp-source">{item.source}</span>
        </div>
        <button className="insp-open" onClick={() => actions.openInspirationDetail(item.id)}>
          <ThunderboltOutlined /> 查看并提取设计要素 <ArrowRightOutlined />
        </button>
      </div>
    </article>
  );
}

function ExtractionDrawer({ state, actions }) {
  const itemId = state.ui.inspirationDetail;
  const item = INSPIRATIONS.find((i) => i.id === itemId) || null;
  const directCount = item ? item.elements.direct.length : 0;
  const chooseCount = item ? item.elements.choose.length : 0;
  const [selections, setSelections] = useState([]);

  useEffect(() => {
    if (item) {
      const initial = [];
      item.elements.direct.forEach((_, i) => initial.push(i));
      initial.push(directCount); // 需要选择里默认勾选第一项
      setSelections(initial);
    }
  }, [item, directCount]);

  const toggle = (index) => {
    setSelections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Drawer
      open={!!item}
      onClose={actions.closeInspirationDetail}
      width={540}
      className="dh-drawer insp-detail-drawer"
      title={
        <div className="drawer-title">
          <span>案例详情 · 灵感</span>
          <Chip tone="muted">示例内容</Chip>
        </div>
      }
      destroyOnClose
    >
      {item && (
        <>
          <div className="insp-detail-hero">
            <img src={item.cover} alt={item.title} />
            <div className="insp-detail-hero-copy">
              <span className="eyebrow">{item.source}</span>
              <h3>{item.title}</h3>
              <div className="insp-detail-meta">
                <Chip tone="muted">{item.space}</Chip>
                <Chip tone="muted">{item.budget} · 示例价格</Chip>
                <Chip tone="teal-soft">{item.style}</Chip>
              </div>
            </div>
          </div>

          <section className="drawer-section">
            <div className="drawer-section-head">
              <h4>案例说明</h4>
            </div>
            <p className="insp-summary">{item.summary}</p>
          </section>

          <section className="drawer-section">
            <div className="drawer-section-head">
              <h4>提取设计要素</h4>
              <span>勾选后会生成一句可核对的要求</span>
            </div>
            <div className="extract-group">
              <div className="extract-group-title">
                <CheckOutlined /> 可直接参考
              </div>
              {item.elements.direct.map((text, index) => (
                <label className="extract-row" key={text}>
                  <Checkbox
                    checked={selections.includes(index)}
                    onChange={() => toggle(index)}
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
            <div className="extract-group">
              <div className="extract-group-title">
                <SelectOutlined /> 需要你选择
              </div>
              {item.elements.choose.map((text, index) => (
                <label className="extract-row" key={text}>
                  <Checkbox
                    checked={selections.includes(directCount + index)}
                    onChange={() => toggle(directCount + index)}
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
            <div className="extract-group is-info">
              <div className="extract-group-title">
                <CompassOutlined /> 需要补测或确认
              </div>
              {item.elements.measure.map((text) => (
                <div className="extract-row" key={text}>
                  <InfoCircleOutlined />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="extract-group is-muted">
              <div className="extract-group-title">
                <CloseOutlined /> 无法从笔记确定
              </div>
              {item.elements.unknown.map((text) => (
                <div className="extract-row" key={text}>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <div className="extract-note">
              <BulbOutlined />
              <span>
                提取只生成“修改要求”，不直接改动方案：接下来仍要经过摘要确认、候选筛选与预览应用。
              </span>
            </div>
          </section>

          <div className="drawer-actions insp-detail-actions">
            <button
              className="ghost-btn"
              onClick={() => actions.toggleFavorite(item.id)}
              data-testid="insp-fav-detail"
            >
              {state.favorites.includes(item.id) ? <HeartFilled /> : <HeartOutlined />}
              {state.favorites.includes(item.id) ? '已收藏' : '收藏到灵感板'}
            </button>
            <button
              className="primary-btn"
              data-testid="insp-generate"
              onClick={() => actions.applyExtraction(item, selections)}
            >
              生成修改要求 <ArrowRightOutlined />
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function InspirationView({ state, actions }) {
  const [query, setQuery] = useState('');
  const tab = state.ui.inspirationTab;
  const favorites = state.favorites;
  const notes = state.notes;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INSPIRATIONS;
    return INSPIRATIONS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.style.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [query]);

  const favoriteItems = INSPIRATIONS.filter((item) => favorites.includes(item.id));

  return (
    <section className="view inspiration-view">
      <div className="inspiration-scroll">
        <div className="inspiration-head">
          <div>
            <div className="eyebrow">灵感 · 发现 / 收藏 / 我的笔记</div>
            <h1>把喜欢的东西，变成能核对的方案。</h1>
            <p>
              收藏不只是一张好看的图：从案例提取设计要素，进入现有的意图摘要与预览链路；
              对比结论也能沉淀为决策笔记，与当时的版本互相引用。
            </p>
          </div>
          <div className="inspiration-head-actions">
            <Input
              prefix={<SearchOutlined />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索风格、材质或案例…"
              allowClear
              className="insp-search"
            />
            <button
              className="primary-btn"
              onClick={() => actions.openNoteEditor({ type: 'idea', title: '', body: '' })}
            >
              <EditOutlined /> 写笔记
            </button>
          </div>
        </div>

        <Tabs
          activeKey={tab}
          onChange={actions.setInspirationTab}
          className="insp-tabs"
          items={undefined}
        >
          <TabPane
            tab={
              <span>
                发现 <em>{filtered.length}</em>
              </span>
            }
            key="discover"
          >
            <div className="insp-grid">
              {filtered.map((item) => (
                <InspirationCard key={item.id} item={item} state={state} actions={actions} />
              ))}
              {filtered.length === 0 && (
                <div className="insp-empty-wrap">
                  <Empty description="没有匹配的案例" />
                  <button className="soft-btn" onClick={() => setQuery('')}>
                    清除搜索
                  </button>
                </div>
              )}
            </div>
            <div className="insp-foot-note">
              <InfoCircleOutlined />
              <span>案例、作者与价格均为概念演示内容；价格为“示例价格”，不代表实时报价。</span>
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                收藏 <em>{favoriteItems.length}</em>
              </span>
            }
            key="favorites"
          >
            {favoriteItems.length > 0 ? (
              <div className="insp-grid">
                {favoriteItems.map((item) => (
                  <InspirationCard key={item.id} item={item} state={state} actions={actions} />
                ))}
              </div>
            ) : (
              <div className="insp-empty-wrap">
                <Empty description="还没有收藏。收藏后的案例会出现在这里，默认放入「未整理」。" />
                <button className="primary-btn" onClick={() => actions.setInspirationTab('discover')}>
                  去发现收藏 <ArrowRightOutlined />
                </button>
              </div>
            )}
          </TabPane>
          <TabPane
            tab={
              <span>
                我的笔记 <em>{notes.length}</em>
              </span>
            }
            key="notes"
          >
            {notes.length > 0 ? (
              <div className="note-list">
                {notes.map((note) => {
                  const kind = NOTE_KINDS[note.type] || NOTE_KINDS.idea;
                  return (
                    <article className="note-row" key={note.id} data-testid={`note-${note.id}`}>
                      <span className={`note-kind tone-${kind.tone}`}>{kind.label}</span>
                      <div className="note-row-main">
                        <b>{note.title || '未命名笔记'}</b>
                        <p>{note.body || '（无正文）'}</p>
                        {note.context && (
                          <span className="note-context">
                            {note.context.summary || `关联方案 C v${state.version}`} ·{' '}
                            {timeLabel(note.createdAt)}
                          </span>
                        )}
                      </div>
                      <button className="soft-btn" onClick={() => actions.openNoteViewer(note.id)}>
                        查看 <ArrowRightOutlined />
                      </button>
                    </article>
                  );
                })}
                <button className="note-new" onClick={() => actions.openNoteEditor({ type: 'idea', title: '', body: '' })}>
                  <PlusOutlined /> 写一篇新笔记
                </button>
              </div>
            ) : (
              <div className="insp-empty-wrap">
                <Empty description="还没有笔记。决策笔记会记录“为什么这样选”，并链接当时的方案版本。" />
                <div className="insp-empty-actions">
                  <button
                    className="primary-btn"
                    onClick={() => actions.openNoteEditor({ type: 'idea', title: '', body: '' })}
                  >
                    <EditOutlined /> 写一篇笔记
                  </button>
                  <button
                    className="ghost-btn"
                    data-testid="note-from-scheme"
                    onClick={() =>
                      actions.openNoteEditor({
                        type: 'scheme',
                        title: `方案笔记 · 餐办共用 C v${state.version}`,
                        body: '记录一下这个方案的背景、保留条件与待确认项。',
                        context: { view: 'scheme', summary: `餐办共用 C v${state.version}` },
                      })
                    }
                  >
                    <FileTextOutlined /> 从当前方案生成笔记
                  </button>
                </div>
              </div>
            )}
          </TabPane>
        </Tabs>
      </div>
      <ExtractionDrawer state={state} actions={actions} />
    </section>
  );
}
