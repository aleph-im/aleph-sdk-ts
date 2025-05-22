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
  coverageReporters: ['text-summary', 'html'],
}
