// eslint.config.mjs
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintParserAngular from "angular-eslint";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true
      }
    },
    processor: eslintParserAngular.processInlineTemplates
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: eslintParserAngular.templateParser
    }
  },
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,

      "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {lineBreakStyle: "windows"}]
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/styles.css",
      }
    }
  }
];
