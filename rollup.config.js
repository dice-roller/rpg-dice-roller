import commonjs from "@rollup/plugin-commonjs";
import license from "rollup-plugin-license";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const production = !process.env.BUILD || process.env.BUILD === "prod";

const inputPath = "src/index.ts";
const outputPath = (format, minify = false) =>
  `lib/${format}/bundle${minify ? ".min" : ""}.js`;
const packageName = "rpgDiceRoller";

/**
 * Hides warnings about circular imports inside dependencies (e.g. mathjs), which we can't fix.
 */
const onwarn = (warning, warn) => {
  if (
    warning.code === "CIRCULAR_DEPENDENCY" &&
    warning.ids?.every((id) => id.includes("node_modules"))
  ) {
    return;
  }

  warn(warning);
};

/**
 * Returns the list of common plugins.
 *
 * @param {boolean} [isProduction=false]
 */
const plugins = (isProduction = false) => [
  // compile TypeScript (type errors fail the build)
  typescript({
    tsconfig: "./tsconfig.json",
    include: ["src/**/*.ts"],
    exclude: ["tests/**"],
    noEmitOnError: true,
  }),
  // resolve third party library imports
  nodeResolve(),
  // handle commonJS modules
  commonjs(),
  // minify for production
  isProduction ? terser({ keep_classnames: true }) : null,
  license({
    banner: {
      content: {
        file: "./banner.txt",
      },
    },
  }),
];

export default [
  // ESM: runtime dependencies stay external, so consumers' bundlers can dedupe and tree-shake them
  {
    input: inputPath,
    output: {
      file: outputPath("esm", production),
      format: "esm",
    },
    plugins: plugins(production),
    external: [/^mathjs(\/.*)?$/, /^random-js(\/.*)?$/],
    onwarn,
  },
  // UMD: self-contained, with only the used parts of mathjs bundled
  {
    input: inputPath,
    output: {
      file: outputPath("umd", production),
      format: "umd",
      name: packageName,
      exports: "named",
    },
    plugins: plugins(production),
    onwarn,
  },
];
