import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import license from 'rollup-plugin-license';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const path = require('path');

const production = !process.env.BUILD || (process.env.BUILD === 'prod');

const inputPath = 'src/index.ts';
const outputDir = 'dist';
const packageName = 'rpgDiceRoller';
const globals = {
  mathjs: 'math',
  'random-js': 'Random',
};

const buildOutputPath = (format, minify = false) => `${outputDir}/${format}/bundle${minify ? '.min' : ''}.js`;

/**
 * Returns a list of common plugins
 *
 * @param {boolean} [isUmd=false]
 * @param {boolean} [isProduction=false]
 * @returns {{}}
 */
const getPlugins = (isUmd = false, isProduction = false) => [
  typescript(),
  // resolve third party library imports
  nodeResolve(),
  // only use babel if we're compiling to UMD
  isUmd ? babel({
    exclude: 'node_modules/**',
  }) : null,
  // minify for production
  isProduction ? terser({ keep_classnames: true }) : null,
  license({
    banner: {
      content: {
        file: path.join(__dirname, 'banner.txt'),
      },
    },
  }),
];

export default [
  // ESM
  {
    input: inputPath,
    output: {
      file: buildOutputPath('esm', production),
      format: 'es',
    },
    plugins: getPlugins(false, production),
    // indicate which modules should be treated as external
    external: ['mathjs'],
  },
  // UMD
  {
    input: inputPath,
    output: {
      file: buildOutputPath('umd', production),
      format: 'umd',
      name: packageName,
      // map external dependencies to variables
      globals,
    },
    plugins: getPlugins(true, production),
    // indicate which modules should be treated as external
    external: ['mathjs', 'random-js'],
  },
];
