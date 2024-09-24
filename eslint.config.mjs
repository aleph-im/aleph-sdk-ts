import { fixupConfigRules } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/node_modules/", "**/dist/", "**/docs/"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
)), {
    settings: {
        "import/resolver": {
            node: {
                paths: ["packages/**"],
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
            },
        },

        "import/ignore": ["./node_modules", "./dist"],
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "off",

        "import/order": ["error", {
            "newlines-between": "always",
            groups: [["builtin", "external"], ["internal"]],

            pathGroups: [{
                pattern: "react",
                group: "external",
                position: "before",
            }, {
                pattern: "@/**",
                group: "internal",
                position: "before",
            }],

            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },
        }],
    },
}, {
    files: ["examples/**/*.{ts,tsx}"],
    rules: {
        "import/no-unresolved": "off",
    },
}];