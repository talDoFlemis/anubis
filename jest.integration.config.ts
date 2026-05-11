import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.integration-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/database/testing/global-setup.ts',
  globalTeardown: '<rootDir>/database/testing/global-teardown.ts',
  testTimeout: 120_000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^src/(.*)$': '<rootDir>/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@users/(.*)$': '<rootDir>/users/$1',
    '^@professors/(.*)$': '<rootDir>/professors/$1',
  },
};

export default config;
