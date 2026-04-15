export function smartMatch(haystack: string, query: string): boolean {
  const normalizedHaystack = haystack.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  if (normalizedHaystack.includes(normalizedQuery)) {
    return true;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => normalizedHaystack.includes(token))) {
    return true;
  }

  let queryIndex = 0;

  for (const character of normalizedHaystack) {
    if (character === normalizedQuery[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === normalizedQuery.length) {
        return true;
      }
    }
  }

  return false;
}
