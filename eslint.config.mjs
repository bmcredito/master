import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "eslint-config-next";

export default [
  ...nextPlugin,
  { ignores: [".next/**", "node_modules/**"] },
  { files: ["**/*.ts", "**/*.tsx"], languageOptions: { parser: tsParser }, plugins: { "@typescript-eslint": tseslint } }
];
