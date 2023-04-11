import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import banner from 'rollup-plugin-banner';
// import eslint from '@rollup/plugin-eslint';

const { terser } = require('rollup-plugin-terser');
const path = require('path');

const production = !process.env.BUILD || (process.env.BUILD === 'prod');

const inputPath = 'src/index.js';
const outputPath = (format, minify = false) => `lib/${format}/bundle${minify ? '.min' : ''}.js`;
const packageName = 'rpgDiceRoller';
const globals = {
  'random-js': 'Random',
};

/**
 * Returns a list of common plugins
 *
 * @param {boolean} [isUmd=false]
 * @param {boolean} [isProduction=false]
 * @returns {{}}
 */
const plugins = (isUmd = false, isProduction = false) => [
  // lint the files (Currently broken because plugin uses an old version of eslint)
  // eslint(),
  // resolve third party library imports
  nodeResolve(),
  // handle commonJS modules
  commonjs(),
  // only use babel if we're compiling to UMD
  isUmd ? babel({
    exclude: 'node_modules/**',
  }) : null,
  // minify for production
  isProduction ? terser({ keep_classnames: true }) : null,
  banner({
    file: path.join(__dirname, 'banner.txt'),
  }),
];

export default [
  // ESM
  {
    input: inputPath,
    output: {
      file: outputPath('esm', production),
      format: 'esm',
      // map external dependencies to variables
      globals,
    },
    plugins: plugins(false, production),
  },
  // UMD
  {
    input: inputPath,
    output: {
      file: outputPath('umd', production),
      format: 'umd',
      name: packageName,
      // map external dependencies to variables
      globals,
    },
    plugins: plugins(true, production),
    // indicate which modules should be treated as external
    external: ['random-js'],
  },
];
