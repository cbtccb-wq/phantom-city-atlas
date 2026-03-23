/**
 * ExportButton.tsx — Export the SVG map as an SVG file download
 */
import type { City } from '../types/city';

interface Props {
  city: City;
}

export function ExportButton({ city }: Props) {
  const handleExport = () => {
    const svgEl = document.querySelector<SVGSVGElement>('svg[data-export]');
    if (!svgEl) {
      alert('マップが見つかりません。地図画面で実行してください。');
      return;
    }

    // Clone and embed styles
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '800');
    clone.setAttribute('height', '700');

    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${city.name}_seed${city.seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      title="地図をSVGで書き出す"
      className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
    >
      ↓ SVG
    </button>
  );
}
