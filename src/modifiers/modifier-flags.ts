import { Modifier } from "../types/Interfaces/Modifiers/Modifier";

// @todo if we're keeping this functionality, possibly move to an enum
const flags = {
  compound: '!',
  explode: '!',
  'critical-failure': '__',
  'critical-success': '**',
  drop: 'd',
  max: 'v',
  min: '^',
  penetrate: 'p',
  're-roll': 'r',
  're-roll-once': 'ro',
  'target-failure': '_',
  'target-success': '*',
  unique: 'u',
  'unique-once': 'uo',
};

/**
 * Return the flags for the given list of modifiers
 *
 * @param {...Modifier|string} modifiers
 *
 * @returns {string}
 */
const getModifierFlags = (...modifiers: Modifier[]|string[]): string => (
  // @todo need a better way of mapping modifiers to symbols
  [...modifiers].reduce((acc, modifier) => {
    let name: string;

    if (typeof modifier === 'string') {
      name = modifier;
    } else {
      name = modifier.name;
    }

    return `${acc}${(flags[name as keyof typeof flags]) || name}`;
  }, '') as string
);

export default getModifierFlags;
