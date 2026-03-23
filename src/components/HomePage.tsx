import { useState } from 'react';
import { useCityStore } from '../stores/cityStore';
import { CITY_TYPE_LABELS } from '../engine/cityGenerator';
import type { CityType } from '../types/city';

const SAMPLE_SEEDS = [42, 1337, 88888, 314159, 999, 777777, 2024];
const SAMPLE_CITY_NAMES = ['白鷺ヶ浜市', '東光港市', '水ノ峰都', '碧川崎市', '龍ノ台市', '新萩浦市', '霧谷市'];

export function HomePage() {
  const { generate, isGenerating, savedCities, removeSaved } = useCityStore();
  const [seedInput, setSeedInput] = useState('');

  const handleGenerate = () => {
    const seed = seedInput.trim() ? parseInt(seedInput, 10) : undefined;
    if (seedInput.trim() && isNaN(seed!)) return;
    generate(seed);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative transit lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" aria-hidden>
        <line x1="0" y1="30%" x2="100%" y2="40%" stroke="#60a5fa" strokeWidth="3" />
        <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#f87171" strokeWidth="2" />
        <line x1="20%" y1="0" x2="35%" y2="100%" stroke="#4ade80" strokeWidth="2" />
        <line x1="70%" y1="0" x2="65%" y2="100%" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="35%" cy="39%" r="6" fill="#60a5fa" />
        <circle cx="65%" cy="56%" r="6" fill="#f87171" />
        <circle cx="35%" cy="60%" r="4" fill="white" stroke="#4ade80" strokeWidth="2" />
      </svg>

      <div className="relative z-10 w-full max-w-xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="mb-2 text-slate-500 text-xs tracking-widest uppercase">Phantom City Atlas</div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            架空都市へようこそ
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            シード値から再現可能な都市を生成します。<br />
            地図を探索し、地区をクリックして都市を感じてください。
          </p>
        </div>

        {/* Seed input */}
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="シード値（省略でランダム）"
            value={seedInput}
            onChange={e => setSeedInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="flex-1 bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {isGenerating ? '生成中…' : '都市を生成'}
          </button>
        </div>

        {/* Sample seeds */}
        <div className="mb-8">
          <div className="text-xs text-slate-600 mb-2">サンプル都市：</div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SEEDS.map((s, i) => (
              <button
                key={s}
                onClick={() => { setSeedInput(String(s)); generate(s); }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 text-xs px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="text-slate-500 mr-1">{s}</span>
                {SAMPLE_CITY_NAMES[i]}
              </button>
            ))}
          </div>
        </div>

        {/* Saved cities */}
        {savedCities.length > 0 && (
          <div className="mb-8">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
              <span>★ 保存済み都市</span>
              <span className="text-slate-600">({savedCities.length}件)</span>
            </div>
            <div className="space-y-2">
              {savedCities.map(s => (
                <div
                  key={s.seed}
                  className="flex items-center gap-3 bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2 hover:border-slate-500 transition-colors"
                >
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.themeColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{s.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span style={{ color: s.themeColor }}>{CITY_TYPE_LABELS[s.type as CityType]}</span>
                      <span>·</span>
                      <span>人口 {s.population.toLocaleString('ja-JP')}人</span>
                      <span className="font-mono">#{s.seed}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => generate(s.seed)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    >
                      開く
                    </button>
                    <button
                      onClick={() => removeSaved(s.seed)}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
          {[
            { icon: '🗺', text: '地区をクリックして詳細を見る' },
            { icon: '🚇', text: '路線図で交通網を確認' },
            { icon: '★', text: '気に入った都市を保存できる' },
          ].map(({ icon, text }) => (
            <div key={text} className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
