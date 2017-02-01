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


### UMD

You can also load the library using AMD and CommonJS.

Here is the above example in Node.js:

```
// require the dice-roller library
const dr = require("./dice-roller.js");

// create a new instance of the DiceRoller
var diceRoller  = new dr.DiceRoller();

// roll the dice
diceRoller.roll('4d20-L');

// get the latest dice rolls from the log
var latestRoll = diceRoller.getLog().shift();

// output the latest roll - it has a toString method for nice output
console.log(latestRoll.toString());
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
