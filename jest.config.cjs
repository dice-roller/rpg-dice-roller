/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    // `.js` is included for the generated (ES module) parser
    "^.+\\.[jt]s$": [
      "ts-jest",
      { tsconfig: { allowJs: true, isolatedModules: true } },
    ],
  },
  // source files import each other with `.js` extensions
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  coverageThreshold: {
    global: {
      statements: 99.19,
      branches: 97.49,
      functions: 93.83,
      lines: 99.17,
    },
  },
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/parser/generated/**",
  ],
};
