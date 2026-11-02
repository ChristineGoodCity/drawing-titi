import { useEffect, useState } from 'react';

import { drawingFiles } from "./galleryContent";

export default function GalleryBrandOverlay({ reduced }: { reduced: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setFrame((value) => (value + 1) % drawingFiles.length), 300);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className="gallery-brand-overlay">
      <div className="gallery-drawings" aria-hidden="true">
        {drawingFiles.map((file, index) => (
          <img key={file} src={`${import.meta.env.BASE_URL}playground/${file}`} alt="" className={index === frame ? 'is-visible' : ''} draggable={false} />
        ))}
      </div>
      <div className="gallery-wordmark" role="img" aria-label="Turning Tables">
        <div className="gallery-wordmark-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div className="gallery-wordmark-copy" key={copy}>
              <img src={`${import.meta.env.BASE_URL}wordmark.svg`} alt="" draggable={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
