import { useRef, useState } from "react";
import GalleryVariants from "./GalleryVariants";
import StretchGallery from "./StretchGallery";
import MosaicGallery from "./MosaicGallery";
import {
  works,
  mosaicWorks,
  skewedWorks,
  shapeMotionWorks,
  verticalWorks,
} from "./components/galleryContent";

const versions = [
  { id: "natural", label: "Shape motion" },
  { id: "motion", label: "Shape motion · Preset shapes" },
  { id: "skewed", label: "Skewed carousel" },
  { id: "vertical", label: "Vertical carousel" },
  { id: "mosaic-unique", label: "Mosaic" },
  { id: "mosaic", label: "Mosaic · Repeat" },
] as const;

const showVersionSwitcher = true;

export default function Gallery() {
  const [active, setActive] =
    useState<(typeof versions)[number]["id"]>("skewed");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <main
      className={`gallery-page ${showVersionSwitcher ? "gallery-comparison" : ""} ${active === "skewed" || active === "vertical" || active === "mosaic" || active === "mosaic-unique" ? "is-fullscreen-carousel" : ""}`}
    >
      <a className="gallery-drawing-link" href={import.meta.env.BASE_URL}>
        Drawing
      </a>
      {showVersionSwitcher && (
        <nav
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
        </nav>
      )}
      <div
        id="gallery-version"
        role={showVersionSwitcher ? "tabpanel" : "region"}
        aria-labelledby={showVersionSwitcher ? `tab-${active}` : undefined}
        aria-label={showVersionSwitcher ? undefined : "Shape motion gallery"}
      >
        {active === "motion" || active === "natural" ? (
          <StretchGallery
            key={active}
            works={shapeMotionWorks}
            naturalAspect={active === "natural"}
          />
        ) : active === "mosaic" || active === "mosaic-unique" ? (
          <MosaicGallery
            key={active}
            works={active === "mosaic-unique" ? mosaicWorks : works}
            uniqueRows={active === "mosaic-unique"}
          />
        ) : (
          <GalleryVariants
            key={active}
            variant={active}
            works={active === "skewed" ? skewedWorks : verticalWorks}
          />
        )}
      </div>
    </main>
  );
}
