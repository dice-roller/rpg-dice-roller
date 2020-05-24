---
sidebarDepth: 2
---

# Get Started

## Install

* NPM:
    ```bash
    npm install rpg-dice-roller
    ```
* Yarn:
    ```bash
    yarn add rpg-dice-roller
    ```
* CDN
    [![JSDelivr](https://data.jsdelivr.com/v1/package/npm/rpg-dice-roller/badge)](https://www.jsdelivr.com/package/npm/rpg-dice-roller)
    
    ```html
    <script src="https://cdn.jsdelivr.net/npm/rpg-dice-roller@VERSION/lib/umd/bundle.min.js"></script>
    ```


## Setup

### ES modules

You can import the dice roller and use it in your application, using ES standard modules like so:

```js
// import only the DiceRoller class
import { DiceRoller } from 'lib/esm/bundle.js';
// or in nodeJS using ES modules
import { DiceRoller } from 'rpg-dice-roller';

// create a new instance of the DiceRoller
const roller = new DiceRoller();
```

Rather than specifying the individual components, you can import everything like so:

```js
// import everything and store it on the `rpgDiceRoller` scope
import * as rpgDiceRoller from 'lib/esm/bundle.js';
// or in nodeJS using ES modules
import * as rpgDiceRoller from 'rpg-dice-roller';

// create a DiceRoller
const roller = new rpgDiceRoller.DiceRoller();

// create a DiceRoll
const roll = new rpgDiceRoller.DiceRoll('2d6');
```


### NodeJS / UMD

::: tip
If you're using Node.js >= 12 and are using [ES modules](https://nodejs.org/api/esm.html) (`import`) instead of CommonJS (`require`) follow the [ES modules](#es-modules) examples above.
:::

You can also load the library using CommonJS, AMD, etc.

Instead of the ESM file (`lib/esm/bundle.js`), you should use the UMD file (`lib/umd/bundle.js`).

Here is an example in Node.js:

```js
// require the dice-roller library
const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle.js');

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


### Older Browsers

We support _some_ [older browsers](readme.md#browser-support) *(Not IE)* without Module support.

Instead of the ESM file (`lib/esm/bundle.js`), you **must** use the UMD file (`lib/umd/bundle.min.js`). You can either download the file locally, or use the [CDN](#install)

All uses of the library classes and objects **must** be accessed from the `rpgDiceRoller` namespace.

```html
<!-- download the file locally -->
<script src="lib/umd/bundle.min.js"></script>
<!-- or use the CDN -->
<script src="https://cdn.jsdelivr.net/npm/rpg-dice-roller@VERSION/lib/umd/bundle.min.js"></script>

<script>
  // create a new instance of the DiceRoller
  var diceRoller = new rpgDiceRoller.DiceRoller();
</script>
```
