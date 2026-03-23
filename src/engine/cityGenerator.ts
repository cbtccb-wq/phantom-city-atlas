/**
 * cityGenerator.ts — Main entry point for city generation.
 *
 * generateCity(seed) → City
 *
 * Deterministic: same seed always produces same city.
 */
import { createRng } from './rng';
import { generateCityName, generateTagline } from './nameGen';
import { generateDistricts, generateTerrain } from './districtGen';
import { generateLines } from './transitGen';
import type {
  City, CityType, CityStats, TimelineEvent, Landmark, LandmarkCategory, District
} from '../types/city';

// ── City type selection ───────────────────────────────────────────────────────

const CITY_TYPES: CityType[] = ['port', 'industrial', 'academic', 'tourist', 'administrative', 'bedroom', 'mixed'];

const CITY_TYPE_LABELS: Record<CityType, string> = {
  port:           '港湾都市',
  industrial:     '工業都市',
  academic:       '学術都市',
  tourist:        '観光都市',
  administrative: '行政都市',
  bedroom:        'ベッドタウン',
  mixed:          '複合都市',
};

const CITY_THEME_COLORS: Record<CityType, string> = {
  port:           '#0891b2', // teal
  industrial:     '#64748b', // slate
  academic:       '#22c55e', // green
  tourist:        '#d97706', // amber
  administrative: '#3b82f6', // blue
  bedroom:        '#8b5cf6', // violet
  mixed:          '#ec4899', // pink
};

// ── Timeline generation ───────────────────────────────────────────────────────

const TIMELINE_EVENTS: { event: string; type: TimelineEvent['type'] }[] = [
  { event: '開港・集落の形成', type: 'founding' },
  { event: '近隣村との合併', type: 'political' },
  { event: '鉄道開通', type: 'development' },
  { event: '大規模水害', type: 'disaster' },
  { event: '高度経済成長期の急拡大', type: 'growth' },
  { event: '地下鉄開業', type: 'development' },
  { event: 'バブル崩壊と地価下落', type: 'political' },
  { event: '大規模再開発計画始動', type: 'development' },
  { event: '未解決連続失踪事件', type: 'mystery' },
  { event: '市長選挙での大波乱', type: 'political' },
  { event: '観光客数が過去最多を記録', type: 'growth' },
  { event: '旧工場跡地の芸術村化', type: 'development' },
];

function generateTimeline(rng: ReturnType<typeof createRng>, foundingYear: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const numEvents = rng.int(6, 10);
  const used = new Set<number>();

  events.push({ year: foundingYear, event: TIMELINE_EVENTS[0].event, type: 'founding' });
  used.add(0);

  let y = foundingYear;
  for (let i = 1; i < numEvents; i++) {
    y += rng.int(8, 35);
    let idx: number;
    do { idx = rng.int(1, TIMELINE_EVENTS.length - 1); } while (used.has(idx) && used.size < TIMELINE_EVENTS.length - 1);
    used.add(idx);
    events.push({ year: y, ...TIMELINE_EVENTS[idx] });
  }

  return events.sort((a, b) => a.year - b.year);
}

// ── Landmark generation ───────────────────────────────────────────────────────

const LANDMARK_TEMPLATES: { category: LandmarkCategory; name: string; description: string }[] = [
  { category: 'government', name: '市庁舎', description: '市政の中枢。市民が手続きに訪れる近代的な建物。' },
  { category: 'park', name: '中央公園', description: '市民の憩いの場。週末には家族連れで賑わう。' },
  { category: 'tower', name: '展望タワー', description: '市内最高峰の建造物。晴れた日は遠くまで見渡せる。' },
  { category: 'museum', name: '市立美術館', description: '地域の芸術文化を発信する施設。企画展も人気。' },
  { category: 'university', name: '中央大学', description: '学術都市の核となる総合大学。研究機関も多い。' },
  { category: 'stadium', name: '市民スタジアム', description: '地元チームの本拠地。試合日は市全体が盛り上がる。' },
  { category: 'shrine', name: '総鎮守神社', description: '創建数百年を誇る古社。地元民の信仰を集める。' },
  { category: 'bridge', name: '大橋', description: '川を渡る象徴的な橋。夜間のライトアップが美しい。' },
  { category: 'redevelopment', name: '新興商業施設', description: '再開発で生まれた複合施設。若者を中心に人気。' },
];

function generateLandmarks(rng: ReturnType<typeof createRng>, districts: District[]): Landmark[] {
  const landmarks: Landmark[] = [];
  const numLandmarks = rng.int(4, 8);
  const usedTemplates = new Set<number>();

  for (let i = 0; i < numLandmarks && i < LANDMARK_TEMPLATES.length; i++) {
    let tIdx: number;
    do { tIdx = rng.int(0, LANDMARK_TEMPLATES.length - 1); } while (usedTemplates.has(tIdx));
    usedTemplates.add(tIdx);

    const tmpl = LANDMARK_TEMPLATES[tIdx];
    const district = rng.pick(districts);
    const cx = district.polygon.length > 0
      ? district.polygon.reduce((s, p) => s + p.x, 0) / district.polygon.length
      : 400;
    const cy = district.polygon.length > 0
      ? district.polygon.reduce((s, p) => s + p.y, 0) / district.polygon.length
      : 350;

    const lm: Landmark = {
      id: `landmark-${i}`,
      name: tmpl.name,
      category: tmpl.category,
      x: cx + rng.range(-30, 30),
      y: cy + rng.range(-30, 30),
      districtId: district.id,
      popularity: rng.int(1, 5),
      description: tmpl.description,
    };

    landmarks.push(lm);
    district.landmarkIds.push(lm.id);
  }

  return landmarks;
}

