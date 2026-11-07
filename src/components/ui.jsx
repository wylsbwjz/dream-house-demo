import React, { useId } from 'react';
import { PRODUCTS } from '../data/catalog.js';
import { money } from '../core/engine.js';

export function ObjectIcon({ kind, size = 18, stroke = 'currentColor' }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (kind) {
    case 'sofa':
      return (
        <svg {...common}>
          <path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
          <path d="M3 12.5a2 2 0 0 1 2 2V18h14v-3.5a2 2 0 0 1 2-2" />
          <path d="M5 18v2M19 18v2M7 12h10" />
        </svg>
      );
    case 'table':
      return (
        <svg {...common}>
          <path d="M3 9h18M4.5 9v10M19.5 9v10" />
          <path d="M3.5 9l1-3h15l1 3" />
        </svg>
      );
    case 'chair':
      return (
        <svg {...common}>
          <path d="M7 3v10M17 3v10M7 13h10v3H7zM8 16v5M16 16v5" />
        </svg>
      );
    case 'cabinet':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M12 5v14M9 12h1M14 12h1" />
        </svg>
      );
    case 'lamp':
      return (
        <svg {...common}>
          <path d="M9 4h6l2 7H7l2-7zM12 11v8M8 21h8" />
        </svg>
      );
    case 'rug':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="1.5" />
          <path d="M6 9h12M6 12h12M6 15h12" opacity="0.5" />
        </svg>
      );
    case 'art':
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M7 16l4-6 3 4 3-5" />
        </svg>
      );
    case 'plant':
      return (
        <svg {...common}>
          <path d="M8 13h8l-1 8H9l-1-8zM12 13V6" />
          <path d="M12 8c0-3 2-5 4-5 0 3-2 5-4 5zM12 10c0-3-2-4.5-4-5 0 3 2 5 4 5z" />
        </svg>
      );
    case 'floor':
      return (
        <svg {...common}>
          <path d="M3 8h18M3 16h18M8 3v18M16 3v18" opacity="0.8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      );
  }
}

