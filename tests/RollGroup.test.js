import StandardDice from '../src/dice/StandardDice.js';
import FudgeDice from '../src/dice/FudgeDice.js';
import PercentileDice from '../src/dice/PercentileDice.js';
import RequiredArgumentError from '../src/exceptions/RequiredArgumentError.js';
import KeepModifier from '../src/modifiers/KeepModifier.js';
import Modifier from '../src/modifiers/Modifier.js';
import ResultGroup from '../src/results/ResultGroup.js';
import RollResults from '../src/results/RollResults.js';
import RollGroup from '../src/RollGroup.js';

describe('RollGroup', () => {
  let group;
  let expressions;
  let modifier;

  beforeEach(() => {
    expressions = [
      [3, '+', 4],
      [new StandardDice(6, 4), '/', 2],
      [new StandardDice(10), '*', new StandardDice(20)],
    ];

    modifier = new KeepModifier();

    group = new RollGroup(expressions);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.modifiers).toEqual(new Map());
      expect(group.notation).toEqual('{3+4, 4d6/2, 1d10*1d20}');
      expect(group.roll).toBeInstanceOf(Function);
      expect(group.toJSON).toBeInstanceOf(Function);
      expect(group.toString).toBeInstanceOf(Function);
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
          group.expressions = 'foo';
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = {};
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = 1;
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = 4536;
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = true;
        }).toThrow(TypeError);
      });

      test('cannot be falsey', () => {
        expect(() => {
          group.expressions = 0;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          group.expressions = false;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          group.expressions = null;
        }).toThrow(RequiredArgumentError);

        expect(() => {
          group.expressions = undefined;
        }).toThrow(RequiredArgumentError);
      });
    });

    describe('Sub-expressions', () => {
      test('must be array', () => {
        expect(() => {
          group.expressions = ['foo'];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [{}];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [45];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [false];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [null];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [undefined];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [0];
        }).toThrow(TypeError);
      });

      test('items cannot be empty / falsey', () => {
        expect(() => {
          group.expressions = [[], [], []];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [[false]];
        }).toThrow(TypeError);

        expect(() => {
          group.expressions = [[null]];
        }).toThrow(TypeError);

        expect(() => {
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

        group.expressions = [[dice[0]], [dice[1]], [dice[2]]];
        expect(group.expressions).toEqual([[dice[0]], [dice[1]], [dice[2]]]);
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
          group.expressions = [[{}]];
        }).toThrow(TypeError);
      });
    });
  });

  describe('Modifiers', () => {
    let modifiers;

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
      expect(group.modifiers.has('keep-h'));
      expect(group.modifiers.get('keep-h')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        new RollGroup([], 'foo');
      }).toThrow(TypeError);

      expect(() => {
        new RollGroup([], 351);
      }).toThrow(TypeError);

      expect(() => {
        modifiers = new Map(Object.entries({ foo: 'bar' }));
        new RollGroup([], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        modifiers = { foo: 'bar' };
        new RollGroup([], modifiers);
      }).toThrow(TypeError);

      expect(() => {
        modifiers = ['bar'];
        new RollGroup([], modifiers);
      }).toThrow(TypeError);
    });

    test('modifiers list always returns in correct order', () => {
      // create modifiers and define their order
      const mod1 = new Modifier('m1');
      mod1.order = 4;
      const mod2 = new Modifier('m2');
      mod2.order = 3;
      const mod3 = new Modifier('m3');
      mod3.order = 1;
      const mod4 = new Modifier('m4');
      mod4.order = 2;

      // create the dice instance
      group = new RollGroup([]);

      group.modifiers = {
        mod1, mod2, mod3, mod4,
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

      expect(rolls.results[0]).toBeInstanceOf(ResultGroup);
      expect(rolls.results[0].results).toHaveLength(3);
      expect(rolls.results[0].results).toEqual([results, '/', 2]);
      expect(rolls.results[0].modifiers).toEqual(new Set());

      jest.restoreAllMocks();
    });

    test('Returns correct results with multiple sub-rolls', () => {
      const results = [
        new RollResults([4, 3, 6, 1]),
        new RollResults([8]),
        new RollResults([16]),
      ];

      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => results[0])
        .mockImplementationOnce(() => results[1])
        .mockImplementationOnce(() => results[2]);

      const rolls = group.roll();

      expect(rolls).toBeInstanceOf(ResultGroup);
      expect(rolls).toHaveLength(3);

      expect(rolls.results[0]).toBeInstanceOf(ResultGroup);
      expect(rolls.results[0].results).toHaveLength(3);
      expect(rolls.results[0].results).toEqual([3, '+', 4]);
      expect(rolls.results[0].modifiers).toEqual(new Set());

      expect(rolls.results[1]).toBeInstanceOf(ResultGroup);
      expect(rolls.results[1].results).toHaveLength(3);
      expect(rolls.results[1].results).toEqual([results[0], '/', 2]);
      expect(rolls.results[1].modifiers).toEqual(new Set());

      expect(rolls.results[2]).toBeInstanceOf(ResultGroup);
      expect(rolls.results[2].results).toHaveLength(3);
      expect(rolls.results[2].results).toEqual([results[1], '*', results[2]]);
      expect(rolls.results[2].modifiers).toEqual(new Set());

      jest.restoreAllMocks();
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(group))).toEqual({
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
        notation: '{3+4, 4d6/2, 1d10*1d20}',
        type: 'group',
      });
    });

    test('String output is correct', () => {
      expect(group.toString()).toEqual('{3+4, 4d6/2, 1d10*1d20}');
    });
  });
});
