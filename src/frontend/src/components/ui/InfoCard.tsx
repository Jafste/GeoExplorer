import { Card } from "../layout/card/card";

export type InfoCardItem = {
  label: string;
  value: string;
  span?: "full";
};

type InfoCardProps = InfoCardItem;

export function InfoCard({ label, value, span }: InfoCardProps) {
  return (
    <Card variant="inset" gridColumn={span === "full" ? "1 / -1" : undefined}>
      <span className="muted-eyebrow">{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

export type InfoGridProps = {
  items: InfoCardItem[];
  layout?: "three" | "preview" | "stack";
};

export function InfoGrid({ items, layout = "three" }: InfoGridProps) {
  return (
    <div className={`info-grid info-grid--${layout}`}>
      {items.map((item) => (
        <InfoCard key={item.label} {...item} />
      ))}
    </div>
  );
}
