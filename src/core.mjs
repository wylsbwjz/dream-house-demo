export const CATALOG = Object.freeze([
  { id:'T150', name:'栖木 T150', l:150, w:80, h:74, price:219900, tone:'浅木色', description:'当前餐桌 · 宽裕的共用桌面' },
  { id:'T150-Lite', name:'栖木 T150 Lite', l:150, w:80, h:74, price:189900, tone:'浅木色', description:'保留桌面大小，节省 ¥300' },
  { id:'T140', name:'栖木 T140', l:140, w:75, h:74, price:169900, tone:'浅木色', description:'桌面小一些，预算轻一些' },
  { id:'T120', name:'栖木 T120', l:120, w:70, h:74, price:149900, tone:'浅木色', description:'紧凑双人桌，需核对办公空间' }
]);
export const ROOM = { l:600, w:410, area:24.6 };
export const EXAMPLE = '只换这张餐桌，找便宜一点的浅木色款。长至少140cm、宽至少75cm，其他物品和位置保持不变。';
export const money = cents => '¥' + (cents / 100).toLocaleString('zh-CN', {maximumFractionDigits:2});
export const product = id => { const p = CATALOG.find(p=>p.id===id); if(!p) throw new Error('商品不在示例目录中'); return p; };
export const clone = x => structuredClone(x);
export const uid = () => globalThis.crypto.randomUUID();
const fail = (message, code='INVALID') => { const e = new Error(message); e.code=code; throw e; };
export function initialState() {
  const objects = [
    {id:'sofa-01',name:'浅米色三人沙发',kind:'sofa',existing:true,l:230,w:88,h:76,x:35,y:174,rotation:0,price:0,qty:1},
    {id:'table-01',kind:'table',productId:'T150',x:360,y:211,rotation:0,qty:1},
    {id:'chairs-01',name:'白蜡木餐椅',kind:'chairs',price:136000,qty:2,x:366,y:180,l:45,w:45,h:78},
    {id:'cabinet-01',name:'原木收纳矮柜',kind:'cabinet',price:89000,qty:1,x:333,y:20,l:186,w:40,h:68,rotation:0},
    {id:'lamp-01',name:'亚麻落地灯',kind:'lamp',price:65900,qty:1,x:36,y:130,l:30,w:30,h:150},
    {id:'rug-01',name:'羊毛混纺地毯',kind:'rug',price:169000,qty:1,x:38,y:165,l:240,w:190,h:1},
    {id:'art-01',name:'抽象装饰画',kind:'art',price:38900,qty:1,x:110,y:0,l:80,w:5,h:80},
    {id:'plant-01',name:'绿植与陶土盆',kind:'plant',price:49300,qty:1,x:550,y:45,l:36,w:36,h:120},
    {id:'coffee-01',name:'已有木质茶几',kind:'coffee',existing:true,price:0,qty:1,x:106,y:277,l:105,w:60,h:36,rotation:0},
    {id:'floor-01',name:'现有原木地板',kind:'floor',existing:true,price:0,qty:1}
  ];
  const saved={version:3,label:'餐办共用',objects:clone(objects),time:Date.now(),reason:'初始方案'};
  return {schema:1,sessionId:uid(),revision:0,briefRevision:0,version:3,objects,snapshots:[saved],proposal:null,events:[],appliedOps:[],undoStack:[],dirty:false};
}
export function tableOf(state) {return state.objects.find(o=>o.id==='table-01');}
export function dimensions(obj) { const p=obj.productId?product(obj.productId):obj; return {l:obj.rotation%180?p.w:p.l,w:obj.rotation%180?p.l:p.w,h:p.h}; }
export function costs(state, candidateId) {
  const goods = state.objects.reduce((s,o)=>s+(o.productId?product(o.id==='table-01'&&candidateId?candidateId:o.productId).price:o.price||0),0);
  return {goods,delivery:40000,known:goods+40000,installation:null,gap:1000000-goods-40000};
}
export function geometryIssue(state, table=tableOf(state)) {
  const d=dimensions(table);
  if(table.x<0 || table.y<0 || table.x+d.l>ROOM.l || table.y+d.w>ROOM.w) return '餐桌超出房间边界，请调整位置。';
  const solid=state.objects.filter(o=>['sofa','cabinet','coffee'].includes(o.kind));
  for(const o of solid){const b=dimensions(o);if(table.x<o.x+b.l&&table.x+d.l>o.x&&table.y<o.y+b.w&&table.y+d.w>o.y) return `餐桌与${o.name}重叠，请调整位置。`;}
  return null;
}
function event(s,type,label,detail={}){s.events.unshift({id:uid(),type,label,time:Date.now(),...detail});s.events=s.events.slice(0,80);}
export function normalizeIntent(value) {
  if(value.target!=='table-01') fail('本次只支持餐桌替换，其他物品暂不修改。');
  const n={target:'table-01',minLength:Number(value.minLength),minWidth:Number(value.minWidth),maxPrice:value.maxPrice==null||value.maxPrice===''?null:Number(value.maxPrice),tone:value.tone||'浅木色',cheaper:value.cheaper!==false,keepOther:true,keepPosition:true,goal:'两人用餐，偶尔办公'};
  if(!Number.isFinite(n.minLength)||!Number.isFinite(n.minWidth)||n.minLength<60||n.minLength>300||n.minWidth<40||n.minWidth>160) fail('请确认可接受的桌面尺寸（长 60–300cm，宽 40–160cm）。');
  if(n.maxPrice!==null&&(!Number.isFinite(n.maxPrice)||n.maxPrice<=0||n.maxPrice>100000)) fail('请输入有效的餐桌价格上限。');
  if(!['浅木色','不限'].includes(n.tone)) fail('示例目录仅含浅木色；请调整偏好或扩大后续目录。');
  return n;
}
export function parseOffline(text,current) {
  const issues=[]; const v=text.trim();
  if(!v) return {unsupported:'先描述希望怎样调整餐桌。'};
  if(/(换|改|删除|添加).{0,4}(沙发|地板|椅子|墙|灯)/.test(v)&&!/(不换|不改|保留)/.test(v)) return {unsupported:'当前演示只开放餐桌替换。可以修改价格、尺寸与颜色要求。'};
  let l=v.match(/(?:长(?:度)?(?:至少|不低于|不小于|≥|>=|最小|下限|为)?\s*)(\d+(?:\.\d+)?)/)?.[1];
  let w=v.match(/(?:宽(?:度)?(?:至少|不低于|不小于|≥|>=|最小|下限|为)?\s*)(\d+(?:\.\d+)?)/)?.[1];
  const pair=v.match(/(\d{2,3})\s*[×xX*]\s*(\d{2,3})/); if(pair){l??=pair[1];w??=pair[2];}
  if(/(尺寸|大小).{0,4}(不变|一样)|同尺寸/.test(v)){l=current.l;w=current.w;}
  if(l==null||w==null) issues.push('你愿意接受多大的桌面？请确认长、宽下限，系统不会把“略小”当作确定尺寸。');
  const price=v.match(/(?:不超过|预算(?:上限)?|最多|低于|上限)\s*[¥￥]?\s*(\d+(?:\.\d+)?)/)?.[1];
  const tone=/黑色|深木色|胡桃/.test(v)?'其他颜色':/颜色不限|任意颜色/.test(v)?'不限':'浅木色';
  if(tone==='其他颜色') return {unsupported:'示例商品库暂无这一颜色。可以改用浅木色，或保留当前方案。'};
  return {intent:{target:'table-01',minLength:l?Number(l):null,minWidth:w?Number(w):null,maxPrice:price?Number(price):null,tone,cheaper:true,keepOther:true,keepPosition:true},issues};
}
export function filterCatalog(state,intent) {
  const i=normalizeIntent(intent);const now=product(tableOf(state).productId);
  return CATALOG.filter(p=>p.id!==now.id).map(p=>{
    const reasons=[];
    if(p.l<i.minLength||p.w<i.minWidth) reasons.push(`桌面 ${p.l}×${p.w}cm 小于 ${i.minLength}×${i.minWidth}cm 下限`);
    if(i.cheaper&&p.price>=now.price) reasons.push('价格没有低于当前餐桌');
    if(i.maxPrice!==null&&p.price>i.maxPrice*100) reasons.push('超出餐桌价格上限');
    const issue=geometryIssue(state,{...tableOf(state),productId:p.id}); if(issue)reasons.push(issue);
    return {productId:p.id,eligible:!reasons.length,reasons,saving:now.price-p.price,known:costs(state,p.id).known};
  }).sort((a,b)=>product(b.productId).price-product(a.productId).price);
}
export function makeProposal(state,intent,meta={}) {
  const normalized=normalizeIntent(intent);const results=filterCatalog(state,normalized);
  return {id:uid(),requestId:meta.requestId||uid(),schemeId:'C',targetObjectId:'table-01',baseRevision:state.revision,briefRevision:state.briefRevision,baseVersion:state.version,intent:normalized,results,status:'ready',mode:meta.mode||'offline',toolEvents:meta.toolEvents||[],created:Date.now()};
}
export function isStale(state,proposal=state.proposal){return !!proposal&&(proposal.status!=='ready'||proposal.baseRevision!==state.revision||proposal.briefRevision!==state.briefRevision);}
export function validateApply(state,proposal,productId,schemeId='C') {
  if(schemeId!=='C'||proposal?.schemeId!=='C') fail('候选属于方案 C，请返回 C 后应用。');
  if(!proposal||proposal.targetObjectId!=='table-01') fail('没有可应用的餐桌候选。');
  if(isStale(state,proposal)) fail('方案已变化，候选需要重新校验。','STALE');
  const candidate=filterCatalog(state,proposal.intent).find(r=>r.productId===productId);
  if(!candidate?.eligible) fail(candidate?.reasons.join('；')||'候选不在允许范围内。');
  return candidate;
}
export function applyCandidate(state,proposal,productId,operationId,schemeId='C') {
  if(state.appliedOps.includes(operationId))return state;
  validateApply(state,proposal,productId,schemeId);
  const s=clone(state),table=tableOf(s),before=table.productId;
  table.productId=productId;s.revision++;s.version++;s.dirty=false;s.proposal=null;s.appliedOps.push(operationId);
  s.undoStack.push({operationId,before,after:productId,undone:false});
  s.snapshots.push({version:s.version,objects:clone(s.objects),time:Date.now(),reason:`餐桌 ${before} → ${productId}`});
  event(s,'apply',`已应用 ${productId} · C v${s.version}`,{before,after:productId}); return s;
}
export function undoReplacement(state) {
  const s=clone(state);const op=[...s.undoStack].reverse().find(o=>!o.undone);
  if(!op)fail('没有可以撤销的餐桌替换。');
  if(tableOf(s).productId!==op.after)fail('餐桌型号已有后续修改，无法覆盖。请先处理后续替换。','CONFLICT');
  tableOf(s).productId=op.before;op.undone=true;s.revision++;s.version++;s.dirty=false;s.proposal=null;
  s.snapshots.push({version:s.version,objects:clone(s.objects),time:Date.now(),reason:`撤销 ${op.after}，恢复 ${op.before}`});
  event(s,'undo',`已撤销餐桌替换 · C v${s.version}`,{before:op.after,after:op.before});return s;
}
export function moveObject(state,id,patch) {
  if(!['table-01','sofa-01'].includes(id))fail('当前仅开放餐桌与已有沙发的位置调整。');
  if(Object.keys(patch).some(k=>!['x','y','rotation'].includes(k)))fail('不支持的对象属性。');
  if(Object.values(patch).some(v=>!Number.isFinite(v)))fail('位置必须为有效数字。');
  if(patch.rotation!==undefined&&patch.rotation%90!==0)fail('本次演示以 90° 旋转。');
  const s=clone(state);const o=s.objects.find(o=>o.id===id);Object.assign(o,patch);const d=dimensions(o);
  if(o.x<0||o.y<0||o.x+d.l>ROOM.l||o.y+d.w>ROOM.w)fail('物品超出房间边界。');
  if(id==='table-01'){const issue=geometryIssue(s);if(issue)fail(issue);}
  s.revision++;s.dirty=true;event(s,'manual',`调整${id==='table-01'?'餐桌':'已有沙发'}位置`);return s;
}
export function saveDraft(state){if(!state.dirty)return state;const s=clone(state);s.version++;s.dirty=false;s.snapshots.push({version:s.version,objects:clone(s.objects),time:Date.now(),reason:'保存布局调整'});event(s,'save',`已保存 C v${s.version}`);return s;}
export function changeBrief(state){return {...state,briefRevision:state.briefRevision+1};}
export function attachProposal(state,p){if(p.baseRevision!==state.revision||p.briefRevision!==state.briefRevision)return {...state,proposal:{...p,status:'stale'}};return {...state,proposal:p};}
export function snapshotState(state,snapshot){return {...state,objects:snapshot.objects,version:snapshot.version};}
export function referenceState(){const s=initialState();tableOf(s).productId='T120';s.version=2;return s;}
