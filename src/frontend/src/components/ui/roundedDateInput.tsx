import React from "react";
import { RoundedInput, type RoundedInputProps } from "./roundedInput";

type Mode = "date" | "datetime" | "time";

const MODE_TO_TYPE: Record<Mode, string> = {
  date: "date",
  datetime: "datetime-local",
  time: "time",
};

export type RoundedDateInputProps = Omit<RoundedInputProps, "type" | "inputMode"> & {
  mode?: Mode;
};

export const RoundedDateInput = React.forwardRef<HTMLInputElement, RoundedDateInputProps>(
  ({ mode = "date", className, ...props }, ref) => {
    return (
      <RoundedInput
        ref={ref}
        type={MODE_TO_TYPE[mode]}
        className={[
          // Helps make the native picker look closer to your inputs
          // (especially the icon spacing / text baseline)
          "[&::-webkit-calendar-picker-indicator]:opacity-70 " +
            "dark:[&::-webkit-calendar-picker-indicator]:invert " +
            "dark:[&::-webkit-calendar-picker-indicator]:opacity-80",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

RoundedDateInput.displayName = "RoundedDateInput";