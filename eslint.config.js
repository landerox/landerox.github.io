/**
 * ESLint flat config for the site's native ES modules and Node tests.
 * Only globals the code uses bare are declared; others go through
 * `window.` or `globalThis.`, so `no-undef` stays meaningful.
 */

// The 64 rules of `@eslint/js` 10.0.1 `configs.recommended`, written out.
// The pre-commit hook exposes its packages through NODE_PATH, which ESM
// imports ignore, so `import js from "@eslint/js"` cannot resolve here (the
// same limit as the Stylelint config). Compare this list with the package
// when the eslint pin moves; see docs/runbook.md.
const RECOMMENDED = [
  "constructor-super",
  "for-direction",
  "getter-return",
  "no-async-promise-executor",
  "no-case-declarations",
  "no-class-assign",
  "no-compare-neg-zero",
  "no-cond-assign",
  "no-const-assign",
  "no-constant-binary-expression",
  "no-constant-condition",
  "no-control-regex",
  "no-debugger",
  "no-delete-var",
  "no-dupe-args",
  "no-dupe-class-members",
  "no-dupe-else-if",
  "no-dupe-keys",
  "no-duplicate-case",
  "no-empty",
  "no-empty-character-class",
  "no-empty-pattern",
  "no-empty-static-block",
  "no-ex-assign",
  "no-extra-boolean-cast",
  "no-fallthrough",
  "no-func-assign",
  "no-global-assign",
  "no-import-assign",
  "no-invalid-regexp",
  "no-irregular-whitespace",
  "no-loss-of-precision",
  "no-misleading-character-class",
  "no-new-native-nonconstructor",
  "no-nonoctal-decimal-escape",
  "no-obj-calls",
  "no-octal",
  "no-prototype-builtins",
  "no-redeclare",
  "no-regex-spaces",
  "no-self-assign",
  "no-setter-return",
  "no-shadow-restricted-names",
  "no-sparse-arrays",
  "no-this-before-super",
  "no-unassigned-vars",
  "no-undef",
  "no-unexpected-multiline",
  "no-unreachable",
  "no-unsafe-finally",
  "no-unsafe-negation",
  "no-unsafe-optional-chaining",
  "no-unused-labels",
  "no-unused-private-class-members",
  "no-unused-vars",
  "no-useless-assignment",
  "no-useless-backreference",
  "no-useless-catch",
  "no-useless-escape",
  "no-with",
  "preserve-caught-error",
  "require-yield",
  "use-isnan",
  "valid-typeof",
];

export default [
  {
    languageOptions: {
      // Matches the `es2023` target in jsconfig.json.
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        fetch: "readonly",
        // Scheme, header and shadow-root observers.
        MutationObserver: "readonly",
        // Zensical's instant-navigation observable.
        document$: "readonly",
      },
    },
    // Every rule is an error, and the hook passes --max-warnings 0.
    rules: {
      ...Object.fromEntries(RECOMMENDED.map((name) => [name, "error"])),
      "no-console": "off",
      // Stricter than recommended, which ignores nothing but also reports
      // less: undeclared equality and reassigned bindings are bugs here.
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
