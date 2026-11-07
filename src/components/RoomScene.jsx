import React, { useId, useMemo, useRef, useState } from 'react';
import { money, dimsOf, product, tableOf } from '../core/engine.js';
import { ROOM } from '../data/catalog.js';
import { iso, isoPoly, plan, floorDelta, snapCm } from '../core/scene.js';

const C = {
  floorA: '#E7D2B2',
  floorB: '#DFC8A5',
  floorC: '#EBD8BB',
  seam: '#CDB190',
  wall: '#F3EBDF',
  wallSide: '#EDE1D0',
  skirting: '#D9C8B2',
  woodTop: '#DFBE8E',
  woodSide: '#C69C69',
  woodFront: '#B88C58',
  woodLight: '#E9D0A9',
  sofa: '#D4C6B0',
  sofaLight: '#E4D9C7',
  sofaDark: '#B9A78D',
  teal: '#299F91',
  tealDeep: '#16786C',
  ink: '#3B2A22',
  soft: '#7A6555',
  paper: '#FFFCF7',
};

const clampValue = (n, min, max) => Math.max(min, Math.min(max, n));

function Defs(uid) {
  return (
    <defs>
      <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#EBD4B4" />
        <stop offset="0.55" stopColor="#DFC39C" />
        <stop offset="1" stopColor="#CDAE83" />
      </linearGradient>
      <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F5EDE1" />
        <stop offset="1" stopColor="#E6D7C2" />
      </linearGradient>
      <linearGradient id={`${uid}-wallSide`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#EFE4D4" />
        <stop offset="1" stopColor="#DECCB4" />
      </linearGradient>
      <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0" stopColor="#E7C796" />
        <stop offset="0.5" stopColor="#DDBB89" />
        <stop offset="1" stopColor="#D0A873" />
      </linearGradient>
      <linearGradient id={`${uid}-woodDark`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#BE9464" />
        <stop offset="1" stopColor="#AE8455" />
      </linearGradient>
      <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#DDEBE5" />
        <stop offset="0.7" stopColor="#EFF3E7" />
        <stop offset="1" stopColor="#FBF6E8" />
      </linearGradient>
      <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#FFFDF5" stopOpacity="0.9" />
        <stop offset="1" stopColor="#FFF8E6" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${uid}-lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFE9BE" stopOpacity="0.85" />
        <stop offset="1" stopColor="#FFE9BE" stopOpacity="0" />
      </radialGradient>
      <pattern id={`${uid}-rug`} width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#E7DDCB" />
        <path d="M0 0L6 6M-1 1L1 3M5 3L7 5" stroke="#D8CBB4" strokeWidth="0.7" />
      </pattern>
      <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>
  );
}

export function RoomScene({
  objects,
  tableProductId,
  selectedId = 'table-01',
  previewId = null,
  mode = 'iso',
  interactive = true,
  mini = false,
  showGrid = true,
  showDims = true,
  onSelect,
  onMoveTable,
  onRotate,
}) {
  const uid = `dh${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const dragPosRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const table = tableOf(objects);
  const previewProduct = previewId ? product(previewId) : null;
  const activeProduct = previewProduct || product(tableProductId || table.productId);
  const baseDims = dimsOf(table);
  const dims = dimsOf(table, activeProduct.id);
  const t = drag ? { ...table, ...drag } : table;
  const isPreview = !!previewProduct && previewId !== table.productId;
  const selected = selectedId === 'table-01';
  const showHandles = interactive && selected && !mini;

  const other = useMemo(
    () => ({
      sofa: objects.find((o) => o.kind === 'sofa'),
      rug: objects.find((o) => o.kind === 'rug'),
      coffee: objects.find((o) => o.kind === 'coffee'),
      cabinet: objects.find((o) => o.kind === 'cabinet'),
      lamp: objects.find((o) => o.kind === 'lamp'),
      art: objects.find((o) => o.kind === 'art'),
      plant: objects.find((o) => o.kind === 'plant'),
      chair: objects.find((o) => o.kind === 'chair'),
    }),
    [objects]
  );

  const toUser = (event) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const startDrag = (event) => {
    if (!interactive || mini || !onMoveTable) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.('table-01');
    const p = toUser(event);
    dragRef.current = { start: p, origin: { x: table.x, y: table.y } };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const p = toUser(event);
    const delta = floorDelta(p.x - dragRef.current.start.x, p.y - dragRef.current.start.y, mode);
    const next = {
      x: clampValue(snapCm(dragRef.current.origin.x + delta.x), 0, ROOM.l - dims.l),
      y: clampValue(snapCm(dragRef.current.origin.y + delta.y), 0, ROOM.w - dims.w),
    };
    dragPosRef.current = next;
    setDrag(next);
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    const final = dragPosRef.current;
    dragRef.current = null;
    dragPosRef.current = null;
    setDrag(null);
    if (final && onMoveTable) onMoveTable(final);
  };
  const onKeyDown = (event) => {
    if (!interactive || !onMoveTable) return;
    const move = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    }[event.key];
    if (move) {
      event.preventDefault();
      onMoveTable({ x: table.x + move[0], y: table.y + move[1] });
    }
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      onRotate?.();
    }
  };

  const labelAnchor = iso(t.x + dims.l / 2, t.y + dims.w / 2, 118);
  const miniCenter = iso(t.x + dims.l / 2, t.y + dims.w / 2, 40);
  const viewBox = mini
    ? `${Math.round(miniCenter[0] - 280)} ${Math.round(miniCenter[1] - 100)} 560 200`
    : '80 110 860 660';
  const currentLabel = `${activeProduct.id} · ${dims.l} × ${dims.w} cm · ${
    isPreview ? '预计 ' : ''
  }${money(activeProduct.price)}`;
  const sofa = other.sofa;
  const leftGap =
    sofa && t.y < sofa.y + sofa.w && t.y + dims.w > sofa.y ? Math.round(t.x - (sofa.x + sofa.l)) : null;

  if (mode === 'plan') {
    return (
      <PlanScene
        uid={uid}
        objects={objects}
        table={t}
        dims={dims}
        activeProduct={activeProduct}
        isPreview={isPreview}
        selected={selected}
        showHandles={showHandles}
        interactive={interactive}
        mini={mini}
        showGrid={showGrid}
        showDims={showDims}
        svgRef={svgRef}
        startDrag={startDrag}
        moveDrag={moveDrag}
        endDrag={endDrag}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        onRotate={onRotate}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      className={`room-svg ${mini ? 'is-mini' : ''}`}
      viewBox={viewBox}
      role="img"
      aria-label={`客厅等轴测空间，餐桌 ${activeProduct.id}，${dims.l} 乘 ${dims.w} 厘米`}
    >
      {Defs(uid)}
      <title>{`客厅空间，餐桌 ${activeProduct.name}`}</title>
      {/* 地面 */}
      <polygon points={isoPoly([[0, 0, 0], [ROOM.l, 0, 0], [ROOM.l, ROOM.w, 0], [0, ROOM.w, 0]])} fill={`url(#${uid}-floor)`} />
      {Array.from({ length: 30 }, (_, i) => (
        <polygon
          key={`plank-${i}`}
          points={isoPoly([
            [i * 20, 0, 0.2],
            [i * 20 + 20, 0, 0.2],
            [i * 20 + 20, ROOM.w, 0.2],
            [i * 20, ROOM.w, 0.2],
          ])}
          fill={i % 3 === 0 ? C.floorB : i % 3 === 1 ? C.floorA : C.floorC}
          opacity="0.72"
        />
      ))}
      {Array.from({ length: 3 }, (_, i) => (
        <line
          key={`seam-${i}`}
          x1={iso(0, 70 + i * 120, 0.4)[0]}
          y1={iso(0, 70 + i * 120, 0.4)[1]}
          x2={iso(ROOM.l, 70 + i * 120, 0.4)[0]}
          y2={iso(ROOM.l, 70 + i * 120, 0.4)[1]}
          stroke={C.seam}
          strokeWidth="0.9"
          opacity="0.55"
        />
      ))}
      {/* 西窗光带 */}
      <polygon points={isoPoly([[330, 0, 1], [540, 0, 1], [500, 410, 1], [190, 410, 1]])} fill={`url(#${uid}-sun)`} opacity="0.55" />
      <polygon points={isoPoly([[150, 0, 1], [250, 0, 1], [70, 410, 1], [0, 410, 1]])} fill={`url(#${uid}-sun)`} opacity="0.35" />
      {showGrid && !mini && (
        <g pointerEvents="none" opacity="0.5">
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`gx-${i}`}
              x1={iso(i * 50, 0, 0.6)[0]}
              y1={iso(i * 50, 0, 0.6)[1]}
              x2={iso(i * 50, ROOM.w, 0.6)[0]}
              y2={iso(i * 50, ROOM.w, 0.6)[1]}
              stroke={C.tealDeep}
              strokeWidth={i % 2 === 0 ? 0.8 : 0.5}
              opacity={i % 2 === 0 ? 0.2 : 0.11}
            />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`gy-${i}`}
              x1={iso(0, i * 50, 0.6)[0]}
              y1={iso(0, i * 50, 0.6)[1]}
              x2={iso(ROOM.l, i * 50, 0.6)[0]}
              y2={iso(ROOM.l, i * 50, 0.6)[1]}
              stroke={C.tealDeep}
              strokeWidth={i % 2 === 0 ? 0.8 : 0.5}
              opacity={i % 2 === 0 ? 0.2 : 0.11}
            />
          ))}
        </g>
      )}
      {/* 地毯 */}
      {other.rug && (
        <g>
          <polygon
            points={isoPoly([
              [other.rug.x, other.rug.y, 1.4],
              [other.rug.x + other.rug.l, other.rug.y, 1.4],
              [other.rug.x + other.rug.l, other.rug.y + other.rug.w, 1.4],
              [other.rug.x, other.rug.y + other.rug.w, 1.4],
            ])}
            fill={`url(#${uid}-rug)`}
            stroke="#D3C5AE"
            strokeWidth="1.2"
          />
          <polygon
            points={isoPoly([
              [other.rug.x + 8, other.rug.y + 8, 1.5],
              [other.rug.x + other.rug.l - 8, other.rug.y + 8, 1.5],
              [other.rug.x + other.rug.l - 8, other.rug.y + other.rug.w - 8, 1.5],
              [other.rug.x + 8, other.rug.y + other.rug.w - 8, 1.5],
            ])}
            fill="none"
            stroke="#CFBFA6"
            strokeWidth="1.4"
            opacity="0.8"
          />
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={`fringe-${i}`}
              x1={iso(other.rug.x + (i * other.rug.l) / 24, other.rug.y + other.rug.w, 1.2)[0]}
              y1={iso(other.rug.x + (i * other.rug.l) / 24, other.rug.y + other.rug.w, 1.2)[1]}
              x2={iso(other.rug.x + (i * other.rug.l) / 24, other.rug.y + other.rug.w + 5, 1.2)[0]}
              y2={iso(other.rug.x + (i * other.rug.l) / 24, other.rug.y + other.rug.w + 5, 1.2)[1]}
              stroke="#D9CBB4"
              strokeWidth="0.8"
            />
          ))}
        </g>
      )}
      {/* 墙面 */}
      <polygon points={isoPoly([[0, 0, 0], [ROOM.l, 0, 0], [ROOM.l, 0, 280], [0, 0, 280]])} fill={`url(#${uid}-wall)`} />
      <polygon points={isoPoly([[0, 0, 0], [0, ROOM.w, 0], [0, ROOM.w, 280], [0, 0, 280]])} fill={`url(#${uid}-wallSide)`} />
      <line x1={iso(0, 0, 0.4)[0]} y1={iso(0, 0, 0.4)[1]} x2={iso(ROOM.l, 0, 0.4)[0]} y2={iso(ROOM.l, 0, 0.4)[1]} stroke={C.skirting} strokeWidth="7" opacity="0.8" />
      <line x1={iso(0, 0, 0.4)[0]} y1={iso(0, 0, 0.4)[1]} x2={iso(0, ROOM.w, 0.4)[0]} y2={iso(0, ROOM.w, 0.4)[1]} stroke={C.skirting} strokeWidth="5" opacity="0.6" />
      {/* 窗 */}
      <g>
        <polygon points={isoPoly([[330, 0.5, 42], [540, 0.5, 42], [540, 0.5, 228], [330, 0.5, 228]])} fill={`url(#${uid}-sky)`} stroke="#A3907A" strokeWidth="2.4" />
        <polygon points={isoPoly([[332, 0.2, 190], [540, 0.2, 190], [540, 0.2, 228], [332, 0.2, 228]])} fill="#F7F1E4" opacity="0.55" />
        <line x1={iso(435, 0.4, 42)[0]} y1={iso(435, 0.4, 42)[1]} x2={iso(435, 0.4, 228)[0]} y2={iso(435, 0.4, 228)[1]} stroke="#A3907A" strokeWidth="2" />
        <line x1={iso(330, 0.4, 150)[0]} y1={iso(330, 0.4, 150)[1]} x2={iso(540, 0.4, 150)[0]} y2={iso(540, 0.4, 150)[1]} stroke="#B6A38C" strokeWidth="1" opacity="0.7" />
        {/* 窗外树影 */}
        <g opacity="0.3" stroke="#8CA08A" strokeWidth="1.4" fill="none">
          <path d={`M${iso(470, 0.4, 70)[0]} ${iso(470, 0.4, 70)[1]} q 12 -26 26 -34`} />
          <path d={`M${iso(478, 0.4, 74)[0]} ${iso(478, 0.4, 74)[1]} q -14 -18 -20 -26`} />
          <ellipse cx={iso(500, 0.4, 118)[0]} cy={iso(500, 0.4, 118)[1]} rx="17" ry="7" fill="#92A488" opacity="0.4" />
        </g>
        {/* 窗帘 */}
        <g opacity="0.85">
          <polygon points={isoPoly([[312, 1.5, 40], [334, 1.5, 40], [334, 1.5, 242], [312, 1.5, 242]])} fill="#FAF4E7" opacity="0.9" />
          <polygon points={isoPoly([[334, 1.5, 40], [346, 1.5, 40], [346, 1.5, 236], [334, 1.5, 236]])} fill="#F3EBDD" opacity="0.7" />
          <polygon points={isoPoly([[538, 1.5, 40], [562, 1.5, 40], [562, 1.5, 242], [538, 1.5, 242]])} fill="#FAF4E7" opacity="0.9" />
          <polygon points={isoPoly([[562, 1.5, 40], [574, 1.5, 40], [574, 1.5, 236], [562, 1.5, 236]])} fill="#F3EBDD" opacity="0.65" />
        </g>
      </g>
      {/* 左墙挂画 */}
      {other.art && (
        <g>
          <polygon points={isoPoly([[0.8, 86, 96], [0.8, 170, 96], [0.8, 170, 180], [0.8, 86, 180]])} fill="#7A5B40" />
          <polygon points={isoPoly([[2.6, 91, 101], [2.6, 165, 101], [2.6, 165, 175], [2.6, 91, 175]])} fill="#F5EEDF" />
          <polygon points={isoPoly([[2.6, 96, 106], [2.6, 143, 106], [2.6, 143, 170], [2.6, 96, 170]])} fill="#D9C9AE" />
          <ellipse cx={iso(2.8, 132, 148)[0]} cy={iso(2.8, 132, 148)[1]} rx="13" ry="20" fill="#B9A88C" transform={`rotate(-12 ${iso(2.8, 132, 148)[0]} ${iso(2.8, 132, 148)[1]})`} />
          <polygon points={isoPoly([[2.8, 148, 104], [2.8, 162, 104], [2.8, 162, 128], [2.8, 148, 128]])} fill="#9D8B70" />
        </g>
      )}
      {/* 墙面隔板 */}
      <g>
        {[120, 158, 196].map((z, i) => (
          <g key={`shelf-${i}`}>
            <polygon points={isoPoly([[300, 1, z], [486, 1, z], [486, 15, z], [300, 15, z]])} fill="#D3B28A" stroke="#BE9C73" strokeWidth="0.7" />
            <polygon points={isoPoly([[300, 15, z], [486, 15, z], [486, 15, z - 5], [300, 15, z - 5]])} fill="#B9956E" />
            {i === 0 && (
              <>
                <polygon points={isoPoly([[318, 4, z], [332, 4, z], [332, 4, z + 24], [318, 4, z + 24]])} fill="#8C6A4C" />
                <polygon points={isoPoly([[336, 4, z], [352, 4, z], [352, 4, z + 20], [336, 4, z + 20]])} fill="#C8B48F" />
                <polygon points={isoPoly([[356, 4, z], [372, 4, z], [372, 4, z + 26], [356, 4, z + 26]])} fill="#6F7D62" />
                <polygon points={isoPoly([[430, 4, z], [476, 4, z], [476, 4, z + 9], [430, 4, z + 9]])} fill="#E9DDC8" />
              </>
            )}
            {i === 1 && (
              <>
                <polygon points={isoPoly([[336, 4, z], [345, 4, z], [345, 4, z + 22], [336, 4, z + 22]])} fill="#3F5248" />
                <polygon points={isoPoly([[348, 4, z], [360, 4, z], [360, 4, z + 25], [348, 4, z + 25]])} fill="#D6C6AB" />
                <polygon points={isoPoly([[363, 4, z + 8], [380, 4, z + 8], [380, 4, z + 18], [363, 4, z + 18]])} fill="#E8DCC6" />
              </>
            )}
            {i === 2 && (
              <>
                <polygon points={isoPoly([[320, 4, z], [350, 4, z], [350, 4, z + 6], [320, 4, z + 6]])} fill="#D8C6AA" />
                <polygon points={isoPoly([[355, 4, z], [382, 4, z], [382, 4, z + 6], [355, 4, z + 6]])} fill="#BFA98A" />
              </>
            )}
          </g>
        ))}
      </g>
      {/* 矮柜 */}
      {other.cabinet && (
        <g>
          <ellipse
            cx={iso(other.cabinet.x + other.cabinet.l / 2, other.cabinet.y + other.cabinet.w / 2, 1.2)[0]}
            cy={iso(other.cabinet.x + other.cabinet.l / 2, other.cabinet.y + other.cabinet.w / 2, 1.2)[1]}
            rx={other.cabinet.l * 0.48}
            ry="22"
            fill="#6E4F33"
            opacity="0.16"
            filter={`url(#${uid}-blur)`}
          />
          <IsoBox
            uid={uid}
            x={other.cabinet.x}
            y={other.cabinet.y}
            l={other.cabinet.l}
            w={other.cabinet.w}
            h={other.cabinet.h}
            top="#D2B087"
            front="#C39D72"
            side="#B58D61"
            stroke="#B08A60"
          />
          {[0, 1, 2].map((i) => (
            <line
              key={`cab-${i}`}
              x1={iso(other.cabinet.x + (i * other.cabinet.l) / 3, other.cabinet.y + other.cabinet.w, 6)[0]}
              y1={iso(other.cabinet.x + (i * other.cabinet.l) / 3, other.cabinet.y + other.cabinet.w, 6)[1]}
              x2={iso(other.cabinet.x + (i * other.cabinet.l) / 3, other.cabinet.y + other.cabinet.w, other.cabinet.h - 6)[0]}
              y2={iso(other.cabinet.x + (i * other.cabinet.l) / 3, other.cabinet.y + other.cabinet.w, other.cabinet.h - 6)[1]}
              stroke="#A67F57"
              strokeWidth="1"
            />
          ))}
          <line
            x1={iso(other.cabinet.x + 6, other.cabinet.y + other.cabinet.w, other.cabinet.h + 1)[0]}
            y1={iso(other.cabinet.x + 6, other.cabinet.y + other.cabinet.w, other.cabinet.h + 1)[1]}
            x2={iso(other.cabinet.x + other.cabinet.l - 6, other.cabinet.y + other.cabinet.w, other.cabinet.h + 1)[0]}
            y2={iso(other.cabinet.x + other.cabinet.l - 6, other.cabinet.y + other.cabinet.w, other.cabinet.h + 1)[1]}
            stroke="#C8A47B"
            strokeWidth="2"
          />
          {/* 柜上陶器 */}
          <g>
            <ellipse cx={iso(352, 24, 68)[0]} cy={iso(352, 24, 68)[1]} rx="9" ry="4" fill="#C9B392" />
            <path d={`M${iso(344, 24, 68)[0]} ${iso(344, 24, 68)[1]} q 4 -18 8 -18 q 4 0 8 18 z`} fill="#DCCBAD" />
            <ellipse cx={iso(420, 28, 68)[0]} cy={iso(420, 28, 68)[1]} rx="7" ry="3.4" fill="#BBA98A" />
            <path d={`M${iso(414, 28, 68)[0]} ${iso(414, 28, 68)[1]} q 3 -12 6 -12 q 3 0 6 12 z`} fill="#CDBB9C" />
            <polygon
              points={isoPoly([
                [452, 20, 68],
                [486, 20, 68],
                [486, 38, 68],
                [452, 38, 68],
              ])}
              fill="#E6DAC4"
              stroke="#CFC0A6"
              strokeWidth="0.7"
            />
          </g>
        </g>
      )}
      {/* 落地灯 */}
      {other.lamp && (
        <g>
          <ellipse cx={iso(other.lamp.x + 15, other.lamp.y + 15, 0.6)[0]} cy={iso(other.lamp.x + 15, other.lamp.y + 15, 0.6)[1]} rx="34" ry="16" fill={`url(#${uid}-lamp)`} opacity="0.55" />
          <line x1={iso(other.lamp.x + 15, other.lamp.y + 15, 0)[0]} y1={iso(other.lamp.x + 15, other.lamp.y + 15, 0)[1]} x2={iso(other.lamp.x + 15, other.lamp.y + 15, 148)[0]} y2={iso(other.lamp.x + 15, other.lamp.y + 15, 148)[1]} stroke="#8A7258" strokeWidth="3" />
          <polygon points={isoPoly([[other.lamp.x, other.lamp.y, 148], [other.lamp.x + 30, other.lamp.y, 148], [other.lamp.x + 38, other.lamp.y + 30, 168], [other.lamp.x - 8, other.lamp.y + 30, 168]])} fill="#F7EDD7" stroke="#DCCBAF" strokeWidth="1" />
          <ellipse cx={iso(other.lamp.x + 15, other.lamp.y + 15, 140)[0]} cy={iso(other.lamp.x + 15, other.lamp.y + 15, 140)[1]} rx="16" ry="7" fill="#FFEBC4" opacity="0.8" />
        </g>
      )}
      {/* 绿植 */}
      {other.plant && <Plant uid={uid} plant={other.plant} />}
      {/* 餐椅（桌后） */}
      {other.chair && [378, 452].map((x) => <Chair key={`chair-${x}`} uid={uid} x={x} y={152} />)}
      {/* 餐桌占地 */}
      {(selected || isPreview || drag) && (
        <g pointerEvents="none">
          <polygon
            data-testid="footprint"
            data-length={dims.l}
            data-width={dims.w}
            data-x={t.x}
            data-y={t.y}
            points={isoPoly([
              [t.x, t.y, 0.8],
              [t.x + dims.l, t.y, 0.8],
              [t.x + dims.l, t.y + dims.w, 0.8],
              [t.x, t.y + dims.w, 0.8],
            ])}
            fill={isPreview ? 'rgba(41,159,145,0.18)' : 'rgba(41,159,145,0.28)'}
            stroke={isPreview ? '#365F91' : C.teal}
            strokeWidth="2"
            strokeDasharray={isPreview ? '7 5' : '0'}
          />
          {isPreview && (
            <polygon
              points={isoPoly([
                [table.x, table.y, 1],
                [table.x + baseDims.l, table.y, 1],
                [table.x + baseDims.l, table.y + baseDims.w, 1],
                [table.x, table.y + baseDims.w, 1],
              ])}
              fill="none"
              stroke="#9A846C"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}
          {[[t.x, t.y], [t.x + dims.l, t.y], [t.x + dims.l, t.y + dims.w], [t.x, t.y + dims.w]].map(
            ([x, y], i) => (
              <circle key={`handle-${i}`} cx={iso(x, y, 0.9)[0]} cy={iso(x, y, 0.9)[1]} r="4" fill="#FFFCF7" stroke={isPreview ? '#365F91' : C.tealDeep} strokeWidth="1.5" />
            )
          )}
        </g>
      )}
      {/* 餐桌 */}
      <ellipse
        cx={iso(t.x + dims.l / 2, t.y + dims.w / 2, 1.2)[0]}
        cy={iso(t.x + dims.l / 2, t.y + dims.w / 2, 1.2)[1]}
        rx={dims.l * 0.5}
        ry={dims.w * 0.26}
        fill="#6E4F33"
        opacity="0.18"
        filter={`url(#${uid}-blur)`}
      />
      <g
        className="room-table"
        data-testid="room-table"
        data-no-pan
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !mini ? 0 : undefined}
        aria-label={interactive ? '选中餐桌；方向键移动 10 厘米，R 旋转' : undefined}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onClick={() => interactive && onSelect?.('table-01')}
        style={{ cursor: interactive ? (drag ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* 桌腿（随商品样式变化，替换后一眼可见） */}
        {activeProduct.look?.leg === 'trestle' ? (
          <g>
            {[[10, 6], [dims.l - 34, 6]].map(([dx, dy], i) => (
              <g key={`trestle-${i}`}>
                <polygon points={isoPoly([[t.x + dx, t.y + dy, 0], [t.x + dx, t.y + dy + 6, 0], [t.x + dx + 26, t.y + dy + 6, 66], [t.x + dx + 26, t.y + dy, 66]])} fill={activeProduct.look.legColor} />
                <polygon points={isoPoly([[t.x + dx + 26, t.y + dy, 0], [t.x + dx + 26, t.y + dy + 6, 0], [t.x + dx, t.y + dy + 6, 66], [t.x + dx, t.y + dy, 66]])} fill={activeProduct.look.edge} />
              </g>
            ))}
            <polygon points={isoPoly([[t.x + 24, t.y + 6, 30], [t.x + dims.l - 24, t.y + 6, 30], [t.x + dims.l - 24, t.y + 10, 30], [t.x + 24, t.y + 10, 30]])} fill={activeProduct.look.edge} />
          </g>
        ) : activeProduct.look?.leg === 'panel' ? (
          <g>
            <IsoBox
              uid={uid}
              x={t.x + 9}
              y={t.y + 4}
              l={13}
              w={dims.w - 8}
              h={70}
              top={activeProduct.look.legColor}
              front={activeProduct.look.side}
              side={activeProduct.look.edge}
              z={0}
            />
            <IsoBox
              uid={uid}
              x={t.x + dims.l - 22}
              y={t.y + 4}
              l={13}
              w={dims.w - 8}
              h={70}
              top={activeProduct.look.legColor}
              front={activeProduct.look.side}
              side={activeProduct.look.edge}
              z={0}
            />
          </g>
        ) : (
          <g>
            {[[9, 9], [dims.l - 15, 9], [9, dims.w - 15], [dims.l - 15, dims.w - 15]].map(([dx, dy], i) => (
              <IsoBox
                key={`leg-${i}`}
                uid={uid}
                x={t.x + dx}
                y={t.y + dy}
                l={activeProduct.look?.leg === 'taper' ? 4 : 6}
                w={activeProduct.look?.leg === 'taper' ? 4 : 6}
                h={70}
                top={activeProduct.look.legColor}
                front={activeProduct.look.legColor}
                side={activeProduct.look.edge}
                z={0}
              />
            ))}
          </g>
        )}
        {/* 望板 */}
        <polygon points={isoPoly([[t.x + 6, t.y + 6, 62], [t.x + dims.l - 6, t.y + 6, 62], [t.x + dims.l - 6, t.y + 6, 70], [t.x + 6, t.y + 6, 70]])} fill={activeProduct.look.front} />
        <polygon points={isoPoly([[t.x + dims.l - 6, t.y + 6, 62], [t.x + dims.l - 6, t.y + dims.w - 6, 62], [t.x + dims.l - 6, t.y + dims.w - 6, 70], [t.x + dims.l - 6, t.y + 6, 70]])} fill={activeProduct.look.side} />
        {/* 台面 */}
        <IsoBox
          uid={uid}
          x={t.x}
          y={t.y}
          l={dims.l}
          w={dims.w}
          h={4}
          z={70}
          top={activeProduct.look.top}
          front={activeProduct.look.front}
          side={activeProduct.look.side}
          stroke={activeProduct.look.edge}
        />
        {Array.from({ length: 4 }, (_, i) => (
          <line
            key={`grain-${i}`}
            x1={iso(t.x + 10, t.y + 12 + i * 15, 74.4)[0]}
            y1={iso(t.x + 10, t.y + 12 + i * 15, 74.4)[1]}
            x2={iso(t.x + dims.l - 10, t.y + 12 + i * 15, 74.4)[0]}
            y2={iso(t.x + dims.l - 10, t.y + 12 + i * 15, 74.4)[1]}
            stroke={activeProduct.look.edge}
            opacity="0.22"
            strokeWidth="0.8"
          />
        ))}
        {/* 桌上静物 */}
        <g pointerEvents="none">
          <ellipse cx={iso(t.x + dims.l * 0.42, t.y + dims.w * 0.5, 74.6)[0]} cy={iso(t.x + dims.l * 0.42, t.y + dims.w * 0.5, 74.6)[1]} rx="11" ry="4.4" fill="#D7C4A7" />
          <path d={`M${iso(t.x + dims.l * 0.42 + 6, t.y + dims.w * 0.5, 84)[0]} ${iso(t.x + dims.l * 0.42 + 6, t.y + dims.w * 0.5, 84)[1]} q 5 -3 3 -14`} stroke="#7E8F6B" strokeWidth="1.6" fill="none" />
          <ellipse cx={iso(t.x + dims.l * 0.42 + 12, t.y + dims.w * 0.5 - 1, 99)[0]} cy={iso(t.x + dims.l * 0.42 + 12, t.y + dims.w * 0.5 - 1, 99)[1]} rx="6" ry="3.4" fill="#8F9C72" />
          <polygon
            points={isoPoly([
              [t.x + dims.l * 0.62, t.y + dims.w * 0.42, 74.6],
              [t.x + dims.l * 0.62 + 22, t.y + dims.w * 0.42, 74.6],
              [t.x + dims.l * 0.62 + 22, t.y + dims.w * 0.42 + 16, 74.6],
              [t.x + dims.l * 0.62, t.y + dims.w * 0.42 + 16, 74.6],
            ])}
            fill="#EFE7D8"
            stroke="#D8CBB5"
            strokeWidth="0.6"
          />
        </g>
        {/* 选中描边 */}
        {selected && (
          <polygon
            points={isoPoly([
              [t.x, t.y, 74.8],
              [t.x + dims.l, t.y, 74.8],
              [t.x + dims.l, t.y + dims.w, 74.8],
              [t.x, t.y + dims.w, 74.8],
            ])}
            fill="none"
            stroke={isPreview ? '#365F91' : C.tealDeep}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        )}
      </g>
      {/* 沙发 */}
      {other.sofa && <Sofa uid={uid} sofa={other.sofa} interactive={interactive} onSelect={onSelect} selected={selectedId === 'sofa-01'} />}
      {/* 茶几 */}
      {other.coffee && (
        <g>
          <IsoBox uid={uid} x={other.coffee.x} y={other.coffee.y} l={other.coffee.l} w={other.coffee.w} h={5} z={30} top="#8C6A4F" front="#765741" side="#6B4D39" stroke="#74553F" />
          {[[10, 10], [other.coffee.l - 14, 10], [10, other.coffee.w - 14], [other.coffee.l - 14, other.coffee.w - 14]].map(([dx, dy], i) => (
            <IsoBox key={`coffee-leg-${i}`} uid={uid} x={other.coffee.x + dx} y={other.coffee.y + dy} l={4} w={4} h={30} top="#76563F" front="#654733" side="#5A3E2D" />
          ))}
          <polygon points={isoPoly([[other.coffee.x + 26, other.coffee.y + 22, 35], [other.coffee.x + 52, other.coffee.y + 22, 35], [other.coffee.x + 52, other.coffee.y + 42, 35], [other.coffee.x + 26, other.coffee.y + 42, 35]])} fill="#EDE3D2" stroke="#D5C6AE" strokeWidth="0.6" />
          <ellipse cx={iso(other.coffee.x + 70, other.coffee.y + 30, 35)[0]} cy={iso(other.coffee.x + 70, other.coffee.y + 30, 35)[1]} rx="8" ry="4" fill="#B7A180" />
        </g>
      )}
      {/* 桌签 */}
      {!mini && selected && (
        <g pointerEvents="none">
          <line x1={labelAnchor[0]} y1={labelAnchor[1] + 18} x2={iso(t.x + dims.l / 2, t.y + dims.w / 2, 76)[0]} y2={iso(t.x + dims.l / 2, t.y + dims.w / 2, 76)[1]} stroke={isPreview ? '#365F91' : '#476C62'} strokeWidth="1" strokeDasharray="3 4" opacity="0.8" />
          <g transform={`translate(${labelAnchor[0] - 128}, ${labelAnchor[1] - 17})`}>
            <rect width="256" height="34" rx="9" fill={isPreview ? '#365F91' : '#4A2E24'} opacity="0.96" />
            <circle cx="16" cy="17" r="3.4" fill={isPreview ? '#CFE1F1' : '#84CBBF'} />
            <text x="28" y="21.5" fill="#FFF9EF" fontSize="11.5" letterSpacing="0.2">
              {currentLabel}
            </text>
          </g>
        </g>
      )}
      {/* 场景标注 */}
      {!mini && (
        <g pointerEvents="none">
          {sofa && (
            <g>
              <line x1={iso(sofa.x + 150, sofa.y + sofa.w, 80)[0]} y1={iso(sofa.x + 150, sofa.y + sofa.w, 80)[1]} x2={iso(sofa.x + 150, sofa.y + sofa.w - 4, 96)[0]} y2={iso(sofa.x + 150, sofa.y + sofa.w - 4, 96)[1]} stroke="#A18C75" strokeWidth="0.9" />
              <g transform={`translate(${iso(sofa.x + 150, sofa.y + sofa.w + 20, 94)[0] - 88}, ${iso(sofa.x + 150, sofa.y + sofa.w + 20, 94)[1] - 26})`}>
                <rect width="176" height="24" rx="7" fill="#FFFCF7" opacity="0.92" stroke="#E0D2BE" />
                <text x="11" y="16" fill={C.soft} fontSize="10.5">
                  三人位浅米沙发 · 现状保留
                </text>
              </g>
            </g>
          )}
          <g transform={`translate(${iso(330, 0, 258)[0] - 10}, ${iso(330, 0, 258)[1] + 4})`}>
            <rect width="190" height="26" rx="7" fill="#FFFCF7" opacity="0.9" stroke="#E0D2BE" />
            <text x="12" y="17.4" fill={C.soft} fontSize="10.5">
              西窗采光 · 侧向净距 {leftGap != null ? leftGap : 92}cm
            </text>
          </g>
        </g>
      )}
      {/* 尺寸标注 */}
      {showDims && selected && !mini && (
        <g pointerEvents="none">
          <DimLine
            a={iso(t.x, t.y + dims.w + 30, 0.9)}
            b={iso(t.x + dims.l, t.y + dims.w + 30, 0.9)}
            label={`${dims.l} cm`}
          />
          <DimLine
            a={iso(t.x + dims.l + 30, t.y, 0.9)}
            b={iso(t.x + dims.l + 30, t.y + dims.w, 0.9)}
            label={`${dims.w} cm`}
          />
        </g>
      )}
      {/* 交互按钮 */}
      {showHandles && (
        <g data-no-pan>
          <g
            transform={`translate(${iso(t.x + dims.l / 2, t.y + dims.w / 2, 2)[0]}, ${iso(t.x + dims.l / 2, t.y + dims.w / 2, 2)[1]})`}
            style={{ cursor: 'grab' }}
          >
            <circle r="15" fill="#4A2E24" opacity="0.92" />
            <path d="M-5 0H5M0-5V5" stroke="#FFF9EF" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g
            transform={`translate(${iso(t.x + dims.l / 2, t.y + dims.w / 2, 2)[0] + 42}, ${iso(t.x + dims.l / 2, t.y + dims.w / 2, 2)[1]})`}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onRotate?.();
            }}
            role="button"
            aria-label="旋转餐桌 90 度"
            data-testid="rotate-table"
          >
            <circle r="15" fill="#4A2E24" opacity="0.92" />
            <path d="M4.5 -2.5a6 6 0 1 0 1 5.6" fill="none" stroke="#FFF9EF" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.4 -6.2l.4 4 -3.9.4" fill="none" stroke="#FFF9EF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      )}
      {drag && (
        <g pointerEvents="none" transform={`translate(${iso(t.x + dims.l / 2, t.y + dims.w / 2, 120)[0] - 58}, ${iso(t.x + dims.l / 2, t.y + dims.w / 2, 120)[1] - 30})`}>
          <rect width="116" height="26" rx="7" fill="#3B2A22" />
          <text x="58" y="17.5" fill="#FFF9EF" fontSize="11" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
            X {Math.round(t.x)} · Y {Math.round(t.y)} cm
          </text>
        </g>
      )}
      {!mini && (
        <g pointerEvents="none">
          <text x="104" y="756" fill="#9A8874" fontSize="10" letterSpacing="2.4">
            DREAM HOUSE / LIVING ROOM
          </text>
          <text x="900" y="756" fill="#9A8874" fontSize="10" textAnchor="end">
            {showGrid ? '10 cm 网格吸附 · ' : ''}示例空间，非实测
          </text>
        </g>
      )}
    </svg>
  );
}

