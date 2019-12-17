# rpg-dice-roller

A JS based dice roller that can role various types of dice and modifiers, along with mathematical equations.

[![Build Status](https://travis-ci.org/GreenImp/rpg-dice-roller.svg?branch=master)](https://travis-ci.org/GreenImp/rpg-dice-roller)


## Demo

View the demo here: http://rpg.greenimp.co.uk/dice-roller


## Get Started

### Install

* NPM:
    ```bash
    $ npm install rpg-dice-roller
    ```
* Yarn:
    ```bash
    $ yarn add rpg-dice-roller
    ```
* CDN
    [![JSDelivr](https://data.jsdelivr.com/v1/package/npm/rpg-dice-roller/badge)](https://www.jsdelivr.com/package/npm/rpg-dice-roller)
    
    ```html
    <script src="https://cdn.jsdelivr.net/npm/rpg-dice-roller@VERSION/lib/umd/bundle.min.js"></script>
    ```


### Setup

#### ES modules

You can import the dice roller and use it in your application, using ES standard modules like so:

```js
// import only the DiceRoller class
import { DiceRoller } from 'lib/esm/bundle.min.js';
// or in nodeJS using ES modules
import { DiceRoller } from 'rpg-dice-roller';

// create a new instance of the DiceRoller
const roller = new DiceRoller();
```

Rather than specifying the individual components, you can import everything like so:
```js
// import everything and store it on the `rpgDiceRoller` scope
import * as rpgDiceRoller from 'lib/esm/bundle.min.js';
// or in nodeJS using ES modules
import * as rpgDiceRoller from 'rpg-dice-roller';

// create a DiceRoller
const roller = new rpgDiceRoller.DiceRoller();

// create a DiceRoll
const roll = new rpgDiceRoller.DiceRoll('2d6');
```


#### NodeJS And Module Loaders

_Note: if you're using NodeJS v12 or greater and are using [ES modules](https://nodejs.org/docs/latest-v13.x/api/esm.html) (`import`) instead of CommonJS (`require`) follow the [ES modules](#es-modules) examples above._

You can also load the library using CommonJS, AMD, etc.

Instead of the ESM file (`lib/esm/bundle.min.js`), you should use the UMD file (`lib/umd/bundle.min.js`).

Here is an example in Node.js:

```js
// require the dice-roller library
const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle.min.js');

// create a new instance of the DiceRoller
const diceRoller = new DiceRoller();
```

Rather than specifying the individual components, you can import everything like so:
```js
// import everything and store it on the `rpgDiceRoller` scope
const rpgDiceRoller = require('rpg-dice-roller/lib/umd/bundle.js');

// create a DiceRoller
const roller = new rpgDiceRoller.DiceRoller();
```


#### Older Browsers

We support _some_ [older browsers](#older-browsers) *(Not IE!)* without Module support.

Instead of the ESM file (`lib/esm/bundle.min.js`), you **must** use the UMD file (`lib/umd/bundle.min.js`).

All uses of the library classes and objects **must** be accessed from the `rpgDiceRoller` namespace.

```html
<script src="lib/umd/bundle.min.js"></script>
<script>
  // create a new instance of the DiceRoller
  var diceRoller = new rpgDiceRoller.DiceRoller();
</script>
```

### Usage

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


// If you don't need to keep a roll log, you can pass the notation to an instance of `DiceRoll` (Not `DiceRoller`)
roll = new DiceRoll('4d10*3');

// output the roll
console.log(`You rolled: ${roll}`);
// You rolled: 4d10*3: [8, 3, 4, 6]*3 = 63
```

Check the [API](#api) section for more details on using the dice roller.


## Supported notation

### Dice

The simplest form of notation is just a basic dice roll.


#### Standard (`d{n}`)

A standard die has a positive numerical number of sides, like typical 6 sided dice, or a d20.

```
d6   // roll a 6 sided dice
4d10 // roll a 10 sided dice 4 times and add the results together
```


#### Percentile dice (`d%`)

Percentile dice roll a whole number between `0-100`, and are specified with the format `d%`.
This is a shorthand to a standard die with 100 sides; `d100`

```
4d%   // roll a percentile die 4 times and add the results together
```
Is equivalent to:
```
4d100 // roll a 100 sided die 4 times and add the results together
```


#### Fudge / Fate dice (`dF` / `dF.2` / `dF.1`)

Fudge dice are 6 sided dice but, instead of numbers, they're marked with minus signs, plus signs, and blank sides, meaning `-1`, `+1`, and `0` respectively.

The default is one third of each, known as `dF.2`, or just `dF`. A variant is `dF.1` which has 4 blanks, 1 plus sign, and 1 minus sign.

```
dF   // roll a standard Fudge die. Equivalent to `dF.2`
dF.2 // roll a standard fudge dice. Equivalent to `dF`
dF.1 // roll the variant fudge dice
4dF  // Roll a standard Fudge die 4 times and add the results together
```


### Modifiers

Modifiers a special flags that can change the value of dice rolls, their appearance, order, and more.

You can generally combine multiple modifiers of different types and they'll work together. This will both [Explode](#explode) any maximum rolls, and [Keep](#keep-kn--khn--kln) only keep the highest 2 rolls:

```
5d10!k2
```

We have tried to cover all the commonly used modifiers. [Let us know](https://github.com/GreenImp/rpg-dice-roller/issues) if we've missed one that you use!


#### Exploding (`!` / `!{cp}`)

The exploding dice mechanic allows one or more dice to be re-rolled (Usually when it rolls the highest possible number on the die), with each successive roll being added to the total.

To explode a dice, add an exclamation mark after the die notation: `4d10!`

Each exploded die shows as a separate roll in the list, like so:

```
2d6!: [4, 6!, 6!, 2] = 18
```

The second die rolled the highest value, and so it exploded - we roll again. The re-rolled die also exploded, so we roll a fourth time. The fourth role, however, did not explode, so we stop rolling.

If you want to change the number that a dice will explode on, you can use a [Compare Point](#Compare Point):

```
2d6!=5   // explode on any rolls equal to 5
2d6!>4   // explode on any rolls greater than 4
4d10!<=3 // explode on any roll less than or equal to 3
```

Read more about [Compare Points below](#Compare Point).


##### Compounding (`!!` / `!!{cp}`)

Sometimes, you may want the exploded dice rolls to be combined together into a single roll. In this situation, you can compound the dice by using two exclamation marks: `4d10!!`

For example:

```
2d6!: [4, 6!, 6!, 2] = 18 // exploding re-rolls
2d6!!: [4, 14!!] = 18     // compounding combines re-rolls
```

You can also use [Compare Points](#Compare Point) to change when a dice will compound:

```
2d6!!=5   // compound on any rolls equal to 5
2d6!!>4   // compound on any rolls greater than 4
4d10!!<=3 // compound on any roll less than or equal to 3
```


##### Penetrating (`!p` / `!!p` / `!p{cp}` / `!!p{cp}`)

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

So, if I rolled `1d6` (penetrating), and got a 6, I would roll another `d6`, subtracting 1 from the result. If that die rolled a 6 (before the -1) it would also penetrate, and so on.

The syntax for penetrating is very similar to exploding, but with a lowercase 'p' appended: `2d6!p`.

For example:

```
2d6!p: [6!p, 5!p, 5!p, 3, 1] = 20 // Actual rolls are [6, 6, 6, 4, 1]
```
The first roll exploded (Rolled the highest number on the die), so we rolled again and subtracted 1 from the re-roll. The second and third rolls also exploded and were re-rolled, so we subtract 1 from each.

Remember that we subtract 1 from penetrated rolls, which is why we show `5`s and a `3` instead of `6`s and a `1`.

You can also compound penetrating dice, like so: `2d6!!p`

You can also use [Compare Points](#Compare Point) to change when a dice will penetrate:

```
2d6!p=5   // penetrate on any rolls equal to 5
2d6!!p>4   // penetrate and compound on any rolls greater than 4
4d10!p<=3 // penetrate on any roll less than or equal to 3
```


#### Drop (`d{n}` / `dh{n}` / `dl{n}`)

Sometimes you may want roll a certain number of dice, but "drop" or remove high or low rolls from the results. It is the opposite of the Keep modifier.

The notation of the drop modifier is a lowercase `d`, followed by the end that should be dropped ("h" = "highest", "l" = "lowest"), and then the number of dice to drop.

The "end" is optional and, if omitted, will default to _lowest_.

For example:

```
4d10dl2 // roll a d10 4 times and drop the lowest 2 rolls
4d10d2  // equivalent to the above
4d10dh1 // roll a d10 4 times and drop the highest roll
```

When outputting the roll, the dropped rolls are given the "d" flag:

```
6d8dh3: [3, 6d, 7d, 2, 5d, 4] = 9
```


#### Keep (`k{n}` / `kh{n}` / `kl{n}`)

The keep modifier allows you to roll a collection of dice but to disregard all except for the highest or lowest result. It is the opposite of the Drop modifier.

The notation of the keep modifier is a lowercase `k`, followed by the end that should be dropped ("h" = "highest", "l" = "lowest"), and then the number of dice to drop.

The "end" is optional and, if omitted, will default to _highest_.

For example:

```
4d10kh2 // roll a d10 4 times and keep the highest 2 rolls
4d10k2  // equivalent to the above
4d10dl1 // roll a d10 4 times and keep the lowest roll
```

When outputting the roll, the kept rolls aren't modified, but the dropped rolls are given the "d" flag:

```
6d8k3: [3d, 6, 7, 2d, 5, 4d] = 9
```


#### Re-roll (`r` / `ro` / `r{cp}` / `ro{cp}`)

This will re-roll a die that rolls the lowest possible number on a die (Usually a 1). It will keep re-rolling until a number greater than the minimum is rolled, disregarding any of the previous rolls.

This is similar to [Exploding](#explode), but explode will keep the previous rolls and add them together.

To re-roll, add an `r` after the dice notation:

```
d6r // roll 1 d6 and re-roll if the result is 1 (and again each time a 1 is rolled)
```

If you only want to re-roll once, even if the second roll also rolls the minimum value, you can use the `ro` notation:

```
d6ro // roll 1 d6 and re-roll if the result is 1. Don't re-roll again, even if the second roll is also a 1
```

If you want to change the number that a dice will re-roll on, you can use a [Compare Point](#Compare Point):

```
2d6r=5   // re-roll on any rolls equal to 5
2d6ro>4   // re-roll once on any roll greater than 4
4d10r<=3 // re-roll on any roll less than or equal to 3
```

Read more about [Compare Points below](#Compare Point).


#### Target Success / Dice pool (`{cp}`)

Some systems use dice pool, or success counts, whereby the total is equal to the quantity of dice rolled that meet a fixed condition, rather than the total value of the rolls.

This can be achieved by adding a [Compare Point](#compare-point) notation directly after the die notation.

For example, a "pool" of 10 sided dice where you count the number of dice that roll an 8 or higher as "successes":

```
5d10>=8
```

You can use any valid [Compare Point](#compare-point) notation.

Examples:

```
2d6=6: [4,6*] = 1               // only a roll of 6 is a success
4d3>1: [1,3*,2*,1] = 2          // greater than a 1 is a success
4d3<2: [1*,3,2,1*] = 2          // less than a 2 is a success
5d8>=5: [2,4,6*,3,8*] = 2       // greater than or equal to 5 is a success
6d10<=4: [7,2*,10,3*,3*,4*] = 4 // less than or equal to 4 is a success
```

However, you cannot count success for any number that is _not_ equal to a certain value:

```
2d6!=3 // instead this will explode on anything other than a 3
```

Another caveat is that the target modifier cannot directly follow any modifier that uses Compare Points, otherwise the Target modifier will be mistakenly used as the Compare Point for the modifier:

```
2d6!>3   // explode on any roll greater than 3
2d6>3!   // explode on a roll of 6, greater than 3 is a success
2d6>3!<4 // explode on any roll greater than 4, greater than 3 is a success
```

The result total will be the number of success, instead of the value of the rolls:

```
4d6>3: [2, 6*, 4*, 1] = 2
```


#### Target Failures / Dice Pool (`f{cp}`)

Sometimes, when counting success, you also need to consider failures. A failure modifier _must_ directly follow a Success modifier, and works in much the same way.

For each failure counted, it will subtract 1 from the total number of success counted.

The Failure modifier is a [Compare Point](#compare-point), preceded with the letter "f":

```
4d6>4f<3: [2_, 5*, 4, 5*] = 1 // greater than 4 is success, less than 3 is failure
```


#### Sorting (`s` / `sa` / `sd`)

You can sort the dice rolls, so that they are displayed in numerical order by appending the `s` flag after the dice notation.

The default order is ascending, but you can specify the sort order using `sa` and `sd` for ascending and descending:

```
4d6: [4, 3, 5, 1]   // no sorting
4d6s: [1, 3, 4, 5]  // default sort the results ascending
4d6sa: [1, 3, 4, 5] // sort the results ascending
4d6sd: [5, 4, 3, 1] // sort the results descending
```


#### Critical Success (`cs{cp}`)

_This is purely aesthetic and makes no functional difference to the rolls or their values._

When a die rolls the highest possible value, such as rolling a 20 on a d20, this is called a critical success.

However, sometimes you want a critical success to be on a different value, or a range, such as 18-20 on a d20.

To specify what is considered as a critical success, add `cs` and a [Compare Point](#compare-point), after the die notation:

```
4d10cs>7 // roll a d10 4 times, anything greater than 7 is a critical success
```

The roll result output will look something like this:

```
5d20cs>=16: [3, 20**, 18**, 15, 6] = 62 // the rolls of 20 and 18 are critical successes
```


#### Critical Failure (`cf{cp}`)

_This is purely aesthetic and makes no functional difference to the rolls or their values._

When a die rolls the lowest possible value, such as rolling a 1 on a d20, this is called a critical failure.

However, sometimes you want a critical failure to be on a different value, or a range, such as 1-3 on a d20.

To specify what is considered as a critical failure, add `cf` and a [Compare Point](#compare-point), after the die notation:

```
4d10cf<3 // roll a d10 4 times, anything less than 3 is a critical failure
```

The roll result output will look something like this:

```
5d20cf<=6: [3__, 20, 18, 15, 6__] = 62 // the rolls of 3 and 6 are critical failures
```


#### Compare point

Many modifiers perform an action when the die rolls either the highest or lowest possible number. Sometimes you may want the modifier to execute on different values, and this is what Compare Points are for.

A compare point is a comparative operator, followed by the number to match: `=8`

The following are valid comparative operators:

```
=  // equal to
!= // not equal to
<  // less than
>  // greater than
<= // less than or equal to
>= // greater than or equal to
```

Wherever you can use compare points, the notation is the same. So if you wanted to check if a number is _"greater than or equal to 5"_, the notation would look like:

```
>=5
```

Here are some examples with full notation strings:

```
d10!>=5 // roll a d10 and explode on any roll greater than or equal to 5
d6!!>4 // roll a d6 and compound only on rolls greater than 4
d4r<3 // roll a d4 and re-roll anything less than 3
```

However, you can't have a die that only explodes if you _don't_ roll a specific number:

```
2d6!!=4
```

This notation will actually create a compound roll if you roll a 4.


### Maths

#### Operators

You can use mathematical operators to carry out equations with roll results

```
d6*5     // roll a six sided dice and multiple the result by 5
2d10/d20 // roll a 10 sided dice 2 times and add the results together, then roll a 20 sided dice and divide the two totals
(4-2)d10 // subtract 2 from 4 (`2`) and then roll a 10 sided dice that many times
3d(2*6)  // multiple 2 by 6 (`12`) and roll a dice with that many sides 3 times
```

#### Parenthesis

Parenthesis are recognised anywhere in notations to group sections and define the order of operations:

```
1d6+2*3: [4]+2*3 = 10
(1d6+2)*3: ([4]+2)*3 = 18
```


#### Functions

You can also use an array of mathematical formulas and functions.

Internally it uses [Math.Js](https://mathjs.org), so you should be able to use any of its built in [arithmetic functions](https://mathjs.org/docs/reference/functions.html#arithmetic-functions).

```
round(4d10/3): round([3, 6, 1, 1]/3) = 3.7
floor(4d10/3): round([3, 6, 1, 1]/3) = 3.6
ceil(4d10/3): round([3, 6, 1, 1]/3) = 3.7
```


## API

### `DiceRoller` object

The `DiceRoller` is the main class that can roll dice, remember previous rolls and output results.

It can have multiple, independent instances, each with it's own log of dice rolls, which is handy if you're rolling for several unrelated things.

```js
// my first DiceRoller
const roller1 = new DiceRoller();

// my second DiceRoller
const roller2 = new DiceRoller();
```


#### Constructor

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


#### Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const roller = new DiceRoller();
roller.roll('d6');
```

| Method                               | Description                                                  | Return                |
| ------------------------------------ | ------------------------------------------------------------ | --------------------- |
| `clearLog()`                         | Clears the roll history log.                                 | `void`                |
| `export({exportFormats=} format)`    | Exports the `DiceRoller` object to the specified format. Throws `Error` if format is invalid | `string|null`         |
| `import({mixed} data)`               | Imports the given data and appends it to the current roll log, returning the updated log. Throws `Error` if data type is invalid | `DiceRoll[]`          |
| `roll({String} ...notation)`         | Rolls the dice notation returning the rolls. You can pass in multiple notations (i.e `roll('d6', '2d8')`) | `DiceRoll|DiceRoll[]` |
| `toJSON()`                           | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(roller)` | `Object`              |
| `toString()`                         | Returns a string representation of the object (See `output` property). Called automatically when the object is cast to a string (ie. `Rolled: ${diceroller}`) | `string`              |
| ~~`rollMany({String[]} notations)`~~ | ~~**Deprecated (Removed in v4.0.0)** use `roll()` method instead.~~ |                       |


#### Properties

| Property        | Type         | Description                                                  |
| --------------- | ------------ | ------------------------------------------------------------ |
| `log`           | `DiceRoll[]` | A list of the current roll logs                              |
| `output`        | `String`     | String representation of the object, in the format of: `2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6` |
| `total`         | `Number`     | The sum of all the rolls in the `log`                        |
| ~~`successes`~~ | ~~`Number`~~ | ~~**Deprecated (Removed in v4.0.0)** use `total` instead~~   |


#### Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const diceRoller = DiceRoller.import(data);
```

| Method                 | Return       | Description                                                  |
| ---------------------- | ------------ | ------------------------------------------------------------ |
| `import({mixed} data)` | `DiceRoller` | Imports the given data and creates a new `DiceRoller` object |


### `DiceRoll` object

The `DiceRoll` does the actual rolling and holds the results. You can call this directly, bypassing the `DiceRoller` object, if you don't need to retain roll logs.


#### Constructor

```js
/**
 * @param {string|object} notation The dice notation to parse and roll
 */
DiceRoll({string|object} notation)
```

A `DiceRoll` object requires a dice notation, which it parses into rolls:

```js
const roll = new DiceRoll('4d10');
```

Or it can be an object containing a `notation` and `rolls` to import:

```js
const roll = new DiceRoll({
  notation: '4d6',
  rolls: ..., // RollResults object or array of roll results
});

// which is equivalent to doing:
const roll = DiceRoll.import({
  notation: '4d6',
  rolls: ..., // RollResults object or array of roll results
});
```

If the notation is missing or invalid an error will be thrown

#### Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const roll = new DiceRoll('d6');
roll.export();
```

| Method                            | Description                                                  | Return        |
| --------------------------------- | ------------------------------------------------------------ | ------------- |
| `export({exportFormats=} format)` | Exports the `DiceRoll` in the specified format. Throes `Error` if format is invalid | `string|null` |
| `hasRolls()`                      | Returns whether the object has rolled dice or not            | `boolean`     |
| `rolls()`                         | Rolls the dice for the existing notation and returns the results. Useful if you want to re-roll the dice, but usually better to create a new `DiceRoll` instance instead | `[]`          |
| `toJSON()`                        | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(diceroll)` | `Object`      |
| `toString()`                      | Returns a string representation of the object (See `output` property). Called automatically when the object is cast to a string (ie. `Rolled: ${diceroll}`) | `string`      |


#### Properties

| Property               | Type            | Description                                                  |
| ---------------------- | --------------- | ------------------------------------------------------------ |
| `notation`             | `String`        | The dice notation                                            |
| `output`               | `String`        | The roll notation and rolls in the format of: `2d20+1d6: [20,2]+[2] = 24`. |
| `rolls`                | `RollResults[]` | The dice rolled for the notation                             |
| `total`                | `Number`        | The roll total                                               |
| ~~`notationPatterns`~~ | ~~`Object`~~    | ~~**Deprecated (Removed in v4.0.0)**~~                       |
| ~~`successes`~~        | ~~`Number`~~    | ~~**Deprecated (Removed in v4.0.0)** use `total` instead~~   |


#### Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const diceRoll = DiceRoll.import(data);
```

| Method                                 | Description                                                  | Return     |
| -------------------------------------- | ------------------------------------------------------------ | ---------- |
| `import({{}|string|DiceRoll} data)`    | Imports the given data and creates a new dice roll           | `DiceRoll` |
| ~~`parseNotation({String} notation)`~~ | ~~**Deprecated (Removed in v4.0.0)** use `Parser` object instead~~ | ~~[]~~     |


### `RollResult` object

A `Rollresult` object holds the roll value and active modifiers for a single die roll.

_You will probably not need to create your own `RollResult` instances, unless you're importing rolls, but `RollResult` objects will be returned when rolling dice._


#### Constructor

```js
/**
 * @param {number|{value: Number, initialValue: number}} value The value rolled
 * @param {string[]=} modifiers Optional List of modifier names that affect this roll
 * @param {boolean=} useInTotal Optional Whether to include the roll value when calculating totals
 */
RollResult({number|{value: Number, initialValue: number}} value, {string[]=} modifiers, {boolean} useInTotal = true)
```

The `RollResult` constructor requires a `value`. This is usually a number and defines the roll value.

The `modifiers` array is optional. If defined, it should be a list of modifier attribute names that have affected this rolls (ie. `explode`, `drop`, `critical-succes`). This is used mainly for flagging rolls visually.

```js
// a roll of 10, which is a critical success and should be re-rolled
const result1 = new RollResult(10, ['critical-success', 're-roll']);

// a roll of 3 that should be dropped (To stop a dropped roll being included in total calculations, `useInTotal` must be set to false)
const result2 = new RollResult(3, ['drop'], false);
```


#### Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const result = new RollResult(20);
result.toJSON();
```

| Method       | Description                                                  | Return   |
| ------------ | ------------------------------------------------------------ | -------- |
| `toJSON()`   | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(result)` | `Object` |
| `toString()` | Returns a string representation of the object. Called automatically when the object is cast to a string (ie. `Rolled: ${result}`) | `string` |


#### Properties

| Property           | Type       | Description                                                  |
| ------------------ | ---------- | ------------------------------------------------------------ |
| `calculationValue` | `number`   | The roll value to use in calculations. This may be changed by modifiers |
| `initialValue`     | `number`   | The initial value passed to the constructor. This is not usually used and is mainly for reference |
| `modifierFlags`    | `string`   | The visual flags that get appended to the value when outputting as a string |
| `modifiers`        | `string[]` | A list of modifier attribute names that affect the roll      |
| `useInTotal`       | `boolean`  | Whether the value should be used when calculation roll totals |
| `value`            | `number`   | The current value to display visually. This may be changed by modifiers. This is separate from the `calculationValue` so that you can display one value, and use another in calculations |


### `RollResults` object

The `RollResults` object contains a collection of `RollResult` objects.

_You will probably not need to create your own `RollResults` instances, unless you're importing rolls, but `RollResults` objects will be returned when rolling dice._


#### Constructor

```js
/**
 * @param {RollResult[]=} rolls Optional The rolls
 */
RollResults({RollResult[]=} rolls)
```

The constructor takes an optional rolls argument, which should be a collection of `RollResult` objects.

You can create a `RollResults` object without any rolls, and pass them in afterwards.


#### Prototype methods

Prototype methods can be called on an instance of the object, like so:

```js
const results = new RollResults();
results.toJSON();
```

| Method       | Description                                                  | Return   |
| ------------ | ------------------------------------------------------------ | -------- |
| `toJSON()`   | Returns a JSON serialisable version of the object. Called automatically when using `JSON.stringify(results)` | `Object` |
| `toString()` | Returns a string representation of the object. Called automatically when the object is cast to a string (ie. `Results: ${results}`) | `string` |


#### Properties

| Property | Type           | Description                      |
| -------- | -------------- | -------------------------------- |
| `length` | `number`       | The number of rolls              |
| `rolls`  | `RollResult[]` | The rolls                        |
| `value`  | `number`       | The total value of all the rolls |


### `ComparePoint` object

The `ComparePoint` object can check if a number matches a particular test. For example, is `numberA` greater than `3`, or is `numberB` equal to `10`.


#### Constructor

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


#### Prototype methods

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


#### Properties

| Property   | Type     | Description                                                  |
| ---------- | -------- | ------------------------------------------------------------ |
| `operator` | `string` | The comparison operator. Can be one of: `=`, `!=`, `<`, `>`, `<=`, `>=` |
| `value`    | `Number` | The comparison value (ie. the `8` in `>8`)                   |


#### Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```js
const isValid = ComparePoint.isValidOperator('=');
```

| Method                               | Description                     | Return    |
| ------------------------------------ | ------------------------------- | --------- |
| `isValidOperator({string} operator)` | Checks if the operator is valid | `boolean` |


### `Parser` object

The parser object takes a notation string and parses it into objects.
It is used internally by the `DiceRoll` object when rolling notation, but can be used by itself if necessary.

The parser object only has a single static method and no prototype methods or properties, so should not be instantiated as an object.


#### Static methods

Static methods can be called on the class itself, without instantiating an object, like so:

```
const parsedNotation = Parser.parse('4d20');
```

| Method                     | Description                                                  | Return |
| -------------------------- | ------------------------------------------------------------ | ------ |
| `parse({string} notation)` | Parses the notation and returns a list of dice and modifiers found | `[]`   |


### `exportFormats` object

The `exportFormats` object is an "enum" of valid formats that a `DiceRoller` or a `DiceRoll` object can be exported in. It looks like this:

```js
{
  JSON: 0,    // export as a JSON encoded string
  BASE_64: 1, // export as a base64 encoded string
  OBJECT: 2   // export a raw object
}
```


## Browser support

This dice roller uses modern JS and native JS modules, which work in all the latest browsers.

We actively support the latest versions of Firefox, Chrome, Opera, Safari, and Microsoft Edge.

We do **not** support IE, and the library will **not** work in IE.


## Licence

This dice roller is released under the MIT licence, meaning that you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit


## Reference

Further information on the basic dice notation can be found here: https://en.wikipedia.org/wiki/Dice_notation