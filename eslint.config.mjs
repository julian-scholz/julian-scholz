// eslint.config.mjs
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintPluginTypeScript from "@typescript-eslint/eslint-plugin";
import eslintAngular from "angular-eslint";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

export default [
  {
    files: ["**/*.ts"],
    processor: eslintAngular.processInlineTemplates,
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true
      }
    },
    plugins: {
      "@typescript-eslint": eslintPluginTypeScript
    },
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules
    },
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: eslintAngular.templateParser
    },
    plugins: {
      "@angular-eslint/template": eslintAngular.templatePlugin
    },
    rules: {
      ...eslintAngular.configs.recommended
    }
  },
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {lineBreakStyle: "unix"}]
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/styles.css",
      }
    }
  }
];