function IsoBox({ uid, x, y, l, w, h, z = 0, top, front, side, stroke = 'none' }) {
  return (
    <g>
      <polygon points={isoPoly([[x, y + w, z], [x + l, y + w, z], [x + l, y + w, z + h], [x, y + w, z + h]])} fill={front} stroke="none" />
      <polygon points={isoPoly([[x + l, y, z], [x + l, y + w, z], [x + l, y + w, z + h], [x + l, y, z + h]])} fill={side} stroke="none" />
      <polygon points={isoPoly([[x, y, z + h], [x + l, y, z + h], [x + l, y + w, z + h], [x, y + w, z + h]])} fill={top} stroke={stroke} strokeWidth="0.9" strokeLinejoin="round" />
    </g>
  );
}

function Sofa({ uid, sofa, interactive, onSelect, selected }) {
  const { x, y, l, w } = sofa;
  return (
    <g onClick={() => interactive && onSelect?.('sofa-01')} style={{ cursor: interactive ? 'pointer' : 'default' }}>
      <ellipse cx={iso(x + l / 2, y + w / 2, 0.4)[0]} cy={iso(x + l / 2, y + w / 2, 0.4)[1]} rx={l * 0.42} ry={22} fill="#8B7358" opacity="0.16" filter={`url(#${uid}-blur)`} />
      {[[6, 6], [l - 12, 6], [6, w - 12], [l - 12, w - 12]].map(([dx, dy], i) => (
        <IsoBox key={`sofa-leg-${i}`} uid={uid} x={x + dx} y={y + dy} l={6} w={6} h={9} top="#B6A48B" front="#A4907A" side="#98836C" />
      ))}
      <IsoBox uid={uid} x={x} y={y} l={l} w={w} h={22} z={9} top={C.sofaDark} front={C.sofa} side="#C3B49E" stroke="#B9A992" />
      <IsoBox uid={uid} x={x} y={y} l={l} w={18} h={52} z={31} top={C.sofaLight} front={C.sofa} side={C.sofaDark} stroke="#C6B7A1" />
      <IsoBox uid={uid} x={x} y={y} l={18} w={w} h={28} z={31} top={C.sofaLight} front={C.sofa} side={C.sofaDark} />
      <IsoBox uid={uid} x={x + l - 18} y={y} l={18} w={w} h={28} z={31} top={C.sofaLight} front={C.sofa} side={C.sofaDark} />
      {[0, 1, 2].map((i) => (
        <IsoBox key={`seat-${i}`} uid={uid} x={x + 20 + i * ((l - 40) / 3)} y={y + 20} l={(l - 44) / 3} w={w - 34} h={13} z={31} top="#E8DECD" front="#DBD0BD" side="#CCBEA7" stroke="#D2C4AE" />
      ))}
      {[0, 1, 2].map((i) => (
        <IsoBox
          key={`pillow-${i}`}
          uid={uid}
          x={x + 26 + i * 64}
          y={y + 20}
          l={44}
          w={10}
          h={22}
          z={44}
          top={i === 1 ? '#CBB795' : '#EFE6D6'}
          front={i === 1 ? '#C0A983' : '#E3D8C5'}
          side={i === 1 ? '#B39C77' : '#D3C4AD'}
          stroke="#CDBEA8"
        />
      ))}
      {/* 搭毯 */}
      <polygon
        points={isoPoly([
          [x + 18, y + 54, 46],
          [x + 96, y + 54, 46],
          [x + 96, y + 80, 46],
          [x + 18, y + 80, 46],
        ])}
        fill="#C9A47B"
        opacity="0.95"
      />
      <polygon
        points={isoPoly([
          [x + 18, y + 80, 46],
          [x + 96, y + 80, 46],
          [x + 96, y + 80, 16],
          [x + 18, y + 80, 16],
        ])}
        fill="#BC946C"
      />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`throw-${i}`}
          x1={iso(x + 26 + i * 18, y + 56, 46.4)[0]}
          y1={iso(x + 26 + i * 18, y + 56, 46.4)[1]}
          x2={iso(x + 26 + i * 18, y + 80, 46.4)[0]}
          y2={iso(x + 26 + i * 18, y + 80, 46.4)[1]}
          stroke="#AE875F"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      <line x1={iso(x + 18, y + 20, 54)[0]} y1={iso(x + 18, y + 20, 54)[1]} x2={iso(x + l - 18, y + 20, 54)[0]} y2={iso(x + l - 18, y + 20, 54)[1]} stroke="#C9BAA4" strokeWidth="0.9" />
      {selected && (
        <polygon
          points={isoPoly([[x, y, 82], [x + l, y, 82], [x + l, y + w, 82], [x, y + w, 82]])}
          fill="none"
          stroke="#299F91"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
      )}
    </g>
  );
}

