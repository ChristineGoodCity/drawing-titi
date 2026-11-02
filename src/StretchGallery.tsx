import { useEffect, useState, type CSSProperties } from "react";
import { drawingFiles, type Work } from "./components/galleryContent";
import { useReducedMotion } from "./components/useReducedMotion";

// The reference alternates size as well as proportion: compact portrait,
// wide landscape, large square, then a smaller portrait before looping.
const shapes = [
  { width: 144, height: 192, label: "3:4" },
  { width: 256, height: 192, label: "4:3" },
  { width: 288, height: 288, label: "1:1" },
  { width: 192, height: 224, label: "6:7" },
];

const aspectRatios = [
  [[1, 2], [7, 15], [8, 15]],
  [[9, 16], [8, 15], [3, 5]],
  [[2, 3], [5, 8], [5, 7]],
  [[3, 4], [5, 7], [4, 5]],
  [[4, 5], [3, 4], [5, 6]],
  [[1, 1], [15, 16], [16, 15]],
  [[5, 4], [6, 5], [4, 3]],
  [[4, 3], [5, 4], [7, 5]],
  [[3, 2], [7, 5], [8, 5]],
  [[16, 9], [5, 3], [15, 8]],
  [[2, 1], [15, 8], [15, 7]],
].map((pairs) => {
  const variations = pairs.map(([width, height]) => ({
    ratio: width / height, label: `${width}:${height}`,
  }));
  return { ...variations[0], variations };
});

export default function StretchGallery({ works, naturalAspect = false }: { works: Work[]; naturalAspect?: boolean }) {
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [drawingStep, setDrawingStep] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || works.length < 2) return;
    const timer = setInterval(() => setStep((value) => value + 1), 2000);
    return () => clearInterval(timer);
  }, [reduced, works.length]);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setDrawingStep((value) => value + 1), 300);
    return () => clearInterval(timer);
  }, [reduced]);
  const selected = step % works.length;
  const previous = step > 0 ? (step - 1) % works.length : -1;
  const selectedDrawing = drawingStep % drawingFiles.length;
  const ratio = imageRatios[works[selected]?.file] ?? 1;
  // Snap the actual frame and its label to the nearest familiar proportion.
  const aspect = aspectRatios.reduce((closest, candidate) =>
    Math.abs(Math.log(candidate.ratio / ratio)) < Math.abs(Math.log(closest.ratio / ratio))
      ? candidate : closest);
  const frameAspect = aspect.variations[step % aspect.variations.length];
  const frameRatio = frameAspect.ratio;
  // Alternate the overall size so similar ratios still produce visible motion.
  const longEdge = step % 2 === 0 ? 288 : 248;
  const shape = naturalAspect ? {
    width: longEdge * Math.min(frameRatio, 1),
    height: longEdge / Math.max(frameRatio, 1),
    label: frameAspect.label,
  } : shapes[step % shapes.length];
  const { width, height } = shape;
  return (
    <section
      className="center-gallery"
      aria-label="Changing photographs and proportions"
    >
      <div className="gallery-drawings">
        {drawingFiles.map((file, index) => (
          <img
            key={file}
            src={`${import.meta.env.BASE_URL}playground/${file}`}
            alt={index === selectedDrawing ? `Drawing ${index + 1}` : ""}
            aria-hidden={index !== selectedDrawing}
            className={index === selectedDrawing ? "is-visible" : ""}
            draggable={false}
          />
        ))}
      </div>
      <div
        className="center-frame"
        style={
          {
            "--frame-width": width,
            "--frame-height": height,
          } as CSSProperties
        }
      >
        <span className="center-ratio" aria-hidden="true">
          {shape.label}
        </span>
        <div className="center-images">
          {works.map((work, index) => (
            <img
              key={work.file}
              src={`${import.meta.env.BASE_URL}gallery/${work.file}`}
              onLoad={naturalAspect ? (event) => {
                const image = event.currentTarget;
                if (!image.naturalWidth || !image.naturalHeight) return;
                const aspect = image.naturalWidth / image.naturalHeight;
                setImageRatios((current) => current[work.file] === aspect
                  ? current : { ...current, [work.file]: aspect });
              } : undefined}
              alt={index === selected ? work.name : ""}
              aria-hidden={index !== selected}
              className={index === selected
                ? `is-visible${step > 0 ? " is-revealing" : ""}`
                : index === previous ? "is-previous" : ""}
              draggable={false}
            />
          ))}
        </div>
        <div className="center-caption">
          <span>{works[selected]?.name}</span>
        </div>
      </div>
      <div className="gallery-wordmark" role="img" aria-label="Turning Tables">
        <div
          className="gallery-wordmark-track"
          aria-hidden="true"
        >
          {[0, 1].map((copy) => (
            <div className="gallery-wordmark-copy" key={copy}>
              <img
                src={`${import.meta.env.BASE_URL}wordmark.svg`}
                alt=""
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
