import type { KeepNode } from "../../ast/nodes.js";
import type { ModifierHandler } from "../types.js";
import { dropAt, indexesByValue } from "./utils.js";

/**
 * `k`, `kh`, `kl`: keeps the highest / lowest `qty` items, and drops the rest (flag `drop`).
 *
 * Like drop, it looks at every item, including those already dropped, so keep and drop can
 * override each other (`3d10k1dh1` drops every roll). Of two equal items, the earlier counts as
 * the lower one. Keeping more items than there are keeps them all.
 *
 * On a group with a single expression it keeps dice from every pool in it; otherwise it keeps
 * members by their totals.
 */
export const keepHandler: ModifierHandler<KeepNode> = {
  name: "keep",
  order: 6,
  appliesTo: ["pool", "group"],
  groupHandling: "flatten",
  apply(items, { modifier }) {
    const ascending = indexesByValue(items);
    const kept = Math.min(modifier.qty, items.length);

    return dropAt(
      items,
      modifier.end === "h"
        ? ascending.slice(0, items.length - kept)
        : ascending.slice(kept),
    );
  },
};
