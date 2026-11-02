import type { MaxNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ModifierHandler } from "../types.js";

/** `max5`: lowers rolls above the value to the value (flag `max`). */
export const maxHandler: ModifierHandler<MaxNode> = {
  name: "max",
  order: 2,
  appliesTo: ["pool"],
  apply(items, { modifier }) {
    return items.map((item) =>
      item.value > modifier.value
        ? withFlags(withValue(item, modifier.value), "max")
        : item,
    );
  },
};
