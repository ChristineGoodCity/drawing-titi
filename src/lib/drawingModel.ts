export type Prediction = { className: string; probability: number };
let modelPromise:
  | Promise<import("@teachablemachine/image").CustomMobileNet>
  | undefined;
export async function predictDrawing(canvas: HTMLCanvasElement) {
  if (!modelPromise) {
    modelPromise = import("@teachablemachine/image")
      .then((tm) => {
        const base = `${import.meta.env.BASE_URL}my_model/`;
        return tm.load(`${base}model.json`, `${base}metadata.json`);
      })
      .catch((error) => {
        modelPromise = undefined;
        throw error;
      });
  }
  const model = await modelPromise;
  return model.predict(canvas, false);
}
