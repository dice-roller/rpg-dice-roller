# `DiceRoller`

The `DiceRoller` is the main class that can roll dice, remember previous rolls and output results.

It can have multiple, independent instances, each with it's own log of dice rolls, which is handy if you're rolling for several unrelated things.

```js
// my first DiceRoller
const roller1 = new DiceRoller();

// my second DiceRoller
const roller2 = new DiceRoller();
```


## Constructor

```js
DiceRoller({{}=} data)
```

The `DiceRoller` constructor takes an _optional_ `data` argument. which should be an object containing a `log` property. The `log` property should be an array of `DiceRoll` objects:

```js
const roller = new DiceRoller({
  logs: [
    ... // a list of DiceRoll objects
  ],
});
```

This allows importing of `DiceRoll`s and is equivalent to doing:

```js
const roller = DiceRoller,import({
  logs: [
    ... // a list of DiceRoll objects
  ],
});
```


## Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const roller = new DiceRoller();
roller.roll('d6');
```

| Method                            | Description                                                  | Return                 |
| --------------------------------- | ------------------------------------------------------------ | ---------------------- |
| `clearLog()`                      | Clears the roll history log.                                 | `void`                 |
| `export({exportFormats=} format)` | Exports the `DiceRoller` object to the specified format. Throws `Error` if format is invalid | `string\|null`         |
| `import({mixed} data)`            | Imports the given data and appends it to the current roll log, returning the updated log. Throws `Error` if data type is invalid | `DiceRoll[]`           |
| `roll({String} ...notation)`      | Rolls the dice notation returning the rolls. You can pass in multiple notations (i.e `roll('d6', '2d8')`) | `DiceRoll\|DiceRoll[]` |
| `toJSON()`                        | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(roller)` | `Object`               |
| `toString()`                      | Returns a string representation of the object (See `output` property). Called automatically when the object is cast to a string (ie. `Rolled: ${diceroller}`) | `string`               |


## Properties

| Property | Type         | Description                                                  |
| -------- | ------------ | ------------------------------------------------------------ |
| `log`    | `DiceRoll[]` | A list of the current roll logs                              |
| `output` | `String`     | String representation of the object, in the format of: `2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6` |
| `total`  | `Number`     | The sum of all the rolls in the `log`                        |


## Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const diceRoller = DiceRoller.import(data);
```

| Method                 | Return       | Description                                                  |
| ---------------------- | ------------ | ------------------------------------------------------------ |
| `import({mixed} data)` | `DiceRoller` | Imports the given data and creates a new `DiceRoller` object |