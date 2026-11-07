/**
 * 纯函数层：意图解析、约束筛选、计价、几何与版本比较。
 * 所有金额按“分”存储，只在展示时转成元。
 */
import {
  ALT_IDS,
  BUDGET,
  DELIVERY,
  LIFE_GOALS,
  PRESERVE_ITEMS,
  PRODUCTS,
  ROOM,
} from '../data/catalog.js';

export const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export const money = (cents, options = {}) => {
  const value = (cents || 0) / 100;
  const fixed = options.decimals ?? (Number.isInteger(value) ? 0 : 2);
  return (
    '¥' +
    value.toLocaleString('zh-CN', {
      minimumFractionDigits: fixed,
      maximumFractionDigits: fixed,
    })
  );
};

export const signedMoney = (cents) => (cents > 0 ? '+' : cents < 0 ? '−' : '') + money(Math.abs(cents));

export const product = (id) => {
  const p = PRODUCTS[id];
  if (!p) throw new Error(`商品 ${id} 不在示例目录中`);
  return p;
};

export const tableOf = (objects) => objects.find((o) => o.id === 'table-01');

export const dimsOf = (object, productId) => {
  const base = productId
    ? product(productId)
    : object.productId
      ? product(object.productId)
      : { l: object.l, w: object.w, h: object.h };
  const rotated = object.rotation % 180 !== 0;
  return {
    l: rotated ? base.w : base.l,
    w: rotated ? base.l : base.w,
    h: base.h,
    rotated,
  };
};

export const tableProduct = (state) => product(tableOf(state.objects).productId);

export const unitPrice = (object) =>
  object.productId ? product(object.productId).price : object.price || 0;

export const goodsTotal = (objects) =>
  objects.reduce((sum, object) => sum + unitPrice(object) * (object.qty || 1), 0);

export const knownTotal = (objects) => goodsTotal(objects) + DELIVERY;

export const gapToBudget = (known) => BUDGET - known;

export const impactFor = (state, productId) => {
  const table = tableOf(state.objects);
  const current = product(table.productId);
  const next = product(productId);
  const currentKnown = knownTotal(state.objects);
  const nextObjects = state.objects.map((o) =>
    o.id === 'table-01' ? { ...o, productId, name: next.full } : o
  );
  const nextKnown = knownTotal(nextObjects);
  return {
    currentId: current.id,
    nextId: next.id,
    currentPrice: current.price,
    nextPrice: next.price,
    delta: next.price - current.price,
    currentKnown,
    nextKnown,
    deltaKnown: nextKnown - currentKnown,
    currentGap: gapToBudget(currentKnown),
    nextGap: gapToBudget(nextKnown),
  };
};

export const clearances = (state, productId) => {
  const table = tableOf(state.objects);
  const dims = dimsOf(table, productId || table.productId);
  const sofa = state.objects.find((o) => o.kind === 'sofa');
  const left =
    sofa && table.y < sofa.y + sofa.w && table.y + dims.w > sofa.y
      ? table.x - (sofa.x + sofa.l)
      : null;
  return {
    left: left == null ? null : Math.round(left),
    right: Math.round(ROOM.l - (table.x + dims.l)),
    front: Math.round(ROOM.w - (table.y + dims.w)),
    back: Math.round(table.y),
  };
};

export const placementIssue = (state, table, productId) => {
  const dims = dimsOf(table, productId || table.productId);
  if (table.x < 10 || table.y < 10 || table.x + dims.l > ROOM.l - 10 || table.y + dims.w > ROOM.w - 10) {
    return {
      code: 'bounds',
      text: '餐桌超出房间边界，请调整位置。',
      table,
    };
  }
  const solid = state.objects.filter((o) => ['sofa', 'cabinet', 'coffee'].includes(o.kind));
  for (const other of solid) {
    const od = dimsOf(other);
    const overlaps =
      table.x < other.x + od.l &&
      table.x + dims.l > other.x &&
      table.y < other.y + od.w &&
      table.y + dims.w > other.y;
    if (overlaps) {
      return {
        code: 'overlap',
        text: `餐桌与${other.name}重叠，请调整位置。`,
        otherId: other.id,
      };
    }
  }
  return null;
};

