/**
 * CityMap.tsx — SVG-based interactive city map
 * Features: district polygons, terrain, transit lines, stations, landmarks
 * Interactions: zoom, drag, district click
 */
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { City, District, Point, TerrainFeature } from '../types/city';
import { useCityStore } from '../stores/cityStore';

const MAP_W = 800;
const MAP_H = 700;

function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
}

function polylinePath(pts: Point[]): string {
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

// ── Landmark icons ────────────────────────────────────────────────────────────

function LandmarkIcon({ category, x, y }: { category: string; x: number; y: number }) {
  const size = 8;
  switch (category) {
    case 'park':
      return <circle cx={x} cy={y} r={size / 2} fill="#4ade80" stroke="#16a34a" strokeWidth={1} />;
    case 'government':
      return <rect x={x - size/2} y={y - size/2} width={size} height={size} fill="#60a5fa" stroke="#2563eb" strokeWidth={1} />;
    case 'tower':
      return (
        <polygon
          points={`${x},${y - size} ${x + size/2},${y + size/2} ${x - size/2},${y + size/2}`}
          fill="#fbbf24" stroke="#d97706" strokeWidth={1}
        />
      );
    case 'museum':
      return <rect x={x - size/2} y={y - size/2} width={size} height={size} rx={2} fill="#c084fc" stroke="#7c3aed" strokeWidth={1} />;
    case 'shrine':
      return (
        <>
          <line x1={x - size} y1={y} x2={x + size} y2={y} stroke="#dc2626" strokeWidth={2} />
          <line x1={x} y1={y - size} x2={x} y2={y + size} stroke="#dc2626" strokeWidth={2} />
        </>
      );
    default:
      return <circle cx={x} cy={y} r={size / 2} fill="#94a3b8" stroke="#475569" strokeWidth={1} />;
  }
}

// ── Terrain rendering ─────────────────────────────────────────────────────────

function TerrainLayer({ features }: { features: TerrainFeature[] }) {
  return (
    <g className="terrain">
      {features.map((f, i) => {
        if (f.type === 'coast') {
          return (
            <path
              key={i}
              d={polylinePath(f.path) + ' Z'}
              fill={f.color ?? '#bde3f7'}
              fillOpacity={0.6}
              stroke="#74b9e8"
              strokeWidth={1.5}
            />
          );
        }
        if (f.type === 'river') {
          return (
            <path
              key={i}
              d={polylinePath(f.path)}
              fill="none"
              stroke={f.color ?? '#74b9e8'}
              strokeWidth={f.width ?? 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.75}
            />
          );
        }
        if (f.type === 'road') {
          return (
            <path
              key={i}
              d={polylinePath(f.path)}
              fill="none"
              stroke="#d1d5db"
              strokeWidth={2.5}
              strokeDasharray="none"
              opacity={0.5}
            />
          );
        }
        return null;
      })}
    </g>
  );
}

// ── Transit layer ─────────────────────────────────────────────────────────────

function TransitLayer({ city, showLabels }: { city: City; showLabels: boolean }) {
  return (
    <g className="transit">
      {city.lines.map((line) => {
        const pts = line.stations;
        if (pts.length < 2) return null;
        const path = pts.map((s, i) => `${i === 0 ? 'M' : 'L'}${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ');

        return (
          <g key={line.id}>
            {/* Line shadow */}
            <path d={path} fill="none" stroke="#000" strokeWidth={5} strokeOpacity={0.15}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Line */}
            <path d={path} fill="none" stroke={line.color} strokeWidth={3.5}
              strokeLinecap="round" strokeLinejoin="round" />

            {/* Stations */}
            {pts.map((s) => (
              <g key={s.id} className="group" style={{ cursor: 'pointer' }}>
                <circle
                  cx={s.x} cy={s.y}
                  r={s.interchange ? 6 : 4}
                  fill="white"
                  stroke={line.color}
                  strokeWidth={2}
                />
                {s.interchange && (
                  <circle cx={s.x} cy={s.y} r={3} fill={line.color} />
                )}
                {showLabels && (
                  <text
                    x={s.x + 8} y={s.y + 4}
                    fontSize={9}
                    fill="#374151"
                    stroke="white"
                    strokeWidth={3}
                    paintOrder="stroke"
                    fontFamily="sans-serif"
                  >
                    {s.name}
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ── District layer ────────────────────────────────────────────────────────────

function DistrictLayer({
  city,
  selectedId,
  onSelect,
  layer,
}: {
  city: City;
  selectedId: string | null;
  onSelect: (d: District) => void;
  layer: string;
}) {
  const getColor = (d: District) => {
    if (layer === 'safety') {
      const h = Math.round(d.safetyLevel * 24);
      return `hsl(${h + 20}, 70%, 55%)`;
    }
    if (layer === 'landprice') {
      const r = d.landPriceLevel / 5;
      return `hsl(${Math.round(220 - r * 220)}, 75%, 55%)`;
    }
    return d.color;
  };

  // Pre-calculate label positions once per city change
  const labelPositions = useMemo(() =>
    city.districts.map(d => ({
      id: d.id,
      cx: d.polygon.length > 0 ? d.polygon.reduce((s, p) => s + p.x, 0) / d.polygon.length : 0,
      cy: d.polygon.length > 0 ? d.polygon.reduce((s, p) => s + p.y, 0) / d.polygon.length : 0,
    })),
    [city.districts]
  );

  return (
    <g className="districts">
      {city.districts.map((d, i) => {
        const isSelected = d.id === selectedId;
        const { cx, cy } = labelPositions[i];
        return (
          <g
            key={d.id}
            onClick={() => onSelect(d)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d); } }}
            tabIndex={0}
            role="button"
            aria-label={`${d.name}地区の詳細を表示`}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <path
              d={pointsToPath(d.polygon)}
              fill={getColor(d)}
              fillOpacity={isSelected ? 0.85 : 0.55}
              stroke={isSelected ? '#1e293b' : '#64748b'}
              strokeWidth={isSelected ? 2.5 : 1}
              style={{ transition: 'fill-opacity 0.2s, stroke-width 0.2s' }}
            />
            {/* Hover highlight area */}
            <path
              d={pointsToPath(d.polygon)}
              fill="transparent"
              stroke="transparent"
              strokeWidth={6}
            />
            {/* District label */}
            {d.polygon.length > 0 && (
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={isSelected ? 700 : 500}
                fill={isSelected ? '#1e293b' : '#374151'}
                stroke="white"
                strokeWidth={3}
                paintOrder="stroke"
                fontFamily="'Noto Sans JP', sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Main CityMap component ────────────────────────────────────────────────────

interface Props {
  city: City;
}

export function CityMap({ city }: Props) {
  const { selectedDistrict, selectDistrict, activeLayer } = useCityStore();

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const showLabels = transform.scale > 0.9;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => ({
      ...t,
      scale: Math.min(3, Math.max(0.4, t.scale * delta)),
    }));
  }, []);

  // Reset transform when new city generated
  useEffect(() => { setTransform({ x: 0, y: 0, scale: 1 }); }, [city.id]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 rounded-lg">
      <svg
        ref={svgRef}
        data-export
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background */}
        <rect width={MAP_W} height={MAP_H} fill="#e8edf2" />

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}
           style={{ transformOrigin: 'center' }}>
          {/* Terrain (bottom layer) */}
          <TerrainLayer features={city.terrain} />

          {/* Districts */}
          <DistrictLayer
            city={city}
            selectedId={selectedDistrict?.id ?? null}
            onSelect={selectDistrict}
            layer={activeLayer}
          />

          {/* Transit */}
          {(activeLayer === 'standard' || activeLayer === 'transit') && (
            <TransitLayer city={city} showLabels={showLabels} />
          )}

          {/* Landmarks */}
          {city.landmarks.map(lm => (
            <g key={lm.id} filter="url(#shadow)">
              <LandmarkIcon category={lm.category} x={lm.x} y={lm.y} />
            </g>
          ))}
        </g>

        {/* Zoom controls overlay */}
        <g>
          <rect x={MAP_W - 44} y={8} width={36} height={72} rx={6} fill="white" fillOpacity={0.9} />
          <text x={MAP_W - 26} y={30} textAnchor="middle" fontSize={18} fill="#374151"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}>+</text>
          <line x1={MAP_W - 40} y1={44} x2={MAP_W - 12} y2={44} stroke="#d1d5db" strokeWidth={1} />
          <text x={MAP_W - 26} y={66} textAnchor="middle" fontSize={18} fill="#374151"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.4, t.scale * 0.8) }))}>−</text>
        </g>
      </svg>
    </div>
  );
}
