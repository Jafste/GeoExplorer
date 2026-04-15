// src/components/layout/card/CardSlot.tsx
import type React from "react";
import { Card, type CardProps } from "./card";

export const CardSlot: React.FC<CardProps> = ({
  title,
  children,
  className,
  contentClassName,
}) => {
  return (
    <div className="w-full h-full">
      <Card
        title={title}
        contentClassName={contentClassName}
        className={[
          "flex h-full flex-col text-left",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </Card>
    </div>
  );
};
