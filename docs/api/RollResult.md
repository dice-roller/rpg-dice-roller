# `RollResult`

A `Rollresult` object holds the roll value and active modifiers for a single die roll.

_You will probably not need to create your own `RollResult` instances, unless you're importing rolls, but `RollResult` objects will be returned when rolling dice._


## Constructor

```js
/**
 * @param {number|{value: Number, initialValue: number}} value The value rolled
 * @param {string[]|Set<string>=} modifiers Optional List of modifier names that affect this roll
 * @param {boolean=} useInTotal Optional Whether to include the roll value when calculating totals
 */
RollResult({number|{value: Number, initialValue: number}} value, {string[]|Set<string>=} modifiers, {boolean} useInTotal = true)
```

The `RollResult` constructor requires a `value`. This is usually a number and defines the roll value.

The `modifiers` argument is optional. If defined, it should be a list of modifier attribute names that have affected this rolls (ie. `explode`, `drop`, `critical-succes`). This is used mainly for flagging rolls visually.

```js
// a roll of 10, which is a critical success and should be re-rolled
const result1 = new RollResult(10, ['critical-success', 're-roll']);
// or a Set
const result2 = new RollResult(10, new Set(['critical-success', 're-roll']);

// a roll of 3 that should be dropped (To stop a dropped roll being included in total calculations, `useInTotal` must be set to false)
const result3 = new RollResult(3, ['drop'], false);
```


## Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const result = new RollResult(20);
result.toJSON();
```

| Method       | Description                                                  | Return   |
| ------------ | ------------------------------------------------------------ | -------- |
| `toJSON()`   | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(result)` | `Object` |
| `toString()` | Returns a string representation of the object. Called automatically when the object is cast to a string (ie. `Rolled: ${result}`) | `string` |


## Properties

| Property           | Type          | Description                                                  |
| ------------------ | ------------- | ------------------------------------------------------------ |
| `calculationValue` | `number`      | The roll value to use in calculations. This may be changed by modifiers |
| `initialValue`     | `number`      | The initial value passed to the constructor. This is not usually used and is mainly for reference |
| `modifierFlags`    | `string`      | The visual flags that get appended to the value when outputting as a string |
| `modifiers`        | `Set<string>` | A list of modifier attribute names that affect the roll      |
| `useInTotal`       | `boolean`     | Whether the value should be used when calculation roll totals |
| `value`            | `number`      | The current value to display visually. This may be changed by modifiers. This is separate from the `calculationValue` so that you can display one value, and use another in calculations |