import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true,
        }),
    ],
    build: {
        target: "esnext",
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext",
        },
    },
    define: {
        "process.env": {},
    },
    resolve: {
        alias: {
            crypto: "crypto-browserify",
            process: "process/browser",
            stream: "stream-browserify",
            zlib: "browserify-zlib",
            util: "util",
        },
    },
});
