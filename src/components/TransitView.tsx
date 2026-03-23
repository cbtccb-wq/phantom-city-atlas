/**
 * TransitView.tsx — Transit diagram screen
 * Diagram-style transit map: horizontal lines, vertical station dots
 */
import type { City, Line, Station } from '../types/city';

const TYPE_LABELS: Record<string, string> = {
  subway:   '地下鉄',
  commuter: '私鉄',
  circular: '環状線',
  night:    '夜行',
  tram:     '路面電車',
  monorail: 'モノレール',
  brt:      'BRT',
};

const CROWD_LABEL = ['', '閑散', 'やや空き', '普通', 'やや混雑', '激混み'];

interface StationCardProps {
  station: Station;
  line: Line;
  selected: boolean;
  onClick: () => void;
}

function StationDot({ station, line, selected, onClick }: StationCardProps) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer group"
      onClick={onClick}
    >
      {/* Station name (above) */}
      <div
        className={`text-[10px] mb-1 text-center leading-tight max-w-[60px] break-words transition-colors
          ${selected ? 'font-bold text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: 56, overflow: 'hidden' }}
      >
        {station.name}
      </div>

      {/* Dot */}
      <div
        className={`rounded-full border-2 transition-all ${selected ? 'scale-125' : 'group-hover:scale-110'}`}
        style={{
          width: station.interchange ? 16 : 12,
          height: station.interchange ? 16 : 12,
          backgroundColor: station.interchange ? 'white' : line.color,
          borderColor: line.color,
          boxShadow: selected ? `0 0 0 3px ${line.color}44` : undefined,
        }}
      />

      {/* Interchange badge */}
      {station.interchange && (
        <div className="mt-1 text-[8px] text-gray-400">乗換</div>
      )}
    </div>
  );
}

interface LineDiagramProps {
  line: Line;
  selected: Station | null;
  onSelect: (s: Station) => void;
}

function LineDiagram({ line, selected, onSelect }: LineDiagramProps) {
  return (
    <div className="mb-6">
      {/* Line header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
        <span className="font-bold text-sm text-gray-800">{line.name}</span>
        <span className="text-xs text-gray-400">{TYPE_LABELS[line.type]}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">混雑: {CROWD_LABEL[line.crowdedness]}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">全{line.stations.length}駅</span>
      </div>

      {/* Diagram row */}
      <div className="flex items-end gap-0 overflow-x-auto pb-2">
        {line.stations.map((s, i) => (
          <div key={s.id} className="flex items-center">
            {/* Station */}
            <StationDot
              station={s}
              line={line}
              selected={selected?.id === s.id}
              onClick={() => onSelect(s)}
            />
            {/* Connector line */}
            {i < line.stations.length - 1 && (
              <div
                className="h-1 flex-shrink-0"
                style={{ width: 32, backgroundColor: line.color, marginBottom: 14 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface StationDetailProps {
  station: Station;
  line: Line;
}

function StationDetail({ station, line }: StationDetailProps) {
  const vol = station.passengerVolume;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-lg text-gray-900">{station.name}</div>
          <div className="text-xs text-gray-400">{line.name}</div>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: line.color }}
        >
          {TYPE_LABELS[line.type][0]}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-0.5">乗降客数</div>
          <div className="font-medium text-gray-800">{'●'.repeat(vol)}{'○'.repeat(5 - vol)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-0.5">乗換</div>
          <div className="font-medium text-gray-800">{station.interchange ? 'あり' : 'なし'}</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{station.description}</p>
    </div>
  );
}

interface Props {
  city: City;
}

export function TransitView({ city }: Props) {
  const [selectedStation, setSelectedStation] = useState<{ station: Station; line: Line } | null>(null);
  const [search, setSearch] = useState('');

  const allStations = city.lines.flatMap(line =>
    line.stations.map(s => ({ station: s, line }))
  );
  const filtered = search
    ? allStations.filter(({ station }) => station.name.includes(search))
    : [];

  return (
    <div className="flex h-full min-h-0">
      {/* Main diagram */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 mb-5">路線図</h2>
        {city.lines.map(line => (
          <LineDiagram
            key={line.id}
            line={line}
            selected={selectedStation?.station ?? null}
            onSelect={(s) => setSelectedStation({ station: s, line })}
          />
        ))}
      </div>

      {/* Right panel: search + detail */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="駅を検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
          />
          {search && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {filtered.length === 0
                ? <div className="text-xs text-gray-400 p-2">見つかりません</div>
                : filtered.map(({ station, line }) => (
                  <button
                    key={station.id}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { setSelectedStation({ station, line }); setSearch(''); }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                    <span>{station.name}</span>
                    <span className="text-gray-400 ml-auto">{line.name}</span>
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* Station detail */}
        <div className="p-3 flex-1 overflow-y-auto">
          {selectedStation
            ? <StationDetail station={selectedStation.station} line={selectedStation.line} />
            : (
              <div className="text-center text-gray-400 text-sm mt-8">
                <div className="text-3xl mb-2">🚉</div>
                駅をクリックして<br />詳細を表示
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

// Need useState
import { useState } from 'react';
