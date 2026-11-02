import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import GalleryBrandOverlay from "./components/GalleryBrandOverlay";
import { defaultCarouselSettings } from "./components/carouselSettingsDefaults";
import { blendExpandingWaves, expandingWave, gooeyWave } from "./components/expandingWave";
import { useGooeyPointer } from "./components/useGooeyPointer";
import type { Work } from "./components/galleryContent";
import { useReducedMotion } from "./components/useReducedMotion";

export type Variant = "skewed" | "vertical" | "expanding" | "gooey";

export default function GalleryVariants({
  works,
  variant,
}: {
  works: Work[];
  variant: Variant;
}) {
  const vertical = variant === "vertical";
  const skewed = variant === "skewed" || vertical;
  const [selected, setSelected] = useState(0);
  const settings = defaultCarouselSettings;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!skewed || !settings.autoplay || reduced || works.length < 2) return;
    const timer = setInterval(() => setSelected((value) => (value + 1) % works.length), settings.interval);
    return () => clearInterval(timer);
  }, [skewed, settings.autoplay, settings.interval, reduced, works.length]);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const stage = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const waveId = useId().replace(/:/g, "");
  const [animatedWave, setAnimatedWave] = useState(() => expandingWave(works.length, 0));
  const currentWave = useRef(animatedWave);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHover = useRef<number | null>(null);
  function cancelHover() {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    pendingHover.current = null;
  }
  useEffect(() => () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
  }, []);
  useEffect(() => {
    if (skewed || reduced) return;
    const from = currentWave.current;
    const target = expandingWave(works.length, selected);
    const startTime = performance.now();
    let animation = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - startTime) / (variant === "gooey" ? 1000 : 650));
      const eased = progress * progress * (3 - 2 * progress);
      currentWave.current = progress === 1 ? target : blendExpandingWaves(from, target, eased);
      setAnimatedWave(currentWave.current);
      if (progress < 1) animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [selected, skewed, reduced, works.length, variant]);
  const baseWave = reduced ? expandingWave(works.length, selected) : animatedWave;
  const goo = useGooeyPointer(variant === "gooey", reduced, stage, baseWave);
  const wave = variant === "gooey" ? gooeyWave(baseWave, goo.pull) : baseWave;
  // Size each photograph to the highest point of its own section of the wave.
  // Width, height and clipping all use the same animated geometry.
  const imageHeights = wave.widths.map((width, index) => {
    const left = wave.centers[index] - width / 2;
    const samples = Array.from({ length: 33 }, (_, point) =>
      wave.halfHeight(left + width * point / 32));
    return Math.min(1, 2 * Math.max(...samples) + 0.006);
  });
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
  const axisSize = vertical ? size.height : size.width;
  const bigWidth = axisSize * settings.width / 100;
  const smallWidth = (axisSize - bigWidth) / Math.max(1, works.length - 1);

  // Overscan the outer strips so their slanted edges stay outside the viewport.
  const edgeBleed = skewed
    ? Math.ceil((vertical ? size.width : size.height) * Math.tan(Math.abs(settings.skew) * Math.PI / 180) / 2) + 1
    : 0;

  return (
    <section
      className={`variant-gallery ${skewed ? "variant-skewed" : ""} ${variant === "gooey" ? "variant-expanding" : ""} variant-${variant}`}
      aria-label={`${variant} gallery`}
      onPointerMove={variant === "gooey" ? goo.onPointerMove : undefined}
      onPointerLeave={variant === "gooey" ? goo.onPointerLeave : undefined}
      style={skewed ? {
        '--carousel-skew': `${settings.skew}deg`,
        '--carousel-duration': `${settings.duration}ms`,
        '--carousel-easing': settings.easing,
        '--carousel-zoom': settings.zoom,
      } as CSSProperties : undefined}
    >
      {!skewed && <svg className="expanding-wave-defs" aria-hidden="true" width="0" height="0">
        <defs><clipPath id={waveId} clipPathUnits="objectBoundingBox">
          <path d={wave.path} />
        </clipPath></defs>
      </svg>}
      <div
        className="variant-stage"
        ref={stage}
        onPointerLeave={() => { lastPointer.current = null; cancelHover(); }}
        style={skewed ? {
          [vertical ? "gridTemplateRows" : "gridTemplateColumns"]: works.map((_, i) => `${i === selected ? bigWidth : smallWidth}px`).join(" "),
        } : { clipPath: `url(#${waveId})` }}
      >
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
              '--photo-width': `${bigWidth + (i === 0 ? edgeBleed : 0) + (i === works.length - 1 ? edgeBleed : 0)}px`,
              '--expanding-image-height': `${imageHeights[i] * 100}%`,
              // One grid transition keeps unchanged columns at a constant width.
              width: skewed ? (vertical ? "100%" : undefined) : `${wave.widths[i] * 100}%`,
              [vertical ? "marginTop" : "marginLeft"]: i === 0 ? -edgeBleed : undefined,
              [vertical ? "marginBottom" : "marginRight"]: i === works.length - 1 ? -edgeBleed : undefined,
              height: vertical ? undefined : "100%",
            } as CSSProperties}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse' && skewed && settings.hover) setSelected(i);
            }}
            onPointerMove={(event) => {
              if (skewed || event.pointerType !== 'mouse') return;
              const point = { x: event.clientX, y: event.clientY };
              const previousPoint = lastPointer.current;
              // Resizing panels can generate boundary events under a stationary mouse.
              // Only deliberate pointer movement should pick another expanding panel.
              if (previousPoint?.x === point.x && previousPoint.y === point.y) return;
              lastPointer.current = point;
              if (i === selected) { cancelHover(); return; }
              if (pendingHover.current === i) return;
              cancelHover();
              pendingHover.current = i;
              hoverTimer.current = setTimeout(() => {
                setSelected(i);
                pendingHover.current = null;
                hoverTimer.current = null;
              }, 120);
            }}
            onFocus={() => { cancelHover(); setSelected(i); }}
            onClick={() => { cancelHover(); setSelected(i); }}
            onKeyDown={(event) => {
              const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
              const nextKey = vertical ? "ArrowDown" : "ArrowRight";
              if (event.key !== previousKey && event.key !== nextKey)
                return;
              event.preventDefault();
              buttons.current[
                (i + (event.key === nextKey ? 1 : -1) + works.length) %
                  works.length
              ]?.focus();
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}gallery/${work.file}`}
              alt=""
              draggable={false}
            />
            {!skewed && <span style={{ left: "50%", top: `${(0.5 + wave.bottomHeight(wave.centers[i])) * 100}%`, bottom: "auto", transform: "translate(-50%, -28px)" }}>{String(i + 1).padStart(2, "0")}</span>}
          </button>
        ))}
      </div>
      {variant === "skewed" && <GalleryBrandOverlay reduced={reduced} />}
    </section>
  );
}
