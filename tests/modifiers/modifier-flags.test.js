import getModifierFlags from '../../src/modifiers/modifier-flags';
import ExplodeModifier from '../../src/modifiers/ExplodeModifier.ts';

describe('Modifier flags', () => {
  test('returns a string', () => {
    const flags = getModifierFlags('explode');

    expect(typeof flags === 'string').toBe(true);
    expect(flags.length).toBeGreaterThanOrEqual(1);
  });

  test('returns modifier name if flag not found', () => {
    expect(getModifierFlags('foo')).toEqual('foo');
  });

  test('combined multiple flags', () => {
    const flag1 = getModifierFlags('explode');
    const flag2 = getModifierFlags('drop');

    expect(getModifierFlags('explode', 'drop')).toEqual(`${flag1}${flag2}`);
  });

  test('uses modifier name', () => {
    const flags = getModifierFlags(new ExplodeModifier());

    expect(typeof flags === 'string').toBe(true);
    expect(flags.length).toBeGreaterThanOrEqual(1);

    expect(flags).toEqual(getModifierFlags('explode'));
  });
});
