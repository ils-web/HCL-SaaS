import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const finalId = id || generatedId

    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        <input
          type="checkbox"
          id={finalId}
          ref={ref}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={finalId}
            className="text-sm font-medium leading-none cursor-pointer text-gray-700"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
