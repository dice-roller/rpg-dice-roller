import type { SortNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `s`, `sa`, `sd`: sorts the items by value, ascending or descending. */
export const sortHandler: ModifierHandler<SortNode> = {
  name: "sort",
  order: 11,
  appliesTo: ["pool", "group"],
  apply() {
    throw new NotImplementedError("sort modifier");
  },
};
