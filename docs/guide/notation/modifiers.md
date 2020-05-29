---
sidebarDepth: 2
---

# Modifiers

Modifiers a special flags that can change the value of dice rolls, their appearance, order, and more.

You can generally combine multiple modifiers of different types, and they'll work together.

For example, This will both [Explode](#exploding-cp) any maximum rolls, and [Keep](#keep-kn-khn-kln) only the highest 2 rolls:

```
5d10!k2
```

We have tried to cover all the commonly used modifiers. [Let us know](https://github.com/GreenImp/rpg-dice-roller/issues) if we've missed one that you use!

::: warning Modifier order
Modifiers always run in a specific order, regardless of the order you specify them in.
This is determined by the modifier's `order` property, and works in ascending order.

These two are equivalent, and the [explode modifier](#exploding-cp) will always run before the [drop modifier](#drop-dn-dhn-dln):
```
4d6!d1
4d6d1!
```
:::


## Exploding (`!` / `!{cp}`)

**Order:** 1

The exploding dice mechanic allows one or more dice to be re-rolled (Usually when it rolls the highest possible number on the die), with each successive roll being added to the total.

To explode a die, add an exclamation mark after the die notation: `4d10!`

Each exploded die shows as a separate roll in the list, like so:

```
2d6!: [4, 6!, 6!, 2] = 18
```

The second die rolled the highest value, and so it exploded - we roll again. The re-rolled die also exploded, so we roll a fourth time. The fourth roll, however, did not explode, so we stop rolling.

If you want to change the number that a die will explode on, you can use a [Compare Point](#compare-point):

```
2d6!=5   // explode on any rolls equal to 5
2d6!>4   // explode on any rolls greater than 4
4d10!<=3 // explode on any roll less than or equal to 3
```

Read more about [Compare Points below](#compare-point).

::: warning `!=` compare point with exploding dice
You can't have a die that only explodes if you _don't_ roll a specific number:

```
2d6!!=4
```

This notation will instead create a [compound roll](#compounding-cp) if you roll a 4.
:::

::: roll 4d10!<=3 :::


### Compounding (`!!` / `!!{cp}`)

Sometimes, you may want the exploded dice rolls to be combined together into a single roll. In this situation, you can compound the dice by using two exclamation marks: `4d10!!`

For example:

```{2}
2d6!: [4, 6!, 6!, 2] = 18 // exploding re-rolls
2d6!!: [4, 14!!] = 18     // compounding combines re-rolls
```

You can also use [Compare Points](#compare-point) to change when a die will compound:

```
2d6!!=5   // compound on any rolls equal to 5
2d6!!>4   // compound on any rolls greater than 4
4d10!!<=3 // compound on any roll less than or equal to 3
```

::: roll 4d10!!<=3 :::


### Penetrating (`!p` / `!!p` / `!p{cp}` / `!!p{cp}`)

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

You can also use [Compare Points](#compare-point) to change when a dice will penetrate:

```
2d6!p=5   // penetrate on any rolls equal to 5
2d6!!p>4  // penetrate and compound on any rolls greater than 4
4d10!p<=3 // penetrate on any roll less than or equal to 3
```

::: roll 4d10!p<=3 :::


## Re-roll (`r` / `ro` / `r{cp}` / `ro{cp}`)

**Order:** 2

This will re-roll a die that rolls the lowest possible number on a die (Usually a 1). It will keep re-rolling until a number greater than the minimum is rolled, disregarding any of the previous rolls.

This is similar to [Exploding](#exploding-cp), but explode will keep the previous rolls and add them together.

To re-roll, add an `r` after the dice notation:

```
d6r // roll 1 d6 and re-roll if the result is 1 (and again each time a 1 is rolled)
```

If you only want to re-roll once, even if the second roll also rolls the minimum value, you can use the `ro` notation:

```
d6ro // roll 1 d6 and re-roll if the result is 1. Don't re-roll again, even if the second roll is also a 1
```

If you want to change the number that a dice will re-roll on, you can use a [Compare Point](#compare-point):

```
2d6r=5   // re-roll on any rolls equal to 5
2d6ro>4   // re-roll once on any roll greater than 4
4d10r<=3 // re-roll on any roll less than or equal to 3
```

Read more about [Compare Points below](#compare-point).

::: roll 4d10r<=3 :::


## Keep (`k{n}` / `kh{n}` / `kl{n}`)

**Order:** 3

The keep modifier allows you to roll a collection of dice but to disregard all except for the highest or lowest result.
It is the opposite of the [Drop modifier](#drop-dn-dhn-dln).

The notation of the keep modifier is a lowercase `k`, followed by the end that should be dropped ("h" = "highest", "l" = "lowest"), and then the number of dice to drop.

The "end" is optional and, if omitted, will default to _highest_.

For example:

```
4d10kh2 // roll a d10 4 times and keep the highest 2 rolls
4d10k2  // equivalent to the above
4d10kl1 // roll a d10 4 times and keep the lowest roll
```

When outputting the roll, the kept rolls aren't modified, but the dropped rolls are given the "d" flag:

```
6d8k3: [3d, 6, 7, 2d, 5, 4d] = 9
```

::: roll 6d8k3 :::

::: tip Using Drop and Keep modifiers together
The keep and drop modifiers work really well together, but there're some caveats.
They both look at the entire dice pool. So if a roll has been dropped, it will be still be included in the list of possible rolls to drop.

This means that using keep and drop modifiers together can override each other.

For example, the following will drop all the rolls:

```
3d10k1dh1: [7d, 1d, 2d] = 0
```

The is because the `k1` will drop the second and third dice, and the `dh1` will drop the first dice.

This (perhaps more expectedly) will only keep the highest dice:
```
3d10k1d1: [6d, 1d, 9] = 9
```

The `k1` will drop the first and second rolls, and the `d1` will also drop the first roll.
:::


## Drop (`d{n}` / `dh{n}` / `dl{n}`)

**Order:** 4

Sometimes you may want to roll a certain number of dice, but "drop" or remove high or low rolls from the results.
It is the opposite of the [Keep modifier](#keep-kn-khn-kln).

The notation of the drop modifier is a lowercase `d`, followed by the end that should be dropped ("h" = "highest", "l" = "lowest"), and then the number of dice to drop.

The "end" is optional and, if omitted, will default to _lowest_.

For example:

```
4d10dl2    // roll a d10 4 times and drop the lowest 2 rolls
4d10d2     // equivalent to the above
4d10dh1    // roll a d10 4 times and drop the highest roll
```

When outputting the roll, the dropped rolls are given the "d" flag:

```
6d8dh3: [3, 6d, 7d, 2, 5d, 4] = 9
```

You can also use "drop lowest" and "drop highest" modifiers together:

```
// roll a d10 4 times and drop the highest and lowest rolls
4d10dh1dl2: [5, 3d, 7, 8d] = 12
```

::: roll 4d10dh1dl2 :::

::: tip Using Drop and Keep modifiers together
See the note in the [Keep modifier section](#keep-kn-khn-kln) regarding using the two together
:::


## Target Success / Dice pool (`{cp}`)

**Order:** 5

Some systems use dice pool, or success counts, whereby the total is equal to the quantity of dice rolled that meet a fixed condition, rather than the total value of the rolls.

This can be achieved by adding a [Compare Point](#compare-point) notation directly after the die notation.

For example, a "pool" of 10 sided dice where you count the number of dice that roll an 8 or higher as "successes":

```
5d10>=8
```

You can use any valid [Compare Point](#compare-point) notation.

Examples:

```
2d6=6: [4, 6*] = 1                   // only a roll of 6 is a success
4d3>1: [1, 3*, 2*, 1] = 2            // greater than a 1 is a success
4d3<2: [1*, 3, 2, 1*] = 2            // less than a 2 is a success
5d8>=5: [2, 4, 6*, 3, 8*] = 2        // greater than or equal to 5 is a success
6d10<=4: [7, 2*, 10, 3*, 3*, 4*] = 4 // less than or equal to 4 is a success
```

::: warning Not equal to
You cannot count success for any number that is _not_ equal to a certain value, like:

```
2d6!=3
```

Because it will conflict with the [Explode](#exploding-cp) modifier, and it will instead explode on any roll of `3`
:::

::: warning Modifiers with compare points
Another caveat is that the target modifier cannot directly follow any modifier that uses [Compare Points](#compare-point),
otherwise the Target modifier will be instead be used as the [Compare Points](#compare-point) for the modifier:

```
2d6!>3   // explode on any roll greater than 3
```

But you can work around this by specifying the Target compare point first:

```
2d6>3!   // explode on a roll of 6, greater than 3 is a success
2d6>3!<4 // explode on any roll greater than 4, greater than 3 is a success
```
:::

::: roll 6d10<=4 :::


## Target Failures / Dice Pool (`f{cp}`)

**Order:** 5

Sometimes, when counting success, you also need to consider failures. A failure modifier _must_ directly follow a Success modifier, and works in much the same way.

For each failure counted, it will _subtract 1_ from the total number of success counted.

The Failure modifier is a [Compare Point](#compare-point), preceded with the lowercase letter "f":

```
4d6>4f<3: [2_, 5*, 4, 5*] = 1 // greater than 4 is success, less than 3 is failure
```

::: roll 4d6>4f<3 :::


## Critical Success (`cs{cp}`)

**Order:** 6

::: tip
This is purely aesthetic and makes no functional difference to the rolls or their values.
:::

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

::: roll 5d20cs>=16 :::


## Critical Failure (`cf{cp}`)

**Order:** 7

::: tip
This is purely aesthetic and makes no functional difference to the rolls or their values.
:::

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

::: roll 5d20cf<=6 :::


## Sorting (`s` / `sa` / `sd`)

**Order:** 8

You can sort the dice rolls, so that they are displayed in numerical order by appending the `s` flag after the dice notation.

The default order is ascending, but you can specify the sort order using `sa` and `sd` for ascending and descending respectively:

```
4d6: [4, 3, 5, 1]   // no sorting
4d6s: [1, 3, 4, 5]  // default sort the results ascending
4d6sa: [1, 3, 4, 5] // sort the results ascending
4d6sd: [5, 4, 3, 1] // sort the results descending
```

::: roll 4d6sd :::


## Compare point

Many modifiers perform an action when the die rolls either the highest or lowest possible number. Sometimes you may want the modifier to execute on different values, and this is what Compare Points are for.

A compare point is a comparative operator, followed by the number to match against (e.g. `=8`)

The following are valid comparative operators:

```
=   // equal to
!=  // not equal to
<   // less than
>   // greater than
<=  // less than or equal to
>=  // greater than or equal to
```

Wherever you can use compare points, the notation is the same. So if you wanted to check if a number is _"greater than or equal to 5"_, the notation would look like:

```
>=5
```

Here are some examples with full notation strings:

```
d6!=3    // roll a d6 and explode any roll equal to 3
d10!>=5  // roll a d10 and explode on any roll greater than or equal to 5
d6!!>4   // roll a d6 and compound only on rolls greater than 4
d4r<3    // roll a d4 and re-roll anything less than 3
```

::: roll d4r<3 :::
