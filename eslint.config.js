import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

const tsFiles = ["src/**/*.ts", "ww1-dogfight/**/*.ts", "test/**/*.ts", "src/**/*.d.ts", "ww1-dogfight/**/*.d.ts", "test/**/*.d.ts"];

export default [
    {
        ignores: ["node_modules/**"],
    },
    js.configs.recommended,
    {
        files: tsFiles,
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        files: ["ww1-dogfight/index.ts", "ww1-dogfight/src/{audio,core,systems,world}/**/*.ts", "ww1-dogfight/src/ui/markers.ts"],
        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
    {
        files: ["src/**/*.d.ts", "test/**/*.d.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
];
