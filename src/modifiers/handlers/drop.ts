import type { DropNode } from "../../ast/nodes.js";
import type { ModifierHandler } from "../types.js";
import { dropAt, indexesByValue } from "./utils.js";

/**
 * `d`, `dl`, `dh`: drops the lowest / highest `qty` items (flag `drop`).
 * `d` defaults to lowest.
 *
 * Like keep, it looks at every item, including those already dropped. Of two equal items, the
 * earlier counts as the lower one. Dropping more items than there are drops them all.
 *
 * On a group with a single expression it drops dice from every pool in it; otherwise it drops
 * members by their totals.
 */
export const dropHandler: ModifierHandler<DropNode> = {
  name: "drop",
  order: 7,
  appliesTo: ["pool", "group"],
  groupHandling: "flatten",
  apply(items, { modifier }) {
    const ascending = indexesByValue(items);
    const dropped = Math.min(modifier.qty, items.length);

    return dropAt(
      items,
      modifier.end === "h"
        ? ascending.slice(items.length - dropped)
        : ascending.slice(0, dropped),
    );
  },
};
