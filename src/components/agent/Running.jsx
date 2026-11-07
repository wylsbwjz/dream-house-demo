import React from 'react';
import { CheckOutlined, CloseOutlined, LoadingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Chip } from '../ui.jsx';

export function Running({ state, actions }) {
  const { agent } = state;
  const run = agent.run;
  const stages = run?.stages || [];
  const done = stages.filter((s) => s.status === 'done').length;
  const progress = Math.round((done / (stages.length || 4)) * 100);
  const intent = agent.intent || {};

  return (
    <div className="panel-body running" aria-live="polite">
      <div className="run-head">
        <span className="run-orb">
          <LoadingOutlined spin />
        </span>
        <div>
          <h3>正在检索与校验</h3>
          <p>
            仅替换餐桌 · {intent.minLength}×{intent.minWidth}cm · C v{state.version}
          </p>
        </div>
        <Chip tone="muted">本地规则 · 即时</Chip>
      </div>

      <div className="run-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="run-progress-meta">
        <span>{done} / {stages.length || 4} 个阶段</span>
        <span>结果由程序计算，不展示内部推理</span>
      </div>

      <div className="stage-list">
        {stages.map((stage, index) => (
          <div className={`stage-row is-${stage.status}`} key={stage.key}>
            <div className="stage-node">
              {stage.status === 'done' ? (
                <CheckOutlined />
              ) : stage.status === 'running' ? (
                <span className="stage-pulse" />
              ) : (
                <span className="stage-index">{index + 1}</span>
              )}
            </div>
            <div className="stage-main">
              <div className="stage-title-row">
                <b>{stage.title}</b>
                <code>{stage.tool}</code>
                <span className={`stage-status ${stage.status}`}>
                  {stage.status === 'done'
                    ? '完成'
                    : stage.status === 'running'
                      ? '进行中'
                      : '等待'}
                </span>
              </div>
              {stage.status === 'done' && (
                <>
                  <div className="stage-result">{stage.result}</div>
                  <button className="link-inline" onClick={() => actions.openDrawer('evidence')}>
                    查看依据
                  </button>
                </>
              )}
              {stage.status === 'running' && (
                <div className="stage-skeleton">
                  <i />
                  <i />
                </div>
              )}
              {stage.status === 'waiting' && <div className="stage-wait">等待前一步完成</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="run-note">
        <ThunderboltOutlined />
        <span>
          这是任务活动摘要，不是模型隐藏思维过程。阶段失败、跳过或取消都会如实显示。
        </span>
      </div>

      <div className="run-footer">
        <button className="ghost-btn" onClick={actions.cancelRun}>
          <CloseOutlined /> 取消本次查找
        </button>
        <span className="run-hint">取消会保留输入与当前方案</span>
      </div>
    </div>
  );
}
