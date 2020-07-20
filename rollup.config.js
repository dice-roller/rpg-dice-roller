import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import banner from 'rollup-plugin-banner';

const { terser } = require('rollup-plugin-terser');
const { eslint } = require('rollup-plugin-eslint');
const path = require('path');

const format = process.env.FORMAT || 'esm';
const production = !process.env.BUILD || (process.env.BUILD === 'prod');
const es6 = format === 'esm';

export default {
  input: 'src/index.js',
  output: {
    file: `lib/${format}/bundle${production ? '.min' : ''}.js`,
    format,
    name: 'rpgDiceRoller',
    // map external dependencies to variables, for UMD builds
    globals: !es6 ? {
      'random-js': 'randomJs',
    } : {},
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
    production ? terser({ keep_classnames: true }) : null,
    banner({
      file: path.join(__dirname, 'banner.txt'),
    }),
  ],
  // indicate which modules should be treated as external
  external: [],
};
