module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/parser/grammars/(generate|grammar).js',
    // temporarily ignore until Roll Groups are functional
    '<rootDir>/src/RollGroup.js',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.[jt]s?(x)',
  ],
};