// ── News / rumors ─────────────────────────────────────────────────────────────

const NEWS_TEMPLATES = [
  '新駅の開業日が正式に発表される',
  '市長、次期選挙への不出馬を表明',
  '旧工場跡地の再開発計画が承認される',
  '市内の人口が10年ぶりに増加に転じる',
  '大型台風による浸水被害で一部地区が孤立',
  '地元出身のアーティストが国際賞を受賞',
  '深夜バス路線の廃止計画に住民が反発',
  '市立図書館、老朽化により移転検討へ',
];

const RUMOR_TEMPLATES = [
  '○○通りの突き当たりには、閉店したはずの古書店が深夜だけ開いているらしい。',
  '廃線になった旧鉄道のトンネルの中に、誰かが住んでいるという噂がある。',
  '市庁舎の地下には、地図に載っていない部屋があると言われている。',
  '港の沖合に、夜になると光る船影が目撃されている。',
  '特定の日の早朝、駅のホームに存在しないはずの電車が止まるらしい。',
];

// ── Stats generation ──────────────────────────────────────────────────────────

function generateStats(rng: ReturnType<typeof createRng>, districts: District[], foundingYear: number): CityStats {
  const currentYear = 2024;
  const years: number[] = [];
  for (let y = foundingYear + 50; y <= currentYear; y += 10) years.push(y);

  let pop = rng.int(5000, 30000);
  const populationHistory = years.map(year => {
    pop = Math.round(pop * rng.range(0.97, 1.12));
    return { year, value: pop };
  });

  return {
    populationHistory,
    districtPopulations: districts.map(d => ({ name: d.name, value: d.population })),
    touristsByYear: years.slice(-5).map((year, i) => ({ year, value: rng.int(50000 + i * 5000, 500000) })),
    industryComposition: [
      { name: '製造業', value: rng.int(5, 30) },
      { name: '商業', value: rng.int(10, 30) },
      { name: 'サービス業', value: rng.int(15, 35) },
      { name: '観光', value: rng.int(5, 20) },
      { name: 'その他', value: rng.int(5, 15) },
    ],
  };
}

// ── Main function ─────────────────────────────────────────────────────────────

export function generateCity(seed: number): City {
  const rng = createRng(seed);

  // Basic attributes
  const cityType = rng.pick(CITY_TYPES);
  const { name, englishName } = generateCityName(rng);
  const tagline = generateTagline(rng, cityType);
  const population = Math.round(rng.range(50000, 800000));
  const area = Math.round(rng.range(30, 500));
  const themeColor = CITY_THEME_COLORS[cityType];
  const foundingYear = rng.int(1600, 1900);

  // Terrain flags
  const hasCost = cityType === 'port' || rng.next() < 0.3;
  const hasRiver = rng.next() < 0.6;

  // Generate components
  const numDistricts = rng.int(6, 10);
  const districts = generateDistricts(rng, cityType, numDistricts);
  const lines = generateLines(rng, districts, cityType);
  const landmarks = generateLandmarks(rng, districts);
  const terrain = generateTerrain(rng, hasCost, hasRiver);
  const timeline = generateTimeline(rng, foundingYear);
  const stats = generateStats(rng, districts, foundingYear);

  // City description
  const descriptions: Record<CityType, string> = {
    port:           `海と共に生きてきた${name}。港を中心に発展した歴史が街の至る所に刻まれている。`,
    industrial:     `工業で栄えた${name}。煙突と工場の風景はこの街のアイデンティティそのものだ。`,
    academic:       `学問の街${name}。大学と研究機関が集積し、若者と知識人が集まる知的な都市。`,
    tourist:        `旅人を魅了し続ける${name}。四季折々の風景と豊かな文化が訪れる人を虜にする。`,
    administrative: `行政の中枢${name}。整然とした街並みと公共施設の充実が市民生活を支えている。`,
    bedroom:        `眠りに帰る街${name}。都心へのアクセスと静かな住環境が住民に愛されている。`,
    mixed:          `何でもある街${name}。多様な機能が混在し、独自の文化と活気を生み出している。`,
  };

  const news = rng.shuffle(NEWS_TEMPLATES).slice(0, rng.int(3, 5));
  const rumors = rng.shuffle(RUMOR_TEMPLATES).slice(0, rng.int(2, 3));

  return {
    id: `city-${seed}`,
    seed,
    name,
    englishName,
    tagline,
    population,
    area,
    type: cityType,
    themeColor,
    description: descriptions[cityType],
    districts,
    lines,
    landmarks,
    terrain,
    timeline,
    news,
    rumors,
    stats,
  };
}

export { CITY_TYPE_LABELS };
