// eslint-disable-next-line import/no-cycle
import Modifier from './Modifier.js';

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
const getModifierFlags = (...modifiers) => (
  // @todo need a better way of mapping modifiers to symbols
  [...modifiers].reduce((acc, modifier) => {
    let name;

    if (modifier instanceof Modifier) {
      name = modifier.name;
    } else {
      name = modifier;
    }

    return acc + (flags[name] || name);
  }, '')
);

export default getModifierFlags;
