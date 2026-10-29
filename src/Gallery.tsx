import { useRef, useState } from "react";
import GalleryVariants from "./GalleryVariants";
import StretchGallery from "./StretchGallery";

const works = [
  { file: "mille3.jpg", name: "Painting in the sunshine" },
  { file: "fornhojden-showcase.webp", name: "Evening showcase" },
  { file: "dj-workshop.webp", name: "At the decks" },
  { file: "outdoor-dj.webp", name: "Outdoor session" },
  { file: "behind-the-scenes.webp", name: "Behind the scenes" },
  { file: "rf16.webp", name: "Live on the mic" },
  { file: "studio-producer.webp", name: "In the studio" },
  { file: "berlin-gathering.webp", name: "Together in Berlin" },
  { file: "studio-duo.webp", name: "Recording together" },
  { file: "studio-trio.webp", name: "Studio session" },
  { file: "vocal-duet.webp", name: "Sharing the mic" },
];

const versions = [
  { id: "motion", label: "Shape motion" },
  { id: "skewed", label: "Skewed carousel" },
  { id: "expanding", label: "Expanding carousel" },
] as const;

const showVersionSwitcher = false;

export default function Gallery() {
  const [active, setActive] =
    useState<(typeof versions)[number]["id"]>("motion");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <main
      className={`gallery-page ${showVersionSwitcher ? "gallery-comparison" : ""} ${active === "skewed" ? "is-fullscreen-carousel" : ""}`}
    >
      {showVersionSwitcher && <nav
        className="gallery-switcher"
        role="tablist"
        aria-label="Gallery versions"
      >
        {versions.map((version, index) => (
          <button
            key={version.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            role="tab"
            id={`tab-${version.id}`}
            aria-selected={active === version.id}
            aria-controls="gallery-version"
            tabIndex={active === version.id ? 0 : -1}
            onClick={() => setActive(version.id)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % versions.length;
              else if (event.key === "ArrowLeft")
                next = (index + versions.length - 1) % versions.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = versions.length - 1;
              else return;
              event.preventDefault();
              setActive(versions[next].id);
              tabs.current[next]?.focus();
            }}
          >
            {version.label}
          </button>
        ))}
      </nav>}
      <div
        id="gallery-version"
        role={showVersionSwitcher ? "tabpanel" : "region"}
        aria-labelledby={showVersionSwitcher ? `tab-${active}` : undefined}
        aria-label={showVersionSwitcher ? undefined : "Shape motion gallery"}
      >
        {active === "motion" ? (
          <StretchGallery works={works} />
        ) : (
          <GalleryVariants key={active} variant={active} works={works} />
        )}
      </div>
    </main>
  );
}
