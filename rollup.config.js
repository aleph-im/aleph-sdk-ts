import path from 'path'
import process from 'process'
import * as url from 'url'
import { readFileSync } from 'node:fs'

import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'
import del from 'rollup-plugin-delete'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const tsconfig = path.join(__dirname, './tsconfig.json')
const packagePath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath))

function getIIFEName(module = packageJson.name) {
  if (!module.startsWith('@aleph-sdk/')) return module
  const [, id] = module.replace(/-/g, '_').split('/')
  return `alephSdk${id.substring(0, 1).toUpperCase()}${id.substring(1).toLowerCase()}`
}

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
      peerDepsExternal({
        includeDependencies: true,
      }),
      resolve({
        extensions: ['.ts'],
        preferBuiltins: true,
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
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.browser,
        format: 'iife',
        sourcemap: true,
        inlineDynamicImports: true,
        name: getIIFEName(packageJson.name),
        globals: getIIFEName,
      },
    ],
    plugins: [
      nodePolyfills(),
      json(),
      peerDepsExternal({
        // @note: false on iife
        includeDependencies: false,
      }),
      resolve({
        // @note: added .js and browser: true on iife
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
      sourcemaps(),
      terser(),
    ],
    onwarn: (warning, next) => {
      if (warning.code === 'CIRCULAR_DEPENDENCY' && (
        warning.message.indexOf('stream') !== -1 ||
        warning.message.indexOf('node_modules/') !== -1
      )) return
      next(warning);
    },
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
