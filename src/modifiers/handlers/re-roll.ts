import type { ReRollNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/**
 * `r`, `ro`: re-rolls rolls that match the compare point (the die's min by default).
 *
 * `r` repeats until the roll no longer matches (up to `ctx.limits.maxIterations`, flag `re-roll`),
 * `ro` re-rolls once (flag `re-roll-once`).
 */
export const reRollHandler: ModifierHandler<ReRollNode> = {
  name: "re-roll",
  order: 4,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("re-roll modifier");
  },
};
