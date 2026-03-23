/**
 * SavedDrawer.tsx — Slide-out drawer showing saved cities
 */
import { useCityStore } from '../stores/cityStore';
import { CITY_TYPE_LABELS } from '../engine/cityGenerator';
import type { CityType } from '../types/city';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SavedDrawer({ open, onClose }: Props) {
  const { savedCities, removeSaved, generate } = useCityStore();

  const load = (seed: number) => {
    generate(seed);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-700 z-50 flex flex-col
          transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white">保存済み都市</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none"
          >✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {savedCities.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-12">
              <div className="text-3xl mb-2">🏙</div>
              保存された都市はありません<br />
              <span className="text-xs">TopBarの★ボタンで保存できます</span>
            </div>
          ) : (
            savedCities.map(s => (
              <div
                key={s.seed}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors"
              >
                {/* Color bar */}
                <div className="h-1.5" style={{ backgroundColor: s.themeColor }} />

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{s.name}</div>
                      <div className="text-slate-400 text-xs">{s.englishName}</div>
                    </div>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.themeColor + '33', color: s.themeColor }}
                    >
                      {CITY_TYPE_LABELS[s.type as CityType]}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      人口 {s.population.toLocaleString('ja-JP')}人
                    </span>
                    <span className="text-xs text-slate-600 font-mono">seed:{s.seed}</span>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => load(s.seed)}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    >
                      読み込む
                    </button>
                    <button
                      onClick={() => removeSaved(s.seed)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-700 text-xs text-slate-600 text-center">
          最大20件保存 · ブラウザに保存
        </div>
      </div>
    </>
  );
}
