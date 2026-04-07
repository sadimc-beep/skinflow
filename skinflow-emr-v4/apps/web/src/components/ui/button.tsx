import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#C4A882]/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#1C1917] text-[#F7F3ED] hover:bg-[#2E2A25] shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-[#D9D0C5] bg-[#F7F3ED] text-[#1C1917] hover:bg-[#EDE7DC] hover:border-[#C4A882] shadow-sm",
        secondary:
          "bg-[#E8E1D6] text-[#1C1917] hover:bg-[#D9D0C5]",
        ghost:
          "text-[#78706A] hover:bg-[#E8E1D6] hover:text-[#1C1917]",
        link: "text-[#1C1917] underline-offset-4 hover:underline hover:text-[#C4A882]",
      },
      size: {
        default: "h-9 px-5 py-2",
        xs: "h-6 rounded-full px-2.5 text-xs gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-full px-4 text-xs gap-1.5",
        lg: "h-11 rounded-full px-7 text-sm",
        icon: "size-9 rounded-full",
        "icon-xs": "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
