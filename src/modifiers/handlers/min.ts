import type { MinNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ModifierHandler } from "../types.js";

/** `min2`: raises rolls below the value to the value (flag `min`). */
export const minHandler: ModifierHandler<MinNode> = {
  name: "min",
  order: 1,
  appliesTo: ["pool"],
  apply(items, { modifier }) {
    return items.map((item) =>
      item.value < modifier.value
        ? withFlags(withValue(item, modifier.value), "min")
        : item,
    );
  },
};
