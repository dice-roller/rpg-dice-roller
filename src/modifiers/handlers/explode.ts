import type { ExplodeNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/**
 * `!`, `!!`, `!p`, `!!p`: rolls another die whenever a roll matches the compare point (the die's max
 * by default), up to `ctx.limits.maxIterations` times.
 *
 * - compound (`!!`): adds the extra rolls to the original roll (flag `compound`)
 * - penetrate (`p`): subtracts 1 from each extra roll (flag `penetrate`)
 * - otherwise each extra roll is a new die result (flag `explode`)
 */
export const explodeHandler: ModifierHandler<ExplodeNode> = {
  name: "explode",
  order: 3,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("explode modifier");
  },
};
