import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallBanner({ phone }: { phone: boolean }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!phone || installed || hide) return null;

  return (
    <div className="border-t border-line px-3 py-3">
      <p className="text-base text-fg">Pane see telefoni avakuvale. Chrome küsib luba ise.</p>
      <p className="mt-1 text-sm text-muted">See kasutab telefoni ekraani ja brauserit, mitte tuuma. Avakuvalt ei tule juurde õigusi, mida lehel ei ole.</p>
      <div className="mt-3 flex gap-2">
        {prompt ? (
          <button
            type="button"
            className="h-14 flex-1 border border-teal text-lg text-teal"
            onClick={() => {
              void prompt.prompt().then(() => setHide(true));
            }}
          >
            Paigalda
          </button>
        ) : (
          <p className="flex min-h-14 flex-1 items-center text-base text-fg">Chrome'i menüü, siis Paigalda rakendus või Lisa avakuvale.</p>
        )}
        <button type="button" className="h-14 border border-line px-4 text-base text-muted" onClick={() => setHide(true)}>
          Hiljem
        </button>
      </div>
    </div>
  );
}
