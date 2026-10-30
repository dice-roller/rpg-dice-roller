import type { CriticalFailureNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `cf`, `cf<3`: flags rolls matching the compare point (the die's min by default) as `critical-failure`. */
export const criticalFailureHandler: ModifierHandler<CriticalFailureNode> = {
  name: "critical-failure",
  order: 10,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("critical-failure modifier");
  },
};
