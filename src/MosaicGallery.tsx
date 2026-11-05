import { useEffect, useRef, useState, type CSSProperties } from "react";
import { defaultCarouselSettings } from "./components/carouselSettingsDefaults";
import type { Work } from "./components/galleryContent";

const rowCount = 5;

export default function MosaicGallery({
  works,
  uniqueRows = false,
}: {
  works: Work[];
  uniqueRows?: boolean;
}) {
  const columnCount = uniqueRows
    ? Math.ceil(works.length / rowCount)
    : works.length;
  const rows = Array.from({ length: rowCount }, (_, row) =>
    uniqueRows
      ? works.slice(row * columnCount, (row + 1) * columnCount)
      : works,
  );
  const [selected, setSelected] = useState({
    row: 2,
    column: Math.floor(columnCount / 2),
  });
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const stage = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
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
        style={
          {
            gridTemplateColumns: Array.from(
              { length: columnCount },
              (_, column) =>
                `${column === selected.column ? expandedWidth : (size.width - expandedWidth) / Math.max(1, columnCount - 1)}px`,
            ).join(" "),
            gridTemplateRows: Array.from(
              { length: rowCount },
              (_, row) =>
                `${row === selected.row ? expandedHeight : (size.height - expandedHeight) / (rowCount - 1)}px`,
            ).join(" "),
            "--mosaic-photo-width": `${expandedWidth}px`,
            "--mosaic-photo-height": `${expandedHeight}px`,
            "--mosaic-duration": `${defaultCarouselSettings.duration}ms`,
            "--mosaic-easing": defaultCarouselSettings.easing,
          } as CSSProperties
        }
      >
        {rows.map((rowWorks, row) =>
          rowWorks.map((work, column) => {
            const index = row * columnCount + column;
            const active = row === selected.row && column === selected.column;
            return (
              <button
                key={`${row}-${work.file}`}
                ref={(element) => {
                  cells.current[index] = element;
                }}
                className="mosaic-cell"
                aria-label={`${work.name}, row ${row + 1}`}
                aria-pressed={active}
                tabIndex={active ? 0 : -1}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse")
                    setSelected({ row, column });
                }}
                onClick={() => setSelected({ row, column })}
                onFocus={() => setSelected({ row, column })}
                onKeyDown={(event) => {
                  let nextRow = row;
                  let nextColumn = column;
                  if (event.key === "ArrowRight")
                    nextColumn = (column + 1) % rowWorks.length;
                  else if (event.key === "ArrowLeft")
                    nextColumn =
                      (column - 1 + rowWorks.length) % rowWorks.length;
                  else if (event.key === "ArrowDown")
                    nextRow = (row + 1) % rowCount;
                  else if (event.key === "ArrowUp")
                    nextRow = (row - 1 + rowCount) % rowCount;
                  else return;
                  event.preventDefault();
                  nextColumn = Math.min(nextColumn, rows[nextRow].length - 1);
                  cells.current[nextRow * columnCount + nextColumn]?.focus();
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}gallery/${encodeURIComponent(work.file)}`}
                  alt=""
                  draggable={false}
                />
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
}
