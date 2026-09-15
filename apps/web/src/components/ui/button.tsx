import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("button", `button--${variant}`, `button--${size}`, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-hidden="true" /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
}

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: ButtonSize;
  variant?: "ghost" | "outline" | "secondary";
  children: ReactNode;
};

export function IconButton({ label, size = "md", variant = "ghost", className, children, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn("icon-button", `icon-button--${variant}`, `icon-button--${size}`, className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
