/**
 * District layout generation — Voronoi-style polygon division.
 *
 * Algorithm:
 * 1. Place N seed points (biased toward realistic city layout)
 * 2. Compute Voronoi regions (Fortune's or incremental approximation)
 * 3. Clip to viewport circle / rectangle
 * 4. Assign district types based on distance from center and terrain
 */
import type { Rng } from './rng';
import type { Point, District, DistrictType, TerrainFeature } from '../types/city';
import { generateDistrictName } from './nameGen';

const MAP_W = 800;
const MAP_H = 700;
const CX = MAP_W / 2;
const CY = MAP_H / 2;

// ── Type palette ──────────────────────────────────────────────────────────────

export const DISTRICT_COLORS: Record<DistrictType, string> = {
  commercial:     '#f59e42',
  residential:    '#7ec8a0',
  industrial:     '#8fa3b1',
  cultural:       '#b89fd4',
  administrative: '#5b8fc9',
  entertainment:  '#f06292',
  historic:       '#c8a96e',
  port:           '#4db6c6',
  developing:     '#a5d6a7',
};

const DISTRICT_DESCRIPTIONS: Record<DistrictType, string[]> = {
  commercial: [
    '活気ある商店街と近代的なビルが混在する。昼夜問わず人が行き交い、この街の経済の心臓部として機能している。',
    '百貨店と路地裏の専門店が共存する商業地区。週末には近隣からも買い物客が集まる。',
  ],
  residential: [
    '落ち着いた住宅街。朝は通勤・通学する市民で賑わい、夜は静かな生活音だけが聞こえる。',
    '戸建てとマンションが混在する典型的な住宅地。地域のつながりが今も生きている。',
  ],
  industrial: [
    '工場と倉庫が立ち並ぶ地区。昼間は機械音と人の声が響き渡るが、夜は驚くほど静かになる。',
    '旧来の製造業から新興の物流拠点へと変貌しつつある地区。古い工場跡地の活用が課題だ。',
  ],
  cultural: [
    'ギャラリーや劇場が集まる文化地区。週末には路上パフォーマーも現れ、独自の雰囲気を醸し出す。',
    '美術館と古書店が並ぶ、静かだが深い文化の薫り漂う街角。',
  ],
  administrative: [
    '市庁舎や官公庁が集中する行政の中枢。平日昼間は手続きに訪れる市民で混雑する。',
    '整然とした街路と官庁建築が並ぶ地区。重要な行政機能を担う静かなエリア。',
  ],
  entertainment: [
    '夜に輝く歓楽街。飲食店やバーが軒を連ね、深夜まで賑わいが続く。昼間は意外に閑散としている。',
    '繁華街として知られる一方、最近はカフェや雑貨店も増え昼の顔も持つようになってきた。',
  ],
  historic: [
    '古い街並みが残る歴史地区。古民家を改装した飲食店や工芸品店が増え、観光客にも人気だ。',
    '城下町の面影を残す旧市街。石畳の路地を歩くと、数百年前の記憶が蘇るようだ。',
  ],
  port: [
    '港湾施設と古い倉庫街が広がるエリア。潮風と船のエンジン音が常に漂う。',
    '貿易の要衝として発展した港湾地区。近年はウォーターフロント開発で新旧が混在している。',
  ],
  developing: [
    '再開発が進む新興エリア。更地とピカピカのビルが混在し、数年後には大きく変貌しそうだ。',
    '企業誘致と住宅開発が同時進行する新興地区。住民の流入速度が施設整備を上回っている。',
  ],
};

