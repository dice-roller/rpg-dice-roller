# `ComparePoint`

The `ComparePoint` object can check if a number matches a particular test. For example, is `numberA` greater than `3`, or is `numberB` equal to `10`.


## Constructor

```js
/**
 * @param {string} operator The compare operator (ie. '=')
 * @param {number} value The compare value (ie. `7`)
 */ 
ComparePoint({string} operator, {number} value)
```

A `ComparePoint` instance requires an `operator` and `value` passed to the constructor:

```js
// create a ComparePoint that checks if numbers are equal to 6
const cp = new ComparePoint('=', 6);
```

If either of these is missing or invalid an error will be thrown.


## Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
// create a ComparePoint that checks if numbers are NOT equal to 2
const cp = new ComparePoint('!=', 2);
cp.isMatch(4); // returns true
```

| Method                    | Description                                                  | Return    |
| ------------------------- | ------------------------------------------------------------ | --------- |
| `isMatch({Number} value)` | Checks whether value matches the compare point               | `boolean` |
| `toJSON()`                | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(cp)` | `Object`  |
| `toString()`              | Returns a string representation of the object. Called automatically when the object is cast to a string (ie. `CP: ${cp}`) | `string`  |


## Properties

| Property   | Type     | Description                                                  |
| ---------- | -------- | ------------------------------------------------------------ |
| `operator` | `string` | The comparison operator. Can be one of: `=`, `!=`, `<`, `>`, `<=`, `>=` |
| `value`    | `Number` | The comparison value (ie. the `8` in `>8`)                   |


## Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const isValid = ComparePoint.isValidOperator('=');
```

| Method                               | Description                     | Return    |
| ------------------------------------ | ------------------------------- | --------- |
| `isValidOperator({string} operator)` | Checks if the operator is valid | `boolean` |