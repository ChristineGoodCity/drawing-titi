import { useEffect, useState, type CSSProperties } from 'react';

type Work = { file: string; name: string };
const drawings = ['Frame 13.svg', 'Frame 14.svg', 'Frame 15.svg', 'Frame 16.svg', 'Frame 17.svg', 'Frame 18.svg', 'Frame 19.svg'];

// Centered square and rectangle animation.
// Keep the area constant: narrowing one axis expands the other, never uniform scaling.
const frameArea = 200 * 200;
const shapes = [
  { aspect: 4 / 5, label: '4:5' },
  { aspect: 5 / 4, label: '5:4' },
  { aspect: 1, label: '1:1' },
  { aspect: 3 / 2, label: '3:2' },
].map(({ aspect, label }) => ({
  width: Math.sqrt(frameArea * aspect),
  height: Math.sqrt(frameArea / aspect),
  label,
}));


export default function StretchGallery({ works }: { works: Work[] }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduced || works.length < 2) return;
    const timer = setInterval(() => setStep(value => value + 1), 1800);
    return () => clearInterval(timer);
  }, [paused, reduced, works.length]);
  const selected = step % works.length;
  const selectedDrawing = step % drawings.length;
  const shape = shapes[step % shapes.length];
  const { width, height } = shape;
  return <section className="center-gallery" aria-label="Changing photographs and proportions">
    <div className="gallery-drawings">
      {drawings.map((file, index) => <img key={file}
        src={`${import.meta.env.BASE_URL}playground/${file}`}
        alt={index === selectedDrawing ? `Drawing ${index + 1}` : ''}
        aria-hidden={index !== selectedDrawing}
        className={index === selectedDrawing ? 'is-visible' : ''}
        draggable={false} />)}
    </div>
    <div className="center-frame" style={{ '--frame-width': `${width}px`, '--frame-height': `${height}px` } as CSSProperties}>
      <span className="center-ratio" aria-hidden="true">{shape.label}</span>
      <div className="center-images">
        {works.map((work, index) => <img key={work.file} src={`${import.meta.env.BASE_URL}gallery/${work.file}`}
          alt={index === selected ? work.name : ''} aria-hidden={index !== selected}
          className={index === selected ? 'is-visible' : ''} draggable={false} />)}
      </div>
      <div className="center-caption">
        <span>{works[selected]?.name}</span>
      </div>
    </div>
    <div className="gallery-wordmark" role="img" aria-label="Turning Tables">
      <div className="gallery-wordmark-track" style={{ animationPlayState: paused ? 'paused' : 'running' }} aria-hidden="true">
        {[0, 1].map(copy => <div className="gallery-wordmark-copy" key={copy}>
          <img src={`${import.meta.env.BASE_URL}wordmark.svg`} alt="" draggable={false} />
        </div>)}
      </div>
    </div>
    {!reduced && <button className="center-pause" onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'}</button>}
  </section>;
}
