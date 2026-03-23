/**
 * CouncilView.tsx — City council meeting minutes (fake government document)
 */
import { useMemo } from 'react';
import type { City } from '../types/city';
import { createRng } from '../engine/rng';
import { generateCouncilMinutes } from '../engine/councilGen';

interface Props {
  city: City;
}

export function CouncilView({ city }: Props) {
  const rng = useMemo(() => createRng(city.seed + 42), [city.seed]);
  const minutes = useMemo(() => generateCouncilMinutes(rng, city), [city.seed]);

  const handlePrint = () => window.print();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Document toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
        <div className="text-xs text-gray-400 font-mono">
          {city.name}市公文書システム › 議会 › 会議録
        </div>
        <button
          onClick={handlePrint}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors"
        >
          🖨 印刷
        </button>
      </div>

      {/* Document */}
      <div className="max-w-3xl mx-auto px-8 py-8 print:py-4">
        {/* Title block */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <div className="text-xs text-gray-500 mb-1">公文書</div>
          <h1 className="text-xl font-bold text-gray-900">{minutes.title}</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div>開会日時：{minutes.date}　午前10時00分</div>
            <div>開会場所：{minutes.venue}</div>
            <div>議長：{minutes.chairman}議員</div>
          </div>
        </div>

        {/* Attendees */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">
            出席議員（{minutes.attendees.length}名）
          </h2>
          <div className="grid grid-cols-4 gap-1 text-xs text-gray-600">
            {minutes.attendees.map((m, i) => (
              <div key={i}>{m}議員</div>
            ))}
          </div>
        </section>

        {/* Executives */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">
            説明員
          </h2>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            {minutes.executives.map((e, i) => (
              <div key={i}>
                <span className="text-gray-400">{e.position}</span>　{e.name}
              </div>
            ))}
          </div>
        </section>

        {/* Agenda items */}
        {minutes.agenda.map((item, ai) => (
          <section key={ai} className="mb-8">
            <h2 className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-2 rounded mb-4">
              {item.title}
            </h2>
            <div className="text-xs text-gray-500 mb-3">
              提案者：{item.proposer}
            </div>

            {/* Discussion */}
            <div className="space-y-3 mb-4">
              {item.discussion.map((d, di) => (
                <div key={di} className="flex gap-3">
                  <div className="w-28 flex-shrink-0 text-xs font-medium text-gray-600 pt-0.5">
                    ○ {d.speaker}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed flex-1">{d.content}</p>
                </div>
              ))}
            </div>

            {/* Vote result */}
            <div className="border border-gray-300 rounded px-4 py-2 bg-white flex items-center gap-3">
              <span className="text-xs text-gray-500">採決：</span>
              <span className="text-sm font-bold text-gray-900">{item.result}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {item.result.includes('否決') ? '❌' : '✅'}
              </span>
            </div>
          </section>
        ))}

        {/* Closing */}
        <div className="border-t border-gray-300 pt-4 mt-8">
          <div className="flex gap-3">
            <div className="w-28 flex-shrink-0 text-xs font-medium text-gray-600 pt-0.5">
              ○ 議長
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{minutes.closingWords}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-right text-xs text-gray-400 border-t border-gray-200 pt-4">
          <div>上記会議録は正確である。</div>
          <div className="mt-2">{city.name}市議会事務局　{minutes.date}</div>
          <div className="flex justify-end gap-8 mt-4">
            <div>
              <div className="border-b border-gray-300 w-32 mb-1" />
              <div>議長　{minutes.chairman}　印</div>
            </div>
            <div>
              <div className="border-b border-gray-300 w-32 mb-1" />
              <div>局長　　　　　　　印</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