const SIZE_PRESETS = [
  { label: '140 × 75 cm', value: { minLength: 140, minWidth: 75 }, hint: '最常见的紧凑长桌' },
  { label: '130 × 70 cm', value: { minLength: 130, minWidth: 70 }, hint: '更省空间的桌型' },
  { label: '150 × 80 cm', value: { minLength: 150, minWidth: 80 }, hint: '与当前同尺寸' },
];

const parseChineseNumber = (raw) => {
  if (!raw) return null;
  const map = { 零: 0, 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === '一万') return 10000;
  if (raw === '两千') return 2000;
  if (raw === '一千五') return 1500;
  if (raw === '一千八') return 1800;
  const wan = raw.match(/^([一两二三四五六七八九])万$/);
  if (wan) return map[wan[1]] * 10000;
  const qian = raw.match(/^([一两二三四五六七八九])千([一两二三四五六七八九])?$/);
  if (qian) return map[qian[1]] * 1000 + (qian[2] ? map[qian[2]] * 100 : 0);
  return null;
};

/**
 * 把自然语言整理成结构化意图。规则引擎只承诺演示范围内的识别；
 * 识别不到的关键条件一律进入 issues，不静默补默认值。
 */
export const parseBrief = (rawText, state, overrides = {}) => {
  const text = String(rawText || '').trim();
  const table = tableOf(state.objects);
  const current = product(table.productId);
  const baseFields = {
    targetObjectId: 'table-01',
    action: 'replace',
    goal: 'cheaper',
    tone: '浅木色',
    minLength: null,
    minWidth: null,
    maxPrice: null,
    preserve: ['sofa', 'floor', 'layout'],
    allowSmaller: false,
    lifeGoals: [...LIFE_GOALS],
    ...overrides,
  };

  if (!text) {
    return {
      ok: false,
      text,
      fields: baseFields,
      issues: [
        {
          code: 'empty',
          title: '还没有描述修改',
          question: '可以从示例开始，或直接说“换便宜一点的浅木色餐桌，长宽至少 140×75cm”。',
          options: [],
        },
      ],
      scope: null,
      unsupported: null,
      notes: [],
    };
  }

  const normalized = text
    .replace(/(\d),(?=\d{3})/g, '$1')
    .replace(/\s+/g, '')
    .replace(/[。；;]/g, '，');

  const issues = [];
  const notes = [];
  let unsupported = null;
  let scope = null;

  const otherItems = [
    ['沙发', 'sofa'],
    ['地板', 'floor'],
    ['茶几', 'coffee'],
    ['餐椅', 'chair'],
    ['椅子', 'chair'],
    ['矮柜', 'cabinet'],
    ['落地灯', 'lamp'],
    ['地毯', 'rug'],
    ['绿植', 'plant'],
    ['装饰画', 'art'],
  ];
  const negative = /(不换|不改|不动|别动|不要动|保留|保持|不移|维持|不变)/;
  const positive = /(换|改|替换|撤|拿掉|移动|挪|重新买|换成|换成)/;
  const scopeHits = [];
  normalized.split('，').forEach((clause) => {
    for (const [label] of otherItems) {
      if (clause.includes(label) && positive.test(clause) && !negative.test(clause)) {
        if (!scopeHits.includes(label)) scopeHits.push(label);
      }
    }
  });
  if (scopeHits.length) {
    scope = {
      warning: true,
      text: `你提到了「${scopeHits.join('、')}」。本次演示只开放餐桌替换，其他物品与布局保持不变。`,
      items: scopeHits,
    };
  }
  if (/(全屋|整个客厅|重新设计|全部重做|整体翻新)/.test(normalized)) {
    unsupported = {
      title: '超出本次演示范围',
      text: '这次只支持一次局部替换。全屋或整体重做需要新的方案生成流程，不在本 Demo 内。',
      suggestions: ['只改餐桌', '返回空间'],
    };
  }

  if (/(更贵|贵一点|升级|高端|更高级|换个更好的)/.test(normalized) && !/(便宜|低价|省钱|降本)/.test(normalized)) {
    unsupported = {
      title: '本次示例聚焦降低单件预算',
      text: '示例目录与校验规则只覆盖“更便宜”的替换。你仍然可以修改尺寸、预算或材质条件。',
      suggestions: ['改成寻找更低价', '取消'],
    };
  }
  if (/(胡桃|深色|深木|黑色|黑胡桃|红木)/.test(normalized)) {
    unsupported = {
      title: '示例目录没有这一颜色',
      text: '当前只有白蜡木与橡木的浅木色款式。若坚持深色，本次无法给出可应用的候选。',
      suggestions: ['改为浅木色', '取消'],
    };
  }

  // 尺寸
  let minLength = null;
  let minWidth = null;
  const pair = normalized.match(/(\d{2,3})[×xX*](\d{2,3})/);
  if (pair) {
    minLength = Number(pair[1]);
    minWidth = Number(pair[2]);
  }
  const lenMatch = normalized.match(/长(?:度|边)?(?:至少|不低于|不小于|不少于|最小|下限|为|要|需|:)?(≥|>=)?\s*(\d{2,3})/);
  if (lenMatch && !minLength) minLength = Number(lenMatch[2]);
  const widMatch = normalized.match(/宽(?:度|边)?(?:至少|不低于|不小于|不少于|最小|下限|为|要|需|:)?(≥|>=)?\s*(\d{2,3})/);
  if (widMatch && !minWidth) minWidth = Number(widMatch[2]);
  if (minLength && !minWidth) {
    const alt = normalized.match(/(?:宽|宽度)\s*(?:约|为|是)?\s*(\d{2,3})/);
    if (alt) minWidth = Number(alt[1]);
  }
  const sameSize = /(同尺寸|尺寸不变|保持原尺寸|跟原来一样大|和现在一样)/.test(normalized);
  if (sameSize) {
    minLength = current.l;
    minWidth = current.w;
    notes.push('“同尺寸”已按当前餐桌 150 × 80 cm 理解。');
  }
  const allowSmaller = /(略小|小一点|小一些|稍小|可以小|小点|紧凑一点)/.test(normalized);
  if (allowSmaller && !minLength) {
    issues.push({
      code: 'smaller-choice',
      title: '“略小”需要你确认下限',
      question: '桌面可以小多少？系统不会把“略小”自动当成 140 × 75cm。',
      options: SIZE_PRESETS,
    });
  }
  if (minLength && (minLength < 100 || minLength > 200)) {
    issues.push({
      code: 'length-range',
      title: '长度超出示例范围',
      question: '示例目录覆盖 120–150cm 长桌，请确认可接受的长度下限。',
      options: SIZE_PRESETS,
    });
  }
  if (minWidth && (minWidth < 60 || minWidth > 100)) {
    issues.push({
      code: 'width-range',
      title: '宽度超出示例范围',
      question: '示例目录覆盖 70–80cm 宽桌，请确认可接受的宽度下限。',
      options: SIZE_PRESETS,
    });
  }
  if ((minLength && !minWidth) || (!minLength && minWidth)) {
    issues.push({
      code: 'missing-size',
      title: minLength ? '还缺桌面宽度下限' : '还缺桌面长度下限',
      question: '长和宽需要成对确认，系统才能按硬条件筛选；不会用当前尺寸自动补齐。',
      options: SIZE_PRESETS,
    });
  } else if (!minLength && !minWidth && !allowSmaller && !sameSize) {
    issues.push({
      code: 'missing-size',
      title: '还缺一个尺寸下限',
      question: '你愿意接受多大的桌面？请确认长、宽下限，系统会按这条硬条件筛选。',
      options: SIZE_PRESETS,
    });
  }

  // 价格
  let maxPrice = null;
  let budgetNote = null;
  const priceRaw =
    normalized.match(
      /(?:单价|餐桌预算|价格|预算)(?:上限|控制在|不超过|为|是|≤|<)?[¥￥]?(\d{3,5}|一万|两千|一千五|一千八)/
    ) ||
    normalized.match(/(?:不超过|最多|低于|上限|控制在|≤|<)[¥￥]?(\d{3,5})/) ||
    normalized.match(/(\d{3,5})(?:元|块)?(?:以内|之内|以下)/);
  if (priceRaw) {
    const value = parseChineseNumber(priceRaw[1] || priceRaw[2]);
    if (value != null) {
      if (value >= 5000) {
        budgetNote = `你提到 ${money(value * 100)}，这更像整体预算；本次不使用它约束单件价格。`;
      } else if (value < 900) {
        issues.push({
          code: 'budget-low',
          title: '单品预算低于示例目录',
          question: '示例目录最低单价为 ¥1,299（林间 R130）。请确认是否放宽预算。',
          options: [
            { label: '¥1,299 起', value: { maxPrice: 1299 } },
            { label: '¥1,699 起', value: { maxPrice: 1699 } },
            { label: '不限单价', value: { maxPrice: null } },
          ],
        });
      } else {
        maxPrice = value;
      }
    }
  }
  if (budgetNote) notes.push(budgetNote);
  if (/(便宜|低价|省钱|降本|性价比|少花)/.test(normalized)) {
    notes.push('优化目标：在不突破硬条件的前提下，优先降低单件价格。');
  }
  if (/(浅木|原木|白蜡|橡木|浅色|奶油|米色)/.test(normalized)) {
    notes.push('材质偏好：浅木色（白蜡木／橡木），与现有地板与沙发同色系。');
  }
  if (/(沙发|地板)/.test(normalized) && negative.test(normalized)) {
    notes.push('保留条件：沙发与原木地板保持现状；移动沙发不算替换。');
  }

  const fields = {
    ...baseFields,
    minLength,
    minWidth,
    maxPrice,
    tone: /(不限|任意颜色)/.test(normalized) ? '不限' : '浅木色',
    allowSmaller,
  };

  return {
    ok: !unsupported && issues.length === 0,
    text,
    fields,
    issues,
    scope,
    unsupported,
    notes,
    confidence: unsupported ? 0 : Math.max(0.62, 0.98 - issues.length * 0.12 - (scope?.warning ? 0.1 : 0)),
  };
};

