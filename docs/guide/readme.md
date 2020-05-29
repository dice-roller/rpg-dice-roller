# Introduction

This library is a JS based dice roller that can roll various types of dice and modifiers, along with mathematical equations.

It's main purpose is for use in pen and paper RPGs, like Dungeons & Dragons, Pathfinder, Cyberpunk etc., where players have to roll complicated combinations of dice.


## How it works

Dice can be rolled through the use of "notations", which are strings of characters that tell the parser which dice and modifiers to roll.

You can read more about it in the [Notation section](notation/readme.md).


## Features

**Different dice types**

* [Standard dice](notation/dice.md#standard-dn)
* [Percentile dice](notation/dice.md#percentile-dice-d)
* [Fudge / fate dice](notation/dice.md#fudge--fate-dice-df--df2--df1)

**Roll modifiers**

* [Exploding](notation/modifiers.md#exploding---cp)
* [Compounding](notation/modifiers.md#compounding---cp)
* [Penetrating](notation/modifiers.md#penetrating-p--p--pcp--pcp)
* [Drop rolls](notation/modifiers.md#drop-dn--dhn--dln)
* [Keep rolls](notation/modifiers.md#keep-kn--khn--kln)
* [Re-roll](notation/modifiers.md#re-roll-r--ro--rcp--rocp)
* [Target success](notation/modifiers.md#target-success--dice-pool-cp)
* [Target failure](notation/modifiers.md#target-failures--dice-pool-fcp)
* [Sort dice](notation/modifiers.md#sorting-s--sa--sd)

**Mathematical equations**

* [Operators](notation/maths.md#operators)
* [Functions](notation/maths.md#functions)

**Coming soon**

* [Group rolls](notation/group-rolls.md)


## Browser support

This library uses ES6+ and native JS modules, which work in all the latest browsers, and Node.js.

We also provide a bundled UMD version that can be used in environments that don't support ES modules.

We actively support the latest versions of Firefox, Chrome, Opera, Safari, Microsoft Edge, and Node.js.

::: warning Node.js
We recommend Node.js >= 12, but it should work on 11 as well.
There's no guarantee that it will work on older versions.
:::

::: danger Internet Explorer
We do **not** support IE, and the library will **not** work in IE.
:::