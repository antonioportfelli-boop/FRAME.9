import { useRef, type ReactNode } from "react";
import { Minus, X } from "lucide-react";
import type { Win } from "@/lib/signal/store";
import { useDesk } from "@/lib/signal/store";

export function WindowFrame({
  win,
  focused,
  hidden,
  children,
}: {
  win: Win;
  focused: boolean;
  hidden: boolean;
  children: ReactNode;
}) {
  const moveWindow = useDesk((s) => s.moveWindow);
  const resizeWindow = useDesk((s) => s.resizeWindow);
  const closeModule = useDesk((s) => s.closeModule);
  const openModule = useDesk((s) => s.openModule);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const grow = useRef<{ x: number; y: number; ow: number; oh: number } | null>(null);

  return (
    <section
      className={`absolute flex flex-col overflow-hidden border bg-surface text-fg ${hidden ? "hidden" : ""} ${focused ? "border-teal" : "border-line"}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      role="dialog"
      aria-label={win.title}
      aria-hidden={hidden}
    >
      <header
        className="flex h-11 shrink-0 cursor-grab items-center border-b border-line bg-ink active:cursor-grabbing"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          openModule(win.id);
          drag.current = { x: event.clientX, y: event.clientY, ox: win.x, oy: win.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          moveWindow(win.id, drag.current.ox + event.clientX - drag.current.x, drag.current.oy + event.clientY - drag.current.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <h2 className="min-w-0 flex-1 truncate px-3 font-mono text-xs tracking-wide text-fg">{win.title}</h2>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center text-muted hover:text-fg"
          aria-label={`Minimize ${win.title}`}
          onClick={() => useDesk.setState((s) => ({ windows: s.windows.map((item) => (item.id === win.id ? { ...item, minimized: true } : item)) }))}
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center text-muted hover:text-fg"
          aria-label={`Close ${win.title}`}
          onClick={() => closeModule(win.id)}
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      <div
        className="absolute right-0 bottom-0 h-11 w-11 cursor-se-resize"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.stopPropagation();
          grow.current = { x: event.clientX, y: event.clientY, ow: win.w, oh: win.h };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!grow.current) return;
          resizeWindow(win.id, grow.current.ow + event.clientX - grow.current.x, grow.current.oh + event.clientY - grow.current.y);
        }}
        onPointerUp={() => {
          grow.current = null;
        }}
      />
    </section>
  );
}
