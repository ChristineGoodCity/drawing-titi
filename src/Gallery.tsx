import { useRef, useState } from "react";
import GalleryVariants from "./GalleryVariants";
import StretchGallery from "./StretchGallery";
import MosaicGallery from "./MosaicGallery";
import { works } from "./components/galleryContent";

const versions = [
  { id: "natural", label: "Shape motion" },
  { id: "motion", label: "Shape motion · Preset shapes" },
  { id: "skewed", label: "Skewed carousel" },
  { id: "vertical", label: "Vertical carousel" },
  { id: "mosaic", label: "Mosaic carousel" },
  { id: "expanding", label: "Expanding carousel" },
  { id: "gooey", label: "Gooey carousel" },
] as const;

const showVersionSwitcher = true;

export default function Gallery() {
  const [active, setActive] =
    useState<(typeof versions)[number]["id"]>("natural");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <main
      className={`gallery-page ${showVersionSwitcher ? "gallery-comparison" : ""} ${(active === "skewed" || active === "vertical" || active === "mosaic") ? "is-fullscreen-carousel" : ""}`}
    >
      {showVersionSwitcher && <nav
        className="gallery-switcher"
        role="tablist"
        aria-label="Gallery versions"
      >
        {versions.map((version, index) => (
          <button
            key={version.id}
            className="gallery-button"
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
              let next: number;
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
        {active === "motion" || active === "natural" ? (
          <StretchGallery key={active} works={works} naturalAspect={active === "natural"} />
        ) : active === "mosaic" ? (
          <MosaicGallery works={works} />
        ) : (
          <GalleryVariants key={active} variant={active} works={works} />
        )}
      </div>
    </main>
  );
}
