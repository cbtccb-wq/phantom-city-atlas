/**
 * TouristView.tsx — Tourist spots & landmarks card list
 */
import type { City, Landmark, LandmarkCategory } from '../types/city';

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

function LandmarkCard({ lm, districtName }: { lm: Landmark; districtName: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
            <span className="text-xs text-gray-400">{districtName}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{lm.description}</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  city: City;
}

export function TouristView({ city }: Props) {
  const districtMap = Object.fromEntries(city.districts.map(d => [d.id, d.name]));

  const sorted = [...city.landmarks].sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">観光スポット</h2>
          <span className="text-xs text-gray-400">{sorted.length}件</span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-w-2xl">
          {sorted.map(lm => (
            <LandmarkCard
              key={lm.id}
              lm={lm}
              districtName={districtMap[lm.districtId] ?? '不明'}
            />
          ))}
        </div>

        {/* Rumors section */}
        <div className="mt-8 max-w-2xl">
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
    </div>
  );
}
