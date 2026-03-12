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
};

export default config;
