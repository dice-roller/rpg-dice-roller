module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/parser/grammars/(generate|grammar).js',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.[jt]s?(x)',
  ],
};
