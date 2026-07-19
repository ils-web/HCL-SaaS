"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info"

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

class ToastManager {
  private toasts: ToastMessage[] = []
  private listeners: Set<(toasts: ToastMessage[]) => void> = new Set()

  addToast(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).substring(2, 9)
    this.toasts = [...this.toasts, { id, message, type }]
    this.notify()

    setTimeout(() => {
      this.removeToast(id)
    }, 4000)
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.notify()
  }

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getToasts() {
    return this.toasts
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts))
  }
}

export const toastManager = new ToastManager()

export function toast(message: string, type: ToastType = "info") {
  toastManager.addToast(message, type)
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  React.useEffect(() => {
    return toastManager.subscribe((newToasts) => {
      setToasts(newToasts)
    })
  }, [])

  return (
    <div className="fixed bottom-5 left-5 z-[110] flex flex-col gap-2 max-w-sm w-full pointer-events-none" dir="rtl">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "p-4 rounded-xl shadow-lg text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto",
            {
              "bg-green-600": t.type === "success",
              "bg-red-600": t.type === "error",
              "bg-blue-600": t.type === "info",
            }
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
