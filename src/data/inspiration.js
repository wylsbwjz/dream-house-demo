/**
 * 灵感分区示例内容：案例、设计要素与笔记类型。
 * 全部为概念演示数据，不代表真实作者、案例或价格。
 */

export const INSPIRATION_BOARDS = [
  { id: 'board-living', label: '梧桐里 · 客厅灵感板', note: '当前项目' },
  { id: 'board-unsorted', label: '未整理', note: '默认收藏位置' },
  { id: 'board-style', label: '风格参考', note: '跨项目' },
];

export const INSPIRATIONS = [
  {
    id: 'insp-nordic',
    title: '浅木色小户型，一张桌子两用',
    cover: `${import.meta.env.BASE_URL}img/insp-nordic.jpg`,
    source: '示例案例 · 居住改造',
    space: '客厅 22㎡',
    budget: '¥7,900',
    style: '奶油暖调',
    tags: ['浅木色', '餐办共用', '小户型'],
    summary:
      '同一张浅木色长桌承担两人用餐与偶尔办公：用餐时收起设备，办公时把餐椅靠墙，靠窗侧保留完整回流动线。墙面与织物保持奶油白，避免小空间出现大面积深色。',
    elements: {
      direct: ['浅木色餐桌（140cm 级别）', '奶油白墙面与亚麻织物', '靠窗保留通行区'],
      choose: ['餐办共用的紧凑桌面', '保留原有沙发，仅微调位置'],
      measure: ['窗边进深', '餐桌与沙发之间的过道净宽'],
      unknown: ['案例中的真实品牌与库存', '当前可成交价格'],
    },
    adoptText:
      '参考《浅木色小户型，一张桌子两用》案例：只替换餐桌，采用浅木色与更紧凑的桌面，长至少 140cm、宽至少 75cm，保留沙发、地板与其余布局。',
    note: '喜欢浅木色，但保留现有沙发。',
  },
  {
    id: 'insp-wood',
    title: '原木长桌的餐桌区节奏',
    cover: `${import.meta.env.BASE_URL}img/insp-wood.jpg`,
    source: '示例案例 · 材质笔记',
    space: '客厅 24㎡',
    budget: '¥8,300',
    style: '原木自然',
    tags: ['白蜡木', '长桌', '暖木色'],
    summary:
      '白蜡木长桌与同色系餐椅构成明确的用餐区，桌面上只保留一盏小灯与少量静物；收纳集中在矮柜，让桌面日常保持干净，适合需要快速切换餐办状态的家庭。',
    elements: {
      direct: ['白蜡木长桌', '同色系餐椅 ×2', '桌面少量静物'],
      choose: ['桌面长度是否缩短', '是否保留矮柜收纳'],
      measure: ['长桌与阳台推拉门的距离', '矮柜上方挂画高度'],
      unknown: ['木材等级与表面工艺', '配送周期'],
    },
    adoptText:
      '参考《原木长桌的餐桌区节奏》案例：只替换餐桌，采用白蜡木浅木色，桌面保持 150×80cm 或更紧凑，保留沙发、地板与矮柜。',
    note: '桌面少放东西，收纳进矮柜。',
  },
  {
    id: 'insp-olive',
    title: '绿植与阳光：轻盈的客厅底色',
    cover: `${import.meta.env.BASE_URL}img/insp-olive.jpg`,
    source: '示例案例 · 氛围参考',
    space: '客厅 26㎡',
    budget: '¥8,900',
    style: '自然轻盈',
    tags: ['绿植', '西窗采光', '轻装饰'],
    summary:
      '把深色压到最低，用绿植、浅色织物和下午的西窗光组织氛围；家具轮廓保持简单，重点装饰只出现在墙面与角落，通行区域完全让出来。',
    elements: {
      direct: ['绿植与陶土盆', '浅色织物', '低饱和墙面'],
      choose: ['是否增加落地灯', '装饰画的位置'],
      measure: ['下午西晒强度', '窗台可用宽度'],
      unknown: ['植物的养护条件', '陶盆尺寸库存'],
    },
    adoptText:
      '参考《绿植与阳光》案例：只替换餐桌，优先浅木色，并在不移动其他物品的前提下保留靠窗采光，长宽至少 140×75cm。',
    note: '想要一点绿植点缀，但不占用通行区。',
  },
  {
    id: 'insp-cream',
    title: '奶油侘寂：少而软的用餐角落',
    cover: `${import.meta.env.BASE_URL}img/insp-cream.jpg`,
    source: '示例案例 · 风格参考',
    space: '客厅 20㎡',
    budget: '¥7,200',
    style: '奶油侘寂',
    tags: ['奶油色', '软装', '留白'],
    summary:
      '用餐区只保留桌子、两把椅子和一盏小灯，其余交给留白与柔软织物；墙面、地板与家具处在同一个奶油色阶里，靠材质差异而不是颜色差异分层。',
    elements: {
      direct: ['奶油色餐桌与织物', '单盏小吊灯或落地灯', '大面积留白'],
      choose: ['桌面尺寸是否最小化', '是否去掉多余装饰'],
      measure: ['地面材质反光', '灯具安装位置'],
      unknown: ['同色系商品的可购性', '织物洗护说明'],
    },
    adoptText:
      '参考《奶油侘寂》案例：只替换餐桌，采用浅木色或奶油色系，桌面可以更小但需保留两人用餐，长至少 130cm、宽至少 70cm，其他物品不变。',
    note: '少一点东西，多一点留白。',
  },
];

export const NOTE_KINDS = {
  decision: { label: '决策笔记', tone: 'teal-soft', hint: '记录一次对比与选择理由' },
  idea: { label: '灵感笔记', tone: 'muted', hint: '记录一个想法或参考' },
  scheme: { label: '方案笔记', tone: 'info', hint: '记录一个方案的背景与差异' },
};

export const DECISION_REASONS = [
  '尺寸不变，价格更低',
  '桌面更小，通道更宽',
  '两人办公更合适',
  '保持浅木色系',
  '先记录，之后再决定',
];

/* ---------- 方案画布上的灵感素材（只展示、可定位，不需打开） ---------- */

export const CANVAS_PALETTE = [
  { name: '奶油白', hex: '#F3E9D7' },
  { name: '米杏', hex: '#EADCC8' },
  { name: '燕麦浅棕', hex: '#D6BFA6' },
  { name: '焦糖', hex: '#B08968' },
  { name: '摩卡', hex: '#7A553A' },
  { name: '巧克力', hex: '#5B3A2E' },
  { name: '锈橙', hex: '#B85E2E' },
  { name: '橄榄绿', hex: '#6B8E5A' },
];

export const CANVAS_STYLE_TAGS = ['奶油暖调', '原木自然', '自然轻盈', '奶油侘寂'];

export const CANVAS_MATERIALS = [
  { name: '白蜡木', hex: '#D9B98C' },
  { name: '橡木', hex: '#C9A472' },
  { name: '亚麻', hex: '#DED3BC' },
  { name: '陶土', hex: '#B98763' },
  { name: '羊毛', hex: '#E7DCC8' },
  { name: '藤编', hex: '#C8A97B' },
];

export const CANVAS_FURNITURE = [
  { id: 'T150L', label: '保持桌面 · 省 ¥300' },
  { id: 'T140', label: '更紧凑 · 省 ¥500' },
  { id: 'R130', label: '紧凑高性价比 · 省 ¥900' },
];
