export type Work = { file: string; name: string };

export const drawingFiles = Array.from(
  { length: 7 },
  (_, index) => `Frame ${index + 13}.svg`,
);

export const works: Work[] = [
  { file: "mille3.jpg", name: "Painting in the sunshine" },
  { file: "behind-the-scenes.webp", name: "Behind the scenes" },
  { file: "fornhojden-showcase.webp", name: "Evening showcase" },
  { file: "dj-workshop.webp", name: "At the decks" },
  { file: "outdoor-dj.webp", name: "Outdoor session" },
  { file: "rf16.webp", name: "Live on the mic" },
  { file: "studio-producer.webp", name: "In the studio" },
  { file: "berlin-gathering.webp", name: "Together in Berlin" },
  { file: "studio-duo.webp", name: "Recording together" },
  { file: "studio-trio.webp", name: "Studio session" },
  { file: "vocal-duet.webp", name: "Sharing the mic" },
];

// Keep the other galleries curated while using the full collection in the new mosaic.
export const mosaicWorks: Work[] = [
  ...works,
  { file: "039__H8A8638__MicDrop_KalzFoto.webp", name: "Gallery photo 12" },
  { file: "103_193__O3A4949_KalzFoto.webp", name: "Gallery photo 13" },
  { file: "252__H8A0983_KalzFoto.webp", name: "Gallery photo 14" },
  { file: "30_11_23-baranmayda-12.webp", name: "Gallery photo 15" },
  { file: "DSC_0224.webp", name: "Gallery photo 16" },
  { file: "gruppenbild-2.webp", name: "Gallery photo 17" },
  { file: "IMG_20210912_164555.webp", name: "Gallery photo 18" },
  { file: "img-7458-2.webp", name: "Gallery photo 19" },
  { file: "PhilProbe_065_H8A9122_Kalz.webp", name: "Gallery photo 20" },
  { file: "PhilProbe_182_H8A9557_Kalz.webp", name: "Gallery photo 21" },
  { file: "Saga.webp", name: "Gallery photo 22" },
  { file: "tempelhof-screenshot-1.webp", name: "Gallery photo 23" },
  { file: "TyraLeia2.webp", name: "Gallery photo 24" },
  { file: "dsc7733-copy.webp", name: "Gallery photo 25" },
  { file: "_H8A0484_Kalz.webp", name: "Gallery photo 26" },
  { file: "_H8A1369_Kalz.webp", name: "Gallery photo 27" },
  { file: "_H8A1405_Kalz.webp", name: "Gallery photo 28" },
  { file: "_MG_5378.webp", name: "Gallery photo 29" },
  { file: "_MG_8638.webp", name: "Gallery photo 30" },
];

export const skewedWorks: Work[] = works.map((work, index) => {
  if (index === 1)
    return { file: "img-7458-2.webp", name: "Music in the pink studio" };
  if (index === 2)
    return {
      file: "PhilProbe_182_H8A9557_Kalz.webp",
      name: "Singer in the concert hall",
    };
  if (index === 4)
    return {
      file: "103_193__O3A4949_KalzFoto.webp",
      name: "Vocalist recording in the studio",
    };
  if (index === 5)
    return { file: "_MG_5378.webp", name: "Recording in the red studio" };
  return work;
});

// Alternate orientations; portraits recur because the collection has more landscapes.
const portraitFiles = new Set([
  "behind-the-scenes.webp",
  "studio-producer.webp",
  "30_11_23-baranmayda-12.webp",
  "img-7458-2.webp",
  "PhilProbe_065_H8A9122_Kalz.webp",
  "PhilProbe_182_H8A9557_Kalz.webp",
  "dsc7733-copy.webp",
  "_H8A0484_Kalz.webp",
  "_MG_5378.webp",
  "_MG_8638.webp",
]);
const portraits = mosaicWorks.filter((work) => portraitFiles.has(work.file));
const landscapes = mosaicWorks.filter((work) => !portraitFiles.has(work.file));
export const shapeMotionWorks = landscapes.flatMap((work, index) => [
  work,
  portraits[index % portraits.length],
]);

export const verticalWorks: Work[] = works.map((work, index) => {
  if (index === 1)
    return {
      file: "039__H8A8638__MicDrop_KalzFoto.webp",
      name: "Mic Drop performance",
    };
  if (index === 4)
    return {
      file: "gruppenbild-2.webp",
      name: "Together at the outdoor stage",
    };
  if (index === 5)
    return {
      file: "PhilProbe_065_H8A9122_Kalz.webp",
      name: "Concert hall rehearsal",
    };
  if (index === 6)
    return { file: "TyraLeia2.webp", name: "Ukulele by the mural" };
  return work;
});
