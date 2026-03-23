/**
 * Japanese-style city / district name generator.
 * Goal: names that feel "familiar but slightly off" —
 * recognisable kanji in slightly unusual combinations.
 */
import type { Rng } from './rng';

// ── Vocabulary pools ─────────────────────────────────────────────────────────

const GEO_PREFIX = ['東', '西', '南', '北', '中', '上', '下', '新', '旧', '内', '外', '港'];
const GEO_TERRAIN = ['川', '浜', '岡', '野', '山', '沢', '谷', '丘', '原', '湊', '坂', '橋', '島', '洲', '峰'];
const GEO_NATURE  = ['松', '梅', '桜', '杉', '楠', '柳', '萩', '葦', '藤', '蓮', '菊', '竹', '橘'];
const GEO_COLOR   = ['白', '青', '緑', '紫', '紅', '黒', '灰', '金', '銀', '碧'];
const GEO_ANIMAL  = ['鷺', '鶴', '鷹', '狐', '鹿', '龍', '鳳', '雀', '燕'];
const GEO_BODY    = ['光', '水', '風', '霞', '霧', '雪', '雨', '波', '潮', '炎'];
const _GEO_SUFFIX  = ['町', '区', '丁目', 'ヶ丘', 'ヶ浜', '台', '崎', 'ノ原', 'ヶ峰', '野', '浜', '坂'];
void _GEO_SUFFIX; // reserved for future use

const CITY_SUFFIX = ['市', '都', '港', '浦', '崎', 'ノ台'];

const TAGLINES: Record<string, string[]> = {
  port:           ['海と共に生きる街', '波のざわめきと、暮らしの温度', '港が語る、幾千の物語'],
  industrial:     ['鉄と汗が刻む誇り', '煙突の向こうに夢がある', '働く街、誇りある街'],
  academic:       ['知と緑が息づく街', '学びの灯、消えることなく', '問いかけ続ける街'],
  tourist:        ['旅人を、故郷のように', '忘れられない景色がここにある', '来るたびに、違う顔を見せる街'],
  administrative: ['秩序と誠実の街', '市民の声が街をつくる', '行政と市民が織りなす物語'],
  bedroom:        ['眠りに帰る、明日へ出発する', '静かな朝と賑やかな夜', '住む人が主役の街'],
  mixed:          ['何でもある、何でもない街', '混沌と調和の絶妙なバランス', '多様性が生む、独自の文化'],
};

const ENGLISH_PARTS = {
  geo:    ['East', 'West', 'North', 'South', 'New', 'Old', 'Upper', 'Lower', 'Inner', 'Harbor'],
  nature: ['River', 'Shore', 'Hill', 'Vale', 'Peak', 'Wood', 'Moor', 'Bay', 'Cliff', 'Glen'],
  suffix: ['town', 'field', 'port', 'haven', 'ford', 'bridge', 'wick', 'bury', 'worth'],
};

// ── District name vocabulary by type ─────────────────────────────────────────

const DISTRICT_VOCAB: Record<string, { prefixes: string[]; suffixes: string[] }> = {
  commercial:     { prefixes: [...GEO_PREFIX, ...GEO_COLOR], suffixes: ['町', '通り', '丁目', '横丁'] },
  residential:    { prefixes: [...GEO_PREFIX, ...GEO_NATURE], suffixes: ['台', 'ヶ丘', '団地', '住宅街'] },
  industrial:     { prefixes: [...GEO_COLOR, '鉄', '機', '炉'], suffixes: ['工業地帯', '工場', '倉庫街', '地区'] },
  cultural:       { prefixes: [...GEO_NATURE, ...GEO_ANIMAL], suffixes: ['文化街', '芸術村', 'ヶ丘', '広場'] },
  administrative: { prefixes: ['本', '中', '官', '府'], suffixes: ['庁舎街', '行政区', '官庁街', '区'] },
  entertainment:  { prefixes: [...GEO_COLOR, ...GEO_BODY, '夜', '灯'], suffixes: ['歓楽街', '花街', '繁華街', '通り'] },
  historic:       { prefixes: ['旧', '古', '元', ...GEO_NATURE], suffixes: ['旧市街', '城下', '宿場', '古道'] },
  port:           { prefixes: ['港', '波', '潮', '浜', '船'], suffixes: ['埠頭', '港湾', '岸壁', '浜'] },
  developing:     { prefixes: ['新', '再', '未来', 'フロンティア'], suffixes: ['再開発区', '新地区', '新興', 'ゾーン'] },
};

// ── Public API ────────────────────────────────────────────────────────────────

export function generateCityName(rng: Rng): { name: string; englishName: string } {
  const pattern = rng.int(0, 4);
  let name: string;

  switch (pattern) {
    case 0: name = rng.pick(GEO_COLOR) + rng.pick(GEO_TERRAIN) + rng.pick(CITY_SUFFIX); break;
    case 1: name = rng.pick(GEO_ANIMAL) + 'ヶ' + rng.pick(GEO_TERRAIN) + rng.pick(CITY_SUFFIX); break;
    case 2: name = rng.pick(GEO_NATURE) + rng.pick(GEO_TERRAIN) + rng.pick(CITY_SUFFIX); break;
    case 3: name = rng.pick(GEO_BODY) + 'ノ' + rng.pick(GEO_TERRAIN) + rng.pick(CITY_SUFFIX); break;
    default: name = rng.pick(GEO_PREFIX) + rng.pick(GEO_TERRAIN) + rng.pick(CITY_SUFFIX); break;
  }

  const englishName =
    rng.pick(ENGLISH_PARTS.geo) + rng.pick(ENGLISH_PARTS.nature) + rng.pick(ENGLISH_PARTS.suffix);

  return { name, englishName };
}

export function generateTagline(rng: Rng, cityType: string): string {
  const pool = TAGLINES[cityType] ?? TAGLINES.mixed;
  return rng.pick(pool);
}

export function generateDistrictName(rng: Rng, type: string, existing: Set<string>): string {
  const vocab = DISTRICT_VOCAB[type] ?? DISTRICT_VOCAB.residential;
  let name: string;
  let attempts = 0;

  do {
    const p = rng.pick(vocab.prefixes);
    const s = rng.pick(vocab.suffixes);
    // Occasionally insert a terrain or nature kanji in the middle
    const mid = rng.next() < 0.4 ? rng.pick(GEO_TERRAIN) : '';
    name = p + mid + s;
    attempts++;
  } while (existing.has(name) && attempts < 20);

  existing.add(name);
  return name;
}

export function generateStationName(rng: Rng, districtName: string): string {
  // Strip common suffixes from district name and append station-like suffix
  const stripped = districtName
    .replace(/町|区|丁目|台|ヶ丘|団地|住宅街|工業地帯|工場|倉庫街|地区|文化街|芸術村|広場|庁舎街|行政区|官庁街|歓楽街|花街|繁華街|旧市街|城下|宿場|古道|埠頭|港湾|岸壁|浜|再開発区|新地区|新興|ゾーン|通り$/, '');
  const suffixes = ['駅', '中央駅', '北口', '南口', '前'];
  return stripped + rng.pick(suffixes);
}
