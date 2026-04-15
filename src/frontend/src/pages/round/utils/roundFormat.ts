export function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatCategoryLabel(category: string) {
  return category.replace(/-/g, " ");
}
