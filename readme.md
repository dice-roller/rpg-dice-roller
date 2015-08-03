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


## Licence

This dice roller is released under the MIT licence, meaning that you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/l/mit


## Reference

Further information can be found here: https://en.wikipedia.org/wiki/Dice_notation
