# dice-roller

A basic JS based dice roller that accepts typical dice notation.


## Supported notation

The standard notation formats are accepted, such as `2d6+12`, and also the use of `L` or `H` to represent the lowest or highest roll respectively.  
ie. `4d6-L` (A roll of 4 six-sided dice, dropping the lowest result)


### Operators

You can also use multiply and divide mathematical operators; `1d6*5` or `2d10/d20`.  
However, the use of the mathematical symbols `×` and `÷` do not currently work, but are planned.


### Percentile dice (d%)

Although percentile dice can be rolled by using a `d100`, you can also use `d%`, which will do the same thing, returning a number between 0 and 100.


## Browsers

This dice roller only works on the latest browsers and will **not** work in versions of IE older than 10.

## Usage

You only need to include the `dice-roller.js` file in your project:

```<script src="dice-roller.js"></script>```

You can use `DiceRoller` like so:

```
<script>
  // create a new instance of the DiceRoller
  var diceRoller  = new DiceRoller();

  // roll the dice
  diceRoller.roll('4d20-L');
  
  // get the latest dice rolls from the log
  var latestRoll  = diceRoller.getLog().shift();
  
  // output the latest roll - it has a toString method for nice output
  document.write(latestRoll);
</script>
```

### API

The Dice Roller provides a global `DiceRoller` class, of which you can have multiple instances:

```
// my first DiceRoller
var roller1 = new DiceRoller();

// my second DiceRoller
var roller2 = new DiceRoller();
```

Each instance keeps it's own log of dice rolls, so it's handy if you're rolling for several completely unrelated things.

#### `DiceRoller` object

| Property           | type                          | description                                                                                                                                |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `roll`             | `function({String} notation)` | Rolls the given dice notation and returns the rolls. Returns `DiceRoll`                                                                    |
| `getLog`           | `function()`                  | Returns the current roll log. Returns: `Array`                                                                                             |
| `clearLog`         | `function()`                  | Clears the roll history log.                                                                                                               |
| `toString`         | `function()`                  | Returns the String representation of the object, in the format of: `2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6`. Returns `String`             |
| `notationPatterns` | `object`                      | An object that contains a single `get(name)` method, which returns the regular expression for matching dice notation                       |
| `parseNotation`    | `function({String} notation)` | Parses the given notation and returns a parsed object (Used internally by the `DiceRoll` object). Returns `Array`                          |
| `parseDie`         | `function({String} notation)` | Parses the given notation for a single die and returns a parsed object (Same as `parseNotation`, but with only 1 result). Returns `object` |


#### `DiceRoll` object

A `DiceRoll` object takes a notation and parses it in to rolls.

It can be created like so:

```
var notation  = '4d10';

var roll      = new DiceRoll(notation);
```

| Property   | type         | description                                                                                                      |
| ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `notation` | `String`     | The dice notation passed                                                                                         |
| `rolls`    | `Array`      | Roll log for the notation                                                                                        |
| `roll`     | `function()` | Rolls the dice for the existing notation and returns the rolls. Returns `Array`                                  |
| `getTotal` | `function()` | Returns the roll total, generated from `roll()`. Returns `Number`                                                |
| `toString` | `function()` | Returns the String representation of the object, in the format of: `2d20+1d6: [20,2]+[2] = 24`. Returns `String` |


### Demo

View the demo here: http://rpg.greenimp.co.uk/dice-roller


## Licence

This dice roller is released under the MIT licence, meaning that you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit


## Reference

Further information can be found here: https://en.wikipedia.org/wiki/Dice_notation