const DISTRICT_TAGS: Record<DistrictType, string[][]> = {
  commercial:     [['賑やか', '商業', '交通の要衝'], ['ショッピング', '飲食', 'オフィス街']],
  residential:    [['静か', '住宅', '公園多い'], ['ファミリー向け', '通勤圏', '緑豊か']],
  industrial:     [['工場', '物流', '臭い'], ['製造業', '倉庫', '24時間稼働']],
  cultural:       [['芸術', 'ギャラリー', '個性的'], ['音楽', '演劇', 'おしゃれ']],
  administrative: [['官庁', '清潔', '整然'], ['行政', '公共施設', '手続き']],
  entertainment:  [['夜の街', 'グルメ', '酔客'], ['バー', 'クラブ', '深夜営業']],
  historic:       [['古民家', '歴史', '趣深い'], ['神社', '石畳', '観光']],
  port:           [['港', '海風', '海産物'], ['船', '倉庫', '夜景']],
  developing:     [['再開発', '新しい', '工事中'], ['ベンチャー', '空き地', '将来有望']],
};

// ── Voronoi helpers ───────────────────────────────────────────────────────────

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Clip a convex polygon to a rectangle [0,w]×[0,h] (Sutherland-Hodgman) */
function clipPolygonToRect(poly: Point[], w: number, h: number): Point[] {
  const edges = [
    { x1: 0, y1: 0, x2: w, y2: 0 },
    { x1: w, y1: 0, x2: w, y2: h },
    { x1: w, y1: h, x2: 0, y2: h },
    { x1: 0, y1: h, x2: 0, y2: 0 },
  ];

  let output = poly;
  for (const edge of edges) {
    if (output.length === 0) break;
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i - 1 + input.length) % input.length];
      const curIn  = isInside(cur,  edge);
      const prevIn = isInside(prev, edge);
      if (curIn) {
        if (!prevIn) output.push(intersect(prev, cur, edge));
        output.push(cur);
      } else if (prevIn) {
        output.push(intersect(prev, cur, edge));
      }
    }
  }
  return output;
}

function isInside(p: Point, e: { x1: number; y1: number; x2: number; y2: number }): boolean {
  return (e.x2 - e.x1) * (p.y - e.y1) - (e.y2 - e.y1) * (p.x - e.x1) >= 0;
}

function intersect(a: Point, b: Point, e: { x1: number; y1: number; x2: number; y2: number }): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const ex = e.x2 - e.x1, ey = e.y2 - e.y1;
  const t = ((e.x1 - a.x) * ey - (e.y1 - a.y) * ex) / (dx * ey - dy * ex);
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Simple approximate Voronoi via grid sampling (fast, good enough for display) */
function buildVoronoiPolygons(seeds: Point[], w: number, h: number, step = 4): Point[][] {
  const n = seeds.length;
  const assignment = new Int32Array((w / step + 1) * (h / step + 1));

  // Assign each grid cell to nearest seed
  const cols = Math.ceil(w / step) + 1;
  for (let gy = 0; gy * step <= h; gy++) {
    for (let gx = 0; gx * step <= w; gx++) {
      const px = gx * step, py = gy * step;
      let best = 0, bestD = Infinity;
      for (let s = 0; s < n; s++) {
        const d = (px - seeds[s].x) ** 2 + (py - seeds[s].y) ** 2;
        if (d < bestD) { bestD = d; best = s; }
      }
      assignment[gy * cols + gx] = best;
    }
  }

  // Collect boundary pixels per region → convex hull approximation
  const pointSets: Point[][] = Array.from({ length: n }, () => []);
  for (let gy = 0; gy * step <= h; gy++) {
    for (let gx = 0; gx * step <= w; gx++) {
      pointSets[assignment[gy * cols + gx]].push({ x: gx * step, y: gy * step });
    }
  }

  return pointSets.map((pts) => convexHull(pts));
}

function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: Point[] = [];
  const upper: Point[] = [];
  const cross = (O: Point, A: Point, B: Point) => (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return [...lower, ...upper];
}

// ── District type assignment ──────────────────────────────────────────────────

