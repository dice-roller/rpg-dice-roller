import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import banner from 'rollup-plugin-banner';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
// import eslint from '@rollup/plugin-eslint';

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
  // lint the files (Currently broken because plugin uses an old version of eslint)
  // eslint(),
  typescript(),
  // resolve third party library imports
  nodeResolve(),
  // handle commonJS modules
  // @todo I don't think this is needed anymore, as we don't have any commonJS dependencies
  commonjs({ extensions: ['.js', '.ts'] }),
  // only use babel if we're compiling to UMD
  isUmd ? babel({
    exclude: 'node_modules/**',
  }) : null,
  // minify for production
  isProduction ? terser({ keep_classnames: true }) : null,
  // @todo replace this
  banner({
    file: path.join(__dirname, 'banner.txt'),
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
