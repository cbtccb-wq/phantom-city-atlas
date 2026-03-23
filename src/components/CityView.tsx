/**
 * CityView.tsx — Main city exploration view
 * Screens: Map | Transit | Tourist | Stats | Legends | Council | Diagnosis
 */
import { useState } from 'react';
import type { City } from '../types/city';
import { useCityStore } from '../stores/cityStore';
import { TopBar } from './TopBar';
import { CityMap } from './CityMap';
import { DistrictPanel } from './DistrictPanel';
import { TransitView } from './TransitView';
import { TouristView } from './TouristView';
import { StatsView } from './StatsView';
import { LegendsView } from './LegendsView';
import { CouncilView } from './CouncilView';
import { DiagnosisView } from './DiagnosisView';

type Screen = 'map' | 'transit' | 'tourist' | 'stats' | 'legends' | 'council' | 'diagnosis';
type Layer = 'standard' | 'administrative' | 'transit' | 'tourist' | 'safety' | 'landprice';

const SCREENS: { id: Screen; label: string; icon: string; separator?: boolean }[] = [
  { id: 'map',       label: '地図',   icon: '🗺' },
  { id: 'transit',   label: '路線',   icon: '🚇' },
  { id: 'tourist',   label: '観光',   icon: '📸' },
  { id: 'stats',     label: '統計',   icon: '📊' },
  { id: 'legends',   label: '伝説',   icon: '👁',  separator: true },
  { id: 'council',   label: '議会',   icon: '📋' },
  { id: 'diagnosis', label: '診断',   icon: '🎯' },
];

const MAP_LAYERS: { id: Layer; label: string; icon: string }[] = [
  { id: 'standard',       label: '標準', icon: '◎' },
  { id: 'administrative', label: '行政', icon: '🏛' },
  { id: 'transit',        label: '交通', icon: '🚇' },
  { id: 'safety',         label: '治安', icon: '🛡' },
  { id: 'landprice',      label: '地価', icon: '💴' },
];

interface Props {
  city: City;
}

export function CityView({ city }: Props) {
  const { selectedDistrict, selectDistrict, activeLayer, setLayer, generate } = useCityStore();
  const [screen, setScreen] = useState<Screen>('map');

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <TopBar city={city} onRegenerate={() => generate()} />

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-14 flex flex-col items-center py-2 gap-0.5 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          {SCREENS.map(s => (
            <div key={s.id} className="w-full flex flex-col items-center">
              {s.separator && <div className="w-8 h-px bg-slate-600 my-1" />}
              <button
                onClick={() => setScreen(s.id)}
                title={s.label}
                className={`
                  w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs transition-all
                  ${screen === s.id
                    ? 'bg-white/25 text-white ring-1 ring-white/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'}
                `}
              >
                <span className="text-base leading-none">{s.icon}</span>
                <span className="text-[8px] mt-0.5 leading-none">{s.label}</span>
              </button>
            </div>
          ))}

          {/* Map layer toggles (only on map screen) */}
          {screen === 'map' && (
            <>
              <div className="w-8 h-px bg-slate-600 my-1" />
              {MAP_LAYERS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayer(l.id)}
                  title={l.label}
                  className={`
                    w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs transition-all
                    ${activeLayer === l.id
                      ? 'bg-blue-600/60 text-white'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                  `}
                >
                  <span className="text-xs leading-none">{l.icon}</span>
                  <span className="text-[8px] mt-0.5 leading-none">{l.label}</span>
                </button>
              ))}
            </>
          )}

          <div className="flex-1" />

          {/* Transit line color legend */}
          <div className="w-10 mb-2 space-y-1">
            {city.lines.map(line => (
              <div key={line.id} title={line.name}
                className="w-full h-1.5 rounded-full"
                style={{ backgroundColor: line.color }}
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex overflow-hidden" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {screen === 'map' && (
            <>
              <div className="flex-1 min-w-0">
                <CityMap city={city} />
              </div>
              <div
                className={`transition-all duration-300 overflow-hidden ${selectedDistrict ? 'w-64' : 'w-0'}`}
                style={{ minWidth: selectedDistrict ? '240px' : '0' }}
              >
                {selectedDistrict && (
                  <DistrictPanel
                    district={selectedDistrict}
                    onClose={() => selectDistrict(null)}
                  />
                )}
              </div>
            </>
          )}
          {screen === 'transit'   && <TransitView city={city} />}
          {screen === 'tourist'   && <TouristView city={city} />}
          {screen === 'stats'     && <StatsView city={city} />}
          {screen === 'legends'   && <LegendsView city={city} />}
          {screen === 'council'   && <CouncilView city={city} />}
          {screen === 'diagnosis' && <DiagnosisView city={city} />}
        </div>
      </div>

      {/* Bottom news ticker */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-1.5 overflow-hidden">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="text-slate-500 shrink-0">📰</span>
          <div className="overflow-hidden flex-1">
            <div style={{ animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap', display: 'inline-block' }}>
              {city.news.join('　　／　　')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