export const summarizeIntent = (fields, state) => {
  const table = tableOf(state.objects);
  const current = product(table.productId);
  const preserve = PRESERVE_ITEMS.filter((p) => fields.preserve.includes(p.id));
  const hard = [];
  if (fields.minLength) hard.push({ key: 'length', label: `长 ≥ ${fields.minLength} cm` });
  if (fields.minWidth) hard.push({ key: 'width', label: `宽 ≥ ${fields.minWidth} cm` });
  if (fields.maxPrice) hard.push({ key: 'price', label: `单价 ≤ ${money(fields.maxPrice * 100)}` });
  return {
    object: `餐桌 · ${current.name}`,
    objectId: table.id,
    action: '替换这一件',
    goal: '价格更低',
    tone: '浅木色',
    hard,
    preserve,
    compromise: fields.allowSmaller ? '桌面可以略小（下限需确认）' : null,
    life: fields.lifeGoals || LIFE_GOALS,
    pending: ['安装费未计入已知合计，仍是待确认项'],
    basis: `餐办共用 C v${state.version}`,
  };
};

const tradeoffFor = (id, state, fields) => {
  const p = product(id);
  const current = product(tableOf(state.objects).productId);
  const rightGap = clearances(state, id).right;
  const areaDelta = Math.round(((p.l * p.w - current.l * current.w) / (current.l * current.w)) * 100);
  const notes = [];
  if (p.l === current.l && p.w === current.w) notes.push('桌面尺寸不变，只改变价格与表面工艺。');
  if (p.l < current.l) notes.push(`桌长减少 ${current.l - p.l}cm，右侧净距增加到 ${rightGap}cm。`);
  if (p.w < current.w) notes.push(`桌宽减少 ${current.w - p.w}cm，前侧回流动线更松。`);
  if (p.material !== current.material) notes.push(`材质从${current.material}变为${p.material}，色系仍在浅木范围。`);
  return {
    areaDelta,
    rightGap,
    notes,
    office: p.w >= 75 ? '两人并排摆放笔记本仍宽裕，双屏需紧凑支架。' : '两人并排办公偏紧，双屏建议使用支架或改单屏。',
    dining: p.l >= 140 ? '两人日常用餐舒适，靠墙可临时加一把椅子。' : '两人用餐刚好，不适合四人聚餐。',
  };
};

