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
import { dts } from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const tsconfig = path.join(__dirname, './tsconfig.json')
const packagePath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath))
const packageName = packageJson.name.split('/').pop()

const fixSourcemap = () => {
  // Fix sourcemap paths like this
  // ../../packages/<packageName>/src/types/base.ts
  // to
  // ../../src/types/base.ts
  return {
    name: 'fix-multi-package-sourcemap',
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        const file = bundle[fileName]
        if (file.map) {
          file.map.sources = file.map.sources.map((source) => {
            return source.replace(`../../packages/${packageName}/src`, `../../src`)
          })
        }
        if (fileName.endsWith('.map')) {
          const sourceMap = JSON.parse(file.source)
          sourceMap.sources = sourceMap.sources.map((source) => {
            return source.replace(`../../packages/${packageName}/src`, `../../src`)
          })
          file.source = JSON.stringify(sourceMap)
        }
      }
    },
  }
}

export default [
  {
    external: ['dns'],
    input: 'src/index.ts',
    output: [
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
        inlineSources: true,
        exclude: ['**/__tests__', '**/*.test.ts'],
      }),
      fixSourcemap(),
      terser(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      json(),
      peerDepsExternal({
        includeDependencies: true,
      }),
      resolve({
        extensions: ['.ts', '.js', '.mjs'],
        preferBuiltins: true,
        browser: false,
      }),
      commonjs(),
      typescript({
        tsconfig,
        sourceMap: true,
        inlineSources: true,
        exclude: ['**/__tests__', '**/*.test.ts'],
      }),
      fixSourcemap(),
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
    ],
  },
]
