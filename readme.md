# rpg-dice-roller

A basic JS based dice roller that accepts typical dice notation.

[![Build Status](https://travis-ci.org/GreenImp/rpg-dice-roller.svg?master)](https://travis-ci.org/GreenImp/rpg-dice-roller)


## Supported notation

The standard notation formats are accepted, such as `2d6+12`, and also the use of `L` or `H` to represent the lowest or highest roll respectively.  
ie. `4d6-L` (A roll of 4 six-sided dice, dropping the lowest result)


### Operators

You can also use multiply and divide mathematical operators; `1d6*5` or `2d10/d20`.  
However, the use of the mathematical symbols `×` and `÷` do not currently work, but are planned.


### Percentile dice (d%)

Although percentile dice can be rolled by using a `d100`, you can also use `d%`, which will do the same thing, returning a number between 0 and 100.


### Exploding dice

Exploding dice roll an additional die if the maximum, on that die, is rolled. If that die is also the maximum it is rolled again, and so forth, until a roll is made that isn't the maximum.  
ie. Rolling a 6 on a d6, or a 10 on a d10.

To explode a dice, add an exclamation mark after the die sides: `4d10!`

Each exploded die shows as a separate roll in the list, like so:

```
2d6!: [4, 6!, 6!, 2] = 20
```

Where the second roll exploded, so we rolled again, which also exploded. The fourth role, however, did not, so we stop rolling.

You can even use `L` and `H`, which will look at exploded dice, as well as normal rolls.  
i.e.

```
1d6!-L: [6!,6!,6!,3]-L = 18
```


#### Compounding

Sometimes, you may want the exploded dice rolls to be added together under the same, original roll. In this situation, you can compound the dice by using two exclamation marks: `4d10!!`

For example (using the examples of exploding dice above):

```
2d6!!: [4, 14!!] = 20   // the exploded dice rolls of [6, 6, 2] are added together
1d6!!-L: [21!!]-L = 18  // the exploded dice rolls of [6, 6, 6, 3] are added together
```


#### Penetrating

Some exploding dice system use a penetrating rule.

Taken from the Hackmaster Basic rules:

> Should you roll the maximum value 
  on this particular die, you may re-roll and add the result of 
  the extra die, less one point, to the total (penetration can 
  actually result in simply the maximum die value if a 1 is subsequently 
  rolled, since any fool knows that 1-1=0). This 
  process continues indefinitely as long as the die in question 
  continues to come up maximum (but there’s always only a 
  –1 subtracted from the extra die, even if it’s, say, the third 
  die of penetration)

So, if I rolled `1d6` (penetrating), and got a 6, I would roll another `d6`, subtracting 1 from the result. If that `d6` rolled a 6 (before the -1) it would penetrate, and so on.

The syntax for penetrating is very similar to exploding, but with a lowercase 'p' appended: `2d6!p`.  
i.e. (Using the same example from exploding dice above):

```
2d6!p: [4, 6!p, 5, 1] = 20
```

Where the second roll exploded, so we rolled again, which also exploded (rolled a 6). The fourth role, however, rolled a 2, so did not penetrate, so we stop rolling.  
Remember that we subtract 1 from penetrated rolls, which is why we show '5' and '1', instead of '6', and '2'.

You can also compound penetrating dice, like so: `2d6!!p`

#### Compare point

By default, Exploding and penetrating dice do so if you roll the highest number possible on the dice (ie. a 6 on a `d6`, a 1 on a Fudge die).  
You can easily change the exploding compare point by adding a comparison after it.
ie. to explode only if you roll a 4:

```
2d6!=4
```

Or exploding if you roll anything over a 4:

```
2d6!>4
```

You can also use this with penetrating and compounding dice:

```
2d6!!<=4  // compound if you roll a 4 or lower
2d6!p!=4  // penetrate if you *don't* roll a 4
```

There is an obvious issue here, wherein you can't do a normal explode if you *don't* roll a certain number. ie:

```
2d6!!=4
```

This will actually tell it to compound if you roll a 4. Solutions are currently being looked in to.


### Fudge dice

Fudge notation is also supported. It allows both `dF.2` and less common `dF.1`.

You can also use it in conjunction with other operators and additions.

Examples:

```
dF      // this is the same as `dF.2`
4dF.2   // roll 4 standard fudge dice
4dF.2-L // roll 4 standard fudge dice, subtracting the lowest result
dF.1*2  // roll non-standard fudge dice, multiplying the result by 2
```


### Dice pools

Some systems use dice pool, whereby the total is equal to the number of dice rolled that meet a fixed condition, rather than the total value of the rolls.

For example, a "pool" of 10 sided dice where you count the number of dice that roll an 8 or higher as "successes".  
This can be achieved with:

```
5d10>=8
```

You can define various success conditions, by simply adding number comparisons directly after the dice roll.  
Because of this, you can *not have a pool dice that also explodes*.

Examples:

```
2d6=6: [4,6*] = 1               // only a roll of 6 is a success
4d3>1: [1,3*,2*,1] = 2          // higher than a 1 is a success
4d3<2: [1*,3,2,1*] = 2          // lower than a 2 is a success
5d8>=5: [2,4,6*,3,8*] = 2       // higher than or equal to 5 is a success
6d10<=4: [7,2*,10,3*,3*,4*] = 4 // less than or equal to 4 is a success
```

You can mix pool dice with other dice types or equations, and it will use the number of successes as the value in the equation:

```
2d6>4+3d5: [4,5*]+[3,1,1] = 6   // 1 success + the raw values of the other rolls
2d6>4*d6!: [6*,5*]*[6!,4] = 20  // 1 success * raw values of the other rolls
2d6>4+2: [3,5*]+2 = 3           // 1 success + 2
2d6>4+H: [3,5*]+H = 2           // Highest roll is 5, which is a success, so value of 1
2d6<4+H: [3*,5]+H = 1           // Highest roll is 5, which is a failure, so value of 0
```

The `successes` property on the `DiceRoll` object will provide the number of successes for a roll.  
However, if the roll is just dice pool, and does not contain any other additions, or dice rolls, then the value provided will be the same as the `totals` property.


## Usage

You only need to include the `dice-roller.js` file in your project:

```html
<script src="dice-roller.js"></script>
```

You can use `DiceRoller` like so:

```js
// create a new instance of the DiceRoller
const roller = new DiceRoller();

// roll the dice
roller.roll('4d20-L');

// get the latest dice rolls from the log
let latestRoll = roller.log.shift();

// output the latest roll - it has a toString method for nice output when converted to a string
document.write(latestRoll);


// roll several notations all at once, and store their DiceRoll objects
const rolls = roller.rollMany(['1d6', '2d4-H', '5d10!!']);


// roll a single notation without saving it to the log
const diceRoll = new DiceRoll('2d6-L');

// export the dice roll as JSON
let exportedData = diceRoll.export(exportFormats.JSON);

// we can also import data either from a previous export, or built up manually
// Note that here we're calling `import` on the `DiceRoll` class, not an existing object
let importedDiceRoll = DiceRoll.import(exportedData);


// importing into a DiceRoller is just as easy
roller.import(exportedData); // appends roll data to the end of existing roll log

// creates a new DiceRoller and stores the roll data
const roller2 = DiceRoller.import(exportedData);
```


### UMD

You can also load the library using AMD and CommonJS.

Here is the above example in Node.js:

```js
// require the dice-roller library
const dr = require("./dice-roller.js");

// create a new instance of the DiceRoller
const diceRoller = new dr.DiceRoller();

// roll the dice
diceRoller.roll('4d20-L');

// get the latest dice rolls from the log
let latestRoll = diceRoller.log.shift();

// output the latest roll - it has a toString method for nice output
console.log(latestRoll + '');
```


### API

The Dice Roller provides a global `DiceRoller` class, of which you can have multiple instances:

```js
// my first DiceRoller
const roller1 = new DiceRoller();

// my second DiceRoller
const roller2 = new DiceRoller();
```

Each instance keeps it's own log of dice rolls, so it's handy if you're rolling for several completely unrelated things.


#### `DiceRoller` object

| Property           | type                                          | description                                                                                                                                |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `clearLog`         | `function()`                                  | Clears the roll history log.                                                                                                               |
| `export`           | `function({exportFormats} format)`            | Exports the `DiceRoller` object to the specified format. Returns `mixed`                                                                   |
| `import`           | `function({mixed} data)`                      | Imports the given data and appends it to the current roll log, returning the updated log. Returns `Array<DiceRoll>`                        |
| `log`              | `Array<DiceRoll>`                             | A list of the current roll logs.                                                                                                           |
| `output`           | `String`                                      | String representation of the object, in the format of: `2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6`.                                          |
| `roll`             | `function({String} notation)`                 | Rolls the given dice notation and returns the rolls. Returns `DiceRoll`                                                                    |
| `rollMany`         | `function({Array<String>} notations)`         | Rolls the given list of dice notations and returns them. Returns `Array<DiceRoll>`                                                         |
| `toJSON`           | `function()`                                  | Returns the JSON serializable object when the `DiceRoller` is passed to `JSON.stringify`. Returns `Object`                                 |
| `toString`         | `function()`                                  | Returns the `output` property when the object is parsed as a string (ie. `diceroller + ''`). Returns `String`                              |
| ~~`getLog`~~       | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `log` property instead.~~                                                                         |
| ~~`getOutput`~~    | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `output` property instead.~~                                                                      |
| ~~`getNotation`~~  | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `output` property instead.~~                                                                      |


##### Static properties

Static properties can be called on the class itself, without instantiating an object, like so:

```js
const diceRoller = DiceRoller.import(data); // returns a new DiceRoller instance with the given data
```

| Property               | type                              | description                                                                                                                                          |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exportFormats`        | `Object`                          | List of available export / import formats                                                                                                            |
| `import`               | `function({mixed} data)`          | Imports the given data and creates a new dice roll. Note: This is called on the `DiceRoller` class, not an instantiated object. Returns `DiceRoller` |
| ~~`utils`~~            | ~~`Object`~~                      | ~~**Deprecated (Removed in v2.0.0)**~~ use global `diceUtils` instead.                                                                               |
| ~~`notationPatterns`~~ | ~~`Object`~~                      | ~~**Deprecated (Removed in v2.0.0)**~~ use `DiceRoll.notationPatterns` property instead.                                                             |
| ~~`parseDie`~~         | ~~`function({String} notation)`~~ | ~~**Deprecated (Removed in v2.0.0)**~~ use `DiceRoll.parseNotation()` method instead.                                                                |
| ~~`parseNotation`~~    | ~~`function({String} notation)`~~ | ~~**Deprecated (Removed in v2.0.0)**~~ use `DiceRoll.parseNotation()` method instead.                                                                |


#### `DiceRoll` object

A `DiceRoll` object takes a notation and parses it in to rolls.

It can be created like so:

```js
const notation = '4d10';

const roll = new DiceRoll(notation);
```

| Property           | type                                          | description                                                                                                        |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `export`           | `function({exportFormats} format)`            | Exports the `DiceRoll` object to the specified format. Returns `mixed`                                             |
| `notation`         | `String`                                      | The dice notation passed                                                                                           |
| `notationPatterns` | `Object`                                      | An object that contains a `get()` method, which returns the regular expression for matching dice notation.         |
| `output`           | `String`                                      | The roll notation in the format of: `2d20+1d6: [20,2]+[2] = 24`.                                                   |
| `rolls`            | `Array`                                       | Roll log for the notation                                                                                          |
| `roll`             | `function()`                                  | Rolls the dice for the existing notation and returns the rolls. Returns `Array`                                    |
| `successes`        | `Number`                                      | The number of successes for the roll, if using pool dice.                                                          |
| `toJSON`           | `function()`                                  | Returns the JSON serializable object when the `DiceRoll` is passed to `JSON.stringify`. Returns `Object`           |
| `toString`         | `function()`                                  | Returns the `output` property when the object is parsed as a string (ie. `diceroll + ''`). Returns `String`        |
| `total`            | `Number`                                      | The roll total generated from `roll()`.                                                                            |
| ~~`getOutput`~~    | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `output` property instead.~~                                              |
| ~~`getNotation`~~  | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `output` property instead.~~                                              |
| ~~`getSuccesses`~~ | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `successes` property instead.~~                                           |
| ~~`getTotal`~~     | ~~`function()`~~                              | ~~**Deprecated (Removed in v2.0.0)** use `total` property instead.~~                                               |


##### Static properties

Static properties can be called on the class itself, without instantiating an object, like so:

```js
const diceRoll = DiceRoll.import(data);
```

| Property        | type                          | description                                                                  |
| --------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `import`        | `function({mixed} data)`      | Imports the given data and creates a new dice roll. Returns `DiceRoll`       |
| `parseNotation` | `function({String} notation)` | Parses the given notation and returns a list of parsed data. Returns `Array` |


## Browser support

This dice roller only works in the latest browsers, including Microsoft Edge, but will **not** work in IE 11 or less without using an ES6 compiler.


### Demo

View the demo here: http://rpg.greenimp.co.uk/dice-roller


## Licence

This dice roller is released under the MIT licence, meaning that you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit


## Reference

Further information can be found here: https://en.wikipedia.org/wiki/Dice_notation
