import { type ModuleId } from "@/lib/signal/types";
import { BlockPane } from "@/components/modules/BlockPane";
import { PlatesPane } from "@/components/modules/PlatesPane";
import { KitPane } from "@/components/modules/KitPane";
import { AuditPane } from "@/components/modules/AuditPane";
import { WirePane } from "@/components/modules/WirePane";
import { MarketPane } from "@/components/modules/MarketPane";
import { PostPane } from "@/components/modules/PostPane";
import { LookupPane } from "@/components/modules/LookupPane";
import { SourcePane } from "@/components/modules/SourcePane";
import { FramesPane } from "./FramesPane";
import { DecodePane } from "./DecodePane";
import { HexPane } from "./HexPane";
import { HostPane } from "./HostPane";
import { WifiPane } from "./WifiPane";
import { BluetoothPane } from "./BluetoothPane";
import { RadioPane } from "./RadioPane";
import { TelevisionPane } from "./TelevisionPane";
import { NodePane } from "./NodePane";

export function ModuleBody({ id, active }: { id: ModuleId; active: boolean }) {
  // Exhaustive over ModuleId: adding a module without a pane is a compile error
  // instead of silently rendering NodePane.
  switch (id) {
    case "frames": return <FramesPane />;
    case "decode": return <DecodePane />;
    case "hex": return <HexPane />;
    case "host": return <HostPane />;
    case "wifi": return <WifiPane />;
    case "bluetooth": return <BluetoothPane />;
    case "radio": return <RadioPane active={active} />;
    case "television": return <TelevisionPane active={active} />;
    case "block": return <BlockPane />;
    case "plates": return <PlatesPane />;
    case "kit": return <KitPane />;
    case "audit": return <AuditPane />;
    case "wire": return <WirePane />;
    case "market": return <MarketPane />;
    case "post": return <PostPane />;
    case "lookup": return <LookupPane />;
    case "source": return <SourcePane />;
    case "node": return <NodePane />;
    default: {
      // Compile-time check only; at runtime keep the previous NodePane fallback.
      const unhandled: never = id;
      void unhandled;
      return <NodePane />;
    }
  }
}
