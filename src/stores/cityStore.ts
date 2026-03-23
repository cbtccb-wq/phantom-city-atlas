import { create } from 'zustand';
import type { City, District } from '../types/city';
import { generateCity } from '../engine/cityGenerator';

const SAVED_KEY = 'phantom-city-saved';

export interface SavedCity {
  seed: number;
  name: string;
  englishName: string;
  type: string;
  themeColor: string;
  population: number;
  savedAt: number; // timestamp
}

function loadSaved(): SavedCity[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persistSaved(list: SavedCity[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

interface CityStore {
  city: City | null;
  selectedDistrict: District | null;
  isGenerating: boolean;
  activeLayer: 'standard' | 'administrative' | 'transit' | 'tourist' | 'safety' | 'landprice';
  savedCities: SavedCity[];

  generate: (seed?: number) => void;
  selectDistrict: (district: District | null) => void;
  setLayer: (layer: CityStore['activeLayer']) => void;
  saveCity: () => void;
  removeSaved: (seed: number) => void;
  isSaved: (seed: number) => boolean;
}

export const useCityStore = create<CityStore>((set, get) => ({
  city: null,
  selectedDistrict: null,
  isGenerating: false,
  activeLayer: 'standard',
  savedCities: loadSaved(),

  generate: (seed) => {
    const s = seed ?? Math.floor(Math.random() * 999999);
    set({ isGenerating: true, selectedDistrict: null });
    setTimeout(() => {
      const city = generateCity(s);
      set({ city, isGenerating: false });
    }, 80);
  },

  selectDistrict: (district) => set({ selectedDistrict: district }),
  setLayer: (layer) => set({ activeLayer: layer }),

  saveCity: () => {
    const { city, savedCities } = get();
    if (!city) return;
    if (savedCities.some(s => s.seed === city.seed)) return;
    const entry: SavedCity = {
      seed: city.seed,
      name: city.name,
      englishName: city.englishName,
      type: city.type,
      themeColor: city.themeColor,
      population: city.population,
      savedAt: Date.now(),
    };
    const updated = [entry, ...savedCities].slice(0, 20); // max 20
    persistSaved(updated);
    set({ savedCities: updated });
  },

  removeSaved: (seed) => {
    const updated = get().savedCities.filter(s => s.seed !== seed);
    persistSaved(updated);
    set({ savedCities: updated });
  },

  isSaved: (seed) => get().savedCities.some(s => s.seed === seed),
}));
