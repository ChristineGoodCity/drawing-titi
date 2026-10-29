import { DrawingStudio } from "./components/DrawingStudio";

export default function App() {
  return (
    <main className="mx-16 py-10 max-w-[1440px]">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-[11px] font-bold uppercase">Make your own titi</h1>
        <nav aria-label="Main navigation" className="flex gap-6">
          <a className="text-[11px] uppercase underline underline-offset-4" href={`${import.meta.env.BASE_URL}gallery/`}>
            Gallery
          </a>
        </nav>
      </header>
      <DrawingStudio />
    </main>
  );
}