function Chair({ uid, x, y }) {
  return (
    <g>
      <ellipse cx={iso(x + 22, y + 24, 0.4)[0]} cy={iso(x + 22, y + 24, 0.4)[1]} rx="24" ry="9" fill="#8B7358" opacity="0.12" filter={`url(#${uid}-blur)`} />
      {[[4, 4], [38, 4], [4, 40], [38, 40]].map(([dx, dy], i) => (
        <IsoBox key={`cl-${i}`} uid={uid} x={x + dx} y={y + dy} l={4} w={4} h={44} top="#C4A377" front="#AF8C62" side="#A17E55" />
      ))}
      <IsoBox uid={uid} x={x} y={y} l={45} w={45} h={5} z={43} top="#D7BC95" front="#C6A87F" side="#B99A71" stroke="#BC9D74" />
      <IsoBox uid={uid} x={x} y={y} l={45} w={5} h={33} z={48} top="#DCC39B" front="#CBAD83" side="#BD9E75" stroke="#C0A177" />
      <IsoBox uid={uid} x={x + 5} y={y + 6} l={35} w={33} h={4} z={48} top="#E3D2B6" front="#D6C2A3" side="#C9B494" />
    </g>
  );
}

function Plant({ uid, plant }) {
  const cx = plant.x + plant.l / 2;
  const cy = plant.y + plant.w / 2;
  const leaves = [
    [-18, -6, 74, -18],
    [14, -10, 86, 22],
    [-10, 8, 96, -35],
    [20, 12, 108, 40],
    [-22, 18, 118, -55],
    [4, -2, 132, 8],
    [26, -2, 92, 62],
    [-2, 22, 78, 5],
  ];
  return (
    <g>
      <ellipse cx={iso(cx, cy, 0.4)[0]} cy={iso(cx, cy, 0.4)[1]} rx="26" ry="10" fill="#8B7358" opacity="0.16" filter={`url(#${uid}-blur)`} />
      <IsoBox uid={uid} x={plant.x} y={plant.y} l={36} w={36} h={36} top="#C59C76" front="#B48761" side="#A47853" stroke="#A87C57" />
      <ellipse cx={iso(cx, cy, 36)[0]} cy={iso(cx, cy, 36)[1]} rx="14" ry="5" fill="#7B5F47" />
      {leaves.map(([dx, dy, z, rot], i) => {
        const base = iso(cx, cy, 36);
        const tip = iso(cx + dx * 0.5, cy + dy * 0.5, z);
        const mid = iso(cx + dx * 0.25, cy + dy * 0.25, 36 + (z - 36) * 0.7);
        return (
          <g key={`leaf-${i}`}>
            <line x1={base[0]} y1={base[1]} x2={mid[0]} y2={mid[1]} stroke="#6E7F55" strokeWidth="1.4" />
            <ellipse cx={tip[0]} cy={tip[1]} rx="13" ry="6" fill={i % 2 ? '#7E9162' : '#637A4F'} opacity="0.94" transform={`rotate(${rot} ${tip[0]} ${tip[1]})`} />
          </g>
        );
      })}
    </g>
  );
}