const CITY_TYPE_DISTRICT_WEIGHTS: Record<string, Partial<Record<DistrictType, number>>> = {
  port:           { port: 3, commercial: 2, industrial: 2, residential: 2, historic: 1, entertainment: 1 },
  industrial:     { industrial: 3, residential: 2, commercial: 2, developing: 2, port: 1 },
  academic:       { cultural: 3, residential: 2, commercial: 2, administrative: 1, entertainment: 1 },
  tourist:        { historic: 3, entertainment: 2, commercial: 2, cultural: 2, residential: 1 },
  administrative: { administrative: 3, residential: 2, commercial: 2, cultural: 1, historic: 1 },
  bedroom:        { residential: 4, commercial: 2, developing: 2, entertainment: 1 },
  mixed:          { commercial: 2, residential: 2, industrial: 1, cultural: 1, historic: 1, entertainment: 1, developing: 1 },
};

function assignDistrictType(
  seed: Point,
  centerDist: number,
  maxDist: number,
  cityType: string,
  rng: Rng,
  usedTypes: DistrictType[],
  hasCost: boolean,
  hasRiver: boolean,
): DistrictType {
  const ratio = centerDist / maxDist;
  const weights = CITY_TYPE_DISTRICT_WEIGHTS[cityType] ?? CITY_TYPE_DISTRICT_WEIGHTS.mixed;

  // Terrain proximity flags
  // Coast is generated on bottom (y > 65%) or right (x > 65%) — boost port near either edge
  const isCoastalEdge = hasCost && (seed.y > MAP_H * 0.60 || seed.x > MAP_W * 0.60);
  // River runs roughly through center-x of map — boost industrial/historic near center-x, outer rows
  const isRiverAdjacent = hasRiver && ratio > 0.3 && Math.abs(seed.x - CX) < MAP_W * 0.25;

  const types: DistrictType[] = ['commercial', 'residential', 'industrial', 'cultural', 'administrative', 'entertainment', 'historic', 'port', 'developing'];
  const w = types.map((t) => {
    let base = weights[t] ?? 0.5;
    // Center bias: commercial / administrative near center
    if (ratio < 0.3 && (t === 'commercial' || t === 'administrative')) base *= 2.5;
    // Edge bias: industrial / port / developing on edges
    if (ratio > 0.65 && (t === 'industrial' || t === 'developing')) base *= 2;
    if (ratio > 0.5 && t === 'residential') base *= 1.5;
    // Terrain coupling: port districts should sit near the coast
    if (isCoastalEdge && t === 'port') base *= 4;
    if (!isCoastalEdge && t === 'port' && !hasCost) base *= 0.3; // suppress port when no coast
    // River-adjacent: slight boost for industrial and historic districts
    if (isRiverAdjacent && (t === 'industrial' || t === 'historic')) base *= 1.6;
    // Reduce over-represented types
    if (usedTypes.filter(u => u === t).length >= 2) base *= 0.4;
    return Math.max(0.1, base);
  });

  return rng.weighted(types, w);
}

// ── Terrain generation ────────────────────────────────────────────────────────

