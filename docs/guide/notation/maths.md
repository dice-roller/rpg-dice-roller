# Maths

The library supports a multitude of mathematical expressions, with quite a lot of flexibility.


## Operators

You can use mathematical operators to carry out equations with roll results

```
d6*5     // roll a 6 sided die and multiple the result by 5
2d10/d20 // roll a 10 sided die 2 times and add the results together, then roll a 20 sided dice and divide the two totals
3d20^4   // roll a 20 sided die 3 times and raise the result to the power of 4 (Exponent)
3d20**4  // Equivalent to above (Exponent)
d15%2    // roll a 15 sided die and return the remainder after division (Modulus)
```

You can even use them to determine the number of dice to roll, or how many sides a die should have:

```
(4-2)d10 // subtract 2 from 4 (`2`) and then roll a 10 sided dice that many times
3d(2*6)  // multiple 2 by 6 (`12`) and roll a dice with that many sides 3 times
```

::: roll 3d(2*6) :::

## Parenthesis

Parenthesis are recognised anywhere in notations to group sections and define the order of operations, as you would expect:

```{2}
1d6+2*3: [4]+2*3 = 10
(1d6+2)*3: ([4]+2)*3 = 18
```

::: roll (1d6+2)*3 :::


## Functions

You can also use an array of mathematical formulas and functions.

It works with the following [Javascript math functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math#Methods):

`abs`, `ceil`, `cos`, `exp`, `floor`, `log`, `round`, `sign`, `sin`, `sqrt`, `tan`, `pow`, `max`, `min`

Some examples:

```
round(4d10/3): round([3, 6, 1, 1]/3) = 3.7
floor(4d10/3): round([3, 6, 1, 1]/3) = 3.6
ceil(4d10/3): round([3, 6, 1, 1]/3) = 3.7
abs(4d10-25): abs([3, 6, 1, 1]-25) = 14
sqrt(4d10/3): sqrt([3, 6, 1, 1]) = 1.91
min(4d6, 2d10): min([3, 4, 1, 5], [10, 6]) = 13
```

::: roll min(4d6, 2d10) :::

:::tip
If we're missing a math function that you want, [let us know](https://github.com/GreenImp/rpg-dice-roller/issues)!
:::
