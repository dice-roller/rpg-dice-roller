import type { CriticalSuccessNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `cs`, `cs>18`: flags rolls matching the compare point (the die's max by default) as `critical-success`. */
export const criticalSuccessHandler: ModifierHandler<CriticalSuccessNode> = {
  name: "critical-success",
  order: 9,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("critical-success modifier");
  },
};