export function generateTerrain(rng: Rng, hasCost: boolean, hasRiver: boolean): TerrainFeature[] {
  const features: TerrainFeature[] = [];

  if (hasCost) {
    // Coastline along bottom/side
    const side = rng.int(0, 1); // 0=bottom, 1=right
    const pts: Point[] = [];
    if (side === 0) {
      const baseY = MAP_H * rng.range(0.7, 0.85);
      for (let x = 0; x <= MAP_W; x += 40) {
        pts.push({ x, y: baseY + rng.range(-15, 15) });
      }
      pts.push({ x: MAP_W, y: MAP_H }, { x: 0, y: MAP_H });
    } else {
      const baseX = MAP_W * rng.range(0.7, 0.85);
      for (let y = 0; y <= MAP_H; y += 40) {
        pts.push({ x: baseX + rng.range(-15, 15), y });
      }
      pts.push({ x: MAP_W, y: MAP_H }, { x: MAP_W, y: 0 });
    }
    features.push({ type: 'coast', path: pts, color: '#bde3f7' });
  }

  if (hasRiver) {
    // River meanders across map
    const startX = rng.range(MAP_W * 0.2, MAP_W * 0.8);
    const pts: Point[] = [{ x: startX, y: 0 }];
    let cx = startX;
    for (let y = 80; y <= MAP_H; y += 80) {
      cx = Math.max(50, Math.min(MAP_W - 50, cx + rng.range(-60, 60)));
      pts.push({ x: cx, y });
    }
    features.push({ type: 'river', path: pts, width: rng.range(6, 14), color: '#74b9e8' });
  }

  // Main roads
  const numRoads = rng.int(2, 4);
  for (let i = 0; i < numRoads; i++) {
    const horizontal = rng.next() < 0.5;
    if (horizontal) {
      const y = rng.range(MAP_H * 0.2, MAP_H * 0.8);
      features.push({ type: 'road', path: [{ x: 0, y }, { x: MAP_W, y }], width: 2, color: '#ccc' });
    } else {
      const x = rng.range(MAP_W * 0.2, MAP_W * 0.8);
      features.push({ type: 'road', path: [{ x, y: 0 }, { x, y: MAP_H }], width: 2, color: '#ccc' });
    }
  }

  return features;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateDistricts(
  rng: Rng,
  cityType: string,
  numDistricts: number,
  hasCost = false,
  hasRiver = false,
): District[] {
  // Place seed points — central one is always near map center
  const seeds: Point[] = [{ x: CX + rng.range(-20, 20), y: CY + rng.range(-20, 20) }];
  const MAX_SEED_ATTEMPTS = 300;
  let attempts = 0;
  while (seeds.length < numDistricts && attempts < MAX_SEED_ATTEMPTS) {
    attempts++;
    const angle = rng.range(0, Math.PI * 2);
    const r = rng.range(100, Math.min(CX, CY) * 0.9);
    const p = { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
    // Ensure minimum spacing; relax constraint if attempts are running high
    const minDist = attempts > 200 ? 50 : 80;
    if (seeds.every(s => distance(s, p) > minDist)) seeds.push(p);
  }

  const polygons = buildVoronoiPolygons(seeds, MAP_W, MAP_H).map(poly =>
    clipPolygonToRect(poly, MAP_W, MAP_H)
  );

  const usedNames = new Set<string>();
  const usedTypes: DistrictType[] = [];
  const maxDist = Math.sqrt(CX ** 2 + CY ** 2);

  return seeds.map((seed, i) => {
    const centerDist = distance(seed, { x: CX, y: CY });
    const type = assignDistrictType(seed, centerDist, maxDist, cityType, rng, usedTypes, hasCost, hasRiver);
    usedTypes.push(type);

    const name = generateDistrictName(rng, type, usedNames);
    const descArr = DISTRICT_DESCRIPTIONS[type];
    const tagsArr = DISTRICT_TAGS[type];

    const population = Math.round(rng.range(8000, 80000));
    const safety = rng.int(1, 5);
    const landPrice = type === 'commercial' ? rng.int(3, 5)
                    : type === 'industrial' ? rng.int(1, 3)
                    : rng.int(1, 5);

    return {
      id: `district-${i}`,
      name,
      type,
      polygon: polygons[i] ?? [],
      color: DISTRICT_COLORS[type],
      population,
      safetyLevel: safety,
      landPriceLevel: landPrice,
      description: rng.pick(descArr),
      tags: rng.pick(tagsArr),
      landmarkIds: [],
      mood: type === 'entertainment' ? '夜型' : type === 'industrial' ? '実直' : type === 'cultural' ? '芸術家気質' : '普通',
      streetType: type === 'commercial' ? '広い大通り' : type === 'historic' ? '石畳の路地' : '一般道',
      localTip: rng.pick([
        `${name}の南口には知る人ぞ知る老舗がある。`,
        `深夜になると${name}には独特の静けさが訪れる。`,
        `${name}で育った人は不思議なほど地元愛が強い。`,
        `最近${name}では若い移住者が増えている。`,
        `${name}には公式地図に載っていない抜け道がある。`,
      ]),
    };
  });
}
