export type Work = { file: string; name: string };

export const drawingFiles = Array.from({ length: 7 }, (_, index) => `Frame ${index + 13}.svg`);

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
