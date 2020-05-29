# `Parser`

The parser object takes a notation string and parses it into objects.
It is used internally by the `DiceRoll` object when rolling notation, but can be used by itself if necessary.

The parser object only has a single static method and no prototype methods or properties, so should not be instantiated as an object.


## Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const parsedNotation = Parser.parse('4d20');
```

| Method                     | Description                                                  | Return |
| -------------------------- | ------------------------------------------------------------ | ------ |
| `parse({string} notation)` | Parses the notation and returns a list of dice and modifiers found | `[]`   |