import { useDesk } from "@/lib/signal/store";

export function useSelectedFrame() {
  const frames = useDesk((s) => s.frames);
  const selected = useDesk((s) => s.selectedFrame);
  if (selected == null) return frames[0] ?? null;
  return frames.find((frame) => frame.no === selected) ?? null;
}
