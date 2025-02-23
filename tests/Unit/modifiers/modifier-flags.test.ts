import { flags as modifierFlags, getModifierFlags } from '../../../src/modifiers/modifier-flags';
import { ReRollModifier } from "../../../src/modifiers";

describe('Modifier flags', () => {
  test('returns a string', () => {
    const flags = getModifierFlags('explode');

    expect(typeof flags === 'string').toBe(true);
    expect(flags).toEqual(modifierFlags.explode);
  });

  test('returns modifier name if flag not found', () => {
    expect(getModifierFlags('foo')).toEqual('foo');
  });

  test('combined multiple flags', () => {
    const flags = {
      explode: getModifierFlags('explode'),
      drop: getModifierFlags('drop'),
    };
    const combinedFlags = getModifierFlags(...Object.keys(flags));

    Object.entries(flags).forEach(([key, flag]) => {
      expect(flag).toEqual(modifierFlags[key as keyof typeof modifierFlags]);
    })

    expect(combinedFlags).toEqual(Object.values(flags).join(''));
  });

  test('uses modifier name', () => {
    const flags = getModifierFlags(new ReRollModifier());

    expect(typeof flags === 'string').toBe(true);
    expect(flags).toEqual(modifierFlags['re-roll']);
    expect(flags).toEqual(getModifierFlags('re-roll'));
  });
});
