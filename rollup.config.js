import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'
import del from 'rollup-plugin-delete'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import path from 'path'
import process from 'process'
import * as url from 'url'
import { readFileSync } from 'node:fs'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const tsconfig = path.join(__dirname, './tsconfig.json')
const packagePath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath))

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true
      },
      {
        file: packageJson.browser,
        format: 'iife',
        sourcemap: true
      },
    ],
    plugins: [
      peerDepsExternal({
        includeDependencies: true,
      }),
      resolve({
        extensions: ['.ts', '.tsx'],
      }),
      commonjs(),
      typescript({
        tsconfig,
        sourceMap: true,
        inlineSources: false,
      }),
      sourcemaps(),
      terser(),
    ],
  },
  {
    input: 'dist/esm/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [
      dts({ tsconfig }),
      del({ targets: 'dist/esm/types', hook: 'buildEnd' }),
      del({ targets: 'dist/cjs/types', hook: 'buildEnd' }),
      del({ targets: 'dist/iife/types', hook: 'buildEnd' }),
    ],
  },
]
