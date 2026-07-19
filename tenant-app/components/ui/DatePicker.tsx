"use client"

import * as React from "react"
import Flatpickr from "react-flatpickr"
import { Hebrew } from "flatpickr/dist/l10n/he.js"
import "flatpickr/dist/flatpickr.min.css"
import { format } from "date-fns"

export interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  taskDates?: Set<string> // Set of ISO date strings like '2026-07-13'
}

export function DatePicker({ value, onChange, taskDates = new Set() }: DatePickerProps) {
  return (
    <div className="relative w-full">
      <Flatpickr
        value={value || ""}
        onChange={(dates) => onChange(dates[0])}
        options={{
          locale: Hebrew,
          dateFormat: "Y-m-d",
          allowInput: false,
          disableMobile: true,
          onDayCreate: function(dObj, dStr, fp, dayElem) {
            const dateStr = format(dayElem.dateObj, "yyyy-MM-dd")
            if (taskDates.has(dateStr)) {
              dayElem.classList.add("has-tasks-dot")
            }
          }
        }}
        className="w-full h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-700 font-medium hover:border-gray-400 transition-colors text-right cursor-pointer"
        placeholder="בחר תאריך..."
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <i className="far fa-calendar-alt"></i>
      </div>
      {/* CSS for dots */}
      <style dangerouslySetInnerHTML={{__html: `
        .flatpickr-day.has-tasks-dot::after {
            content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
            width: 5px; height: 5px; background-color: #4f46e5; border-radius: 50%;
        }
      `}} />
    </div>
  )
}
