import { create } from "zustand";

export const PLATES = [
  { id: "field", title: "Field", src: "/field-plate.jpg" },
  { id: "admin", title: "Admin", src: "/art-admin.jpg" },
  { id: "viz", title: "Visualizer", src: "/viz-bg.jpg" },
  { id: "mast", title: "Mast", src: "/plates/mast.jpg" },
  { id: "tree", title: "Tree", src: "/plates/tree.jpg" },
  { id: "pipe", title: "Pipe", src: "/plates/pipe.jpg" },
  { id: "console", title: "Console", src: "/plates/console.jpg" },
] as const;

type PlateState = { id: string; src: string; setPlate: (id: string) => void };

export const usePlates = create<PlateState>((set) => ({
  id: "field",
  src: "/field-plate.jpg",
  setPlate: (id) => {
    const plate = PLATES.find((item) => item.id === id) ?? PLATES[0];
    set({ id: plate.id, src: plate.src });
  },
}));
