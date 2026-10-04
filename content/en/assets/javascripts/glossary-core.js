/** Validation and lexical filtering for the authored bilingual glossary. */
import { normalize } from "./text-core.js";

export const GLOSSARY_CATEGORIES = Object.freeze([
  "all",
  "cloud",
  "platform",
  "data",
  "ai",
]);

export function validateGlossary(data) {
  if (
    data?.version !== 1 ||
    !Array.isArray(data.terms) ||
    !data.terms.length ||
    data.terms.length > 200
  ) {
    throw new Error("glossary_format");
  }
  const ids = new Set();
  const abbreviations = new Set();
  const validText = (value) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 1000;
  for (const term of data.terms) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id) || ids.has(term.id))
      throw new Error("glossary_id");
    ids.add(term.id);
    if (!GLOSSARY_CATEGORIES.slice(1).includes(term.category))
      throw new Error("glossary_category");
    if (!Array.isArray(term.aliases) || !term.aliases.every(validText))
      throw new Error("glossary_alias");
    for (const locale of ["en", "es"]) {
      if (
        !["term", "definition", "example", "caveat"].every((key) =>
          validText(term[locale]?.[key]),
        )
      ) {
        throw new Error("glossary_locale");
      }
    }
    if (!validText(term.source?.label)) throw new Error("glossary_source");
    // Optional acronyms for site-wide tooltips: short, unique, bilingual.
    if (term.abbr !== undefined) {
      if (!term.abbr || typeof term.abbr !== "object" || Array.isArray(term.abbr))
        throw new Error("glossary_abbr");
      for (const [key, value] of Object.entries(term.abbr)) {
        if (
          !/^[A-Za-z0-9][A-Za-z0-9]{1,11}$/.test(key) ||
          abbreviations.has(key) ||
          !["en", "es"].every(
            (locale) => validText(value?.[locale]) && value[locale].length <= 80,
          )
        )
          throw new Error("glossary_abbr");
        abbreviations.add(key);
      }
    }
    const source = new globalThis.URL(term.source.url);
    if (source.protocol !== "https:" || source.username || source.password)
      throw new Error("glossary_source");
  }
  for (const term of data.terms) {
    if (
      !Array.isArray(term.related) ||
      !term.related.length ||
      term.related.length > 6 ||
      new Set(term.related).size !== term.related.length ||
      term.related.some((id) => id === term.id || !ids.has(id))
    )
      throw new Error("glossary_related");
    if (
      term.practice &&
      (!/^projects\/tools\/#(?:failure-lab|interactive-[a-z-]+)$/.test(
        term.practice.path,
      ) ||
        !validText(term.practice.en) ||
        !validText(term.practice.es))
    )
      throw new Error("glossary_practice");
  }
  return data.terms;
}

const STOP_WORDS = new Set(
  "a an the what is are how does explain que es son como funciona explica el la los las un una de del en y and me about sobre".split(
    " ",
  ),
);
const words = (text) => normalize(text).match(/[a-z0-9]+/g) || [];

/** Bounded edit distance, including a swapped pair of adjacent letters. */
function nearWord(token, name) {
  if (token.length < 5 || /\d/.test(token)) return false;
  const limit = token.length < 8 ? 1 : 2;
  if (Math.abs(token.length - name.length) > limit) return false;
  let previous = Array.from({ length: name.length + 1 }, (_, i) => i);
  let beforePrevious;
  for (let i = 1; i <= token.length; i++) {
    const row = [i];
    for (let j = 1; j <= name.length; j++) {
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(token[i - 1] !== name[j - 1]),
      );
      if (
        i > 1 && j > 1 &&
        token[i - 1] === name[j - 2] && token[i - 2] === name[j - 1]
      )
        row[j] = Math.min(row[j], beforePrevious[j - 2] + 1);
    }
    beforePrevious = previous;
    previous = row;
  }
  return previous[name.length] <= limit;
}

export function searchGlossary(
  terms,
  query = "",
  category = "all",
  locale = "en",
) {
  const tokens = [
    ...new Set(words(String(query).slice(0, 160)).filter((word) => !STOP_WORDS.has(word))),
  ];
  const language = locale === "es" ? "es" : "en";
  return terms
    .filter((term) => category === "all" || term.category === category)
    .map((term) => {
      const names = words(
        [term.id, term.en.term, term.es.term, ...term.aliases].join(" "),
      );
      const body = words(term[language].definition);
      const scores = tokens.map((token) => {
        if (names.includes(token)) return 4;
        if (token.length > 1 && names.some((name) => name.startsWith(token)))
          return 2;
        if (body.includes(token)) return 1;
        return names.some((name) => nearWord(token, name)) ? 0.5 : 0;
      });
      return {
        term,
        score: scores.reduce((sum, value) => sum + value, 0),
        matches: scores.every(Boolean),
        approximate: scores.includes(0.5),
      };
    })
    .filter(({ matches }) => matches)
    .sort(
      (a, b) =>
        Number(a.approximate) - Number(b.approximate) ||
        b.score - a.score ||
        a.term[language].term.localeCompare(b.term[language].term, language),
    );
}

export function filterGlossary(terms, query = "", category = "all", locale = "en") {
  return searchGlossary(terms, query, category, locale).map(({ term }) => term);
}
