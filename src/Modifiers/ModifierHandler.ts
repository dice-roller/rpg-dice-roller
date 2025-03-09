/* eslint-disable */
import { ExpressionResult } from "../Types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../Types/Interfaces/Results/ResultCollection";
import { Modifier as IModifier } from "../Types/Interfaces/Modifiers/Modifier";
import { Modifiable } from "../Types/Interfaces/Modifiable";
import { Modifier } from "./index";

class ModifierHandler {
  apply<T extends ExpressionResult | ResultCollection>(values: T, modifiers: IModifier[], _context?: Modifiable): T {
    if (!modifiers) {
      return values;
    }

    if (!Array.isArray(modifiers) || !modifiers.every(this.isValidModifier)) {
      throw new TypeError('`modifiers` must be an array of modifiers')
    }

    return values;
  }

  isValidModifier(modifier: unknown): modifier is IModifier {
    return modifier instanceof Modifier
      || (
        !!modifier
        && typeof modifier === 'object'
        && 'apply' in (modifier as object)
        && typeof (modifier as IModifier).apply === 'function'
      );
  }
}

const handler = new ModifierHandler();

export default ModifierHandler;

export { handler };
