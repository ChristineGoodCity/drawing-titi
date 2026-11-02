import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { defaultCarouselSettings } from './components/carouselSettingsDefaults';
import type { Work } from "./components/galleryContent";

const rowCount = 5;

export default function MosaicGallery({ works }: { works: Work[] }) {
  const [selected, setSelected] = useState({ row: 2, column: Math.floor(works.length / 2) });
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const stage = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const fraction = defaultCarouselSettings.width / 100;
  const expandedWidth = size.width * fraction;
  const expandedHeight = size.height * fraction;
  return (
    <section className="mosaic-gallery" aria-label="Mosaic carousel">
      <div
        ref={stage}
        className="mosaic-stage"
        style={{
          gridTemplateColumns: works.map((_, column) => `${column === selected.column ? expandedWidth : (size.width - expandedWidth) / Math.max(1, works.length - 1)}px`).join(' '),
          gridTemplateRows: Array.from({ length: rowCount }, (_, row) => `${row === selected.row ? expandedHeight : (size.height - expandedHeight) / (rowCount - 1)}px`).join(' '),
          '--mosaic-photo-width': `${expandedWidth}px`,
          '--mosaic-photo-height': `${expandedHeight}px`,
          '--mosaic-duration': `${defaultCarouselSettings.duration}ms`,
          '--mosaic-easing': defaultCarouselSettings.easing,
        } as CSSProperties}
      >
        {Array.from({ length: rowCount }, (_, row) => works.map((work, column) => {
          const index = row * works.length + column;
          const active = row === selected.row && column === selected.column;
          return (
            <button
              key={`${row}-${work.file}`}
              ref={(element) => { cells.current[index] = element; }}
              className="mosaic-cell"
              aria-label={`${work.name}, row ${row + 1}`}
              aria-pressed={active}
              tabIndex={active ? 0 : -1}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setSelected({ row, column });
              }}
              onClick={() => setSelected({ row, column })}
              onFocus={() => setSelected({ row, column })}
              onKeyDown={(event) => {
                let nextRow = row;
                let nextColumn = column;
                if (event.key === 'ArrowRight') nextColumn = (column + 1) % works.length;
                else if (event.key === 'ArrowLeft') nextColumn = (column - 1 + works.length) % works.length;
                else if (event.key === 'ArrowDown') nextRow = (row + 1) % rowCount;
                else if (event.key === 'ArrowUp') nextRow = (row - 1 + rowCount) % rowCount;
                else return;
                event.preventDefault();
                cells.current[nextRow * works.length + nextColumn]?.focus();
              }}
            >
              <img src={`${import.meta.env.BASE_URL}gallery/${work.file}`} alt="" draggable={false} />
            </button>
          );
        }))}
      </div>
    </section>
  );
}
