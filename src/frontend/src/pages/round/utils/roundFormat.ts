const CATEGORY_LABELS: Record<string, string> = {
  "bridge-view": "Vista de ponte",
  "canal-city": "Cidade de canais",
  "civic-building": "Edifício cívico",
  fortress: "Fortificação",
  "historic-core": "Centro histórico",
  landmark: "Marco urbano",
  "mountain-town": "Paisagem em relevo",
  "natural-landscape": "Paisagem natural",
  plaza: "Praça urbana",
  riverfront: "Frente ribeirinha",
  stadium: "Estádio",
  "street-level-panorama": "Panorama 360",
  "urban-park": "Parque urbano",
  waterfront: "Margem marítima",
};

export function formatCategoryLabel(category: string) {
  const mapped = CATEGORY_LABELS[category];
  if (mapped) {
    return mapped;
  }

  return category
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
