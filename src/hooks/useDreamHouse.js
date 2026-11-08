import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AGENT_STAGE_DEFS,
  BASE_OBJECTS,
  EXAMPLES,
  PRODUCTS,
  ROOM,
} from '../data/catalog.js';
import {
  clone,
  dimsOf,
  impactFor,
  knownTotal,
  money,
  parseBrief,
  placementIssue,
  product,
  searchCatalog,
  staleInfo,
  summarizeIntent,
  tableOf,
  validateCandidate,
} from '../core/engine.js';

const STORAGE_KEY = 'dream-house-agent-v2';
const SCHEMA = 2;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initialAgent = () => ({
  phase: 'idle', // idle | compose | review | running | ready | preview | empty | applied | undone | cancelled
  intent: null,
  summary: null,
  issues: [],
  issueContext: [],
  scope: null,
  unsupported: null,
  notes: [],
  confidence: 0,
  parseText: '',
  results: null,
  selectedId: null,
  previewId: null,
  proposal: null,
  baseRevision: null,
  baseBriefRevision: null,
  run: null,
  staleNote: null,
  applied: null,
  lastMode: 'local',
});

const initialUi = () => ({
  drawer: null,
  railCollapsed: false,
  roomMode: 'iso', // iso | plan | photo
  grid: true,
  dims: true,
  commandOpen: false,
  guideOpen: false,
  compareNote:
    '接受就餐前将笔记本收至边柜，换取客厅更开阔明亮的公共活动区；长桌由 T150 调整为 T140 后，拉椅动线更从容，预算节省 ¥500。',
  compareVersion: null,
  inspirationTab: 'discover', // discover | favorites | notes
  inspirationDetail: null,
  noteEditor: null, // 预填对象
  noteViewer: null, // 笔记 id
  toast: null,
});

export function createInitialState() {
  const objects = clone(BASE_OBJECTS);
  const now = Date.now();
  const snapshot = {
    version: 3,
    label: 'C v3',
    time: now - 1000 * 60 * 26,
    objects: clone(objects),
    productId: 'T150',
    known: knownTotal(objects),
    reason: '初始保存 · 餐办共用',
  };
  return {
    schema: SCHEMA,
    view: 'welcome',
    schemeId: 'C',
    objects,
    version: 3,
    revision: 1,
    briefRevision: 1,
    snapshots: [snapshot],
    favorites: [],
    notes: [],
    events: [
      {
        id: 'evt-init',
        type: 'save',
        label: '已保存 C v3 · 餐办共用',
        detail: '150cm 长桌 · 已知合计 ¥8,080',
        time: now - 1000 * 60 * 26,
      },
      {
        id: 'evt-brief',
        type: 'brief',
        label: '项目依据已核对',
        detail: '两人用餐、偶尔办公；保留沙发与地板',
        time: now - 1000 * 60 * 12,
      },
    ],
    selectedObjectId: 'table-01',
    undoStack: [],
    agent: initialAgent(),
    draft: { text: '', filledBy: null, fillNote: null },
    ui: initialUi(),
    toastSeq: 0,
  };
}

const hydrate = () => {
  const base = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    if (saved?.schema !== SCHEMA || !Array.isArray(saved.objects) || !saved.objects.length) return base;
    return {
      ...base,
      objects: saved.objects,
      version: saved.version || 3,
      revision: saved.revision || 1,
      briefRevision: saved.briefRevision || 1,
      snapshots: Array.isArray(saved.snapshots) && saved.snapshots.length ? saved.snapshots : base.snapshots,
      events: Array.isArray(saved.events) ? saved.events : base.events,
      undoStack: Array.isArray(saved.undoStack) ? saved.undoStack : [],
      selectedObjectId: saved.selectedObjectId || 'table-01',
      favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
      notes: Array.isArray(saved.notes) ? saved.notes : [],
      view: 'welcome',
      agent: initialAgent(),
      ui: initialUi(),
      restored: true,
    };
  } catch {
    return base;
  }
};

const persistable = (state) => ({
  schema: state.schema,
  objects: state.objects,
  version: state.version,
  revision: state.revision,
  briefRevision: state.briefRevision,
  snapshots: state.snapshots,
  events: state.events.slice(0, 120),
  undoStack: state.undoStack,
  selectedObjectId: state.selectedObjectId,
  favorites: state.favorites,
  notes: state.notes,
});

