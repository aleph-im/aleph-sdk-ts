import path from 'path'
import { createDefaultPreset } from 'ts-jest'
import * as url from 'url'

const __dirname = url.fileURLToPath(new url.URL('.', import.meta.url))

const tsconfig = path.join(__dirname, './tsconfig.json')

const tsJestTransformCfg = createDefaultPreset({ tsconfig }).transform

/** @type {import("jest").Config} **/
export default {
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ['<rootDir>/cypress/'],
  coverageReporters: ['text-summary', 'html', 'lcov'],
  transformIgnorePatterns: ['/node_modules/'],
  // Limit the number of workers to prevent CPU overload
  maxWorkers: '50%',
  // Enable caching (should be on by default, but explicitly set)
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Avoid transforming unnecessary files
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/examples/', '<rootDir>/.worktrees/'],
  moduleNameMapper: {
    '^@aleph-sdk/(.*)$': '<rootDir>/packages/$1/src',
  },
}
