import { useEffect, useState, type CSSProperties } from "react";
import { drawingFiles, type Work } from "./components/galleryContent";
import { useReducedMotion } from "./components/useReducedMotion";

// Mix silhouettes and scale; every frame stays inside the responsive 288-unit canvas.
const shapes = [
  { width: 144, height: 288, label: "1:2" },
  { width: 288, height: 162, label: "16:9" },
  { width: 216, height: 216, label: "1:1" },
  { width: 192, height: 288, label: "2:3" },
  { width: 288, height: 120, label: "12:5" },
  { width: 160, height: 200, label: "4:5" },
  { width: 288, height: 288, label: "1:1" },
  { width: 240, height: 180, label: "4:3" },
  { width: 120, height: 216, label: "5:9" },
];

const ratioLabels = [
  [1, 3],
  [1, 2],
  [9, 16],
  [2, 3],
  [3, 4],
  [4, 5],
  [1, 1],
  [5, 4],
  [4, 3],
  [3, 2],
  [16, 9],
  [2, 1],
  [3, 1],
];

export default function StretchGallery({
  works,
  naturalAspect = false,
}: {
  works: Work[];
  naturalAspect?: boolean;
}) {
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
  // Preserve the source proportions and aim for equal area, bounded by the viewport.
  // Shape variation now comes from the photos themselves instead of arbitrary shrinking.
  const targetArea = 240 * 240;
  const naturalWidth = Math.sqrt(targetArea * ratio);
  const naturalHeight = Math.sqrt(targetArea / ratio);
  const fit = Math.min(1, 288 / Math.max(naturalWidth, naturalHeight));
  const roundedRatio = ratioLabels.reduce((closest, candidate) =>
    Math.abs(Math.log(candidate[0] / candidate[1] / ratio)) <
    Math.abs(Math.log(closest[0] / closest[1] / ratio))
      ? candidate
      : closest,
  );
  const shape = naturalAspect
    ? {
        width: naturalWidth * fit,
        height: naturalHeight * fit,
        label: `${roundedRatio[0]}:${roundedRatio[1]}`,
      }
    : shapes[step % shapes.length];
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
              key={`${index}-${work.file}`}
              src={`${import.meta.env.BASE_URL}gallery/${encodeURIComponent(work.file)}`}
              onLoad={
                naturalAspect
                  ? (event) => {
                      const image = event.currentTarget;
                      if (!image.naturalWidth || !image.naturalHeight) return;
                      const aspect = image.naturalWidth / image.naturalHeight;
                      setImageRatios((current) =>
                        current[work.file] === aspect
                          ? current
                          : { ...current, [work.file]: aspect },
                      );
                    }
                  : undefined
              }
              alt={index === selected ? work.name : ""}
              aria-hidden={index !== selected}
              className={
                index === selected
                  ? `is-visible${step > 0 ? " is-revealing" : ""}`
                  : index === previous
                    ? "is-previous"
                    : ""
              }
              draggable={false}
            />
          ))}
        </div>
        <div className="center-caption">
          <span>{works[selected]?.name}</span>
        </div>
      </div>
      <div className="gallery-wordmark" role="img" aria-label="Turning Tables">
        <div className="gallery-wordmark-track" aria-hidden="true">
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