export function ProductArt({ productId = 'T150', className = '', label = false }) {
  const p = PRODUCTS[productId] || PRODUCTS.T150;
  const uid = `pa${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const tw = 154 + Math.max(0, p.l - 120) * 0.62;
  const td = 38 + Math.max(0, p.w - 65) * 0.58;
  const cx = 160;
  const cy = 120;
  const topY = cy - td / 2 + 6;
  const legH = 50;
  const look = p.look || {
    top: '#DFC192',
    front: '#B58E5B',
    side: '#C5A06D',
    edge: '#B08654',
    leg: 'four',
    legColor: '#B58B58',
    toneName: '浅木色',
  };
  const top = look.top;
  const side = look.side;
  const front = look.front;
  const edge = look.edge;
  const legColor = look.legColor;
  const points = [
    [cx - tw / 2, topY],
    [cx + tw / 2, topY - 12],
    [cx + tw / 2, topY - 12 + td],
    [cx - tw / 2, topY + td],
  ];
  const slab = points.map(([x, y]) => `${x},${y + 5}`).join(' ');
  const poly = points.map((q) => q.join(',')).join(' ');
  const legPts = [
    [cx - tw / 2 + 10, topY + 5],
    [cx + tw / 2 - 12, topY - 7],
    [cx - tw / 2 + 10, topY + td - 3],
    [cx + tw / 2 - 12, topY + td - 15],
  ];

  const renderLegs = () => {
    if (look.leg === 'trestle') {
      const lx = cx - tw / 2 + 8;
      const rx = cx + tw / 2 - 30;
      const topL = topY + 8;
      const topR = topY + td - 2;
      return (
        <g>
          <line x1={lx} y1={topL} x2={lx + 22} y2={topL + legH} stroke={legColor} strokeWidth="6" strokeLinecap="round" />
          <line x1={lx + 22} y1={topL} x2={lx} y2={topL + legH} stroke={edge} strokeWidth="6" strokeLinecap="round" />
          <line x1={rx} y1={topR} x2={rx + 22} y2={topR + legH} stroke={legColor} strokeWidth="6" strokeLinecap="round" />
          <line x1={rx + 22} y1={topR} x2={rx} y2={topR + legH} stroke={edge} strokeWidth="6" strokeLinecap="round" />
          <line x1={lx + 11} y1={topL + legH * 0.42} x2={rx + 11} y2={topR + legH * 0.42} stroke={edge} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    }
    if (look.leg === 'panel') {
      const lx = cx - tw / 2 + 8;
      const rx = cx + tw / 2 - 21;
      return (
        <g>
          <polygon
            points={`${lx},${topY + 6} ${lx + 13},${topY - 2} ${lx + 13},${topY - 2 + legH} ${lx},${topY + 6 + legH}`}
            fill={legColor}
            stroke={edge}
            strokeWidth="0.6"
          />
          <polygon
            points={`${rx},${topY + td - 10} ${rx + 13},${topY + td - 18} ${rx + 13},${topY + td - 18 + legH} ${rx},${topY + td - 10 + legH}`}
            fill={side}
            stroke={edge}
            strokeWidth="0.6"
          />
        </g>
      );
    }
    if (look.leg === 'taper') {
      return (
        <g>
          {legPts.map(([x, y], i) => (
            <line key={i} x1={x} y1={y} x2={x - 4} y2={y + legH} stroke={legColor} strokeWidth="6" strokeLinecap="round" />
          ))}
        </g>
      );
    }
    return (
      <g>
        {legPts.map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={x - 2} y2={y + legH} stroke={legColor} strokeWidth="7" strokeLinecap="round" />
            <line x1={x - 2} y1={y + legH} x2={x - 2} y2={y + legH + 2} stroke={edge} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          </g>
        ))}
      </g>
    );
  };
  return (
    <svg className={`product-art ${className}`} viewBox="0 0 320 200" role="img" aria-label={`${p.full} 示意图`}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#F8F1E4" />
          <stop offset="1" stopColor="#EADCC6" />
        </linearGradient>
        <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={side} />
          <stop offset="1" stopColor={top} />
        </linearGradient>
        <linearGradient id={`${uid}-sun`} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FFFDF6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF4DF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${uid}-bg)`} />
      <path d="M0 148c52-16 96-22 160-22s108 6 160 22v52H0z" fill="#E4D1B4" opacity="0.62" />
      <path d="M28 148V82c0-27 22-49 49-49s49 22 49 49v66z" fill="#F2E7D6" opacity="0.65" />
      <path d="M206 148V58c0-22 18-40 40-40h74v130z" fill="#FFF9EC" opacity="0.55" />
      <path d="M56 0h64L86 148H24z" fill={`url(#${uid}-sun)`} opacity="0.7" />
      <line x1="0" y1="148" x2="320" y2="148" stroke="#D2BC9D" strokeWidth="0.8" opacity="0.55" />
      <ellipse cx="160" cy="168" rx={tw * 0.58} ry="13" fill="#7C6244" opacity="0.17" />
      <ellipse cx="160" cy="166" rx={tw * 0.4} ry="9" fill="#9B7A52" opacity="0.12" />
      {/* 侧边植物 */}
      <g opacity="0.9">
        <path d="M266 148v-34" stroke="#8F8E6A" strokeWidth="1.4" />
        <ellipse cx="258" cy="106" rx="12" ry="5.5" fill="#85976B" transform="rotate(-28 258 106)" />
        <ellipse cx="274" cy="96" rx="14" ry="6" fill="#71855C" transform="rotate(22 274 96)" />
        <ellipse cx="264" cy="84" rx="10" ry="5" fill="#93A377" transform="rotate(-8 264 84)" />
        <path d="M252 148h28l-4 20h-20z" fill="#C39A74" />
      </g>
      {/* 桌后椅子剪影 */}
      <g opacity="0.82">
        {[cx - 46, cx + 46].map((x) => (
          <g key={x}>
            <rect x={x - 18} y={topY - 34} width="36" height="6" rx="2" fill="#C9A678" />
            <rect x={x - 18} y={topY - 34} width="4" height="36" fill="#C09A6B" />
            <rect x={x + 14} y={topY - 34} width="4" height="36" fill="#C09A6B" />
            <rect x={x - 16} y={topY + 2} width="32" height="4" rx="2" fill="#D2B389" />
          </g>
        ))}
      </g>
      <g>
        {renderLegs()}
        <polygon points={`${points[0][0]},${points[0][1] + 5} ${points[1][0]},${points[1][1] + 17} ${points[2][0]},${points[2][1] + 17} ${points[3][0]},${points[3][1] + 5}`} fill={front} />
        <polygon points={slab} fill={front} />
        <polygon points={poly} fill={`url(#${uid}-top)`} stroke={edge} strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={cx - tw / 2 + 14}
            y1={topY + 9 + i * (td / 5)}
            x2={cx + tw / 2 - 14}
            y2={topY - 3 + i * (td / 5)}
            stroke={edge}
            strokeWidth="0.7"
            opacity="0.28"
          />
        ))}
        <ellipse cx={cx + 26} cy={topY + td / 2 - 3} rx="12" ry="4" fill="#F1E8D6" />
        <path d={`M${cx + 32} ${topY + td / 2 - 8}q5-11 2-20`} stroke="#75845E" strokeWidth="1.4" fill="none" />
        <ellipse cx={cx + 34} cy={topY + td / 2 - 33} rx="7" ry="3.8" fill="#82946B" />
        <polygon
          points={`${cx - 40},${topY + td / 2 - 4} ${cx - 14},${topY + td / 2 - 8} ${cx - 14},${topY + td / 2 + 3} ${cx - 40},${topY + td / 2 + 7}`}
          fill="#F2EADA"
          stroke="#D9CCB7"
          strokeWidth="0.7"
        />
      </g>
      {label && (
        <text x="16" y="184" fill="#7A6555" fontSize="10.5" letterSpacing="0.4">
          {p.material} · {look.toneName}
        </text>
      )}
    </svg>
  );
}

export function Money({ cents, className = '', strong = false }) {
  return (
    <span className={`money ${strong ? 'is-strong' : ''} ${className}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {money(cents)}
    </span>
  );
}

export function Delta({ cents, suffix = '' }) {
  if (!cents) return <span className="delta is-flat">±¥0</span>;
  const negative = cents < 0;
  return (
    <span className={`delta ${negative ? 'is-down' : 'is-up'}`}>
      {negative ? '−' : '+'}
      {money(Math.abs(cents))}
      {suffix}
    </span>
  );
}

export function Chip({ children, tone = 'neutral', className = '', as = 'span', ...rest }) {
  const Tag = as;
  return (
    <Tag className={`chip chip-${tone} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action, hint }) {
  return (
    <div className="section-title">
      <div className="section-title-main">
        <span>{children}</span>
        {hint && <span className="section-hint">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Dot({ tone = 'teal' }) {
  return <span className={`dot dot-${tone}`} aria-hidden="true" />;
}

export function AgentMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.8l1.7 5.1 5.1 1.7-5.1 1.7L12 16.4l-1.7-5.1-5.1-1.7 5.1-1.7L12 2.8z"
        fill="currentColor"
      />
      <path d="M18.6 14.6l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function Divider({ label }) {
  return (
    <div className="rule-divider">
      <span className="rule-line" />
      {label && <span className="rule-label">{label}</span>}
      <span className="rule-line" />
    </div>
  );
}
