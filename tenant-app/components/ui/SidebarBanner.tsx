"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarBannerProps {
  title: string
  items?: React.ReactNode[]
  icon?: React.ReactNode
  onPrint?: () => void
  className?: string
}

export function SidebarBanner({ title, items = [], icon, onPrint, className }: SidebarBannerProps) {
  return (
    <div
      className={cn(
        "hidden 2xl:flex sticky top-8 w-64 bg-white/40 backdrop-blur-sm border border-white/40 shadow-sm rounded-3xl p-5 flex-col shrink-0 z-0",
        className
      )}
      dir="rtl"
    >
      <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {onPrint && (
          <button
            onClick={onPrint}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="הדפס סטטיסטיקה"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700">
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400 italic text-center py-4">אין נתונים</div>
        )}
      </div>
    </div>
  )
}
