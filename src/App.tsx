import { DrawingStudio } from "./components/DrawingStudio";

export default function App() {
  return (
    <main className="mx-16 py-10 max-w-[1440px]">
      <header className="mb-8">
        <h1 className="text-[11px] font-bold uppercase">Make your own titi</h1>
      </header>
      <DrawingStudio />
    </main>
  );
}
