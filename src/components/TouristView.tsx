/**
 * TouristView.tsx — Tourist spots with clickable detail panel
 */
import { useState } from 'react';
import type { City, Landmark, LandmarkCategory } from '../types/city';
import { generateLandmarkDetail } from '../lib/claudeApi';

const CATEGORY_LABELS: Record<LandmarkCategory, string> = {
  station:       '駅',
  government:    '行政',
  park:          '公園',
  tower:         'タワー',
  museum:        '美術館',
  university:    '大学',
  stadium:       'スタジアム',
  port:          '港',
  industrial:    '工業',
  shrine:        '神社',
  redevelopment: '再開発',
  bridge:        '橋',
};

const CATEGORY_EMOJI: Record<LandmarkCategory, string> = {
  station:       '🚉',
  government:    '🏛',
  park:          '🌳',
  tower:         '🗼',
  museum:        '🖼',
  university:    '🎓',
  stadium:       '🏟',
  port:          '⚓',
  industrial:    '🏭',
  shrine:        '⛩',
  redevelopment: '🏗',
  bridge:        '🌉',
};

const POPULARITY_LABEL = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

// ── Landmark detail panel ─────────────────────────────────────────────────────

function LandmarkDetailPanel({
  lm,
  districtName,
  cityName,
  onClose,
}: {
  lm: Landmark;
  districtName: string;
  cityName: string;
  onClose: () => void;
}) {
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateLandmarkDetail(cityName, lm, districtName);
    setGenerated(text);
    setLoading(false);
  };

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{CATEGORY_EMOJI[lm.category]}</span>
          <div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">{lm.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-amber-500">{POPULARITY_LABEL[lm.popularity]}</span>
              <span className="text-xs text-gray-400">{districtName}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Category badge */}
        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {CATEGORY_LABELS[lm.category]}
        </span>

        {/* Basic description */}
        <p className="text-sm text-gray-600 leading-relaxed">{lm.description}</p>

        <div className="border-t border-gray-100 pt-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">詳細情報</span>

          {generated ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{generated}</p>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
                bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                '✦ AIで詳細を生成する'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface Props {
  city: City;
}

export function TouristView({ city }: Props) {
  const [selected, setSelected] = useState<Landmark | null>(null);
  const districtMap = Object.fromEntries(city.districts.map(d => [d.id, d.name]));
  const sorted = [...city.landmarks].sort((a, b) => b.popularity - a.popularity);

  const handleSelect = (lm: Landmark) => {
    setSelected(prev => prev?.id === lm.id ? null : lm);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left: landmark list */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">観光スポット</h2>
          <span className="text-xs text-gray-400">{sorted.length}件</span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-w-xl">
          {sorted.map(lm => {
            const isSelected = selected?.id === lm.id;
            return (
              <button
                key={lm.id}
                onClick={() => handleSelect(lm)}
                className={`w-full text-left rounded-xl border p-4 transition-all
                  ${isSelected
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{CATEGORY_EMOJI[lm.category]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-gray-900 text-sm">{lm.name}</h3>
                      <span className="text-xs text-amber-500 flex-shrink-0">{POPULARITY_LABEL[lm.popularity]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 mb-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[lm.category]}
                      </span>
                      <span className="text-xs text-gray-400">{districtMap[lm.districtId] ?? '不明'}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{lm.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rumors section */}
        <div className="mt-8 max-w-xl">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>👁</span> 都市の噂・伝説
          </h3>
          <div className="space-y-2">
            {city.rumors.map((r, i) => (
              <div key={i} className="bg-white border border-dashed border-gray-300 rounded-lg p-3 text-xs text-gray-500 italic leading-relaxed">
                "{r}"
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <LandmarkDetailPanel
          lm={selected}
          districtName={districtMap[selected.districtId] ?? '不明'}
          cityName={city.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