/**
 * 按当前意图筛选示例目录，并给出每款的通过/排除原因。
 */
export const searchCatalog = (state, fields) => {
  const table = tableOf(state.objects);
  const current = product(table.productId);
  const minLength = fields.minLength ?? 0;
  const minWidth = fields.minWidth ?? 0;
  const maxPrice = fields.maxPrice ? fields.maxPrice * 100 : null;

  const rows = ALT_IDS.map((id) => {
    const p = product(id);
    const reasons = [];
    if (p.l < minLength) reasons.push(`长 ${p.l}cm 低于确认下限 ${minLength}cm`);
    if (p.w < minWidth) reasons.push(`宽 ${p.w}cm 低于确认下限 ${minWidth}cm`);
    if (maxPrice && p.price > maxPrice) reasons.push(`单价 ${money(p.price)} 超出上限 ${money(maxPrice)}`);
    if (fields.goal === 'cheaper' && p.price >= current.price) reasons.push('价格没有低于当前餐桌');
    const placement = placementIssue(state, table, id);
    if (placement) reasons.push(placement.text);
    const impact = impactFor(state, id);
    return {
      productId: id,
      product: p,
      eligible: reasons.length === 0,
      reasons,
      impact,
      clearance: clearances(state, id),
      tradeoff: tradeoffFor(id, state, fields),
      score: {
        structure: p.l >= minLength && p.w >= minWidth ? 98 : 72,
        material: p.material === current.material ? 96 : 94,
      },
    };
  });

  const eligible = rows.filter((r) => r.eligible).sort((a, b) => b.impact.nextPrice - a.impact.nextPrice);
  const excluded = rows.filter((r) => !r.eligible).sort((a, b) => b.impact.nextPrice - a.impact.nextPrice);
  const recommended = [...eligible].sort((a, b) => a.impact.nextPrice - b.impact.nextPrice)[0] || null;
  return {
    rows,
    eligible,
    excluded,
    recommendedId: recommended?.productId || null,
    count: eligible.length,
    excludedCount: excluded.length,
  };
};

