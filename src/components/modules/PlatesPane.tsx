import { PLATES, usePlates } from "@/lib/signal/plates";

export function PlatesPane() {
  const current = usePlates((s) => s.id);
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {PLATES.map((plate) => (
        <button
          key={plate.id}
          type="button"
          className={`border text-left ${current === plate.id ? "border-teal" : "border-line"}`}
          onClick={() => usePlates.getState().setPlate(plate.id)}
        >
          <img src={plate.src} alt="" className="h-24 w-full object-cover" />
          <span className="block px-2 py-2 font-mono text-xs text-fg">{plate.title}</span>
        </button>
      ))}
      <p className="col-span-2 text-xs text-muted">Need on selle programmi pildid. Taust vahetub kohe. Teiste kuude vestlusi siin kaustas ei ole.</p>
    </div>
  );
}
