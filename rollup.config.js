import path from 'path'
import process from 'process'
import * as url from 'url'
import { readFileSync } from 'node:fs'

import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const __dirname = url.fileURLToPath(new url.URL('.', import.meta.url))

const tsconfig = path.join(__dirname, './tsconfig.json')
const packagePath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath))

// https://gist.github.com/aleclarson/9900ed2a9a3119d865286b218e14d226

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
})

export default [
  bundle({
    plugins: [esbuild({ tsconfig, minify: true })],
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [dts({ tsconfig })],
    output: {
      file: packageJson.types,
      format: 'esm',
    },
  }),
]
