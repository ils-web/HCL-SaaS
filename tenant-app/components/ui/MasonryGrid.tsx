"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MasonryGridProps {
  children: React.ReactNode[]
  className?: string
}

export function MasonryGrid({ children, className }: MasonryGridProps) {
  // Simple CSS columns based masonry
  // Tailwind handles the columns (e.g. columns-1 md:columns-2 lg:columns-3)
  return (
    <div
      className={cn(
        "columns-1 lg:columns-2 xl:columns-3 gap-4 space-y-4",
        className
      )}
      dir="rtl"
    >
      {React.Children.map(children, (child) => (
        <div className="break-inside-avoid">
          {child}
        </div>
      ))}
    </div>
  )
}
