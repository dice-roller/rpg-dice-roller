import StandardDice from '../../src/dice/StandardDice';
import FudgeDice from '../../src/dice/FudgeDice';
import PercentileDice from '../../src/dice/PercentileDice';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentError';
import KeepModifier from '../../src/modifiers/KeepModifier';
import Modifier from '../../src/modifiers/Modifier';
import ResultGroup from '../../src/results/ResultGroup';
import RollResults from '../../src/results/RollResults';
import RollGroup from '../../src/RollGroup';
import Description from '../../src/Description';
import { ExpressionCollection } from "../../src/types/Types/ExpressionCollection";
import { DescriptionType } from "../../src/types/Enums/DescriptionType";
import { ExpressionResult } from "../../src/types/Interfaces/Results/ExpressionResult";
import { Dice } from "../../src/types/Interfaces/Dice";
import ExplodeModifier from "../../src/modifiers/ExplodeModifier";

describe('RollGroup', () => {
  let group: RollGroup;
  let expressions: ExpressionCollection[];
  let modifier: KeepModifier;

  beforeEach(() => {
    expressions = [
      [3, '+', 4],
      [new StandardDice(6, 4), '/', 2],
      [new StandardDice(10), '*', new StandardDice(20)],
    ];

    modifier = new KeepModifier();

    group = new RollGroup(expressions, [], 'a description');
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(group).toBeInstanceOf(RollGroup);

      expect(group.description).toBeInstanceOf(Description);
      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.modifiers).toEqual(new Map());
      expect(group.notation).toEqual('{3+4, 4d6/2, 1d10*1d20}');
      expect(typeof group.roll).toEqual('function');
      expect(typeof group.toJSON).toEqual('function');
      expect(typeof group.toString).toEqual('function');
    });
  });

  describe('Expressions', () => {
    describe('In constructor', () => {
      test('gets set in constructor', () => {
        const storedExpressions = group.expressions;

        expect(storedExpressions).toBeInstanceOf(Array);
        expect(storedExpressions).toHaveLength(3);
        expect(storedExpressions).toEqual(expressions);
      });

      test('setting in constructor calls setter', () => {
        const spy = jest.spyOn(RollGroup.prototype, 'expressions', 'set');

        new RollGroup(expressions);

        expect(spy).toHaveBeenCalledTimes(1);

        // remove the spy
        spy.mockRestore();
      });

      test('defaults to empty array', () => {
        group = new RollGroup();
        expect(group.expressions).toEqual([]);
      });
    });

    describe('In setter', () => {
      test('can be changed', () => {
        expressions = [[4, '/', 2]];
        group.expressions = expressions;
        expect(group.expressions).toEqual(expressions);

        expressions = [[5, '*', 7], [new StandardDice(6, 2), '+', 3]];
        group.expressions = expressions;
        expect(group.expressions).toEqual(expressions);
      });

      test('can be empty array', () => {
        group.expressions = [];
        expect(group.expressions).toEqual([]);
      });

      test('must be array', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = 'foo';
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = {};
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = 1;
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = 4536;
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = true;
        }).toThrow(TypeError);
      });

      test('cannot be falsey', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = 0;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = false;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = null;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = undefined;
        }).toThrow(RequiredArgumentError);
      });
    });

    describe('Sub-expressions', () => {
      test('must be array', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = ['foo'];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [{}];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [45];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [false];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [null];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [undefined];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [0];
        }).toThrow(TypeError);
      });

      test('items cannot be empty / falsey', () => {
        expect(() => {
          group.expressions = [[], [], []];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [[false]];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [[null]];
        }).toThrow(TypeError);

        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [[undefined]];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [[]];
        }).toThrow(TypeError);
      });

      test('items can be Dice', () => {
        const dice = [
          new StandardDice(6, 10),
          new PercentileDice(4),
          new FudgeDice(),
        ];

        group.expressions = [
          [dice[0] as Dice],
          [dice[1] as Dice],
          [dice[2] as Dice],
        ];

        expect(group.expressions).toEqual([
          [dice[0]],
          [dice[1]],
          [dice[2]]
        ]);
      });

      test('items can be number', () => {
        group.expressions = [[4], [7], [346346], [-338.6]];
        expect(group.expressions).toEqual([[4], [7], [346346], [-338.6]]);
      });

      test('items can be string', () => {
        group.expressions = [['('], ['-'], ['+'], ['/']];
        expect(group.expressions).toEqual([['('], ['-'], ['+'], ['/']]);
      });

      test('items can be a mix', () => {
        group.expressions = [
          [4, '+', new StandardDice(6)],
          [new PercentileDice(6), '/', 2],
        ];

        expect(group.expressions).toEqual([
          [4, '+', new StandardDice(6)],
          [new PercentileDice(6), '/', 2],
        ]);
      });

      test('invalid items throw error', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          group.expressions = [[{}]];
        }).toThrow(TypeError);
      });
    });
  });

  describe('Modifiers', () => {
    let modifiers: Map<string, Modifier>|Modifier[];

    beforeEach(() => {
      modifiers = new Map(Object.entries({ foo: modifier }));
    });

    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(RollGroup.prototype, 'modifiers', 'set');

      new RollGroup([], modifiers);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(modifiers);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      group.modifiers = modifiers;

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      group.modifiers = { foo: modifier };

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      modifiers = [modifier];

      group.modifiers = modifiers;

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.has(modifier.name));
      expect(group.modifiers.get(modifier.name)).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], 351);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        modifiers = new Map(Object.entries({ foo: 'bar' }));
        new RollGroup([], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        modifiers = { foo: 'bar' };
        new RollGroup([], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        modifiers = ['bar'];
        new RollGroup([], modifiers);
      }).toThrow(TypeError);
    });

    test('modifiers list always returns in correct order', () => {
      // create modifiers and define their order
      const mod1 = new ExplodeModifier();
      mod1.order = 4;
      const mod2 = new ExplodeModifier();
      mod2.order = 3;
      const mod3 = new ExplodeModifier();
      mod3.order = 1;
      const mod4 = new ExplodeModifier();
      mod4.order = 2;

      // create the dice instance
      group = new RollGroup([]);

      group.modifiers = {
        mod1,
        mod2,
        mod3,
        mod4,
      };

      // get the modifier keys
      const modKeys = [...group.modifiers.keys()];
      // check that the order matches the defined modifier orders
      expect(modKeys[0]).toEqual('mod3');
      expect(modKeys[1]).toEqual('mod4');
      expect(modKeys[2]).toEqual('mod2');
      expect(modKeys[3]).toEqual('mod1');
    });
  });

  describe('Notation', () => {
    test('single sub-roll with no modifiers', () => {
      group = new RollGroup([[4, '/', 2]]);

      expect(group.notation).toEqual('{4/2}');
    });

    test('single sub-roll with modifiers', () => {
      group = new RollGroup([[4, '/', 2]], new Map(Object.entries({ keep: modifier })));

      expect(group.notation).toEqual('{4/2}kh1');
    });

    test('multiple sub-rolls with no modifiers', () => {
      expect(group.notation).toEqual('{3+4, 4d6/2, 1d10*1d20}');
    });

    test('multiple sub-rolls with modifiers', () => {
      group.modifiers = new Map(Object.entries({ explode: modifier }));

      expect(group.notation).toEqual('{3+4, 4d6/2, 1d10*1d20}kh1');
    });
  });

  describe('Description', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(RollGroup.prototype, 'description', 'set');
      const description = 'A test description';

      new RollGroup([], [], description);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(description);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual('a description');
      expect(group.description?.type).toEqual(DescriptionType.Inline);

      group.description = 'foo';
      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual('foo');

      group.description = 'baz bar';
      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual('baz bar');

      group.description = new Description('foo bar', DescriptionType.MultiLine);
      expect(group.description).toBeInstanceOf(Description);
      expect(group.description.text).toEqual('foo bar');
      expect(group.description.type).toEqual(DescriptionType.MultiLine);
    });

    test('setting to falsey get set to `null`', () => {
      group.description = null;
      expect(group.description).toEqual(null);

      group.description = undefined;
      expect(group.description).toEqual(null);

      // @ts-expect-error testing falsey value
      group.description = false;
      expect(group.description).toEqual(null);
    });

    test('throws error if type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], [], 0);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], [], 156);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], [], 4.3);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], [], { foo: 'bar' });
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new RollGroup([], [], ['bar']);
      }).toThrow(TypeError);
    });
  });

  describe('Roll', () => {
    test('Returns a `ResultGroup` object', () => {
      expect(group.roll()).toBeInstanceOf(ResultGroup);
    });

    test('Returns correct results with single sub-roll', () => {
      const results = new RollResults([87, 14, 37, 98, 57]);

      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => results);

      group.expressions = [[new PercentileDice(5), '/', 2]];

      const rolls = group.roll();

      expect(rolls).toBeInstanceOf(ResultGroup);
      expect(rolls).toHaveLength(1);

      const result = rolls.results[0] as ExpressionResult;
      expect(result).toBeInstanceOf(ResultGroup);
      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([results, '/', 2]);
      expect(result.modifiers).toEqual(new Set());

      jest.restoreAllMocks();
    });

    test('Returns correct results with multiple sub-rolls', () => {
      const results = [
        new RollResults([4, 3, 6, 1]),
        new RollResults([8]),
        new RollResults([16]),
      ];

      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => results[0] as RollResults)
        .mockImplementationOnce(() => results[1] as RollResults)
        .mockImplementationOnce(() => results[2] as RollResults);

      const rolls = group.roll();

      expect(rolls).toBeInstanceOf(ResultGroup);
      expect(rolls).toHaveLength(3);

      let result = rolls.results[0] as ExpressionResult;
      expect(result).toBeInstanceOf(ResultGroup);
      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([3, '+', 4]);
      expect(result.modifiers).toEqual(new Set());

      result = rolls.results[1] as ExpressionResult;
      expect(result).toBeInstanceOf(ResultGroup);
      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([results[0], '/', 2]);
      expect(result.modifiers).toEqual(new Set());

      result = rolls.results[2] as ExpressionResult;
      expect(result).toBeInstanceOf(ResultGroup);
      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([results[1], '*', results[2]]);
      expect(result.modifiers).toEqual(new Set());

      jest.restoreAllMocks();
    });
  });

  describe('Output', () => {
    describe('With single-line description', () => {
      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(group))).toEqual({
          description: {
            text: 'a description',
            type: DescriptionType.Inline,
          },
          expressions: [
            [3, '+', 4],
            [
              expect.objectContaining({
                sides: 6,
                qty: 4,
              }),
              '/',
              2,
            ],
            [
              expect.objectContaining({
                sides: 10,
                qty: 1,
              }),
              '*',
              expect.objectContaining({
                sides: 20,
                qty: 1,
              }),
            ],
          ],
          modifiers: {},
          name: 'roll-group',
          notation: '{3+4, 4d6/2, 1d10*1d20}',
          type: 'group',
        });
      });

      test('String output is correct', () => {
        expect(group.toString()).toEqual('{3+4, 4d6/2, 1d10*1d20} # a description');
      });
    });

    describe('With multi-line description', () => {
      test('JSON output is correct', () => {
        (group.description as Description).type = DescriptionType.MultiLine;

        expect(JSON.parse(JSON.stringify(group))).toEqual({
          description: {
            text: 'a description',
            type: DescriptionType.MultiLine,
          },
          expressions: [
            [3, '+', 4],
            [
              expect.objectContaining({
                sides: 6,
                qty: 4,
              }),
              '/',
              2,
            ],
            [
              expect.objectContaining({
                sides: 10,
                qty: 1,
              }),
              '*',
              expect.objectContaining({
                sides: 20,
                qty: 1,
              }),
            ],
          ],
          modifiers: {},
          name: 'roll-group',
          notation: '{3+4, 4d6/2, 1d10*1d20}',
          type: 'group',
        });
      });

      test('String output is correct', () => {
        (group.description as Description).type = DescriptionType.MultiLine;

        expect(group.toString()).toEqual('{3+4, 4d6/2, 1d10*1d20} [a description]');
      });
    });

    describe('Without description', () => {
      test('JSON output is correct', () => {
        group.description = null;

        expect(JSON.parse(JSON.stringify(group))).toEqual({
          description: null,
          expressions: [
            [3, '+', 4],
            [
              expect.objectContaining({
                sides: 6,
                qty: 4,
              }),
              '/',
              2,
            ],
            [
              expect.objectContaining({
                sides: 10,
                qty: 1,
              }),
              '*',
              expect.objectContaining({
                sides: 20,
                qty: 1,
              }),
            ],
          ],
          modifiers: {},
          name: 'roll-group',
          notation: '{3+4, 4d6/2, 1d10*1d20}',
          type: 'group',
        });
      });

      test('String output is correct', () => {
        group.description = null;

        expect(group.toString()).toEqual('{3+4, 4d6/2, 1d10*1d20}');
      });
    });
  });
});
