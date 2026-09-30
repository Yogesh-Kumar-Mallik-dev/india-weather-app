import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 font-bold",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 font-bold",
        outline: "text-foreground border-border/80",
        saffron:
          "border-[#FF9933]/30 bg-[#FF9933]/15 text-amber-300 font-bold",
        green:
          "border-[#138808]/30 bg-[#138808]/20 text-emerald-300 font-bold",
        navy:
          "border-blue-500/30 bg-blue-500/15 text-blue-300 font-bold",
        severe:
          "border-red-500/40 bg-red-950/60 text-red-200 font-bold animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
