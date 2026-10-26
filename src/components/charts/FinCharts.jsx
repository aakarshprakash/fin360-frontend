// Lightweight SVG charts for the finance dashboard. Marks follow one spec:
// bars ≤24px with a 4px rounded data-end and square baseline, 2px surface gaps,
// 2px lines, hairline solid gridlines, text in ink tokens (never series colour).
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { formatMoney, formatMoneyCompact } from '../../utils/format';
import { SERIES, CATEGORY_COLORS } from './chartColors';

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function niceMax(value, ticks = 4) {
  if (value <= 0) return ticks;
  const raw = value / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return step * ticks;
}

// Column with rounded top corners and a square baseline
function columnPath(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function IncomeExpenseBars({ data, height = 260 }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const pad = { top: 12, right: 8, bottom: 28, left: 52 };
  const plotW = Math.max(0, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...data.flatMap((d) => [d.income, d.expense])));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(6, Math.min(24, (band * 0.62 - 2) / 2));
  const y = (v) => pad.top + plotH - (v / max) * plotH;
  const empty = data.every((d) => !d.income && !d.expense);

  return (
    <div className="fc-bars" ref={wrapRef}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Income versus expenses by month">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="fc-grid" />
              <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fc-tick">
                {formatMoneyCompact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = pad.left + band * i + band / 2;
            const x0 = cx - barW - 1;
            return (
              <g key={d.month}>
                {hover === i && (
                  <rect x={pad.left + band * i + 4} y={pad.top} width={band - 8} height={plotH} rx="8" className="fc-band" />
                )}
                <path d={columnPath(x0, y(d.income), barW, pad.top + plotH - y(d.income))} fill={SERIES.income} />
                <path d={columnPath(x0 + barW + 2, y(d.expense), barW, pad.top + plotH - y(d.expense))} fill={SERIES.expense} />
                <text x={cx} y={height - 8} textAnchor="middle" className="fc-tick">{d.month}</text>
                <rect
                  x={pad.left + band * i}
                  y={pad.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          <line x1={pad.left} x2={width - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} className="fc-axis" />
        </svg>
      )}

      {hover !== null && data[hover] && (
        <div
          className="fc-tooltip"
          style={{ left: Math.min(Math.max(pad.left + band * hover + band / 2, 80), width - 80), top: 0 }}
        >
          <strong>{data[hover].month}</strong>
          <span><i style={{ background: SERIES.income }} />Income <b>{formatMoney(data[hover].income)}</b></span>
          <span><i style={{ background: SERIES.expense }} />Expenses <b>{formatMoney(data[hover].expense)}</b></span>
        </div>
      )}

      {empty && <p className="fc-empty">No income or expenses recorded in these months yet.</p>}

      <table className="sr-only">
        <caption>Income and expenses by month</caption>
        <thead><tr><th>Month</th><th>Income</th><th>Expenses</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}><td>{d.month}</td><td>{formatMoney(d.income)}</td><td>{formatMoney(d.expense)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(rOuter, a0);
  const [x1, y1] = p(rOuter, a1);
  const [x2, y2] = p(rInner, a1);
  const [x3, y3] = p(rInner, a0);
  return `M${x0},${y0}A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${rInner},${rInner} 0 ${large} 0 ${x3},${y3}Z`;
}

export function ExpenseDonut({ data, size = 176, thickness = 22 }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const r = size / 2;
  const gap = data.length > 1 ? 2 / (r - thickness / 2) : 0; // 2px surface gap
  const segments = data.reduce((acc, d, i) => {
    const start = acc.length ? acc[acc.length - 1].end : 0;
    const end = start + (total ? (d.amount / total) * Math.PI * 2 : 0);
    acc.push({ ...d, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length], end, a0: start + gap / 2, a1: end - gap / 2 });
    return acc;
  }, []);
  const focus = active !== null ? segments[active] : null;

  if (!total) {
    return <p className="fc-empty is-static">No expenses recorded in this period.</p>;
  }

  return (
    <div className="fc-donut">
      <div className="fc-donut-ring">
        <svg width={size} height={size} role="img" aria-label="Expense breakdown by category">
          {segments.map((s, i) => (
            <path
              key={s.category}
              d={arcPath(r, r, active === i ? r : r - 2, r - thickness, s.a0, Math.max(s.a0 + 0.001, s.a1))}
              fill={s.color}
              opacity={active === null || active === i ? 1 : 0.35}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="fc-donut-center">
          <strong>{formatMoneyCompact(focus ? focus.amount : total)}</strong>
          <span>{focus ? focus.category : 'Total'}</span>
        </div>
      </div>
      <ul className="fc-legend">
        {segments.map((s, i) => (
          <li
            key={s.category}
            className={active === i ? 'is-active' : ''}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <i style={{ background: s.color }} />
            <span className="fc-legend-label">{s.category}</span>
            <span className="fc-legend-pct">{Math.round((s.amount / total) * 100)}%</span>
            <span className="fc-legend-val">{formatMoneyCompact(s.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values, color, width = 88, height = 34 }) {
  const id = useId();
  if (!values?.length || values.every((v) => !v)) return <span className="fc-spark-empty" />;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    4 + (i / (values.length - 1 || 1)) * (width - 8),
    4 + (1 - (v - min) / span) * (height - 8),
  ]);
  const line = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`).join('');
  const area = `${line}L${pts[pts.length - 1][0]},${height}L${pts[0][0]},${height}Z`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="fc-spark" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r="3.5" fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
