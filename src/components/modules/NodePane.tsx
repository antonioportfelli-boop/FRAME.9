import { getWorld } from "@/lib/graph/world";
import { userLinkFrame } from "@/lib/signal/frames";
import { useDesk } from "@/lib/signal/store";
import { Row } from "./Row";

export function NodePane() {
  const id = useDesk((s) => s.selectedNode);
  const pinEpoch = useDesk((s) => s.pinEpoch);
  const graphEpoch = useDesk((s) => s.graphEpoch);
  const selectNode = useDesk((s) => s.selectNode);
  const scopeNode = useDesk((s) => s.scopeNode);
  const bumpPin = useDesk((s) => s.bumpPin);
  void pinEpoch;
  void graphEpoch;
  const node = id ? getWorld().byId.get(id) : undefined;
  if (!node) return <p className="px-3 py-6 text-sm text-muted">Click a node on the fabric. Drag moves it. Double-click pins it.</p>;
  const world = getWorld();
  const links = world.edges.flatMap((edge) => {
    const otherId = edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : "";
    if (!otherId) return [];
    const other = world.byId.get(otherId);
    return other ? [{ id: edge.id, label: edge.label, other }] : [];
  });
  return (
    <div>
      <dl>
        <Row k="Label" v={node.label} />
        <Row k="Id" v={node.id} />
        <Row k="Kind" v={node.kind} />
        <Row k="Domain" v={node.domain} />
        <Row k="Pinned" v={node.pinned ? "yes" : "no"} />
        <Row k="Degree" v={String(links.length)} />
      </dl>
      <p className="px-3 py-3 text-sm text-pretty text-muted">{node.blurb}</p>
      <div className="flex gap-2 px-3">
        <button
          type="button"
          className="h-11 flex-1 border border-line text-sm text-fg"
          onClick={() => {
            node.pinned = !node.pinned;
            bumpPin();
          }}
        >
          {node.pinned ? "Unpin" : "Pin"}
        </button>
        <button type="button" className="h-11 flex-1 border border-teal text-sm text-teal" onClick={() => scopeNode(node.id)}>
          Frames
        </button>
      </div>
      <div className="px-3 pt-2">
        <button
          type="button"
          className="h-11 w-full border border-line text-sm text-muted"
          onClick={() => {
            const desk = useDesk.getState();
            const rel = (performance.now() - desk.sessionStart) / 1000;
            desk.pushFrame(userLinkFrame(rel, node.id, node.label));
          }}
        >
          Assert visible link
        </button>
        <p className="mt-2 text-xs text-pretty text-muted">This is your statement. The camera did not identify the node.</p>
      </div>
      <h3 className="mt-3 border-y border-line bg-ink px-3 py-2 font-mono text-xs text-teal">Links</h3>
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <button type="button" className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left" onClick={() => selectNode(link.other.id)}>
              <span className="text-sm text-fg">{link.other.label}</span>
              <span className="font-mono text-xs text-muted">{link.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
