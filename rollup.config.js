import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
const { terser } = require('rollup-plugin-terser');
const { eslint } = require('rollup-plugin-eslint');
import babel from 'rollup-plugin-babel';

const format = process.env.FORMAT || 'esm';
const production = !process.env.BUILD || (process.env.BUILD === 'prod');
const es6 = format === 'esm';

export default {
  input: 'src/index.js',
  output: {
    file: `lib/${format}/bundle${production ? '.min' : ''}.js`,
    format: format,
    name: 'rpgDiceRoller',
  },
  plugins: [
    // lint the files
    eslint(),
    // resolve third party library imports
    resolve(),
    // handle commonJS modules
    commonjs(),
    !es6 ? babel({
      exclude: 'node_modules/**',
    }) : null,
    // minify for production
    production ? terser() : null,
  ],
};