function DimLine({ a, b, label }) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#4F6F66" strokeWidth="1.1" />
      <line x1={a[0] - 4} y1={a[1] + 4} x2={a[0] + 4} y2={a[1] - 4} stroke="#4F6F66" strokeWidth="1.1" />
      <line x1={b[0] - 4} y1={b[1] + 4} x2={b[0] + 4} y2={b[1] - 4} stroke="#4F6F66" strokeWidth="1.1" />
      <g transform={`translate(${mx}, ${my}) rotate(${angle > 90 || angle < -90 ? angle + 180 : angle})`}>
        <rect x="-25" y="-16" width="50" height="18" rx="5" fill="#FFFCF7" opacity="0.92" />
        <text x="0" y="-3" textAnchor="middle" fill="#355F54" fontSize="10.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {label}
        </text>
      </g>
    </g>
  );
}

/* ---------------- 平面视图 ---------------- */

function PlanScene({
  uid,
  objects,
  table,
  dims,
  activeProduct,
  isPreview,
  selected,
  showHandles,
  interactive,
  mini,
  showGrid,
  showDims,
  svgRef,
  startDrag,
  moveDrag,
  endDrag,
  onKeyDown,
  onSelect,
  onRotate,
}) {
  const t = table;
  const sofa = objects.find((o) => o.kind === 'sofa');
  const rug = objects.find((o) => o.kind === 'rug');
  const coffee = objects.find((o) => o.kind === 'coffee');
  const cabinet = objects.find((o) => o.kind === 'cabinet');
  const lamp = objects.find((o) => o.kind === 'lamp');
  const plant = objects.find((o) => o.kind === 'plant');
  const chair = objects.find((o) => o.kind === 'chair');
  const roomW = ROOM.l;
  const roomH = ROOM.w;
  return (
    <svg
      ref={svgRef}
      className={`room-svg plan ${mini ? 'is-mini' : ''}`}
      viewBox="0 0 724 526"
      role="img"
      aria-label={`客厅平面图，餐桌 ${activeProduct.id}，${dims.l} 乘 ${dims.w} 厘米`}
    >
      <defs>
        <pattern id={`${uid}-pgrid`} width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="#8FA79B" strokeWidth="0.5" opacity="0.35" />
        </pattern>
        <pattern id={`${uid}-pplank`} width="24" height="410" patternUnits="userSpaceOnUse">
          <rect width="24" height="410" fill="#EBD8B9" />
          <line x1="24" y1="0" x2="24" y2="410" stroke="#DCC5A3" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="724" height="526" fill="#FBF7EF" opacity="0" />
      <rect x={plan(0, 0)[0]} y={plan(0, 0)[1]} width={roomW} height={roomH} fill={`url(#${uid}-pplank)`} />
      <rect x={plan(0, 0)[0]} y={plan(0, 0)[1]} width={roomW} height={roomH} fill={`url(#${uid}-pgrid)`} opacity={showGrid ? 0.9 : 0} />
      {/* 墙体 */}
      <rect x={plan(0, 0)[0] - 6} y={plan(0, 0)[1] - 6} width={roomW + 12} height={roomH + 12} fill="none" stroke="#8A7461" strokeWidth="6" />
      {/* 窗与阳台门 */}
      <line x1={plan(330, 0)[0]} y1={plan(330, 0)[1] - 3} x2={plan(540, 0)[0]} y2={plan(540, 0)[1] - 3} stroke="#8FB3A7" strokeWidth="7" />
      <line x1={plan(330, 0)[0]} y1={plan(330, 0)[1] - 9} x2={plan(540, 0)[0]} y2={plan(540, 0)[1] - 9} stroke="#C9BBA7" strokeWidth="1" />
      <line x1={plan(roomW, 130)[0]} y1={plan(roomW, 130)[1]} x2={plan(roomW, 310)[0]} y2={plan(roomW, 310)[1]} stroke="#8FB3A7" strokeWidth="7" />
      <path d={`M${plan(roomW, 130)[0]} ${plan(roomW, 130)[1]} A 180 180 0 0 0 ${plan(roomW - 180, 130)[0]} ${plan(roomW - 180, 130)[1]}`} fill="none" stroke="#C3B4A0" strokeWidth="1" strokeDasharray="4 4" />
      {/* 地毯 */}
      {rug && (
        <rect
          x={plan(rug.x, rug.y)[0]}
          y={plan(rug.x, rug.y)[1]}
          width={rug.l}
          height={rug.w}
          fill="#E9DFCE"
          stroke="#D6C8B2"
          strokeWidth="1"
          rx="3"
        />
      )}
      {/* 矮柜 */}
      {cabinet && (
        <g>
          <rect x={plan(cabinet.x, cabinet.y)[0]} y={plan(cabinet.x, cabinet.y)[1]} width={cabinet.l} height={cabinet.w} fill="#D2B087" stroke="#B58D61" strokeWidth="1.2" />
          {[1, 2].map((i) => (
            <line key={i} x1={plan(cabinet.x + (cabinet.l * i) / 3, cabinet.y)[0]} y1={plan(cabinet.x + (cabinet.l * i) / 3, cabinet.y)[1]} x2={plan(cabinet.x + (cabinet.l * i) / 3, cabinet.y + cabinet.w)[0]} y2={plan(cabinet.x + (cabinet.l * i) / 3, cabinet.y + cabinet.w)[1]} stroke="#B58D61" strokeWidth="0.8" />
          ))}
        </g>
      )}
      {/* 绿植 */}
      {plant && (
        <g>
          <circle cx={plan(plant.x + plant.l / 2, plant.y + plant.w / 2)[0]} cy={plan(plant.x + plant.l / 2, plant.y + plant.w / 2)[1]} r="22" fill="#8FA37A" opacity="0.32" />
          <circle cx={plan(plant.x + plant.l / 2, plant.y + plant.w / 2)[0]} cy={plan(plant.x + plant.l / 2, plant.y + plant.w / 2)[1]} r="10" fill="#7D8F67" opacity="0.55" />
        </g>
      )}
      {/* 落地灯 */}
      {lamp && (
        <g>
          <circle cx={plan(lamp.x + lamp.l / 2, lamp.y + lamp.w / 2)[0]} cy={plan(lamp.x + lamp.l / 2, lamp.y + lamp.w / 2)[1]} r="30" fill="#FFE6B7" opacity="0.5" />
          <circle cx={plan(lamp.x + lamp.l / 2, lamp.y + lamp.w / 2)[0]} cy={plan(lamp.x + lamp.l / 2, lamp.y + lamp.w / 2)[1]} r="8" fill="#B99A71" />
        </g>
      )}
      {/* 餐桌 */}
      <g
        data-testid="room-table"
        data-no-pan
        role={interactive ? 'button' : undefined}
        tabIndex={interactive && !mini ? 0 : undefined}
        aria-label={interactive ? '选中餐桌；方向键移动 10 厘米，R 旋转' : undefined}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onClick={() => interactive && onSelect?.('table-01')}
        style={{ cursor: interactive ? 'grab' : 'default' }}
      >
        {isPreview && (
          <rect
            x={plan(t.x, t.y)[0]}
            y={plan(t.x, t.y)[1]}
            width={dimsOf({ ...t, productId: table.productId }).l}
            height={dimsOf({ ...t, productId: table.productId }).w}
            fill="none"
            stroke="#9A846C"
            strokeWidth="1.4"
            strokeDasharray="5 4"
          />
        )}
        <rect
          x={plan(t.x, t.y)[0]}
          y={plan(t.x, t.y)[1]}
          width={dims.l}
          height={dims.w}
          rx="3"
          fill={isPreview ? 'rgba(41,159,145,0.24)' : activeProduct.look?.top || '#DFBE8E'}
          stroke={isPreview ? '#365F91' : selected ? '#16786C' : activeProduct.look?.edge || '#B58B5B'}
          strokeWidth={selected ? 2 : 1.2}
        />
        {[[t.x, t.y], [t.x + dims.l, t.y], [t.x + dims.l, t.y + dims.w], [t.x, t.y + dims.w]].map(([x, y], i) => (
          <circle key={i} cx={plan(x, y)[0]} cy={plan(x, y)[1]} r={showHandles ? 3.6 : 2} fill="#FFFCF7" stroke={isPreview ? '#365F91' : '#16786C'} strokeWidth="1.3" />
        ))}
        <text x={plan(t.x + dims.l / 2, t.y + dims.w / 2)[0]} y={plan(t.x + dims.l / 2, t.y + dims.w / 2)[1] + 3.5} textAnchor="middle" fill={isPreview ? '#365F91' : '#6A4A2C'} fontSize="10.5" style={{ fontWeight: 600 }}>
          {activeProduct.id} · {dims.l}×{dims.w}
        </text>
        <g
          transform={`translate(${plan(t.x + dims.l / 2, t.y + dims.w / 2)[0]}, ${plan(t.x + dims.l / 2, t.y + dims.w / 2)[1] + 30})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onRotate?.();
          }}
          data-testid="rotate-table"
          role="button"
          aria-label="旋转餐桌 90 度"
        >
          <circle r="9" fill="#FFFCF7" stroke="#CDBBA6" />
          <path d="M3 -2a5 5 0 1 0 1 4.4" fill="none" stroke="#5B3A2E" strokeWidth="1.2" />
        </g>
      </g>
      {/* 餐椅 */}
      {chair &&
        [378, 452].map((x) => (
          <rect key={x} x={plan(x, 152)[0]} y={plan(x, 152)[1]} width="45" height="45" rx="3" fill="#DCC39B" stroke="#C0A177" strokeWidth="0.9" />
        ))}
      {/* 沙发 */}
      {sofa && (
        <g onClick={() => interactive && onSelect?.('sofa-01')} style={{ cursor: interactive ? 'pointer' : 'default' }}>
          <rect x={plan(sofa.x, sofa.y)[0]} y={plan(sofa.x, sofa.y)[1]} width={sofa.l} height={sofa.w} rx="5" fill="#DED3C1" stroke="#BCAE97" strokeWidth="1.2" />
          <rect x={plan(sofa.x + 8, sofa.y + 20)[0]} y={plan(sofa.x + 8, sofa.y + 20)[1]} width={sofa.l - 16} height={sofa.w - 28} rx="4" fill="#ECE3D3" stroke="#D5C8B4" />
          <line x1={plan(sofa.x + 8, sofa.y + 22)[0]} y1={plan(sofa.x + 8, sofa.y + 22)[1]} x2={plan(sofa.x + sofa.l - 8, sofa.y + 22)[0]} y2={plan(sofa.x + sofa.l - 8, sofa.y + 22)[1]} stroke="#CFC0A9" strokeWidth="1" />
        </g>
      )}
      {/* 茶几 */}
      {coffee && <rect x={plan(coffee.x, coffee.y)[0]} y={plan(coffee.x, coffee.y)[1]} width={coffee.l} height={coffee.w} rx="3" fill="#8C6A4F" opacity="0.9" />}
      {/* 尺寸标注 */}
      {showDims && selected && !mini && (
        <g pointerEvents="none">
          <DimLine a={plan(t.x, t.y + dims.w + 24)} b={plan(t.x + dims.l, t.y + dims.w + 24)} label={`${dims.l} cm`} />
          <DimLine a={plan(t.x + dims.l + 24, t.y)} b={plan(t.x + dims.l + 24, t.y + dims.w)} label={`${dims.w} cm`} />
        </g>
      )}
      {!mini && (
        <g pointerEvents="none" className="plan-annotations">
          {/* 房间外尺寸 */}
          <line x1={plan(0, 0)[0]} y1={plan(0, 0)[1] - 16} x2={plan(roomW, 0)[0]} y2={plan(roomW, 0)[1] - 16} stroke="#A3917B" strokeWidth="0.8" />
          <line x1={plan(0, 0)[0]} y1={plan(0, 0)[1] - 20} x2={plan(0, 0)[0]} y2={plan(0, 0)[1] - 12} stroke="#A3917B" strokeWidth="0.8" />
          <line x1={plan(roomW, 0)[0]} y1={plan(roomW, 0)[1] - 20} x2={plan(roomW, 0)[0]} y2={plan(roomW, 0)[1] - 12} stroke="#A3917B" strokeWidth="0.8" />
          <text x={plan(roomW / 2, 0)[0]} y={plan(roomW / 2, 0)[1] - 22} textAnchor="middle" fill="#8A7461" fontSize="9">
            600 cm
          </text>
          <line x1={plan(0, 0)[0] - 16} y1={plan(0, 0)[1]} x2={plan(0, roomH)[0] - 16} y2={plan(0, roomH)[1]} stroke="#A3917B" strokeWidth="0.8" />
          <line x1={plan(0, 0)[0] - 20} y1={plan(0, 0)[1]} x2={plan(0, 0)[0] - 12} y2={plan(0, 0)[1]} stroke="#A3917B" strokeWidth="0.8" />
          <line x1={plan(0, roomH)[0] - 20} y1={plan(0, roomH)[1]} x2={plan(0, roomH)[0] - 12} y2={plan(0, roomH)[1]} stroke="#A3917B" strokeWidth="0.8" />
          <text x={plan(0, roomH / 2)[0] - 26} y={plan(0, roomH / 2)[1]} textAnchor="middle" fill="#8A7461" fontSize="9" transform={`rotate(-90 ${plan(0, roomH / 2)[0] - 26} ${plan(0, roomH / 2)[1]})`}>
            410 cm
          </text>

          {/* 指北针 */}
          <g transform={`translate(${plan(roomW, 0)[0] + 34}, ${plan(roomW, 0)[1] + 26})`}>
            <circle r="13" fill="none" stroke="#B6A792" strokeWidth="0.8" />
            <path d="M0 -9L4 6L0 3L-4 6Z" fill="#8A7461" />
            <text x="0" y="-16" textAnchor="middle" fill="#8A7461" fontSize="7" letterSpacing="1">N</text>
          </g>

          {/* 物品标签 */}
          {sofa && (
            <text x={plan(sofa.x + sofa.l / 2, sofa.y + sofa.w / 2)[0]} y={plan(sofa.x + sofa.l / 2, sofa.y + sofa.w / 2)[1] - 7} textAnchor="middle" fill="#8C7964" fontSize="8">
              三人沙发 · 保留
            </text>
          )}
          {coffee && (
            <text x={plan(coffee.x + coffee.l / 2, coffee.y + coffee.w / 2)[0]} y={plan(coffee.x + coffee.l / 2, coffee.y + coffee.w / 2)[1] + 3} textAnchor="middle" fill="#F7F0E3" fontSize="7.5">
              茶几
            </text>
          )}
          {cabinet && (
            <text x={plan(cabinet.x + cabinet.l / 2, cabinet.y + cabinet.w / 2)[0]} y={plan(cabinet.x + cabinet.l / 2, cabinet.y + cabinet.w / 2)[1] + 3} textAnchor="middle" fill="#6F5741" fontSize="7.5">
              收纳矮柜
            </text>
          )}
          {rug && (
            <text x={plan(rug.x + 18, rug.y + rug.w - 14)[0]} y={plan(rug.x + 18, rug.y + rug.w - 14)[1]} fill="#A7947C" fontSize="7">
              地毯 250 × 190
            </text>
          )}
          {chair &&
            [378, 452].map((x) => (
              <text key={`chair-label-${x}`} x={plan(x + 22, 152)[0]} y={plan(x + 22, 152)[1] + 28} textAnchor="middle" fill="#8C7964" fontSize="7">
                {x === 378 ? '餐椅' : ''}
              </text>
            ))}
          <text x={plan(0, 0)[0] + 12} y={plan(0, roomH)[1] - 12} fill="#A7947C" fontSize="7.5" letterSpacing="1.4">
            客厅 · 约 24.6㎡
          </text>
        </g>
      )}
      {!mini && (
        <g pointerEvents="none">
          <text x="62" y="510" fill="#9A8874" fontSize="10" letterSpacing="2.4">
            DREAM HOUSE / PLAN VIEW
          </text>
          <text x="662" y="510" fill="#9A8874" fontSize="10" textAnchor="end">
            1:50 示例平面 · 非施工图
          </text>
        </g>
      )}
    </svg>
  );
}
