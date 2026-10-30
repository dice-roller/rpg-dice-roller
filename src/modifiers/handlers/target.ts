import type { TargetNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/**
 * `>=8`, `>=8f<=2`: counts successes and failures.
 *
 * Items matching `success` count as `1` (flag `target-success`), items matching `failure` as `-1`
 * (flag `target-failure`), and the rest as `0` (via `calculationValue`).
 */
export const targetHandler: ModifierHandler<TargetNode> = {
  name: "target",
  order: 8,
  appliesTo: ["pool", "group"],
  apply() {
    throw new NotImplementedError("target modifier");
  },
};
