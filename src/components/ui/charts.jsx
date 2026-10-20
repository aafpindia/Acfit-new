import React from 'react';

/* ─── Chart Color Palette ─────────────────────────────────────── */
export const CHART_COLORS = [
  '#2563EB', // Indigo
  '#059669', // Emerald
  '#2563EB', // Blue
  '#D97706', // Amber
  '#EC4899', // Pink
  '#8B5CF6'  // Purple
];

/* ─── Light-Theme Color Tokens ─────────────────────────────────── */
const TRACK_COLOR     = '#F1F5F9';   /* slate-100 */
const GRID_COLOR      = '#E2E8F0';   /* slate-200 */
const LABEL_COLOR     = '#64748B';   /* slate-500 */
const VALUE_COLOR     = '#202124';   /* main text */
const CENTER_BG       = '#FFFFFF';   /* white surface */
const NEEDLE_COLOR    = '#475569';   /* needle */

/* ─── Mini Gauge (speedometer style) ──────────────────────────── */
export const GaugeChart = ({ value = 65, color = '#2563EB', label, size = 140 }) => {
  const r = 48;
  const cx = 70, cy = 70;
  const totalArc = Math.PI * 1.5; // 270°
  const circumference = r * totalArc;
  const filled = circumference * (value / 100);
  const startAngle = Math.PI * 1.25; // -225° from top

  const polarX = (angle) => cx + r * Math.cos(angle);
  const polarY = (angle) => cy + r * Math.sin(angle);

  const startX = polarX(startAngle);
  const startY = polarY(startAngle);
  const endA = startAngle + totalArc;
  const endX = polarX(endA);
  const endY = polarY(endA);

  // Needle angle
  const needleAngle = startAngle + totalArc * (value / 100);
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const gradId = `gauge-grad-${(label || 'default').replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={size} height={size * 0.75} viewBox="0 0 140 100" className="overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={NEEDLE_COLOR} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={NEEDLE_COLOR} />
        {/* Value */}
        <text x={cx} y={cy + 22} textAnchor="middle" fill={VALUE_COLOR} fontSize="18" fontWeight="800 font-sans">{value}%</text>
      </svg>
      {label && <span className="text-[11px] font-semibold text-[#5F6368]">{label}</span>}
    </div>
  );
};

/* ─── Horizontal Bar Chart ─────────────────────────────────────── */
export const HorizontalBar = ({ data = [], color = '#2563EB' }) => (
  <div className="space-y-3.5 w-full font-sans select-none">
    {data.map((item, i) => (
      <div key={i} className="flex items-center gap-3">
        <span className="text-xs font-medium text-[#5F6368] w-28 shrink-0 text-right truncate" title={item.fullTitle || item.label}>
          {item.label}
        </span>
        <div className="flex-1 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(5, (item.value / (item.max || 1)) * 100))}%`,
              backgroundColor: item.color || color
            }}
          />
        </div>
        <span className="text-xs font-bold text-[#202124] w-10 shrink-0 text-right">{item.value}</span>
      </div>
    ))}
  </div>
);

/* ─── Donut Chart ──────────────────────────────────────────────── */
export const DonutChart = ({ segments = [], size = 130, centerLabel, centerValue }) => {
  const r = 44, cx = 65, cy = 65;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 130 130" className="select-none">
      {/* Background track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TRACK_COLOR} strokeWidth="16" />
      {segments.map((seg, i) => {
        const dash = total > 0 ? (seg.value / total) * circumference : 0;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color || CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        );
        offset += dash;
        return el;
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r="28" fill={CENTER_BG} stroke={GRID_COLOR} strokeWidth="1" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={VALUE_COLOR} fontSize="14" fontWeight="800">
        {centerValue !== undefined ? centerValue : total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={LABEL_COLOR} fontSize="8" fontWeight="600">
        {centerLabel || 'TOTAL'}
      </text>
    </svg>
  );
};

/* ─── Vertical Bar Chart (Column) ─────────────────────────────── */
export const ColumnChart = ({ data = [], color = '#2563EB', height = 160 }) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(32, Math.floor(360 / Math.max(data.length, 1)) - 10);
  const gId = `col-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 400 ${height + 30}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1="20"
            y1={height * (1 - t)}
            x2="390"
            y2={height * (1 - t)}
            stroke={GRID_COLOR}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height - 15);
          const x = 20 + i * (370 / Math.max(data.length, 1)) + (370 / Math.max(data.length, 1) - barW) / 2;
          const y = height - barH;
          return (
            <g key={i} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="6"
                ry="6"
                fill={d.color || `url(#${gId})`}
                className="transition-all duration-300 hover:opacity-80"
              />
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fill={LABEL_COLOR} fontSize="9" fontWeight="600">
                {d.label}
              </text>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={d.color || color} fontSize="9" fontWeight="700">
                {d.value}
              </text>
            </g>
          );
        })}
        <line x1="20" y1={height} x2="390" y2={height} stroke={GRID_COLOR} strokeWidth="1" />
      </svg>
    </div>
  );
};

