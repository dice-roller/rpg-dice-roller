<p align="center">
    <img src="https://dice-roller.github.io/documentation/dice-roller-logo.png" alt="RPG Dice Roller" style="max-width: 100%;" width="200"/>
</p>

# RPG Dice Roller

[![npm (scoped)](https://img.shields.io/npm/v/@dice-roller/rpg-dice-roller?label=version)](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)
[![Build Status](https://github.com/dice-roller/rpg-dice-roller/actions/workflows/build.yml/badge.svg)](https://github.com/dice-roller/rpg-dice-roller/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/dice-roller/rpg-dice-roller/badge.svg?branch=main)](https://coveralls.io/github/dice-roller/rpg-dice-roller?branch=main)
![npm type definitions](https://img.shields.io/npm/types/@dice-roller/rpg-dice-roller)
[![License](https://img.shields.io/npm/l/@dice-roller/rpg-dice-roller)](./licence.txt)
[![npm downloads](https://img.shields.io/npm/dm/@dice-roller/rpg-dice-roller)](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)

A JS based dice roller that can roll various types of dice and modifiers, along with mathematical equations.


## Install

```bash
npm install @dice-roller/rpg-dice-roller
```

## Documentation

Check out the documentation at https://dice-roller.github.io/documentation


## Import finished dice results

Use `Roll.import()` to build a roll from finished results, or pass the same data to
`roller.import()` to add it to a history.

```js
import { Roll } from '@dice-roller/rpg-dice-roller';

const roll = Roll.import({
  notation: '3d6kh2 + d8min3 * 2',
  rolls: [
    [6, { value: 3, useInTotal: false, flags: ['drop'] }, 5],
    [{ initialValue: 1, value: 3, flags: ['min'] }],
  ],
});

console.log(roll.total); // 17
```

The importer uses the finished die results in each pool, with no new dice draws or
modifier effects applied to those results. A number is shorthand for an included
die whose original, final and scoring values are all that number. For an object,
`initialValue` and `calculationValue` default to `value`, `useInTotal` defaults to
`true`, and `flags` defaults to `[]`. Flags describe the outcome for presenters.
Use `useInTotal` and `calculationValue` to control scoring. Each pool array contains
its complete final list, including any dice added by modifiers.

List the pool arrays from left to right. For computed expressions, include the parent
pool before pools in its quantity, die arguments and computed modifier quantities
(in modifier execution order). Conditional expressions use pools in the condition and
the selected branch. For a reordered group, supply `groups: { 0: { order: [1, 0] } }`
to display the first group's second member first. Pool arrays stay in source order.
Use `groups[0].members` to override group member scoring by original member index.
Groups are numbered from zero, with parents before their nested groups.

`roll.export()` produces the full versioned snapshot for saving and restoring later.
Exporting a concise import may evaluate the notation separately for the theoretical
minimum and maximum totals, as for an ordinary roll.

## Usage in the wild

### Official

* [Vue components](https://github.com/dice-roller/vue) - For Tailwind, Bootstrap, basic HTML, and renderless
* [Vuepress plugin](https://github.com/dice-roller/vuepress-plugin) - Dice roller plugin used in this documentation
* [CLI](https://github.com/dice-roller/cli) - Command Line Interface for rolling dice


## Contributing

We're always happy for community contributions. You can find our contributing guide in the docs: https://dice-roller.github.io/documentation/contributing


## Licence

This dice roller has been released under the MIT licence, meaning you can do pretty much anything you like with it, so long as the original copyright remains in place.

You **can** use it in commercial products.

If the licence terminology in the licence.txt is confusing, check out this: https://www.tldrlegal.com/license/mit-license
