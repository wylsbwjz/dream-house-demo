import React, {useRef,useState,useEffect} from 'react';
import {product,tableOf,dimensions} from './core.mjs';

export function Room({state,candidateId,selected='table-01',onSelect,onMove,view='iso',grid=true,mini=false,interactive=true}) {
  const svg=useRef(null),drag=useRef(null);const [local,setLocal]=useState(null);
  const base=tableOf(state);const t={...base,...(local||{}),...(candidateId?{productId:candidateId}:{})};
  const d=dimensions(t);const tableProduct=product(t.productId);const isPlan=view==='plan';
  useEffect(()=>setLocal(null),[state.revision,candidateId]);
  const P=(x,y,z=0)=>isPlan?[150+x*1.12,80+y*1.12]:[115+x*1.12+y*.31,185-x*.075+y*.86-z*.85];
  const poly=(pts)=>pts.map(p=>P(...p).join(',')).join(' ');
  function box(x,y,l,w,h,top,front,side,stroke='none',key,baseZ=0){
    return <g key={key}>
      {!isPlan&&<><polygon points={poly([[x,y+w,baseZ],[x+l,y+w,baseZ],[x+l,y+w,h],[x,y+w,h]])} fill={front}/><polygon points={poly([[x+l,y,baseZ],[x+l,y+w,baseZ],[x+l,y+w,h],[x+l,y,h]])} fill={side}/></>}
      <polygon points={poly([[x,y,h],[x+l,y,h],[x+l,y+w,h],[x,y+w,h]])} fill={top} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round"/>
    </g>;
  }
  const rect=(x,y,l,w,z,fill,stroke,sw=1)=> <polygon points={poly([[x,y,z],[x+l,y,z],[x+l,y+w,z],[x,y+w,z]])} fill={fill} stroke={stroke} strokeWidth={sw}/>;
  const pointInSVG=e=>{const p=svg.current.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.current.getScreenCTM().inverse());};
  const floorDelta=(dx,dy)=>isPlan?{x:dx/1.12,y:dy/1.12}:{x:(.86*dx-.31*dy)/(.98645),y:(.075*dx+1.12*dy)/(.98645)};
  function start(e){if(!interactive||mini||!onMove)return;e.preventDefault();e.stopPropagation();onSelect?.('table-01');const p=pointInSVG(e);drag.current={p,original:{x:base.x,y:base.y}};e.currentTarget.setPointerCapture(e.pointerId);}
  function move(e){if(!drag.current)return;const p=pointInSVG(e),delta=floorDelta(p.x-drag.current.p.x,p.y-drag.current.p.y);setLocal({x:Math.round((drag.current.original.x+delta.x)/10)*10,y:Math.round((drag.current.original.y+delta.y)/10)*10});}
  function end(){if(!drag.current)return;drag.current=null;if(local)onMove?.({x:local.x,y:local.y});setLocal(null);}
  function key(e){if(!interactive||!onMove)return;const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];if(delta){e.preventDefault();onMove({x:base.x+delta[0],y:base.y+delta[1]});}if(e.key.toLowerCase()==='r'){e.preventDefault();onMove({rotation:(base.rotation+90)%360});}}
  const sofa=state.objects.find(o=>o.kind==='sofa');const sx=sofa.x,sy=sofa.y;
  const chairs=state.objects.find(o=>o.kind==='chairs');
  function chair(x,y,backY){return <g>{!isPlan&&[[4,4],[34,4],[4,30],[34,30]].map(([dx,dy],i)=>box(x+dx,y+dy,4,4,42,'#c3a57b','#ae8e65','#9b7b54','none',i))}{box(x,y,42,37,43,'#d0b68e','#b99b72','#a58865','none',null,39)}{!isPlan&&box(x,backY,42,5,78,'#d6bd95','#c6a67e','#b39670','none',null,51)}</g>;}
  const label=P(t.x+d.l/2,t.y,112);
  const footprint=poly([[t.x,t.y,0],[t.x+d.l,t.y,0],[t.x+d.l,t.y+d.w,0],[t.x,t.y+d.w,0]]);
  return <svg ref={svg} className={'room-svg '+(mini?'mini':'')} viewBox={isPlan?'70 30 820 570':'30 -30 960 660'} role="img" aria-label={`客厅${isPlan?'平面':'等轴测'}空间，餐桌 ${tableProduct.id}，${tableProduct.l}乘${tableProduct.w}厘米`}>
    <defs>
      <linearGradient id="wall" x2="0" y2="1"><stop stopColor="#eee7db"/><stop offset="1" stopColor="#d9ccbb"/></linearGradient>
      <linearGradient id="floor" x2=".8" y2="1"><stop stopColor="#e7d8c0"/><stop offset="1" stopColor="#cdb594"/></linearGradient>
      <linearGradient id="wood" x2="0" y2="1"><stop stopColor="#e5c89d"/><stop offset="1" stopColor="#d4af7d"/></linearGradient>
      <linearGradient id="window" x2=".5" y2="1"><stop stopColor="#c8d6ce"/><stop offset="1" stopColor="#f7f5e9"/></linearGradient>
      <filter id="softShadow" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#61492c" floodOpacity=".15"/></filter>
      <pattern id="rugPattern" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#e5dfd1"/><path d="M0 0L4 4" stroke="#d3cbbb" strokeWidth=".7"/></pattern>
    </defs>
    <g filter="url(#softShadow)">{rect(0,0,600,410,0,'url(#floor)','#c4b69d')}</g>
    {!isPlan&&<g>
      <polygon points={poly([[0,0,0],[600,0,0],[600,0,195],[0,0,195]])} fill="url(#wall)" stroke="#d2c5b1"/>
      <polygon points={poly([[0,0,0],[0,410,0],[0,410,195],[0,0,195]])} fill="#e8e0d3" stroke="#d2c5b1"/>
      <polygon points={poly([[400,0,64],[575,0,64],[575,0,175],[400,0,175]])} fill="url(#window)" stroke="#8e8574" strokeWidth="6"/>
      <polyline points={poly([[485,0,64],[485,0,175]])} stroke="#8e8574" strokeWidth="4"/>
      <polygon points={poly([[84,0,83],[190,0,83],[190,0,167],[84,0,167]])} fill="#f5eee0" stroke="#86664b" strokeWidth="5"/>
      <polygon points={poly([[95,0,90],[138,0,90],[179,0,150],[155,0,158]])} fill="#966d4f"/>
      <polygon points={poly([[142,0,90],[178,0,90],[178,0,127]])} fill="#bda68b"/>
      <path d={`M${P(0,0,4)}L${P(600,0,4)}`} stroke="#b5a187" strokeWidth="5"/>
    </g>}
    {Array.from({length:31},(_,i)=><polyline key={'floor'+i} points={poly([[i*20,0,0],[i*20,410,0]])} stroke="#b29b78" strokeWidth=".7" opacity=".35"/>)}
    {Array.from({length:14},(_,i)=><polyline key={'seam'+i} points={poly([[0,i*30,0],[600,i*30,0]])} stroke="#ede3cf" strokeWidth=".5" opacity=".55"/>)}
    {rect(25,155,260,225,1,'url(#rugPattern)','#d1c7b6')}
    {grid&&!mini&&<g opacity=".28" pointerEvents="none">{Array.from({length:61},(_,i)=><polyline key={'gx'+i} points={poly([[i*10,0,2],[i*10,410,2]])} stroke="#73978c" strokeWidth={i%5===0?1.2:.55}/>)}{Array.from({length:42},(_,i)=><polyline key={'gy'+i} points={poly([[0,i*10,2],[600,i*10,2]])} stroke="#73978c" strokeWidth={i%5===0?1.2:.55}/>)}</g>}
    {box(333,20,186,40,68,'#c6ac87','#ac8b66','#987959')}
    {Array.from({length:3},(_,i)=><polyline key={'cabinet'+i} points={poly([[333+i*62,60,10],[333+i*62,60,60]])} stroke="#967657"/>) }
    {box(355,25,38,24,75,'#eee5d4','#e4d7c3','#c9bda8','none',null,68)}
    <g onClick={()=>interactive&&onSelect?.('sofa-01')} className={interactive?'selectable':''}>
      {box(sx,sy,230,88,31,'#b9ad96','#ab9e87','#9b8b74')}
      {box(sx,sy,230,19,78,'#e9e2d5','#d9cfbd','#c9bea9')}
      {[0,1,2].map(i=>box(sx+13+i*69,sy+22,66,54,44,'#e7e0d2','#cec3b0','#c2b69f','none','seat'+i))}
      {box(sx,sy,15,88,61,'#ded5c5','#c9bea9','#c2b69e')}{box(sx+215,sy,15,88,61,'#ded5c5','#c9bea9','#bdae96')}
      {selected==='sofa-01'&&rect(sx,sy,230,88,80,'none','#299f91',3)}
    </g>
    {box(106,277,105,60,36,'#92745b','#6c513c','#806149')}
    {box(135,290,26,18,39,'#ece5d7','#e0d6c3','#cbbba1','none',null,36)}
    <g>{box(36,130,28,28,5,'#796a50','#66583f','#544a36')}
      <polyline points={poly([[50,144,0],[50,144,141]])} stroke="#7b6850" strokeWidth="4"/>
      {box(29,123,42,42,148,'#faf2df','#e0d5bb','#d5c7a9','none',null,121)}
    </g>
    <g>{box(550,45,36,36,38,'#b78663','#a46d4d','#8d573c')}
      {[[-8,0,66],[8,4,91],[0,0,120],[18,8,65],[-14,10,97],[10,-5,112]].map(([x,y,z],i)=>{const p=P(568+x,63+y,z);return <g key={i}><line x1={P(568,63,38)[0]} y1={P(568,63,38)[1]} x2={p[0]} y2={p[1]} stroke="#617b50" strokeWidth="3"/><ellipse cx={p[0]} cy={p[1]} rx="16" ry="9" fill={i%2?'#7a8b5b':'#586e4b'} transform={`rotate(${i*32},${p[0]},${p[1]})`}/></g>;})}
    </g>
    {/* The exact same geometry drives the table and its floor footprint. */}
    {(selected==='table-01'||candidateId)&&<g pointerEvents="none"><polygon data-testid="footprint" data-length={d.l} data-width={d.w} data-x={t.x} data-y={t.y} points={footprint} fill="#299f91" fillOpacity=".38" stroke="#167a6e" strokeWidth="2.2"/>
      {[[t.x,t.y],[t.x+d.l,t.y],[t.x+d.l,t.y+d.w],[t.x,t.y+d.w]].map(([x,y],i)=><polyline key={i} points={poly([[x,y,0],[x,y,74]])} stroke="#299f91" strokeDasharray="3 5" opacity=".55"/>)}
    </g>}
    {chair(chairs.x,chairs.y,chairs.y-1)}
    <g className={interactive?'table-object':''} data-testid="room-table" role={interactive?'button':undefined} tabIndex={interactive&&!mini?0:undefined} aria-label={interactive?'选中餐桌；方向键移动，R 旋转':undefined} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;setLocal(null);}} onKeyDown={key} onClick={()=>interactive&&onSelect?.('table-01')}>
      {!isPlan&&[[7,7],[d.l-13,7],[7,d.w-13],[d.l-13,d.w-13]].map(([x,y],i)=>box(t.x+x,t.y+y,6,6,72,'#c7a87d','#b08b61','#98764f','none','leg'+i))}
      {box(t.x,t.y,d.l,d.w,74,'url(#wood)','#bd956a','#b38b5e','none',null,70)}
      {rect(t.x,t.y,d.l,d.w,74,'transparent',selected==='table-01'?'#fff9ee':'#c19f75',selected==='table-01'?5:1)}
      {selected==='table-01'&&rect(t.x,t.y,d.l,d.w,74,'transparent','#168474',2.5)}
      {Array.from({length:4},(_,i)=><polyline key={i} points={poly([[t.x+10,t.y+14+i*15,74.2],[t.x+d.l-10,t.y+14+i*15,74.2]])} stroke="#a78054" opacity=".2" strokeWidth=".8"/>)}
    </g>
    {chair(chairs.x+84,chairs.y+119,chairs.y+150)}
    {!mini&&selected==='table-01'&&<g pointerEvents="none">
      <g transform={`translate(${label[0]-93},${label[1]-21})`}><rect width="186" height="32" rx="8" fill="#5b3a2e"/><circle cx="16" cy="16" r="3" fill="#80c3b7"/><text x="29" y="21" fill="#fffaf1" fontSize="12">{tableProduct.id} · {tableProduct.l} × {tableProduct.w} cm</text></g>
      <polyline points={poly([[t.x,t.y+d.w+55,0],[t.x+d.l,t.y+d.w+55,0]])} stroke="#476c62" strokeWidth="1.5"/>
      <text x={P(t.x+d.l/2,t.y+d.w+67)[0]} y={P(t.x+d.l/2,t.y+d.w+67)[1]+11} textAnchor="middle" fill="#355f54" fontSize="12">{tableProduct.l} cm</text>
    </g>}
    {!mini&&<g><text x="103" y="594" fill="#8b7c68" fontSize="11" letterSpacing="2">DREAM HOUSE / LIVING ROOM</text><text x="884" y="594" fill="#8b7c68" fontSize="11" textAnchor="end">{grid?'10 cm 网格 · ':''}示例空间，非实测</text></g>}
  </svg>;
}

export function TableThumb({id='T150',small=false}){const p=product(id);return <svg className={small?'table-thumb small':'table-thumb'} viewBox="0 0 180 100" aria-hidden="true"><ellipse cx="91" cy="86" rx="65" ry="8" fill="#8f7755" opacity=".1"/><path d="M37 38L42 86M147 34L143 82M54 56L57 90M162 51L157 85" stroke="#b39269" strokeWidth="5"/><path d={`M24 32 L${p.l===140?139:149} 23 L167 47 L44 60Z`} fill="#d7b98d" stroke="#b59063"/><path d="M44 60L167 47V52L44 65L24 37V32" fill="#bc966a"/><path d="M45 43L145 33M53 49L152 39" stroke="#c6a175" opacity=".6"/></svg>;}
