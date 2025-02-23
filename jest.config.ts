import { createDefaultPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultPreset({
  // options...
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.[jt]s',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/parser/grammars/(generate|grammar).[jt]s',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.[jt]s?(x)',
  ],
}

export default jestConfig
