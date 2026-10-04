/** Small selectors for topic-first references. Invalid filters fail open. */
export const GROUPS = Object.freeze(["all", "data", "ai", "platform"]);

export function selectEntries(entries, group = "all") {
  if (!GROUPS.includes(group) || group === "all") return [...entries];
  return entries.filter((entry) => entry.group === group);
}

export function groupCounts(entries) {
  return Object.fromEntries(
    GROUPS.map((group) => [group, selectEntries(entries, group).length]),
  );
}
