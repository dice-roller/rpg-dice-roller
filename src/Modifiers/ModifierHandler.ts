import { ExpressionResult } from "../Types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../Types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../Types/Interfaces/Modifiable";
import { Modifier } from "./index";
import { CanModify } from "../Types/Interfaces/CanModify";

class ModifierHandler {
  run<T extends ExpressionResult | ResultCollection>(values: T, modifiers: CanModify[], context?: Modifiable): T {
    if (!modifiers as unknown) {
      return values;
    }

    if (!Array.isArray(modifiers) || !modifiers.every((modifier) => this.isValidModifier(modifier))) {
      throw new TypeError('`modifiers` must be an array of modifiers')
    }

    let result = values;
    modifiers
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((modifier) => {
        result = modifier.run(result, context);
      });

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  isValidModifier(modifier: unknown): modifier is CanModify {
    return modifier instanceof Modifier
      || (
        !!modifier
        && typeof modifier === 'object'
        && 'run' in modifier
        && typeof (modifier as CanModify).run === 'function'
      );
  }
}

const handler = new ModifierHandler();

export default ModifierHandler;

export { handler };
