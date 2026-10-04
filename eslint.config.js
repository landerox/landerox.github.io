/**
 * ESLint flat config for the site's native ES modules and Node tests.
 * Only globals the code uses bare are declared; others go through
 * `window.` or `globalThis.`, so `no-undef` stays meaningful.
 */
export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
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
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-console": "off",
      "no-constant-condition": "error",
      "no-empty": "error",
    },
  },
];
