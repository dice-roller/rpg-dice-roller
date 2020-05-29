# `exportFormats`

The `exportFormats` object is an "enum" of valid formats that a `DiceRoller` or a `DiceRoll` object can be exported in.

It has the following properties:

```js
{
  JSON: 0,    // export as a JSON encoded string
  BASE_64: 1, // export as a base64 encoded string
  OBJECT: 2,   // export a raw object
}
```