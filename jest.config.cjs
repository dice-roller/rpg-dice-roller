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
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/parser/generated/**",
  ],
};
