import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "amber-glow";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const buttonVariants = ({
  variant = "primary",
  size = "default",
  className = "",
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98] shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30",
    "amber-glow":
      "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98] shadow-lg shadow-primary/35 ring-1 ring-primary/50",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-[#8C582B] active:scale-[0.98] shadow-sm",
    outline:
      "border border-border bg-surface/50 text-foreground hover:bg-surface hover:border-primary/50 active:scale-[0.98]",
    ghost:
      "text-foreground hover:bg-surface hover:text-primary active:scale-[0.98]",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
  };

  const sizeStyles = {
    default: "h-12 px-6 py-3 min-h-[48px]",
    sm: "h-10 px-4 py-2 min-h-[40px] text-xs",
    lg: "h-14 px-8 py-4 min-h-[52px] text-base font-bold",
    icon: "size-12 min-h-[48px] min-w-[48px] p-0",
  };

  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
