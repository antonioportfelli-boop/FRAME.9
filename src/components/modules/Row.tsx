

export function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-2 items-baseline gap-3 border-b border-line px-3 py-2">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="truncate text-right font-mono text-xs text-fg" title={v}>{v}</dd>
    </div>
  );
}
