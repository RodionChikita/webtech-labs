import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "calc/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        Node: "readonly",
        Element: "readonly",
      },
    },
    rules: {},
  },
];
