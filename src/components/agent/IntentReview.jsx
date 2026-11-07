import React, { useEffect, useState } from 'react';
import { Alert, Button, Collapse, InputNumber, Popover, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { INSTALL_NOTE, LIFE_GOALS, PRESERVE_ITEMS } from '../../data/catalog.js';
import { money, product, tableOf } from '../../core/engine.js';
import { Chip } from '../ui.jsx';

const { Panel } = Collapse;

function ConditionChip({ label, value, unit, onApply, onClear, suggestions = [] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const content = (
    <div className="pop-editor">
      <div className="pop-editor-label">{label}下限</div>
      <InputNumber
        value={draft}
        min={60}
        max={300}
        step={5}
        onChange={(v) => setDraft(v)}
        addonAfter={unit}
        autoFocus
        style={{ width: 140 }}
      />
      {suggestions.length > 0 && (
        <div className="pop-presets">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setDraft(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="pop-editor-actions">
        <button
          className="text-btn"
          onClick={() => {
            onClear();
            setOpen(false);
          }}
        >
          清除
        </button>
        <button
          className="mini-primary"
          onClick={() => {
            if (draft != null) onApply(draft);
            setOpen(false);
          }}
        >
          应用
        </button>
      </div>
    </div>
  );
  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
      <button className="condition-chip" data-testid={`condition-${label}`}>
        <span>{label}</span>
        <b>
          {value} {unit}
        </b>
        <EditOutlined />
      </button>
    </Popover>
  );
}

function PriceChip({ value, onApply, onClear }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || 1800);
  useEffect(() => setDraft(value || 1800), [value]);
  const content = (
    <div className="pop-editor">
      <div className="pop-editor-label">单件价格上限</div>
      <InputNumber
        value={draft}
        min={900}
        max={5000}
        step={100}
        onChange={(v) => setDraft(v)}
        prefix="¥"
        style={{ width: 150 }}
      />
      <div className="pop-editor-actions">
        <button
          className="text-btn"
          onClick={() => {
            onClear();
            setOpen(false);
          }}
        >
          清除
        </button>
        <button
          className="mini-primary"
          onClick={() => {
            if (draft) onApply(draft);
            setOpen(false);
          }}
        >
          应用
        </button>
      </div>
    </div>
  );
  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
      <button className="condition-chip" data-testid="condition-单价">
        <span>单价</span>
        <b>{value ? `≤ ${money(value * 100)}` : '未设置'}</b>
        <EditOutlined />
      </button>
    </Popover>
  );
}

export function IntentReview({ state, actions, summary, issues, scope, unsupported, notes, parseText }) {
  const { agent, version } = state;
  const intent = agent.intent || {};
  const table = tableOf(state.objects);
  const current = product(table.productId);
  const blocked = issues.length > 0 || !!unsupported;

  return (
    <div className="panel-body review">
      <div className="review-head">
        <div className="review-title">
          <span className="eyebrow">意图识别 · 可修改摘要</span>
          <h2>我理解的任务</h2>
        </div>
        <Chip tone="teal-soft">
          <CheckOutlined /> 已提取
        </Chip>
      </div>
      <p className="review-sub">
        依据餐办共用 C v{version} · 需求修订 {state.briefRevision} · 本地规则解析
      </p>

      {unsupported && (
        <div className="review-blocker" data-testid="unsupported">
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={unsupported.title}
            description={unsupported.text}
          />
          <div className="blocker-actions">
            <button
              className="mini-primary"
              onClick={() =>
                actions.clearUnsupported(
                  unsupported.title.includes('颜色') ? { tone: '浅木色' } : unsupported.title.includes('更贵') ? { goal: 'cheaper' } : {}
                )
              }
            >
              {unsupported.title.includes('颜色')
                ? '改为浅木色继续'
                : unsupported.title.includes('更贵')
                  ? '改为寻找更低价'
                  : '只处理餐桌'}
            </button>
            <button className="text-btn" onClick={() => actions.openComposer({ text: parseText })}>
              返回修改
            </button>
          </div>
        </div>
      )}

      {scope?.warning && (
        <div className="review-scope" data-testid="scope-warning">
          <Alert type="info" showIcon message="范围提示" description={scope.text} />
          <div className="blocker-actions">
            <button className="mini-primary" onClick={() => actions.clearUnsupported({})}>
              只改餐桌并继续
            </button>
            <button className="text-btn" onClick={() => actions.openComposer({ text: parseText })}>
              重新描述
            </button>
          </div>
        </div>
      )}

      <div className="summary-card">
        <div className="summary-row">
          <span className="summary-key">对象与动作</span>
          <div className="summary-value">
            <b>替换 · 餐桌</b>
            <span className="summary-object">
              {current.name} · {current.l} × {current.w} cm
            </span>
            <Chip tone="teal-soft">仅这一件</Chip>
          </div>
        </div>
        <div className="summary-row">
          <span className="summary-key">优化目标</span>
          <div className="summary-value">
            <b>价格更低</b>
            <span className="summary-chip">浅木色</span>
            <span className="summary-note">优先考虑，不覆盖下面的硬条件</span>
          </div>
        </div>
        <div className="summary-row is-strong">
          <span className="summary-key">
            必须满足
            <em>硬条件</em>
          </span>
          <div className="summary-value">
            <div className="condition-row">
              {intent.minLength ? (
                <ConditionChip
                  label="长"
                  value={intent.minLength}
                  unit="cm"
                  suggestions={[130, 140, 150]}
                  onApply={(v) => actions.updateIntent({ minLength: v })}
                  onClear={() => actions.updateIntent({ minLength: null })}
                />
              ) : (
                <span className="condition-missing">长：未确认</span>
              )}
              {intent.minWidth ? (
                <ConditionChip
                  label="宽"
                  value={intent.minWidth}
                  unit="cm"
                  suggestions={[70, 75, 80]}
                  onApply={(v) => actions.updateIntent({ minWidth: v })}
                  onClear={() => actions.updateIntent({ minWidth: null })}
                />
              ) : (
                <span className="condition-missing">宽：未确认</span>
              )}
              <PriceChip
                value={intent.maxPrice}
                onApply={(v) => actions.updateIntent({ maxPrice: v })}
                onClear={() => actions.updateIntent({ maxPrice: null })}
              />
            </div>
            <span className="summary-note">来自你的原话或明确确认；系统不会静默放宽。</span>
          </div>
        </div>
        <div className="summary-row">
          <span className="summary-key">保留条件</span>
          <div className="summary-value">
            <div className="preserve-row">
              {PRESERVE_ITEMS.map((item) => (
                <Tooltip key={item.id} title={`${item.note}。本次演示固定保留，解除需变更任务范围。`}>
                  <span className="preserve-chip">
                    <LockOutlined /> {item.label}
                  </span>
                </Tooltip>
              ))}
            </div>
            <span className="summary-note">从当前方案继承，示例填充不会解除保留条件。</span>
          </div>
        </div>
        {intent.allowSmaller && (
          <div className="summary-row">
            <span className="summary-key">可妥协</span>
            <div className="summary-value">
              <span className="summary-chip is-warn">桌面可以略小</span>
              <span className="summary-note">只有在你确认具体下限后，才会进入候选筛选。</span>
            </div>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-key">生活目标</span>
          <div className="summary-value">
            <div className="life-row">
              {LIFE_GOALS.map((goal) => (
                <span key={goal}>{goal}</span>
              ))}
            </div>
            <span className="summary-note">用于解释候选取舍，不生成虚构的适配评分。</span>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="issues-card" data-testid="issues">
          <div className="issues-head">
            <QuestionCircleOutlined /> 需要你确认 {issues.length} 项
          </div>
          {issues.map((issue) => (
            <div className="issue-item" key={issue.code}>
              <div className="issue-title">{issue.title}</div>
              <p>{issue.question}</p>
              <div className="issue-options">
                {issue.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => actions.resolveIssue(issue.code, option.value)}
                    data-testid={`issue-${issue.code}-${option.label}`}
                  >
                    <b>{option.label}</b>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pending-card">
        <div className="pending-head">
          <InfoCircleOutlined /> 待确认（不影响本次查找）
        </div>
        <div className="pending-row">
          <span>安装费</span>
          <b>待报价 · 未计入</b>
        </div>
        <div className="pending-row">
          <span>候选来源</span>
          <b>本地示例目录 · 未联网搜价</b>
        </div>
      </div>

      <Collapse ghost className="source-collapse" expandIconPosition="right">
        <Panel header="查看原始表达与识别依据" key="source">
          <blockquote className="raw-quote">“{parseText}”</blockquote>
          <ul className="notes-list">
            {notes.length ? (
              notes.map((note) => <li key={note}>{note}</li>)
            ) : (
              <li>未添加额外解释，摘要只采用可核对的原话与方案依据。</li>
            )}
            <li>摘要与原文保持独立：原文修改后必须重新整理，旧摘要不会继续执行。</li>
          </ul>
        </Panel>
      </Collapse>

      <div className="review-footer">
        <div className="review-footer-note">
          {blocked ? (
            <span className="is-warn">
              <WarningOutlined /> 先处理上面的待确认项
            </span>
          ) : (
            <span>确认只开始检索，不会改动方案。</span>
          )}
        </div>
        <div className="review-actions">
          <button className="ghost-btn" onClick={() => actions.openComposer({ text: parseText })}>
            <ArrowLeftOutlined /> 返回修改
          </button>
          <button className="primary-btn" disabled={blocked} onClick={actions.confirmIntent} data-testid="confirm-intent">
            确认并查找候选 <ArrowRightOutlined />
          </button>
        </div>
      </div>
    </div>
  );
}
