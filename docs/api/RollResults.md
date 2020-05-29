# `RollResults`

The `RollResults` object contains a collection of `RollResult` objects.

_You will probably not need to create your own `RollResults` instances, unless you're importing rolls, but `RollResults` objects will be returned when rolling dice._


## Constructor

```js
/**
 * @param {RollResult[]=} rolls Optional The rolls
 */
RollResults({RollResult[]=} rolls)
```

The constructor takes an optional rolls argument, which should be a collection of `RollResult` objects.

You can create a `RollResults` object without any rolls, and pass them in afterwards.


## Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const results = new RollResults();
results.toJSON();
```

| Method       | Description                                                  | Return   |
| ------------ | ------------------------------------------------------------ | -------- |
| `toJSON()`   | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(results)` | `Object` |
| `toString()` | Returns a string representation of the object. Called automatically when the object is cast to a string (ie. `Results: ${results}`) | `string` |


## Properties

| Property | Type           | Description                      |
| -------- | -------------- | -------------------------------- |
| `length` | `number`       | The number of rolls              |
| `rolls`  | `RollResult[]` | The rolls                        |
| `value`  | `number`       | The total value of all the rolls |