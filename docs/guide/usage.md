# Usage

```js
// create a DiceRoller instance - this keeps a log of previous rolls
const roller = new DiceRoller();

// to roll a dice, you need to pass a formatted "notation" to the `roll()` method.
// this would roll a 20 sided dice 4 times and store the result
let roll = roller.roll('4d20');

// output the latest roll - it outputs formatted text when cast to a string
console.log(`You rolled: ${roll}`);
// You rolled: 4d20: [4, 18, 15, 11] = 48

// roll several notations all at once, and store their DiceRoll objects
const rolls = roller.roll('1d6', '2d4dh1', '5d10!!');

// output all of the rolls from the DiceRoller log
console.log(`You rolled lots: ${roller}`);
// You rolled lots: 4d20: [4, 18, 15, 11] = 48; 1d6: [3] = 3; 2d4dh1: [3d, 1] = 1; 5d10!! = [3, 2, 16!!, 3, 9] = 33

// empty the roll log
roller.clearLog();

// output an empty log
console.log(`Looks empty: ${roller}`);
// Looks empty: 


// If you don't need to keep a roll log, you can pass the notation to an instance of `DiceRoll` (Instead of `DiceRoller`)
roll = new DiceRoll('4d10*3');

// output the roll
console.log(`You rolled: ${roll}`);
// You rolled: 4d10*3: [8, 3, 4, 6]*3 = 63
```

Check the [notation](/notation/readme) section for more examples.

Check the [API](/api/readme.md) section for more details on using the dice roller.


## Try it yourself

::: roll :::
