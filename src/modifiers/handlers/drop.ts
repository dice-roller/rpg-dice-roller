import type { DropNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `d`, `dl`, `dh`: drops the lowest / highest `qty` items (flag `drop`). */
export const dropHandler: ModifierHandler<DropNode> = {
  name: "drop",
  order: 7,
  appliesTo: ["pool", "group"],
  apply() {
    throw new NotImplementedError("drop modifier");
  },
};
