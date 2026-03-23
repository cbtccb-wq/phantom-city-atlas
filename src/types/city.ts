// Phantom City Atlas — Core Type Definitions

export type CityType =
  | 'port'
  | 'industrial'
  | 'academic'
  | 'tourist'
  | 'administrative'
  | 'bedroom'
  | 'mixed';

export type DistrictType =
  | 'commercial'
  | 'residential'
  | 'industrial'
  | 'cultural'
  | 'administrative'
  | 'entertainment'
  | 'historic'
  | 'port'
  | 'developing';

export type TransitType =
  | 'subway'
  | 'commuter'
  | 'circular'
  | 'night'
  | 'tram'
  | 'monorail'
  | 'brt';

export interface Point {
  x: number;
  y: number;
}

export interface District {
  id: string;
  name: string;
  type: DistrictType;
  polygon: Point[];
  color: string;
  population: number;
  safetyLevel: number;    // 1–5
  landPriceLevel: number; // 1–5
  description: string;
  tags: string[];
  landmarkIds: string[];
  mood: string;
  streetType: string;
  localTip: string;
}

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  districtId: string;
  passengerVolume: number; // 1–5
  interchange: boolean;
  description: string;
}

export interface Line {
  id: string;
  name: string;
  color: string;
  stations: Station[];
  type: TransitType;
  crowdedness: number; // 1–5
  description: string;
}

export type LandmarkCategory =
  | 'station'
  | 'government'
  | 'park'
  | 'tower'
  | 'museum'
  | 'university'
  | 'stadium'
  | 'port'
  | 'industrial'
  | 'shrine'
  | 'redevelopment'
  | 'bridge';

export interface Landmark {
  id: string;
  name: string;
  category: LandmarkCategory;
  x: number;
  y: number;
  districtId: string;
  popularity: number; // 1–5
  description: string;
}

export interface TimelineEvent {
  year: number;
  event: string;
  type: 'founding' | 'growth' | 'disaster' | 'development' | 'political' | 'mystery';
}

export interface CityStats {
  populationHistory: { year: number; value: number }[];
  districtPopulations: { name: string; value: number }[];
  touristsByYear: { year: number; value: number }[];
  industryComposition: { name: string; value: number }[];
}

export interface City {
  id: string;
  seed: number;
  name: string;
  englishName: string;
  tagline: string;
  population: number;
  area: number;
  type: CityType;
  themeColor: string;
  description: string;
  districts: District[];
  lines: Line[];
  landmarks: Landmark[];
  timeline: TimelineEvent[];
  news: string[];
  rumors: string[];
  stats: CityStats;
  terrain: TerrainFeature[];
}

export interface TerrainFeature {
  type: 'river' | 'coast' | 'mountain' | 'park' | 'road';
  path: Point[];
  width?: number;
  color?: string;
}
