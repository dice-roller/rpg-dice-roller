import { ResultCollection } from "../Types/Interfaces/Results/ResultCollection";
import { SingleResult } from "../Types/Interfaces/Results/SingleResult";
import { RequiredArgumentError } from "../Exceptions";
import RollResult from "../Results/RollResult";
import { generator } from "../NumberGenerator";
import { RollResults } from "../Results";
import { Rollable } from "../Types/Interfaces/Rollable";
import { handler as modifierHandler } from "../Modifiers/ModifierHandler";
import { Modifiable } from "../Types/Interfaces/Modifiable";

class RollEngine {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #findWeightMatch(table: { value: number, weight: number }[], weight: number): number {
    let cumulativeWeight = 0;

    for (const entry of table) {
      cumulativeWeight += entry.weight;

      if (weight <= cumulativeWeight) {
        return entry.value;
      }
    }

    return table[table.length - 1]?.value as number;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #normaliseTable(table: Rollable['rollTable']): { value: number, weight: number }[] {
    return (table ?? []).map(
      (entry) => (typeof entry === 'object')
        ? {
          value: entry.value,
          weight: entry.weight ?? 1,
        }
        : { value: entry, weight: 1 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  buildTable(min: number, max?: number): { value: number, weight: number }[] {
    return Array.from(
      { length: (max ?? min) - min + 1 },
      (_, i) => ({
        value: i + min,
        weight: 1,
      })
    );
  }

  roll(rollable: Rollable, times: number = 1): ResultCollection {
    if (!(rollable as unknown)) {
      throw new RequiredArgumentError('rollable');
    }

    // create a result object to hold the rolls
    const results = new RollResults();
    for (let i = 0; i < ((times as unknown) ?? 1); i++) {
      results.addRoll(this.rollOnce(rollable));
    }

    if ('modifiers' in rollable) {
      return modifierHandler.run(
        results,
        [...rollable.modifiers?.values() ?? []],
        rollable as Modifiable
      );
    }

    return results;
  }

  rollOnce(rollable: Rollable): SingleResult {
    if (!(rollable as unknown)) {
      throw new RequiredArgumentError('dice');
    }

    let rollTable;
    if (Array.isArray(rollable.rollTable) && rollable.rollTable.length > 0) {
      rollTable = this.#normaliseTable(rollable.rollTable);
    } else if (rollable.min !== undefined && rollable.max !== undefined) {
      rollTable = this.buildTable(rollable.min, rollable.max);
    } else {
      throw new TypeError('Min and Max are required');
    }

    if (rollTable.some((entry) => entry.weight < 0)) {
      throw new RangeError('All weights must be non-negative');
    }

    const totalWeight = rollTable.reduce((sum, entry) => sum + entry.weight, 0);

    if (totalWeight === 0) {
      throw new RangeError('Total weight must be greater than 0');
    }

    console.log('test integer', generator.integer(0, 8));

    const randomWeight = generator.real(0, totalWeight, true);

    return new RollResult(this.#findWeightMatch(rollTable, randomWeight));
  }
}

const rollEngine = new RollEngine();

export default RollEngine;

export {
  rollEngine,
}
