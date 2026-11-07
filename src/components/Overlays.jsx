import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Modal } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseOutlined,
  InfoCircleFilled,
  SearchOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { ObjectIcon } from './ui.jsx';
import { objectTitle } from '../core/engine.js';

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon =
    toast.tone === 'success'
      ? CheckCircleFilled
      : toast.tone === 'warn'
        ? WarningFilled
        : InfoCircleFilled;
  return (
    <div className={`toast tone-${toast.tone || 'neutral'}`} role="status" aria-live="polite">
      <span className="toast-icon">
        <Icon />
      </span>
      <span className="toast-text">{toast.text}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            toast.onAction?.();
            onClose();
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="toast-close" onClick={onClose} aria-label="关闭提示">
        <CloseOutlined />
      </button>
    </div>
  );
}

const VIEW_RESULTS = [
  { label: '方案画布', hint: '视图 · 自由组织方向与版本', key: 'canvas' },
  { label: '空间编辑', hint: '视图 · 选中、移动与预览', key: 'space' },
  { label: '方案对比', hint: '视图 · A / B / C 同角度', key: 'compare' },
  { label: '商品与预算', hint: '视图 · 清单与金额', key: 'budget' },
  { label: '选物池', hint: '视图 · 替代候选与容差', key: 'shop' },
];

export function CommandPalette({ state, actions }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (state.ui.commandOpen) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [state.ui.commandOpen]);

  const items = useMemo(() => {
    const nav = VIEW_RESULTS.map((item) => ({
      group: '跳到视图',
      label: item.label,
      hint: item.hint,
      icon: 'view',
      run: () => actions.setView(item.key),
    }));
    const commands = [
      {
        group: '动作',
        label: '寻找更合适的替代',
        hint: '从餐桌发起一次局部替换',
        icon: 'agent',
        run: () => actions.openComposer(),
      },
      {
        group: '动作',
        label: '演示指引',
        hint: '查看主线与异常演示步骤',
        icon: 'guide',
        run: () => actions.setGuideOpen(true),
      },
      {
        group: '动作',
        label: '版本历史',
        hint: `${state.snapshots.length} 个保存版本`,
        icon: 'history',
        run: () => actions.openDrawer('history'),
      },
      {
        group: '动作',
        label: '撤销本次替换',
        hint: '生成恢复版本，不删除历史',
        icon: 'undo',
        disabled: !state.undoStack.some((op) => !op.undone),
        run: () => actions.undoReplacement(),
      },
      {
        group: '动作',
        label: '重置演示',
        hint: '回到 C v3 起点',
        icon: 'reset',
        run: () => actions.openDrawer('reset'),
      },
    ];
    const objects = state.objects.map((object) => ({
      group: '房间对象',
      label: objectTitle(object),
      hint: object.id === 'table-01' ? '本次替换对象' : object.spec,
      icon: object.kind,
      run: () => actions.selectObject(object.id),
    }));
    const all = [...nav, ...commands, ...objects];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q) ||
        item.group.includes(q)
    );
  }, [actions, query, state.objects, state.snapshots.length, state.undoStack]);

  useEffect(() => setActive(0), [query]);

  const run = (item) => {
    if (item.disabled) return;
    actions.setCommandOpen(false);
    item.run();
  };

  return (
    <Modal
      open={state.ui.commandOpen}
      footer={null}
      closable={false}
      width={580}
      className="command-modal"
      onCancel={() => actions.setCommandOpen(false)}
      destroyOnClose
    >
      <div className="command-head">
        <SearchOutlined />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索视图、对象或动作…"
          bordered={false}
          data-testid="command-input"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(items.length - 1, i + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Enter' && items[active]) {
              e.preventDefault();
              run(items[active]);
            }
          }}
        />
        <kbd>ESC</kbd>
      </div>
      <div className="command-results">
        {items.length === 0 && (
          <div className="command-empty">
            <SearchOutlined />
            <span>没有匹配的视图或对象</span>
          </div>
        )}
        {items.map((item, index) => {
          const showGroup = index === 0 || items[index - 1].group !== item.group;
          return (
            <React.Fragment key={`${item.group}-${item.label}`}>
              {showGroup && <div className="command-group">{item.group}</div>}
              <button
                className={`command-item ${active === index ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => run(item)}
                disabled={item.disabled}
              >
                <span className="command-icon">
                  {item.icon === 'view' ? (
                    <ArrowRightOutlined />
                  ) : ['sofa', 'table', 'chair', 'cabinet', 'lamp', 'rug', 'art', 'plant'].includes(item.icon) ? (
                    <ObjectIcon kind={item.icon} size={16} />
                  ) : (
                    <span className="command-dot" />
                  )}
                </span>
                <span className="command-copy">
                  <b>{item.label}</b>
                  <span>{item.hint}</span>
                </span>
                <ArrowRightOutlined className="command-enter" />
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="command-foot">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 选择
        </span>
        <span>
          <kbd>↵</kbd> 打开
        </span>
        <span>所有操作只影响示例方案</span>
      </div>
    </Modal>
  );
}