export const validateCandidate = (state, productId, fields) => {
  const result = searchCatalog(state, fields);
  const row = result.rows.find((r) => r.productId === productId);
  if (!row) return { ok: false, text: '候选不在示例目录中。' };
  if (!row.eligible) return { ok: false, text: row.reasons.join('；') };
  return { ok: true, row, result };
};

export const staleInfo = (state) => {
  const { agent } = state;
  if (!agent.proposal || !['ready', 'preview'].includes(agent.phase)) return null;
  if (agent.baseRevision === state.revision && agent.baseBriefRevision === state.briefRevision) return null;
  return {
    title: '候选依据已变化',
    detail:
      agent.staleNote ||
      '当前方案或任务描述在你查看候选后发生了变化。候选仍然保留，但需要按最新状态重新检查后才能应用。',
    changedPosition: agent.baseRevision !== state.revision,
    changedBrief: agent.baseBriefRevision !== state.briefRevision,
  };
};

export const changeSummary = (beforeId, afterId) => {
  const before = product(beforeId);
  const after = product(afterId);
  return {
    product: `${before.name} → ${after.name}`,
    size: `${before.l} × ${before.w} × ${before.h} cm → ${after.l} × ${after.w} × ${after.h} cm`,
    price: `${money(before.price)} → ${money(after.price)}`,
    delta: after.price - before.price,
  };
};

export const timeLabel = (ts) =>
  new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export const objectTitle = (object) =>
  object.productId ? product(object.productId).full : object.name;

export const objectSpec = (object) => {
  if (object.productId) {
    const p = product(object.productId);
    return `${p.l} × ${p.w} × ${p.h} cm`;
  }
  return object.spec;
};

export const schemeCPrice = (state) => knownTotal(state.objects);

export const versionLabel = (version) => `C v${version}`;

export const findSnapshot = (state, version) =>
  state.snapshots.find((s) => s.version === version) || state.snapshots[state.snapshots.length - 1];

export const snapshotsForCompare = (state) => {
  const v3 = state.snapshots.find((s) => s.version === 3);
  const latest = state.snapshots[state.snapshots.length - 1];
  return { v3, latest };
};
