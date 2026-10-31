import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintPluginTypeScript from "@typescript-eslint/eslint-plugin";
import eslintAngular from "angular-eslint";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import eslintPluginStylistic from "@stylistic/eslint-plugin";

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
      "@typescript-eslint": eslintPluginTypeScript,
      "@stylistic": eslintPluginStylistic
    },
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules,
      ...eslintPluginStylistic.configs.customize({
        semi: true,
        braceStyle: "1tbs",
        arrowParens: true,
        quoteProps: "as-needed",
        jsx: false
      }).rules,
      "@stylistic/quotes": ["error", "single", {avoidEscape: true, allowTemplateLiterals: "always"}],
      "@stylistic/operator-linebreak": ["error", "after", {overrides: {"?": "before", ":": "before", "|": "before"}}],
      "@stylistic/lines-between-class-members": "off"
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
      "better-tailwindcss/enforce-consistent-line-wrapping": ["warn", {lineBreakStyle: "unix"}],
      "better-tailwindcss/no-unknown-classes": ["warn", {ignore: ["^modal-body$", "^book-cover$"]}]
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/styles.css",
      }
    }
  }
];
