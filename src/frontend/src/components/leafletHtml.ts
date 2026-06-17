const LEAFLET_HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeLeafletHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => LEAFLET_HTML_ESCAPE_MAP[character] ?? character);
}
