import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    loading ? "ui-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} disabled={disabled || loading} className={classes}>
      {loading ? "Loading..." : children}
    </button>
  );
}