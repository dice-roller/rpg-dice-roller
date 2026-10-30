import type { UniqueNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/**
 * `u`, `uo`: re-rolls duplicate values (optionally only those matching the compare point).
 *
 * `u` repeats until unique (up to `ctx.limits.maxIterations`, flag `unique`), `uo` re-rolls once
 * (flag `unique-once`).
 */
export const uniqueHandler: ModifierHandler<UniqueNode> = {
  name: "unique",
  order: 5,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("unique modifier");
  },
};
