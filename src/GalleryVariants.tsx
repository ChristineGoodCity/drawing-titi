import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

type Work = { file: string; name: string };
export type Variant = "skewed" | "expanding";

export default function GalleryVariants({
  works,
  variant,
}: {
  works: Work[];
  variant: Variant;
}) {
  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const stage = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const ratio = ratios[works[selected]?.file] || 1.5;
  const bigWidth =
    variant === "skewed"
      ? size.width * 0.75
      : Math.min(size.width * 0.75, size.height * 0.86 * ratio);
  const smallWidth = (size.width - bigWidth) / Math.max(1, works.length - 1);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    let edge = 0;
    for (let i = 0; i < works.length; i++) {
      edge += i === selected ? bigWidth : smallWidth;
      if (x * size.width < edge - 1e-9 || i === works.length - 1) {
        setSelected(i);
        break;
      }
    }
  }
  function photo(work: Work, className?: string) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}gallery/${work.file}`}
        alt=""
        className={className}
        draggable={false}
        onLoad={(event) => {
          const img = event.currentTarget;
          const aspect = img.naturalWidth / img.naturalHeight;
          setRatios((previous) =>
            previous[work.file] === aspect
              ? previous
              : { ...previous, [work.file]: aspect },
          );
        }}
      />
    );
  }
  return (
    <section
      className={`variant-gallery variant-${variant}`}
      aria-label={`${variant} gallery`}
    >
      <div className="variant-stage" ref={stage} onPointerMove={move}>
        {works.map((work, i) => (
          <button
            key={work.file}
            ref={(element) => {
              buttons.current[i] = element;
            }}
            className="variant-strip"
            aria-label={work.name}
            aria-pressed={i === selected}
            tabIndex={i === selected ? 0 : -1}
            style={{
              width: i === selected ? bigWidth : smallWidth,
              height:
                variant === "skewed"
                  ? "100%"
                  : i === selected
                    ? bigWidth / ratio
                    : size.height * 0.42,
            }}
            onFocus={() => setSelected(i)}
            onClick={() => setSelected(i)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              buttons.current[
                (i + (event.key === "ArrowRight" ? 1 : -1) + works.length) %
                  works.length
              ]?.focus();
            }}
          >
            {photo(work)}
            <span>{String(i + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
      <footer className="variant-footer">
        <span>{works[selected]?.name}</span>
        <span>Hover / tap to explore</span>
      </footer>
    </section>
  );
}
