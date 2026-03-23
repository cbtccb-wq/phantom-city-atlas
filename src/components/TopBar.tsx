import { useState } from 'react';
import type { City } from '../types/city';
import { CITY_TYPE_LABELS } from '../engine/cityGenerator';
import { useCityStore } from '../stores/cityStore';
import { SavedDrawer } from './SavedDrawer';
import { ExportButton } from './ExportButton';
import { getShareUrl } from '../lib/urlSync';

interface Props {
  city: City;
  onRegenerate: () => void;
}

export function TopBar({ city, onRegenerate }: Props) {
  const { saveCity, isSaved } = useCityStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const saved = isSaved(city.seed);

  const handleShare = async () => {
    const url = getShareUrl(city.seed);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('このURLをコピーしてください:', url);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2.5 text-white shadow-md flex-shrink-0"
        style={{ backgroundColor: city.themeColor }}
      >
        {/* Left: city info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {city.name}
            </h1>
            <div className="text-xs opacity-70 truncate">{city.englishName}</div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm opacity-90 flex-shrink-0">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {CITY_TYPE_LABELS[city.type]}
            </span>
            <span className="text-xs">人口 {city.population.toLocaleString('ja-JP')}人</span>
            <span className="opacity-40 hidden md:inline">|</span>
            <span className="opacity-75 text-xs italic hidden md:inline">"{city.tagline}"</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Seed display */}
          <div className="text-xs opacity-50 hidden lg:block font-mono">#{city.seed}</div>

          {/* Share URL */}
          <button
            onClick={handleShare}
            title="URLをコピーしてシェア"
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
          >
            {copied ? '✓ コピー済' : '🔗 共有'}
          </button>

          {/* Export SVG */}
          <ExportButton city={city} />

          {/* Save / unsave */}
          <button
            onClick={saveCity}
            disabled={saved}
            title={saved ? '保存済み' : 'この都市を保存'}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors font-medium
              ${saved
                ? 'bg-white/30 text-white cursor-default'
                : 'bg-white/20 hover:bg-white/30 text-white'}`}
          >
            {saved ? '★ 保存済' : '☆ 保存'}
          </button>

          {/* Saved list */}
          <button
            onClick={() => setDrawerOpen(true)}
            title="保存済み都市を見る"
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full transition-colors"
          >
            🏙
          </button>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full transition-colors font-medium"
          >
            再生成
          </button>
        </div>
      </div>

      <SavedDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
