#!/usr/bin/env node

import { DiceRoller } from '../lib/esm/bundle.js';

const roller = new DiceRoller();

const roll = (...notations) => {
  roller.roll(...notations);

  console.log(`${roller.log.join(`\n`)}`);
};

const notations = process.argv.slice(2);

if (notations.length === 0) {
  console.error('No notation specified');
  process.exit(1);
}

roll(...notations);
