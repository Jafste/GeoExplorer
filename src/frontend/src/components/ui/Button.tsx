import * as React from "react";

export type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button ref={ref} className={className} type={type} {...props} />
  )
);

ButtonBase.displayName = "ButtonBase";

export type IconButtonProps = Omit<ButtonBaseProps, "aria-label"> & {
  label: string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, label, title, ...props }, ref) => (
    <ButtonBase ref={ref} aria-label={label} title={title ?? label} {...props}>
      {children}
    </ButtonBase>
  )
);

IconButton.displayName = "IconButton";
