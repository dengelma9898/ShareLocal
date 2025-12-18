import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-dark))] active:scale-[0.98] shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-sm hover:shadow-md",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px] md:h-10 md:min-h-0",
        sm: "h-10 rounded-md px-3 text-xs min-h-[44px] md:h-8 md:min-h-0",
        lg: "h-12 rounded-md px-8 text-base min-h-[44px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] md:h-10 md:w-10 md:min-h-0 md:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    // Wenn asChild=true, können wir isLoading nicht verwenden (Slot erwartet nur ein Kind)
    if (asChild && isLoading) {
      console.warn('Button: isLoading wird nicht unterstützt wenn asChild=true')
    }
    
    const Comp = asChild ? Slot : "button"
    
    // Wenn asChild, rendere nur children (Slot erwartet nur ein Kind)
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    // Normale Button-Rendering mit Loading-State
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "min-w-[120px]"
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className={cn(
          "transition-opacity duration-300 ease-in-out inline-flex items-center",
          isLoading && "opacity-0"
        )}>
          {children}
        </span>
        <span className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
