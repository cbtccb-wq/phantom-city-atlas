/**
 * LegendsView.tsx — Urban legends / mystery tab
 * Intentionally darker styling to separate from main tone
 */
import { useState, useMemo } from 'react';
import type { City } from '../types/city';
import { createRng } from '../engine/rng';
import { generateLegendDetail } from '../lib/claudeApi';

// Extra deep legend generation using city seed
function generateDeepLegends(city: City): string[] {
  const rng = createRng(city.seed + 9999);
  const district = rng.pick(city.districts);
  const line = city.lines.length > 0 ? rng.pick(city.lines) : null;
  const station = line && line.stations.length > 0 ? rng.pick(line.stations) : null;

  const templates = [
    `${district.name}の古い集合住宅の一室は、何十年も前から誰も借り手がつかない。不動産会社に理由を聞いても「諸事情により」としか答えない。`,
    station
      ? `${station.name}の終電後、プラットフォームの端に立つと聞こえてくる足音がある。ホームには誰もいないはずなのに。`
      : `深夜の市街地に、運行終了しているはずのバスが止まっているという目撃談が絶えない。`,
    `${city.name}市の旧地図と現在の地図を重ね合わせると、特定の区画がきれいに消えていることに気づく。行政に問い合わせた市民は「地番整理によるもの」と説明されたが、納得していない。`,
    `${district.name}には「開かずの踏切」ではなく「開かずの地下道」が存在する。工事中の看板が数十年前から変わっていないと地元民は言う。`,
    line
      ? `${line.name}には、時刻表に記載のない「幻の便」があると言われている。乗車した人間は次の駅で降りられなくなるという。`
      : `市内を流れる川の底に、かつて存在した集落の痕跡があるとされている。`,
    `${city.name}市役所の地下に、公式図面にない空間があるという噂がある。清掃員の間では「あの廊下には絶対に一人で入るな」と語り継がれている。`,
    `${district.name}で深夜に車を走らせると、同じ交差点に何度も戻ってくることがある。地元ドライバーは特定の道を避けると言うが、理由は誰も教えてくれない。`,
  ];

  return rng.shuffle(templates).slice(0, rng.int(3, 5));
}

// ── Legend detail panel ───────────────────────────────────────────────────────

function LegendDetailPanel({
  legend,
  legendIndex,
  isOriginal,
  city,
  onClose,
}: {
  legend: string;
  legendIndex: number;
  isOriginal: boolean;
  city: City;
  onClose: () => void;
}) {
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateLegendDetail(
      city.name,
      legend,
      { type: city.type, population: city.population },
      legendIndex,
    );
    setGenerated(text);
    setLoading(false);
  };

  return (
    <div className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{isOriginal ? '🌑' : '⚠'}</span>
          <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">
            {isOriginal ? '市内流布情報' : '未確認情報'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-400 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Original legend text */}
        <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-3 italic">
          {legend}
        </p>

        <div className="border-t border-slate-800 pt-4">
          <span className="text-xs font-mono text-slate-600 uppercase tracking-widest block mb-3">
            ■ 詳細調査記録
          </span>

          {generated ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{generated}</p>
              <div className="text-xs text-red-900/50 font-mono border border-red-900/30 rounded px-2 py-1">
                ※ 本記録の内容は{city.name}市が公式に認めたものではありません
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 px-4 rounded text-xs font-mono transition-colors
                bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                  記録を復元中...
                </>
              ) : (
                '▶ 詳細記録を展開する'
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

export function LegendsView({ city }: Props) {
  const deepLegends = useMemo(() => generateDeepLegends(city), [city.seed]);
  const allRumors = [...city.rumors, ...deepLegends];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    setSelectedIndex(prev => prev === i ? null : i);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left: legend list */}
      <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-300 min-w-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👁</span>
            <div>
              <h2 className="text-base font-bold text-slate-100">都市伝説・未確認情報</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                以下の情報は{city.name}市内で語られる噂・伝承です。真偽は不明です。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3 max-w-2xl">
          {allRumors.map((rumor, i) => {
            const isOriginal = i < city.rumors.length;
            const isSelected = selectedIndex === i;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left rounded-xl p-4 transition-all
                  ${isSelected
                    ? 'border border-slate-500 bg-slate-800/80'
                    : 'border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                style={{ animation: `fadeIn 0.3s ease-out ${i * 0.08}s both` }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-slate-600 text-lg flex-shrink-0 mt-0.5">
                    {isOriginal ? '🌑' : '⚠'}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{rumor}</p>
                </div>
              </button>
            );
          })}

          {/* Redacted section */}
          <div className="mt-6 border border-red-900/40 rounded-xl p-4 bg-red-950/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-600 text-sm">■</span>
              <span className="text-xs text-red-700 font-mono uppercase tracking-widest">
                非公開情報 — 要情報公開請求
              </span>
            </div>
            <div className="space-y-2">
              {[
                `${city.name}市における${(city.seed % 30) + 1}年${(city.seed % 12) + 1}月の████████████に関する内部文書`,
                `████████地区の土壌汚染調査報告書（平成${(city.seed % 15) + 7}年度版）`,
                `市長と████████の間で交わされた覚書の全文`,
              ].map((line, i) => (
                <div key={i} className="text-xs text-red-900/60 font-mono bg-red-950/30 px-3 py-1.5 rounded select-none">
                  {line}
                </div>
              ))}
            </div>
            <p className="text-xs text-red-800 mt-3">
              ※ これらの文書の存在は市が認めていません。
            </p>
          </div>

          {/* Found item */}
          <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/40 font-mono text-xs text-slate-500 leading-relaxed">
            <div className="text-slate-600 mb-2">// 2ch風書き込み（真偽不明）</div>
            <div>
              <span className="text-slate-400">Anonymous</span>
              <span className="text-slate-700 mx-2">|</span>
              <span className="text-slate-600">{city.name}市民だが</span>
            </div>
            <div className="mt-1">
              {`${city.districts[0]?.name ?? '中央'}でずっと工事してるけど、`}
              完成予定が何度も延期されてる
            </div>
            <div>担当者に聞いたら「地盤に問題が」って言ってたけど</div>
            <div>地盤調査の結果は非公開らしい</div>
            <div className="mt-1 text-slate-600">{'> なんか変なもん出たんじゃないの'}</div>
            <div className="text-slate-600">{'>> そういうこと言うなよ'}</div>
          </div>
        </div>
      </div>

      {/* Right: detail panel */}
      {selectedIndex !== null && (
        <LegendDetailPanel
          legend={allRumors[selectedIndex]}
          legendIndex={selectedIndex}
          isOriginal={selectedIndex < city.rumors.length}
          city={city}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
