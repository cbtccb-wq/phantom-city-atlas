/**
 * DistrictPanel.tsx — Right-side panel showing district details
 */

import type { District, DistrictType } from '../types/city';

const TYPE_LABELS: Record<DistrictType, string> = {
  commercial:     '商業地区',
  residential:    '住宅地区',
  industrial:     '工業地区',
  cultural:       '文化地区',
  administrative: '行政地区',
  entertainment:  '歓楽街',
  historic:       '旧市街',
  port:           '港湾地区',
  developing:     '再開発区',
};

const TYPE_BG: Record<DistrictType, string> = {
  commercial:     'bg-orange-100 text-orange-800',
  residential:    'bg-green-100 text-green-800',
  industrial:     'bg-slate-100 text-slate-800',
  cultural:       'bg-purple-100 text-purple-800',
  administrative: 'bg-blue-100 text-blue-800',
  entertainment:  'bg-pink-100 text-pink-800',
  historic:       'bg-yellow-100 text-yellow-800',
  port:           'bg-cyan-100 text-cyan-800',
  developing:     'bg-emerald-100 text-emerald-800',
};

function LevelBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < value ? color : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}

interface Props {
  district: District;
  onClose: () => void;
}

export function DistrictPanel({ district, onClose }: Props) {
  return (
    <div
      className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto"
      style={{ animation: 'slideIn 0.2s ease-out' }}
    >
      {/* Header */}
      <div
        className="p-4 text-white relative"
        style={{ backgroundColor: district.color }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-sm transition-colors"
        >
          ✕
        </button>
        <div className="pr-8">
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            {district.name}
          </h2>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-white/20`}>
            {TYPE_LABELS[district.type]}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {district.tags.map(tag => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BG[district.type]}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed text-xs">
          {district.description}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">人口</div>
            <div className="font-bold text-gray-800">
              {district.population.toLocaleString('ja-JP')}人
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">雰囲気</div>
            <div className="font-bold text-gray-800">{district.mood}</div>
          </div>
        </div>

        {/* Safety */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>治安</span>
            <span className="font-medium">{district.safetyLevel}/5</span>
          </div>
          <LevelBar value={district.safetyLevel} color="bg-emerald-400" />
        </div>

        {/* Land price */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>地価</span>
            <span className="font-medium">{district.landPriceLevel}/5</span>
          </div>
          <LevelBar value={district.landPriceLevel} color="bg-amber-400" />
        </div>

        {/* Street type */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">街並みタイプ</div>
          <div className="text-gray-700">{district.streetType}</div>
        </div>

        {/* Local tip */}
        <div className="border-l-2 border-gray-300 pl-3">
          <div className="text-xs text-gray-400 mb-1">ローカルの声</div>
          <p className="text-gray-600 text-xs italic leading-relaxed">
            "{district.localTip}"
          </p>
        </div>
      </div>
    </div>
  );
}
