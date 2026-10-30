import type { MinNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `min2`: raises rolls below the value to the value (flag `min`). */
export const minHandler: ModifierHandler<MinNode> = {
  name: "min",
  order: 1,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("min modifier");
  },
};
