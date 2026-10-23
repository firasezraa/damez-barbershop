import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, requiredIndicator, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none flex items-center gap-1",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {requiredIndicator && (
          <span className="text-primary font-bold" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);
Label.displayName = "Label";
