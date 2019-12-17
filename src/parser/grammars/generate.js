import fs from 'fs';
import pegjs from 'pegjs';

const dir = './src/parser/grammars/';
const filename = 'grammar.js';

// load the grammar
const grammar = fs.readFileSync(`${dir}grammar.pegjs`).toString();

// generate the parser
const parser = pegjs.generate(grammar, {output: 'source'});

let output = `import * as Dice from '../../Dice.js';
import * as Modifiers from '../../Modifiers.js';
import ComparePoint from '../../ComparePoint.js';
import RollGroup from '../../RollGroup.js';

const parser = ${parser};

export default parser`;

fs.writeFileSync(`${dir}${filename}`, output);
