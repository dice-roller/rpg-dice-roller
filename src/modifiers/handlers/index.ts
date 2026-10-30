import type { ModifierHandler } from "../types.js";
import { criticalFailureHandler } from "./critical-failure.js";
import { criticalSuccessHandler } from "./critical-success.js";
import { dropHandler } from "./drop.js";
import { explodeHandler } from "./explode.js";
import { keepHandler } from "./keep.js";
import { maxHandler } from "./max.js";
import { minHandler } from "./min.js";
import { reRollHandler } from "./re-roll.js";
import { sortHandler } from "./sort.js";
import { targetHandler } from "./target.js";
import { uniqueHandler } from "./unique.js";

export {
  criticalFailureHandler,
  criticalSuccessHandler,
  dropHandler,
  explodeHandler,
  keepHandler,
  maxHandler,
  minHandler,
  reRollHandler,
  sortHandler,
  targetHandler,
  uniqueHandler,
};

/** The built-in handlers, in execution order. */
export const builtInModifierHandlers: readonly ModifierHandler[] = [
  minHandler,
  maxHandler,
  explodeHandler,
  reRollHandler,
  uniqueHandler,
  keepHandler,
  dropHandler,
  targetHandler,
  criticalSuccessHandler,
  criticalFailureHandler,
  sortHandler,
];
