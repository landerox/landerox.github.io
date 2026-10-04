/** Scenario links: state lives in the URL fragment, which browsers never send
 * to the server. `#tool-id?key=value` keeps plain `#tool-id` links working.
 * The query is percent-encoded twice because the theme decodes the whole
 * fragment once and uses it in a selector: after that decode no quote,
 * backslash or newline may remain.
 */
export const SHARE_LIMIT = 6000;
const KEY = /^[a-z][a-z0-9-]{0,23}$/;

/** Split a fragment into the element id and its first value per valid key. */
export function parseToolHash(hash = "") {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const split = raw.indexOf("?");
  const params = new Map();
  const query = split >= 0;
  let id;
  try {
    id = decodeURIComponent(query ? raw.slice(0, split) : raw);
  } catch {
    return { id: "", params, query };
  }
  if (query && raw.length <= SHARE_LIMIT)
    for (const [key, value] of new globalThis.URLSearchParams(
      raw.slice(split + 1).replaceAll("%25", "%"),
    ))
      if (KEY.test(key) && !params.has(key)) params.set(key, value);
  return { id, params, query };
}

/** Build `#id?…` from [key, value] pairs, skipping empty values. */
export function toolHash(id, entries) {
  const query = new globalThis.URLSearchParams();
  for (const [key, value] of entries) {
    if (!KEY.test(key)) throw new Error("share_key");
    if (value !== undefined && value !== null && value !== "")
      query.append(key, String(value));
  }
  const text = query.toString().replaceAll("%", "%25");
  const hash = `#${encodeURIComponent(id)}${text ? `?${text}` : ""}`;
  if (hash.length > SHARE_LIMIT) throw new Error("share_size");
  return hash;
}
