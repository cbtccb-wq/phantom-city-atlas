/**
 * MiniCityMap.tsx — Read-only mini city map for detail panels
 * Zooms to pin location with smooth CSS transition when a highlight is set
 */
import { useMemo } from 'react';
import type { City, Line, Point } from '../types/city';

const MAP_W = 800;
const MAP_H = 700;

function ptsPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
}

function lnPath(pts: Point[]): string {
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

interface Props {
  city: City;
  highlightX?: number;
  highlightY?: number;
  highlightLine?: Line;
  label?: string;
}

export function MiniCityMap({ city, highlightX, highlightY, highlightLine, label }: Props) {
  const hasPin = highlightX !== undefined && highlightY !== undefined;

  // CSS transform: zoom in on pin with smooth animation
  const mapTransform = useMemo(() => {
    if (!hasPin) return '';
    const zoom = 2.8;
    const tx = MAP_W / 2 - highlightX! * zoom;
    const ty = MAP_H / 2 - highlightY! * zoom;
    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${zoom})`;
  }, [hasPin, highlightX, highlightY]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'hidden' }}
      >
        <g
          style={{
            transform: mapTransform,
            transformOrigin: '0 0',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Terrain */}
          {city.terrain.map((f, i) => {
            if (f.type === 'coast') {
              return (
                <path key={i}
                  d={lnPath(f.path) + ' Z'}
                  fill="#bde3f7" fillOpacity={0.55}
                  stroke="#74b9e8" strokeWidth={1.5} />
              );
            }
            if (f.type === 'river') {
              return (
                <path key={i}
                  d={lnPath(f.path)}
                  fill="none"
                  stroke={f.color ?? '#74b9e8'}
                  strokeWidth={f.width ?? 6}
                  strokeLinecap="round"
                  opacity={0.65} />
              );
            }
            if (f.type === 'road') {
              return (
                <path key={i}
                  d={lnPath(f.path)}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  opacity={0.4} />
              );
            }
            return null;
          })}

          {/* Districts */}
          {city.districts.map(d => (
            <path
              key={d.id}
              d={ptsPath(d.polygon)}
              fill={d.color}
              fillOpacity={0.5}
              stroke="#64748b"
              strokeWidth={0.8}
            />
          ))}

          {/* Transit lines */}
          {city.lines.map(line => {
            const isHL = highlightLine?.id === line.id;
            const pts = line.stations;
            if (pts.length < 2) return null;
            const path = pts.map((s, i) => `${i === 0 ? 'M' : 'L'}${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ');
            return (
              <path
                key={line.id}
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth={isHL ? 4 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={highlightLine ? (isHL ? 1 : 0.18) : 0.75}
              />
            );
          })}

          {/* Station dots */}
          {city.lines.flatMap(line => {
            if (highlightLine && highlightLine.id !== line.id) return [];
            return line.stations.map(s => (
              <circle
                key={s.id}
                cx={s.x} cy={s.y}
                r={s.interchange ? 4 : 2.5}
                fill="white"
                stroke={line.color}
                strokeWidth={1.5}
                opacity={0.85}
              />
            ));
          })}

          {/* Location pin with pulse */}
          {hasPin && (
            <g>
              <circle cx={highlightX} cy={highlightY} r={8} fill="#ef4444" fillOpacity={0.25}>
                <animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={highlightX} cy={highlightY} r={7}
                fill="#ef4444" stroke="white" strokeWidth={2.5} />
              <circle cx={highlightX} cy={highlightY} r={2.5} fill="white" />
            </g>
          )}
        </g>
      </svg>

      {/* Bottom label */}
      {label && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/55 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium tracking-wide">
            {label}
          </div>
        </div>
      )}

      {/* Idle watermark */}
      {!hasPin && !highlightLine && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="text-slate-400/50 text-[10px] font-mono uppercase tracking-widest select-none">
            city map
          </span>
        </div>
      )}
    </div>
  );
}