export function useDreamHouse() {
  const [state, setReactState] = useState(hydrate);
  const stateRef = useRef(state);
  const runToken = useRef(0);
  const applyLock = useRef(false);
  const undoLock = useRef(false);
  const toastTimer = useRef(null);

  const setState = useCallback((updater) => {
    setReactState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable(state)));
    } catch {
      /* localStorage 不可用时仍可继续当前会话 */
    }
  }, [state]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const showToast = useCallback(
    (text, options = {}) => {
      const id = Date.now();
      setState((s) => ({
        ...s,
        ui: {
          ...s.ui,
          toast: { id, text, tone: options.tone || 'neutral', action: options.action || null },
        },
      }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        setState((s) => (s.ui.toast?.id === id ? { ...s, ui: { ...s.ui, toast: null } } : s));
      }, options.duration || 4200);
    },
    [setState]
  );

  const pushEvent = (s, type, label, detail = {}) => [
    { id: `evt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, type, label, time: Date.now(), ...detail },
    ...s.events,
  ].slice(0, 120);

  const setView = useCallback(
    (view) => {
      setState((s) => ({ ...s, view, ui: { ...s.ui, drawer: null } }));
    },
    [setState]
  );

  const selectObject = useCallback(
    (id, options = {}) => {
      setState((s) => ({
        ...s,
        selectedObjectId: id,
        view: options.keepView ? s.view : 'space',
      }));
    },
    [setState]
  );

  const setRoomMode = useCallback(
    (mode) => setState((s) => ({ ...s, ui: { ...s.ui, roomMode: mode } })),
    [setState]
  );

  const toggleGrid = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, grid: !s.ui.grid } })),
    [setState]
  );

  const toggleDims = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, dims: !s.ui.dims } })),
    [setState]
  );

  const openDrawer = useCallback(
    (drawer) => setState((s) => ({ ...s, ui: { ...s.ui, drawer } })),
    [setState]
  );

  const closeDrawer = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, drawer: null } })),
    [setState]
  );

  const setCompareNote = useCallback(
    (note) => setState((s) => ({ ...s, ui: { ...s.ui, compareNote: note } })),
    [setState]
  );

  const setCompareVersion = useCallback(
    (version) => setState((s) => ({ ...s, ui: { ...s.ui, compareVersion: version } })),
    [setState]
  );

  const setRailCollapsed = useCallback(
    (collapsed) => setState((s) => ({ ...s, ui: { ...s.ui, railCollapsed: collapsed } })),
    [setState]
  );

  const openComposer = useCallback(
    (options = {}) => {
      setState((s) => {
        const hasFlow = s.agent.proposal && ['ready', 'preview'].includes(s.agent.phase);
        const keep = options.keep && hasFlow;
        return {
          ...s,
          view: 'space',
          selectedObjectId: 'table-01',
          agent: keep
            ? { ...s.agent }
            : {
                ...initialAgent(),
                phase: 'compose',
                intent: null,
                summary: null,
              },
          draft: keep
            ? s.draft
            : {
                text: options.text || '',
                filledBy: options.filledBy || null,
                fillNote: null,
              },
        };
      });
    },
    [setState]
  );

  const closeAgent = useCallback(() => {
    runToken.current += 1;
    setState((s) => ({ ...s, agent: initialAgent(), draft: { text: '', filledBy: null, fillNote: null } }));
  }, [setState]);

  const setDraftText = useCallback(
    (text) => setState((s) => ({ ...s, draft: { ...s.draft, text, filledBy: null, fillNote: null } })),
    [setState]
  );

  const fillTemplate = useCallback(() => {
    const current = product(tableOf(stateRef.current.objects).productId);
    const text = `只换这张餐桌，找便宜一点的浅木色款。长至少 ${current.l}cm、宽至少 ${current.w}cm，其他物品和位置保持不变。`;
    setState((s) => ({
      ...s,
      view: 'space',
      draft: {
        text,
        filledBy: 'template',
        fillNote: '已填入「寻找平替」模板原句，可继续修改。模板只填入，不会自动执行。',
      },
    }));
  }, [setState]);

  const fillExample = useCallback(
    (id) => {
      const example = EXAMPLES.find((e) => e.id === id);
      if (!example) return;
      setState((s) => ({
        ...s,
        view: 'space',
        agent: {
          ...(s.agent.phase === 'compose' ? s.agent : { ...initialAgent(), phase: 'compose' }),
        },
        draft: {
          text: example.text,
          filledBy: example.id,
          fillNote: `已填入「${example.label}」示例，可继续修改。示例只填入，不会直接改动方案。`,
        },
      }));
    },
    [setState]
  );

  const parseDraft = useCallback(() => {
    const s = stateRef.current;
    const parsed = parseBrief(s.draft.text, s);
    const summary = summarizeIntent(parsed.fields, s);
    setState((prev) => ({
      ...prev,
      view: 'space',
      briefRevision: prev.briefRevision + 1,
      agent: {
        ...prev.agent,
        phase: 'review',
        intent: parsed.fields,
        summary,
        issues: parsed.issues,
        scope: parsed.scope,
        unsupported: parsed.unsupported,
        notes: parsed.notes,
        confidence: parsed.confidence,
        parseText: parsed.text,
        results: null,
        selectedId: null,
        previewId: null,
        proposal: null,
        run: null,
        applied: null,
        staleNote: null,
      },
    }));
  }, [setState]);

  const resolveIssue = useCallback(
    (code, patch) => {
      setState((s) => {
        if (!s.agent.intent) return s;
        const intent = { ...s.agent.intent, ...patch };
        if (patch.minLength) intent.allowSmaller = intent.allowSmaller || false;
        const issues = s.agent.issues.filter((issue) => issue.code !== code);
        return {
          ...s,
          briefRevision: s.briefRevision + 1,
          agent: {
            ...s.agent,
            intent,
            issues,
            summary: summarizeIntent(intent, s),
            results: null,
            proposal: null,
            previewId: null,
            selectedId: null,
            phase: 'review',
            staleNote: null,
          },
        };
      });
    },
    [setState]
  );

  const updateIntent = useCallback(
    (patch, options = {}) => {
      setState((s) => {
        if (!s.agent.intent) return s;
        const intent = { ...s.agent.intent, ...patch };
        const issues = options.keepIssues ? s.agent.issues : s.agent.issues.filter((i) => !options.clear?.includes(i.code));
        return {
          ...s,
          briefRevision: s.briefRevision + 1,
          agent: {
            ...s.agent,
            intent,
            issues,
            summary: summarizeIntent(intent, s),
            phase: 'review',
            results: null,
            proposal: null,
            previewId: null,
            selectedId: null,
            staleNote: null,
          },
        };
      });
      if (options.toast) showToast(options.toast);
    },
    [setState, showToast]
  );

  const quickIntent = useCallback(
    (text) => {
      const s = stateRef.current;
      if (!text || !text.trim()) return;
      const parsed = parseBrief(text.trim(), s);
      setState((prev) => ({
        ...prev,
        view: 'space',
        selectedObjectId: 'table-01',
        briefRevision: prev.briefRevision + 1,
        draft: {
          text: text.trim(),
          filledBy: 'inline',
          fillNote: null,
        },
        agent: {
          ...initialAgent(),
          phase: 'review',
          intent: parsed.fields,
          summary: summarizeIntent(parsed.fields, prev),
          issues: parsed.issues,
          scope: parsed.scope,
          unsupported: parsed.unsupported,
          notes: parsed.notes,
          confidence: parsed.confidence,
          parseText: parsed.text,
        },
      }));
    },
    [setState]
  );

  const clearUnsupported = useCallback(
    (patch = {}) => {
      setState((s) => {
        if (!s.agent.intent) return s;
        const intent = { ...s.agent.intent, ...patch };
        return {
          ...s,
          agent: {
            ...s.agent,
            intent,
            summary: summarizeIntent(intent, s),
            unsupported: null,
            scope: null,
            phase: 'review',
          },
        };
      });
    },
    [setState]
  );

  const runSearch = useCallback(
    async (options = {}) => {
      const start = stateRef.current;
      const { agent } = start;
      const intent = options.intent || agent.intent;
      if (!intent) return;
      const token = ++runToken.current;
      const requestId = `req-${token}-${Date.now()}`;
      const baseRevision = start.revision;
      const baseBriefRevision = start.briefRevision;
      const results = searchCatalog(start, intent);
      const recommended = results.recommendedId;
      const previewImpact = recommended ? impactFor(start, recommended) : null;
      const table = tableOf(start.objects);
      const current = product(table.productId);
      const hardCount = [intent.minLength, intent.minWidth, intent.maxPrice].filter(Boolean).length;
      const excludedNames = results.excluded.map((r) => r.product.name).join('、');

      const stagePayload = {
        read: {
          result: `${start.schemeId} v${start.version} · ${start.objects.length} 个对象`,
          details: [
            `方案：餐办共用 C v${start.version}`,
            `对象：${start.objects.length} 个，其中仅 ${current.name} 可替换`,
            `已知合计：${money(knownTotal(start.objects))}（含配送 ${money(40000)}）`,
            '安装费：未提供报价，保持待确认',
          ],
        },
        check: {
          result: `${hardCount} 项硬条件 · ${intent.preserve.length} 项保留条件`,
          details: [
            intent.minLength ? `长 ≥ ${intent.minLength}cm（来自你的确认）` : '长：未设置',
            intent.minWidth ? `宽 ≥ ${intent.minWidth}cm（来自你的确认）` : '宽：未设置',
            intent.maxPrice ? `单价 ≤ ${money(intent.maxPrice * 100)}` : '单价：只要求低于当前款',
            '保留：沙发、原木地板、其他物品与位置',
            '生活目标：两人用餐、偶尔办公（只用于解释取舍，不生成评分）',
          ],
        },
        search: {
          result: results.count
            ? `${Object.keys(PRODUCTS).length} 款备选 · 找到 ${results.count} 个符合项`
            : '4 款备选 · 暂无符合项',
          details: [
            `目录：${Object.keys(PRODUCTS).length} 款（含当前款）`,
            results.count
              ? `符合项：${results.eligible.map((r) => `${r.product.name}（${money(r.product.price)}）`).join('、')}`
              : '符合项：无',
            results.excludedCount
              ? `排除项：${excludedNames} —— 原因可在“为什么没有更便宜”中核对`
              : '排除项：无',
            '未进行联网搜索，仅查询本地示例目录',
          ],
        },
        impact: {
          result: previewImpact
            ? `预计 ${previewImpact.delta < 0 ? '−' : '+'}${money(Math.abs(previewImpact.delta))} · 已知合计 ${money(previewImpact.nextKnown)}`
            : '没有可计算的候选影响',
          details: previewImpact
            ? [
                `单品：${money(previewImpact.currentPrice)} → ${money(previewImpact.nextPrice)}`,
                `差额：${previewImpact.delta < 0 ? '−' : '+'}${money(Math.abs(previewImpact.delta))}`,
                `已知合计：${money(previewImpact.currentKnown)} → ${money(previewImpact.nextKnown)}`,
                `距离上限：${money(previewImpact.nextGap)}，仍不含安装费`,
              ]
            : ['没有符合条件的候选，未产生费用变化'],
        },
      };

      const run = {
        requestId,
        mode: 'local',
        startedAt: Date.now(),
        cancelled: false,
        stages: AGENT_STAGE_DEFS.map((def) => ({
          ...def,
          status: 'waiting',
          result: null,
          details: [],
        })),
      };

      setState((s) => ({
        ...s,
        view: 'space',
        agent: {
          ...s.agent,
          phase: 'running',
          intent,
          summary: summarizeIntent(intent, s),
          issues: [],
          results: null,
          selectedId: null,
          previewId: null,
          proposal: null,
          run,
          applied: null,
          staleNote: null,
          baseRevision: null,
          baseBriefRevision: null,
        },
      }));

      const durations = options.recheck ? [90, 110, 130, 110] : [240, 300, 340, 260];
      await wait(options.recheck ? 160 : 260);

      for (let i = 0; i < run.stages.length; i += 1) {
        if (token !== runToken.current) return;
        const def = run.stages[i];
        setState((s) => {
          if (!s.agent.run || s.agent.run.requestId !== requestId) return s;
          const stages = s.agent.run.stages.map((st, index) =>
            index === i ? { ...st, status: 'running' } : st
          );
          return { ...s, agent: { ...s.agent, run: { ...s.agent.run, stages } } };
        });
        await wait(durations[i]);
        if (token !== runToken.current) return;
        setState((s) => {
          if (!s.agent.run || s.agent.run.requestId !== requestId) return s;
          const stages = s.agent.run.stages.map((st, index) =>
            index === i
              ? {
                  ...st,
                  status: 'done',
                  result: stagePayload[def.key].result,
                  details: stagePayload[def.key].details,
                }
              : st
          );
          return { ...s, agent: { ...s.agent, run: { ...s.agent.run, stages } } };
        });
      }

      if (token !== runToken.current) return;
      const now = stateRef.current;
      const isStale = now.revision !== baseRevision || now.briefRevision !== baseBriefRevision;
      const proposal = results.count
        ? {
            id: `prop-${token}`,
            targetObjectId: 'table-01',
            baseRevision,
            baseBriefRevision,
            baseVersion: start.version,
            intent,
            results,
            createdAt: Date.now(),
            mode: 'local',
          }
        : null;

      setState((s) => ({
        ...s,
        agent: {
          ...s.agent,
          phase: results.count ? (isStale ? 'ready' : 'preview') : 'empty',
          results,
          proposal,
          selectedId: results.recommendedId,
          previewId: results.count && !isStale ? results.recommendedId : null,
          baseRevision,
          baseBriefRevision,
          staleNote: isStale ? '任务执行期间你调整了餐桌位置，候选已按旧位置生成。' : null,
          run: s.agent.run ? { ...s.agent.run, finishedAt: Date.now() } : null,
        },
      }));

      // 首次自动预览给一条轻提示：预览是临时状态，正式方案未变。
      if (results.count && !isStale && !options.recheck) {
        showToast(
          `已临时预览最符合的候选：${product(results.recommendedId).name}。正式方案未变，可切换候选或直接应用。`,
          { tone: 'info', duration: 5200 }
        );
      }
    },
    [setState, showToast]
  );

  const relaxConditions = useCallback(
    (patch) => {
      const s = stateRef.current;
      const intent = { ...(s.agent.intent || {}), ...patch };
      setState((prev) => ({
        ...prev,
        briefRevision: prev.briefRevision + 1,
        agent: {
          ...prev.agent,
          intent,
          summary: summarizeIntent(intent, prev),
          issues: [],
          unsupported: null,
          scope: null,
          phase: 'review',
          results: null,
          proposal: null,
          previewId: null,
          selectedId: null,
          staleNote: null,
        },
      }));
      setTimeout(() => runSearch({ intent }), 80);
    },
    [runSearch, setState]
  );

  const confirmIntent = useCallback(() => {
    const { agent } = stateRef.current;
    if (!agent.intent) return;
    if (agent.unsupported) {
      showToast(agent.unsupported.title, { tone: 'warn' });
      return;
    }
    if (agent.issues.length) {
      showToast('还有一个关键条件需要确认，回答后即可继续。', { tone: 'warn' });
      return;
    }
    runSearch();
  }, [runSearch, showToast]);

  const cancelRun = useCallback(() => {
    runToken.current += 1;
    setState((s) => ({
      ...s,
      agent: {
        ...s.agent,
        phase: 'review',
        run: s.agent.run ? { ...s.agent.run, cancelled: true } : null,
        previewId: null,
        results: null,
        proposal: null,
      },
    }));
    showToast('已取消本次查找，方案与输入都保留。', { tone: 'neutral' });
  }, [setState, showToast]);

  const selectCandidate = useCallback(
    (id) => {
      const s = stateRef.current;
      if (staleInfo(s)) {
        showToast('候选已过期，先按最新布局重新检查。', { tone: 'warn' });
        return;
      }
      const check = validateCandidate(s, id, s.agent.intent);
      if (!check.ok) {
        showToast(check.text, { tone: 'warn' });
        return;
      }
      setState((prev) => ({
        ...prev,
        agent: {
          ...prev.agent,
          selectedId: id,
          previewId: id,
          phase: 'preview',
        },
      }));
    },
    [setState, showToast]
  );

  const exitPreview = useCallback(() => {
    setState((s) => ({
      ...s,
      agent: { ...s.agent, previewId: null, phase: 'ready' },
    }));
  }, [setState]);

  const applyCandidate = useCallback(
    (productId) => {
      if (applyLock.current) return;
      const s = stateRef.current;
      const targetId = productId || s.agent.selectedId;
      if (!targetId) return;
      if (staleInfo(s)) {
        showToast('候选依据已变化，请重新校验后再应用。', { tone: 'warn' });
        return;
      }
      const check = validateCandidate(s, targetId, s.agent.intent);
      if (!check.ok) {
        showToast(check.text, { tone: 'warn' });
        return;
      }
      const table = tableOf(s.objects);
      const dims = dimsOf(table, targetId);
      const issue = placementIssue(s, { ...table, rotation: table.rotation }, targetId);
      if (issue) {
        showToast(issue.text, { tone: 'warn' });
        return;
      }
      applyLock.current = true;
      setTimeout(() => {
        applyLock.current = false;
      }, 700);
      const before = table.productId;
      const after = product(targetId);
      const version = s.version + 1;
      const objects = s.objects.map((o) =>
        o.id === 'table-01'
          ? {
              ...o,
              productId: targetId,
              name: after.full,
              spec: `${dims.l} × ${dims.w} × ${after.h} cm`,
            }
          : o
      );
      const snapshot = {
        version,
        label: `C v${version}`,
        time: Date.now(),
        objects: clone(objects),
        productId: targetId,
        known: knownTotal(objects),
        reason: `餐桌 ${product(before).name} → ${after.name}`,
      };
      const op = {
        id: `op-${Date.now()}`,
        before,
        after: targetId,
        beforeName: product(before).name,
        afterName: after.name,
        time: Date.now(),
        version,
        undone: false,
      };
      setState((prev) => ({
        ...prev,
        objects,
        version,
        revision: prev.revision + 1,
        snapshots: [...prev.snapshots, snapshot],
        undoStack: [...prev.undoStack, op],
        events: pushEvent(prev, 'apply', `已应用 ${after.name} · C v${version}`, {
          detail: `${money(product(before).price)} → ${money(after.price)} · 已知合计 ${money(snapshot.known)}`,
        }),
        agent: {
          ...prev.agent,
          phase: 'applied',
          previewId: null,
          proposal: null,
          results: null,
          selectedId: null,
          applied: {
            ...op,
            summary: {
              product: `${product(before).name} → ${after.name}`,
              price: `${money(product(before).price)} → ${money(after.price)}`,
              known: `${money(knownTotal(prev.objects))} → ${money(snapshot.known)}`,
              size: `${product(before).l} × ${product(before).w} → ${after.l} × ${after.w} cm`,
              delta: after.price - product(before).price,
            },
            undone: false,
          },
        },
      }));
      showToast(`已应用到方案 C · v${version}。正式金额已更新，可随时撤销。`, {
        tone: 'success',
        action: { label: '撤销这次替换', kind: 'undo' },
        duration: 6000,
      });
    },
    [setState, showToast]
  );

  const undoReplacement = useCallback(
    (opId) => {
      if (undoLock.current) return;
      const s = stateRef.current;
      const op = [...s.undoStack].reverse().find((o) => !o.undone && (!opId || o.id === opId));
      if (!op) {
        showToast('没有可以撤销的餐桌替换。', { tone: 'neutral' });
        return;
      }
      const table = tableOf(s.objects);
      if (table.productId !== op.after) {
        showToast('餐桌型号已有后续修改，不能直接撤销这次替换。请先处理后续的替换。', { tone: 'warn' });
        return;
      }
      undoLock.current = true;
      setTimeout(() => {
        undoLock.current = false;
      }, 700);
      const version = s.version + 1;
      const objects = s.objects.map((o) =>
        o.id === 'table-01'
          ? {
              ...o,
              productId: op.before,
              name: product(op.before).full,
              spec: `${product(op.before).l} × ${product(op.before).w} × ${product(op.before).h} cm`,
            }
          : o
      );
      const snapshot = {
        version,
        label: `C v${version}`,
        time: Date.now(),
        objects: clone(objects),
        productId: op.before,
        known: knownTotal(objects),
        reason: `撤销替换，恢复 ${product(op.before).name}`,
      };
      setState((prev) => ({
        ...prev,
        objects,
        version,
        revision: prev.revision + 1,
        snapshots: [...prev.snapshots, snapshot],
        undoStack: prev.undoStack.map((item) => (item.id === op.id ? { ...item, undone: true, undoneAt: Date.now() } : item)),
        events: pushEvent(prev, 'undo', `已撤销餐桌替换 · C v${version}`, {
          detail: `恢复 ${product(op.before).name}；后续位置调整保留`,
        }),
        agent: {
          ...prev.agent,
          phase: 'undone',
          previewId: null,
          proposal: null,
          results: null,
          selectedId: null,
          applied: {
            ...op,
            summary: {
              product: `${product(op.after).name} → ${product(op.before).name}`,
              price: `${money(product(op.after).price)} → ${money(product(op.before).price)}`,
              size: `${product(op.after).l} × ${product(op.after).w} cm → ${product(op.before).l} × ${product(op.before).w} cm`,
              known: `${money(knownTotal(s.objects))} → ${money(snapshot.known)}`,
              delta: product(op.before).price - product(op.after).price,
            },
            undone: true,
            undoneVersion: version,
            restoreName: product(op.before).name,
          },
        },
      }));
      showToast(`已撤销餐桌替换，${product(op.before).name} 已恢复 · C v${version}。`, {
        tone: 'success',
        duration: 5000,
      });
    },
    [setState, showToast]
  );

  const moveTable = useCallback(
    (patch, options = {}) => {
      const s = stateRef.current;
      const table = tableOf(s.objects);
      const next = { ...table, ...patch };
      if (patch.rotation != null) next.rotation = ((patch.rotation % 360) + 360) % 360;
      const issue = placementIssue(s, next);
      if (issue) {
        if (options.silent) return issue;
        showToast(issue.text, { tone: 'warn' });
        return issue;
      }
      const changed = table.x !== next.x || table.y !== next.y || table.rotation !== next.rotation;
      if (!changed) return null;
      const objects = s.objects.map((o) =>
        o.id === 'table-01'
          ? {
              ...o,
              x: next.x,
              y: next.y,
              rotation: next.rotation,
            }
          : o
      );
      const descriptor =
        patch.rotation != null && patch.x == null && patch.y == null
          ? `你把餐桌旋转到 ${next.rotation}°`
          : `你把餐桌移动到 X ${Math.round(next.x)}cm / Y ${Math.round(next.y)}cm`;
      setState((prev) => {
        const hasProposal = prev.agent.proposal && ['ready', 'preview'].includes(prev.agent.phase);
        return {
          ...prev,
          objects,
          revision: prev.revision + 1,
          selectedObjectId: 'table-01',
          events: pushEvent(prev, 'manual', descriptor, {
            detail: `位置 ${Math.round(table.x)},${Math.round(table.y)} → ${Math.round(next.x)},${Math.round(next.y)}；角度 ${next.rotation}°`,
          }),
          agent: hasProposal
            ? {
                ...prev.agent,
                phase: 'ready',
                previewId: null,
                staleNote: `${descriptor}。候选仍保留，但需要按最新布局重新检查。`,
              }
            : prev.agent,
        };
      });
      return null;
    },
    [setState, showToast]
  );

  const rotateTable = useCallback(() => {
    const table = tableOf(stateRef.current.objects);
    moveTable({ rotation: (table.rotation + 90) % 360 });
  }, [moveTable]);

  const recheck = useCallback(() => {
    const s = stateRef.current;
    if (!s.agent.intent) return;
    setState((prev) => ({
      ...prev,
      agent: { ...prev.agent, phase: 'running', previewId: null, staleNote: null, run: null },
    }));
    runSearch({ recheck: true, intent: s.agent.intent });
  }, [runSearch, setState]);

  const dropProposal = useCallback(() => {
    setState((s) => ({
      ...s,
      agent: {
        ...s.agent,
        phase: 'review',
        results: null,
        proposal: null,
        selectedId: null,
        previewId: null,
        staleNote: null,
      },
    }));
    showToast('已放弃这次候选，输入条件仍保留，可重新查找。', { tone: 'neutral' });
  }, [setState, showToast]);

  const resetDemo = useCallback(() => {
    runToken.current += 1;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState(createInitialState());
    showToast('演示已重置到 C v3 起点。', { tone: 'neutral' });
  }, [setState, showToast]);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, ui: { ...s.ui, toast: null } }));
  }, [setState]);

  const setCommandOpen = useCallback(
    (open) => setState((s) => ({ ...s, ui: { ...s.ui, commandOpen: open } })),
    [setState]
  );

  const setGuideOpen = useCallback(
    (open) => setState((s) => ({ ...s, ui: { ...s.ui, guideOpen: open } })),
    [setState]
  );

  /* ---------- 灵感、收藏与项目笔记（只增不减的新能力） ---------- */

  const toggleFavorite = useCallback(
    (id) => {
      const s = stateRef.current;
      const isFavorite = s.favorites.includes(id);
      setState((prev) => ({
        ...prev,
        favorites: isFavorite
          ? prev.favorites.filter((fav) => fav !== id)
          : [...prev.favorites, id],
      }));
      if (!isFavorite) {
        showToast('已收藏到「梧桐里 · 客厅灵感板」，可随时在收藏中查看。', {
          tone: 'success',
          action: { label: '查看收藏', kind: 'goto', payload: { tab: 'favorites' } },
          duration: 5000,
        });
      } else {
        showToast('已取消收藏。', { tone: 'neutral', action: { label: '撤销', kind: 'unfavorite', payload: id } });
      }
    },
    [setState, showToast]
  );

  const removeFavorite = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        favorites: prev.favorites.includes(id) ? prev.favorites : [...prev.favorites, id],
      }));
    },
    [setState]
  );

  const saveNote = useCallback(
    (note) => {
      const finalNote = {
        id: note.id || `note-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        createdAt: note.createdAt || Date.now(),
        ...note,
      };
      setState((prev) => {
        const exists = prev.notes.some((n) => n.id === finalNote.id);
        return {
          ...prev,
          notes: exists
            ? prev.notes.map((n) => (n.id === finalNote.id ? finalNote : n))
            : [finalNote, ...prev.notes],
          ui: { ...prev.ui, noteEditor: null },
        };
      });
      showToast('已保存到「梧桐里 / 客厅」的项目笔记。', {
        tone: 'success',
        action: { label: '查看笔记', kind: 'note', payload: finalNote.id },
        duration: 6000,
      });
    },
    [setState, showToast]
  );

  const removeNote = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
        ui: { ...prev.ui, noteViewer: null },
      }));
      showToast('笔记已删除。', { tone: 'neutral' });
    },
    [setState, showToast]
  );

  const openNoteEditor = useCallback(
    (prefill) => setState((s) => ({ ...s, ui: { ...s.ui, noteEditor: prefill || {} } })),
    [setState]
  );

  const closeNoteEditor = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, noteEditor: null } })),
    [setState]
  );

  const openNoteViewer = useCallback(
    (id) => setState((s) => ({ ...s, ui: { ...s.ui, noteViewer: id } })),
    [setState]
  );

  const closeNoteViewer = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, noteViewer: null } })),
    [setState]
  );

  const openInspirationDetail = useCallback(
    (id) => setState((s) => ({ ...s, ui: { ...s.ui, inspirationDetail: id } })),
    [setState]
  );

  const closeInspirationDetail = useCallback(
    () => setState((s) => ({ ...s, ui: { ...s.ui, inspirationDetail: null } })),
    [setState]
  );

  const setInspirationTab = useCallback(
    (tab) => setState((s) => ({ ...s, ui: { ...s.ui, inspirationTab: tab } })),
    [setState]
  );

  /**
   * 链路 A：灵感 → 设计要素 → 意图摘要。
   * 只把用户勾选的要素转成一句可核对的要求，进入现有「模板→摘要→候选」链路。
   */
  const applyExtraction = useCallback(
    (item, selections) => {
      const chosen = (item.elements.direct || [])
        .concat(item.elements.choose || [])
        .filter((_, index) => selections.includes(index))
        .join('、');
      const text =
        `参考《${item.title}》案例：只替换餐桌，${chosen ? `采用 ${chosen}，` : ''}` +
        '优先浅木色与更低价格，长至少 140cm、宽至少 75cm，保留沙发、地板与其余布局。';
      setState((prev) => ({
        ...prev,
        view: 'space',
        selectedObjectId: 'table-01',
        ui: { ...prev.ui, inspirationDetail: null },
        draft: {
          text,
          filledBy: 'inspiration',
          fillNote: `已从《${item.title}》提取设计要素，生成了一句可编辑的要求。要素可以再增删，确认摘要后才会开始检索。`,
        },
        agent: {
          ...initialAgent(),
          phase: 'compose',
          intent: null,
          summary: null,
        },
      }));
    },
    [setState]
  );

  const toast = useMemo(() => {
    const t = state.ui.toast;
    if (!t) return null;
    if (t.action?.kind === 'undo') {
      return { ...t, onAction: () => undoReplacement() };
    }
    if (t.action?.kind === 'unfavorite') {
      return { ...t, onAction: () => removeFavorite(t.action.payload) };
    }
    if (t.action?.kind === 'note') {
      return { ...t, onAction: () => openNoteViewer(t.action.payload) };
    }
    if (t.action?.kind === 'goto' && t.action.payload?.tab) {
      return {
        ...t,
        onAction: () => {
          setInspirationTab(t.action.payload.tab);
          setView('inspiration');
        },
      };
    }
    return t;
  }, [state.ui.toast, undoReplacement, removeFavorite, openNoteViewer, setInspirationTab, setView]);

  const table = tableOf(state.objects);
  const currentProduct = product(table.productId);
  const known = knownTotal(state.objects);
  const stale = staleInfo(state);

  return {
    state: { ...state, ui: { ...state.ui, toast } },
    table,
    currentProduct,
    known,
    stale,
    knownLabel: money(known),
    budgetLabel: money(1000000),
    gapLabel: money(1000000 - known),
    actions: {
      setView,
      selectObject,
      setRoomMode,
      toggleGrid,
      toggleDims,
      openDrawer,
      closeDrawer,
      setCompareNote,
      setCompareVersion,
      setRailCollapsed,
      openComposer,
      closeAgent,
      setDraftText,
      fillTemplate,
      fillExample,
      parseDraft,
      resolveIssue,
      updateIntent,
      clearUnsupported,
      quickIntent,
      relaxConditions,
      confirmIntent,
      cancelRun,
      selectCandidate,
      exitPreview,
      applyCandidate,
      undoReplacement,
      moveTable,
      rotateTable,
      recheck,
      dropProposal,
      resetDemo,
      showToast,
      dismissToast,
      setCommandOpen,
      setGuideOpen,
      toggleFavorite,
      removeFavorite,
      saveNote,
      removeNote,
      openNoteEditor,
      closeNoteEditor,
      openNoteViewer,
      closeNoteViewer,
      openInspirationDetail,
      closeInspirationDetail,
      setInspirationTab,
      applyExtraction,
    },
  };
}

export const USE_ROOM = ROOM;
