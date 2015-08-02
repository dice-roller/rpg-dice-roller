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

## Reference

Further information can be found here: https://en.wikipedia.org/wiki/Dice_notation
