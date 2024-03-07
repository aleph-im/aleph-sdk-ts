import path from 'path'
import process from 'process'
import * as url from 'url'
import { readFileSync } from 'node:fs'

import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'

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
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      nodePolyfills(),
      json(),
      peerDepsExternal({
        includeDependencies: true,
      }),
      resolve({
        extensions: ['.ts', '.js', '.mjs'],
        preferBuiltins: true,
        browser: true,
      }),
      commonjs(),
      typescript({
        tsconfig,
        sourceMap: true,
        inlineSources: false,
      }),
      terser(),
    ],
  },
]
