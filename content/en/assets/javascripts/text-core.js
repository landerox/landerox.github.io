/** Shared accent-insensitive normalization; no worksheet dependencies. */
export const normalize = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
