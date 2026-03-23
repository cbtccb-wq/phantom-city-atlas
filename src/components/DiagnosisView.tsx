/**
 * DiagnosisView.tsx — "Where would you live in this city?" diagnosis
 */
import { useState, useMemo } from 'react';
import type { City, District } from '../types/city';
import { DISTRICT_COLORS } from '../engine/districtGen';

interface Question {
  text: string;
  options: { label: string; scores: Partial<Record<string, number>> }[];
}

const QUESTIONS: Question[] = [
  {
    text: '休日の過ごし方は？',
    options: [
      { label: 'カフェで読書', scores: { cultural: 3, residential: 1 } },
      { label: 'ショッピング', scores: { commercial: 3, entertainment: 1 } },
      { label: '公園・自然', scores: { residential: 3, developing: 1 } },
      { label: '夜の街を歩く', scores: { entertainment: 3, historic: 1 } },
    ],
  },
  {
    text: '住居に求めるものは？',
    options: [
      { label: '静かさ・安全', scores: { residential: 3, administrative: 1 } },
      { label: '利便性・アクセス', scores: { commercial: 3, port: 1 } },
      { label: '家賃の安さ', scores: { industrial: 2, developing: 2 } },
      { label: '雰囲気・個性', scores: { historic: 3, cultural: 2 } },
    ],
  },
  {
    text: '仕事のスタイルは？',
    options: [
      { label: 'オフィスワーク', scores: { administrative: 3, commercial: 1 } },
      { label: 'クリエイティブ', scores: { cultural: 3, entertainment: 1 } },
      { label: '現場・製造', scores: { industrial: 3, port: 2 } },
      { label: '自由業・リモート', scores: { residential: 2, developing: 2 } },
    ],
  },
  {
    text: '夜の外出頻度は？',
    options: [
      { label: 'ほぼ毎日', scores: { entertainment: 3, commercial: 1 } },
      { label: '週2〜3回', scores: { historic: 2, cultural: 2 } },
      { label: '月数回', scores: { residential: 2, administrative: 1 } },
      { label: 'ほとんどしない', scores: { industrial: 1, residential: 3 } },
    ],
  },
  {
    text: '街に期待するものは？',
    options: [
      { label: '歴史・文化の厚み', scores: { historic: 3, cultural: 2 } },
      { label: '発展・新しさ', scores: { developing: 3, commercial: 1 } },
      { label: 'コミュニティ・人情', scores: { port: 2, residential: 2 } },
      { label: '何もないこと', scores: { residential: 3, industrial: 1 } },
    ],
  },
];

interface Props {
  city: City;
}

export function DiagnosisView({ city }: Props) {
  const [step, setStep] = useState<'start' | 'quiz' | 'result'>('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const result = useMemo<District | null>(() => {
    if (step !== 'result') return null;
    let best = city.districts[0];
    let bestScore = -Infinity;
    for (const d of city.districts) {
      const s = scores[d.type] ?? 0;
      if (s > bestScore) { bestScore = s; best = d; }
    }
    return best;
  }, [step, scores, city.districts]);

  const handleOption = (optIdx: number) => {
    setSelectedOption(optIdx);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const opt = QUESTIONS[currentQ].options[selectedOption];
    const newScores = { ...scores };
    for (const [type, pts] of Object.entries(opt.scores)) {
      newScores[type] = (newScores[type] ?? 0) + pts;
    }
    setScores(newScores);
    setSelectedOption(null);

    if (currentQ + 1 >= QUESTIONS.length) {
      setStep('result');
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const reset = () => {
    setStep('start');
    setCurrentQ(0);
    setScores({});
    setSelectedOption(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        {step === 'start' && (
          <div className="text-center" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="text-5xl mb-4">🏙</div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {city.name}なら<br />どこに住む？
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              5つの質問に答えると、あなたにぴったりの地区を診断します。
            </p>
            <button
              onClick={() => setStep('quiz')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              診断スタート
            </button>
          </div>
        )}

        {step === 'quiz' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${i <= currentQ ? 'bg-blue-500' : 'bg-slate-700'}`}
                />
              ))}
            </div>

            <div className="text-xs text-slate-500 mb-2">Q{currentQ + 1} / {QUESTIONS.length}</div>
            <h3 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {QUESTIONS[currentQ].text}
            </h3>

            <div className="space-y-3 mb-6">
              {QUESTIONS[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOption(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm
                    ${selectedOption === i
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {currentQ + 1 >= QUESTIONS.length ? '診断する' : '次へ'}
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🎯</div>
              <div className="text-slate-400 text-sm mb-1">あなたにぴったりの地区は…</div>
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {result.name}
              </h2>
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: result.color }}
              >
                {result.type === 'commercial' ? '商業地区'
                  : result.type === 'residential' ? '住宅地区'
                  : result.type === 'cultural' ? '文化地区'
                  : result.type === 'historic' ? '旧市街'
                  : result.type === 'entertainment' ? '歓楽街'
                  : result.type === 'administrative' ? '行政地区'
                  : result.type === 'port' ? '港湾地区'
                  : result.type === 'industrial' ? '工業地区'
                  : '再開発区'}
              </div>
            </div>

            {/* District card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 mb-5">
              <div
                className="h-2 rounded-full mb-4"
                style={{ backgroundColor: result.color }}
              />
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{result.description}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-0.5">人口</div>
                  <div className="text-sm font-bold text-white">{result.population.toLocaleString('ja-JP')}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-0.5">治安</div>
                  <div className="text-sm font-bold text-white">{'★'.repeat(result.safetyLevel)}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500 mb-0.5">地価</div>
                  <div className="text-sm font-bold text-white">{'●'.repeat(result.landPriceLevel)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 italic">
                "{result.localTip}"
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl transition-colors text-sm"
            >
              もう一度診断する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
