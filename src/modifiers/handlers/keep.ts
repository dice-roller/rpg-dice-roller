import type { KeepNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `k`, `kh`, `kl`: keeps the highest / lowest `qty` items, and drops the rest (flag `drop`). */
export const keepHandler: ModifierHandler<KeepNode> = {
  name: "keep",
  order: 6,
  appliesTo: ["pool", "group"],
  apply() {
    throw new NotImplementedError("keep modifier");
  },
};
