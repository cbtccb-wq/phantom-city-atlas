/**
 * StatsView.tsx — Statistics dashboard with Recharts
 */
import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { City } from '../types/city';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

interface Props {
  city: City;
}

export function StatsView({ city }: Props) {
  const { stats } = city;

  const districtsByLandPrice = useMemo(
    () => [...city.districts].sort((a, b) => b.landPriceLevel - a.landPriceLevel),
    [city.districts]
  );
  const districtsBySafety = useMemo(
    () => [...city.districts].sort((a, b) => b.safetyLevel - a.safetyLevel),
    [city.districts]
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
      <h2 className="text-lg font-bold text-gray-800">統計情報</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '総人口', value: city.population.toLocaleString('ja-JP') + '人' },
          { label: '面積', value: city.area.toLocaleString('ja-JP') + ' km²' },
          { label: '地区数', value: city.districts.length + '区' },
          { label: '路線数', value: city.lines.length + '路線' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Population history */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">人口推移</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={stats.populationHistory}>
            <defs>
              <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50}
              tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)} />
            <Tooltip formatter={(v: number) => [v.toLocaleString('ja-JP') + '人', '人口']} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2}
              fill="url(#popGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* District populations */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">地区別人口</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.districtPopulations} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }}
              tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            <Tooltip formatter={(v: number) => [v.toLocaleString('ja-JP') + '人', '人口']} />
            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Industry composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-4">産業構成</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.industryComposition}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={75}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={10}
              >
                {stats.industryComposition.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tourist trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-4">観光客数推移</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.touristsByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={50}
                tickFormatter={v => v >= 10000 ? (v / 10000).toFixed(0) + '万' : String(v)} />
              <Tooltip formatter={(v: number) => [v.toLocaleString('ja-JP') + '人', '観光客']} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route ridership */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">路線別利用者数</h3>
        <div className="space-y-3">
          {city.lines.map(line => {
            const total = line.stations.reduce((s, st) => s + st.passengerVolume, 0);
            const max = city.lines.reduce((m, l) => Math.max(m, l.stations.reduce((s, st) => s + st.passengerVolume, 0)), 0);
            const pct = max > 0 ? (total / max) * 100 : 0;
            return (
              <div key={line.id}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.name}
                  </span>
                  <span>{line.stations.length}駅 · 混雑{'●'.repeat(line.crowdedness)}{'○'.repeat(5 - line.crowdedness)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: line.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Land price ranking + Safety comparison side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">地価ランキング</h3>
          <div className="space-y-2">
            {districtsByLandPrice.map((d, i) => (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-gray-400 font-mono">{i + 1}</span>
                  <span className="flex-1 text-gray-700 truncate">{d.name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-sm ${j < d.landPriceLevel ? 'bg-amber-400' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">治安比較</h3>
          <div className="space-y-2">
            {districtsBySafety.map((d, i) => (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-gray-400 font-mono">{i + 1}</span>
                  <span className="flex-1 text-gray-700 truncate">{d.name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-sm ${j < d.safetyLevel ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">年表</h3>
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-3">
            {city.timeline.map((ev, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-14 text-right text-xs text-gray-400 font-mono pt-0.5 flex-shrink-0">
                  {ev.year}
                </div>
                <div className="relative flex-1">
                  <div
                    className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white"
                    style={{
                      backgroundColor:
                        ev.type === 'mystery' ? '#ef4444'
                        : ev.type === 'disaster' ? '#f59e0b'
                        : ev.type === 'founding' ? '#6366f1'
                        : '#10b981',
                    }}
                  />
                  <div className="text-xs text-gray-700 leading-relaxed">{ev.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">最新ニュース</h3>
        <div className="space-y-2">
          {city.news.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600 py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-300 flex-shrink-0">📰</span>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
