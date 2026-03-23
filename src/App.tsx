import { useEffect } from 'react';
import { useCityStore } from './stores/cityStore';
import { HomePage } from './components/HomePage';
import { CityView } from './components/CityView';
import { getSeedFromUrl, setSeedInUrl } from './lib/urlSync';

export default function App() {
  const { city, isGenerating, generate } = useCityStore();

  // On mount: load seed from URL if present
  useEffect(() => {
    const seed = getSeedFromUrl();
    if (seed !== null) generate(seed);
  }, []);

  // Sync URL when city changes
  useEffect(() => {
    if (city) setSeedInUrl(city.seed);
  }, [city?.seed]);

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-slate-400 text-sm">都市を生成中…</div>
        </div>
      </div>
    );
  }

  if (!city) return <HomePage />;
  return <CityView city={city} />;
}
