import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-50 text-indigo-700 border border-indigo-100",
        secondary:
          "bg-slate-100 text-slate-600 border border-slate-200",
        destructive:
          "bg-red-50 text-red-600 border border-red-100",
        outline:
          "border border-current text-foreground bg-transparent",
        ghost:
          "bg-transparent text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        // Semantic status variants
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-100",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-100",
        purple:
          "bg-violet-50 text-violet-700 border border-violet-100",
        blue:
          "bg-blue-50 text-blue-700 border border-blue-100",
        orange:
          "bg-orange-50 text-orange-700 border border-orange-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
