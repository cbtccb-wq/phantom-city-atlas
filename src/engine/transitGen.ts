/**
 * Transit network generation.
 * Generates 2–4 lines that connect major districts.
 */
import type { Rng } from './rng';
import type { District, Line, Station, TransitType, Point } from '../types/city';
import { generateStationName } from './nameGen';

const LINE_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#f4511e'];

const LINE_TYPE_WEIGHTS: Record<string, TransitType[]> = {
  port:           ['subway', 'tram', 'commuter'],
  industrial:     ['subway', 'commuter', 'brt'],
  academic:       ['subway', 'circular', 'tram'],
  tourist:        ['circular', 'tram', 'monorail'],
  administrative: ['subway', 'commuter'],
  bedroom:        ['commuter', 'subway'],
  mixed:          ['subway', 'commuter', 'tram', 'circular'],
};

const LINE_TYPE_LABELS: Record<TransitType, string> = {
  subway:   '地下鉄',
  commuter: '私鉄',
  circular: '環状線',
  night:    '夜行',
  tram:     '路面電車',
  monorail: 'モノレール',
  brt:      'BRT',
};

const LINE_SUFFIX = ['線', '本線', '急行線', '東西線', '南北線', '環状線', '臨港線', '学園線'];

function districtCentroid(d: District): Point {
  if (d.polygon.length === 0) return { x: 400, y: 350 };
  const x = d.polygon.reduce((s, p) => s + p.x, 0) / d.polygon.length;
  const y = d.polygon.reduce((s, p) => s + p.y, 0) / d.polygon.length;
  return { x, y };
}

export function generateLines(rng: Rng, districts: District[], cityType: string): Line[] {
  const numLines = rng.int(2, 4);
  const typePool = LINE_TYPE_WEIGHTS[cityType] ?? LINE_TYPE_WEIGHTS.mixed;
  const usedColors = new Set<string>();
  const lines: Line[] = [];

  // Sort districts by population for "important" ones
  const sorted = [...districts].sort((a, b) => b.population - a.population);

  for (let l = 0; l < numLines; l++) {
    const type: TransitType = rng.pick(typePool);
    let color: string;
    do { color = rng.pick(LINE_COLORS); } while (usedColors.has(color) && usedColors.size < LINE_COLORS.length);
    usedColors.add(color);

    // Choose anchor districts for this line
    const numStops = rng.int(3, Math.min(6, districts.length));
    const lineDistricts: District[] = [];

    // Always include a high-population or commercial district
    const anchor = sorted.find(d => !lineDistricts.includes(d)) ?? sorted[0];
    lineDistricts.push(anchor);

    // Add more districts by proximity
    while (lineDistricts.length < numStops) {
      const last = lineDistricts[lineDistricts.length - 1];
      const lastPos = districtCentroid(last);
      const candidate = districts
        .filter(d => !lineDistricts.includes(d))
        .sort((a, b) => {
          const da = Math.hypot(districtCentroid(a).x - lastPos.x, districtCentroid(a).y - lastPos.y);
          const db = Math.hypot(districtCentroid(b).x - lastPos.x, districtCentroid(b).y - lastPos.y);
          return da - db + rng.range(-80, 80); // some randomness
        })[0];
      if (!candidate) break;
      lineDistricts.push(candidate);
    }

    // For circular lines, ensure loop-back
    if (type === 'circular' && lineDistricts.length >= 3) {
      lineDistricts.push(lineDistricts[0]);
    }

    const stationNameSet = new Set<string>();
    const stations: Station[] = lineDistricts.map((d, si) => {
      const pos = districtCentroid(d);
      // Offset slightly from centroid for visual interest
      const sx = pos.x + rng.range(-20, 20);
      const sy = pos.y + rng.range(-20, 20);

      let sname = generateStationName(rng, d.name);
      if (stationNameSet.has(sname)) sname += (si + 1).toString();
      stationNameSet.add(sname);

      return {
        id: `station-${l}-${si}`,
        name: sname,
        x: sx,
        y: sy,
        districtId: d.id,
        passengerVolume: rng.int(1, 5),
        interchange: si === 0 || rng.next() < 0.2,
        description: `${d.name}地区に位置する駅。`,
      };
    });

    const lineName = rng.pick(['東', '西', '南', '北', '中央', '臨港', '学園', '環状']) + rng.pick(LINE_SUFFIX);

    lines.push({
      id: `line-${l}`,
      name: lineName,
      color,
      stations,
      type,
      crowdedness: rng.int(1, 5),
      description: `${LINE_TYPE_LABELS[type]}の${lineName}。全${stations.length}駅。`,
    });
  }

  return lines;
}
