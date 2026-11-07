import fs from 'node:fs';
const file=new URL('../src/main.jsx',import.meta.url);
let s=fs.readFileSync(file,'utf8');
function replace(a,b){if(!s.includes(a))throw new Error('Missing edit target: '+a.slice(0,70));s=s.replace(a,b);}
replace("commit(moveObject(stateRef.current,id,patch));setIssue('');setApplied(false);", "commit(moveObject(stateRef.current,id,patch));setIssue('');");
replace("useEffect(()=>{if(stale)setPreview(false);},[stale]);", "useEffect(()=>{if(stale)setPreview(false);},[stale]);\n  useEffect(()=>{document.querySelector('.agent-scroll')?.scrollTo({top:0});},[phase]);");
replace('className="agent-scroll"','className={"agent-scroll "+(phase===\'results\'?\'show-results\':\'\')}');
replace("{!applied&&<><div className=\"intent-section\">", "{!applied&&<>{phase==='results'&&summary&&<div className=\"confirmed-brief\"><span><CheckOutlined/> 已确认条件</span><p>长 ≥ {summary.minLength}cm · 宽 ≥ {summary.minWidth}cm · {summary.tone}</p><button onClick={()=>{setPhase('summary');setPreview(false);}}>修改要求 <ArrowRightOutlined/></button></div>}{phase!=='results'&&<div className=\"intent-section\">");
replace('整理修改要求</Button>}</div>', '整理修改要求</Button>}</div>}');
replace('{summary&&<section className="summary-card">', '{summary&&phase!==\'results\'&&<section className="summary-card">');
replace('餐桌、空间占地与预算已同步。其他物品和位置保持不变。','餐桌、空间占地与预算已同步。本次替换没有改变其他物品；后续手动调整独立保留。');
fs.writeFileSync(file,s);
