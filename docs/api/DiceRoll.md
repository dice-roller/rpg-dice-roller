# `DiceRoll`

The `DiceRoll` does the actual rolling and holds the results. You can call this directly, bypassing the `DiceRoller` object, if you don't need to retain roll logs.


## Constructor

```js
/**
 * @param {string|object} notation The dice notation to parse and roll
 */
DiceRoll({string|object} notation)
```

A `DiceRoll` object requires a dice notation, which it parses into rolls:

```js
const roll = new DiceRoll('4d10');
```

Or it can be an object containing a `notation` and `rolls` to import:

```js
const roll = new DiceRoll({
  notation: '4d6',
  rolls: ..., // RollResults object or array of roll results
});

// which is equivalent to doing:
const roll = DiceRoll.import({
  notation: '4d6',
  rolls: ..., // RollResults object or array of roll results
});
```

If the notation is missing or invalid an error will be thrown

## Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const roll = new DiceRoll('d6');
roll.export();
```

| Method                            | Description                                                  | Return         |
| --------------------------------- | ------------------------------------------------------------ | -------------- |
| `export({exportFormats=} format)` | Exports the `DiceRoll` in the specified format. Throws `Error` if format is invalid | `string\|null` |
| `hasRolls()`                      | Returns whether the object has rolled dice or not            | `boolean`      |
| `rolls()`                         | Rolls the dice for the existing notation and returns the results. Useful if you want to re-roll the dice, but usually better to create a new `DiceRoll` instance instead | `[]`           |
| `toJSON()`                        | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(diceroll)` | `Object`       |
| `toString()`                      | Returns a string representation of the object (See `output` property). Called automatically when the object is cast to a string (ie. `Rolled: ${diceroll}`) | `string`       |


## Properties

| Property   | Type            | Description                                                  |
| ---------- | --------------- | ------------------------------------------------------------ |
| `notation` | `String`        | The dice notation                                            |
| `output`   | `String`        | The roll notation and rolls in the format of: `2d20+1d6: [20,2]+[2] = 24`. |
| `rolls`    | `RollResults[]` | The dice rolled for the notation                             |
| `total`    | `Number`        | The roll total                                               |


## Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const diceRoll = DiceRoll.import(data);
```

| Method                                | Description                                        | Return     |
| ------------------------------------- | -------------------------------------------------- | ---------- |
| `import({{}\|string\|DiceRoll} data)` | Imports the given data and creates a new dice roll | `DiceRoll` |