/* ─── Area / Line Chart (Refined Smooth Curved SVG) ──────────── */
export const LineAreaChart = ({ data = [], lines, height = 150, color = '#2563EB' }) => {
  const chartLines =
    lines ||
    (data.length > 0
      ? [
          {
            id: 'line-1',
            color: color,
            ...buildLinePath(data, 440, height - 30, 20)
          }
        ]
      : []);

  const labels = data.map((d) => d.label || '');
  const gradId = `area-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 480 ${height + 25}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <filter id="shadow-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.2, 0.5, 0.8, 1].map((t, i) => (
          <line
            key={i}
            x1="20"
            y1={(height - 30) * (1 - t) + 10}
            x2="460"
            y2={(height - 30) * (1 - t) + 10}
            stroke={GRID_COLOR}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        ))}

        {/* Area & Line paths */}
        {chartLines.map((l, li) => {
          if (!l.path) return null;
          const fillPath = `${l.path} L 460 ${height - 20} L 20 ${height - 20} Z`;
          return (
            <g key={li}>
              <path d={fillPath} fill={`url(#${gradId})`} />
              <path
                d={l.path}
                fill="none"
                stroke={l.color || color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shadow-glow)"
              />
              {l.dots?.map((pt, pi) => (
                <g key={pi} className="group cursor-pointer">
                  <circle cx={pt[0]} cy={pt[1]} r="5" fill={l.color || color} stroke="#FFFFFF" strokeWidth="2.5" />
                  <circle cx={pt[0]} cy={pt[1]} r="9" fill={l.color || color} opacity="0.15" />
                  {data[pi] && (
                    <text
                      x={pt[0]}
                      y={pt[1] - 10}
                      textAnchor="middle"
                      fill={LABEL_COLOR}
                      fontSize="9"
                      fontWeight="700"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {data[pi].value}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}

        {/* Labels */}
        {labels.map((lbl, i) => (
          <text
            key={i}
            x={labels.length > 1 ? 20 + i * (440 / (labels.length - 1)) : 240}
            y={height + 15}
            textAnchor="middle"
            fill={LABEL_COLOR}
            fontSize="10"
            fontWeight="600"
          >
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  );
};

/* ─── Training / Completion Progress Bars ─────────────────────── */
export const TrainingBars = ({ data = [] }) => (
  <div className="space-y-3.5 w-full font-sans select-none">
    {data.map((item, i) => (
      <div key={i} className="flex items-center gap-3">
        <span className="text-xs font-medium text-[#5F6368] w-28 shrink-0 truncate" title={item.label}>
          {item.label}
        </span>
        <div className="flex-1 h-3.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${item.pct}%`, backgroundColor: item.color || '#2563EB' }}
          />
        </div>
        <span className="text-xs font-bold w-10 shrink-0 text-right" style={{ color: item.color || '#2563EB' }}>
          {item.pct}%
        </span>
      </div>
    ))}
  </div>
);

/* ─── Helper: Build line path from data points ────────────────── */
export const buildLinePath = (dataPoints, width = 440, height = 120, paddingX = 20) => {
  if (!dataPoints || dataPoints.length === 0) return { path: '', dots: [] };

  const maxVal = Math.max(...dataPoints.map((d) => d.value), 1);
  const dots = dataPoints.map((d, i) => {
    const x = dataPoints.length > 1 ? paddingX + i * (width / (dataPoints.length - 1)) : paddingX + width / 2;
    const y = height - (d.value / maxVal) * (height - 20) + 10;
    return [x, y];
  });

  if (dots.length === 1) {
    return { path: `M ${dots[0][0]} ${dots[0][1]}`, dots };
  }

  // Smooth bezier curve through points
  let path = `M ${dots[0][0]} ${dots[0][1]}`;
  for (let i = 1; i < dots.length; i++) {
    const prevPt = dots[i - 1];
    const currPt = dots[i];
    const cpx = (prevPt[0] + currPt[0]) / 2;
    path += ` C ${cpx} ${prevPt[1]}, ${cpx} ${currPt[1]}, ${currPt[0]} ${currPt[1]}`;
  }

  return { path, dots };
};
