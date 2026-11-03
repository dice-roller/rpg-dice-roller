import type { SortNode } from "../../ast/nodes.js";
import type { ModifierHandler } from "../types.js";
import { compareValues } from "./utils.js";

/**
 * `s`, `sa`, `sd`: sorts the items by value, ascending or descending. `s` defaults to ascending.
 *
 * The sort is stable, so items with the same value keep their order. On a group, the members are
 * sorted by their totals, and the dice within each pool are sorted too.
 */
export const sortHandler: ModifierHandler<SortNode> = {
  name: "sort",
  order: 11,
  appliesTo: ["pool", "group"],
  groupHandling: "each-pool",
  apply(items, { modifier }) {
    const direction = modifier.direction === "d" ? -1 : 1;

    return [...items].sort(
      (a, b) => compareValues(a.value, b.value) * direction,
    );
  },
};
