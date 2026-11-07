import React from 'react';
import { Input, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CheckOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { EXAMPLES, TEMPLATE_SENTENCE } from '../../data/catalog.js';
import { Chip } from '../ui.jsx';

const INSERTS = [
  { label: '长 ≥ 140cm', text: '长至少 140cm' },
  { label: '宽 ≥ 75cm', text: '宽至少 75cm' },
  { label: '单价 ≤ ¥1,800', text: '餐桌单价不超过 1800 元' },
  { label: '只换餐桌', text: '只替换餐桌' },
  { label: '保留沙发与地板', text: '沙发和地板保持不动' },
];

export function Composer({ state, actions }) {
  const { draft } = state;
  const { text } = draft;
  const append = (snippet) => {
    if (text.includes(snippet)) return;
    const base = text.trim().replace(/。$/, '');
    actions.setDraftText(`${base ? `${base}，` : ''}${snippet}。`);
  };

  const templateParts = TEMPLATE_SENTENCE.split(/(〔[^〕]+〕)/g).filter(Boolean);

  return (
    <div className="panel-body composer">
      <div className="scope-strip">
        <span className="scope-lock">
          <LockOutlined />
        </span>
        <div>
          <b>仅替换餐桌</b>
          <span>对象从空间选择继承 · 依据 C v{state.version}</span>
        </div>
        <Chip tone="teal-soft">范围锁定</Chip>
      </div>

      <div className="compose-intro">
        <h3>从一句话开始</h3>
        <p>模板帮助你组织“对象—目标—约束—保留项”。它不是表单，也不是唯一入口。</p>
      </div>

      <div className="template-card">
        <div className="template-head">
          <span className="template-kicker">
            <ThunderboltOutlined /> 任务模板 · 寻找平替
          </span>
          <span className="template-note">可改写，不会自动执行</span>
        </div>
        <p className="template-sentence">
          {templateParts.map((part, i) =>
            part.startsWith('〔') ? (
              <Tooltip key={i} title="这些内容会在识别摘要里变成可修改字段">
                <span className="template-token">{part.slice(1, -1)}</span>
              </Tooltip>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <button className="template-use" onClick={actions.fillTemplate}>
          <PlusOutlined /> 用这句填入输入框
        </button>
      </div>

      <div className={`compose-input ${draft.fillNote ? 'has-note' : ''}`}>
        <div className="compose-input-head">
          <span>
            <EditOutlined /> 也可以直接描述
          </span>
          <span className="char-count">{text.length}/240</span>
        </div>
        <Input.TextArea
          data-testid="brief-input"
          value={text}
          maxLength={240}
          autoSize={{ minRows: 4, maxRows: 8 }}
          placeholder="例如：只换这张餐桌，找便宜一点的浅木色款。长至少 140cm、宽至少 75cm，其他物品和位置保持不变。"
          onChange={(e) => actions.setDraftText(e.target.value)}
          aria-label="修改需求"
        />
        {draft.fillNote && (
          <div className="fill-note" data-testid="fill-note">
            <CheckOutlined /> {draft.fillNote}
          </div>
        )}
      </div>

      <div className="quick-row">
        <span className="quick-label">快速补充</span>
        <div className="quick-chips">
          {INSERTS.map((item) => (
            <button key={item.label} onClick={() => append(item.text)} className={text.includes(item.text) ? 'is-used' : ''}>
              {text.includes(item.text) ? <CheckOutlined /> : <PlusOutlined />} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="example-block">
        <div className="example-head">
          <BulbOutlined /> 情境示例
          <span>点击只填入，不会执行，也不改动方案</span>
        </div>
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            className={`example-card ${draft.filledBy === example.id ? 'is-filled' : ''}`}
            onClick={() => actions.fillExample(example.id)}
          >
            <span className="example-label">{example.label}</span>
            <span className="example-text">“{example.short}”</span>
            <span className="example-hint">{example.hint}</span>
            <ArrowRightOutlined className="example-arrow" />
          </button>
        ))}
      </div>

      <div className="compose-next">
        <div className="compose-next-hint">
          下一步：先核对 AI 整理的摘要，确认后才开始检索。
        </div>
        <div className="compose-actions">
          <button className="ghost-btn" onClick={actions.closeAgent}>
            <ArrowLeftOutlined /> 取消
          </button>
          <button className="primary-btn" disabled={!text.trim()} onClick={actions.parseDraft} data-testid="parse-brief">
            整理修改要求 <ArrowRightOutlined />
          </button>
        </div>
      </div>
    </div>
  );
}
