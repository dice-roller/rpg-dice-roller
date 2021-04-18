/* eslint-disable import/no-extraneous-dependencies, no-console */
import fs from 'fs';
import peggy from 'peggy';

const dir = './src/parser/grammars/';
const sourceFilename = 'grammar.pegjs';
const outputFilename = 'grammar.js';

// load the grammar file
const grammar = fs.readFileSync(`${dir}${sourceFilename}`).toString();

// generate the parser (as CommonJS)
const parser = peggy.generate(grammar, { output: 'source', format: 'commonjs' });

// convert parser to ES module
const output = `
import { evaluate } from '../../utilities/math.js';
import * as Dice from '../../dice/index.js';
import * as Modifiers from '../../modifiers/index.js';
import ComparePoint from '../../ComparePoint.js';
import RollGroup from '../../RollGroup.js';

const module = {};

${parser}

export {
  peg$SyntaxError as SyntaxError,
  peg$parse as parse,
};
`;

// create the file
fs.writeFileSync(`${dir}${outputFilename}`, output);

console.log(`Grammar parser saved to: ${dir}${outputFilename}`);
