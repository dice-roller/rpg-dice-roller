import type { MaxNode } from "../../ast/nodes.js";
import { NotImplementedError } from "../../errors/NotImplementedError.js";
import type { ModifierHandler } from "../types.js";

/** `max5`: lowers rolls above the value to the value (flag `max`). */
export const maxHandler: ModifierHandler<MaxNode> = {
  name: "max",
  order: 2,
  appliesTo: ["pool"],
  apply() {
    throw new NotImplementedError("max modifier");
  },
};
