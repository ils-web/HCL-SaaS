"use client"
import React, { useEffect, useState } from "react"

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=32.08&longitude=34.78&current_weather=true")
      .then(res => res.json())
      .then(data => {
        if (data && data.current_weather) {
          setWeather(data.current_weather)
        }
      })
      .catch(e => console.error("Weather fetch failed", e))
  }, [])

  if (!weather) return null

  // WMO Weather code mapping
  const code = weather.weathercode
  let icon = "fa-cloud-sun"
  let color = "text-blue-400"
  let bg = "bg-blue-50/50"
  let border = "border-blue-100/50"
  let text = "מעונן חלקית"

  if (code === 0 || code === 1) {
    icon = "fa-sun"
    color = "text-yellow-500"
    bg = "bg-yellow-50/50"
    border = "border-yellow-100/50"
    text = "בהיר"
  } else if (code === 2 || code === 3) {
    icon = "fa-cloud"
    color = "text-gray-400"
    bg = "bg-gray-50/50"
    border = "border-gray-200/50"
    text = "מעונן"
  } else if (code >= 51 && code <= 69) {
    icon = "fa-cloud-rain"
    color = "text-blue-500"
    bg = "bg-blue-50/50"
    border = "border-blue-200/50"
    text = "גשם"
  } else if (code >= 71 && code <= 79) {
    icon = "fa-snowflake"
    color = "text-cyan-400"
    bg = "bg-cyan-50/50"
    border = "border-cyan-200/50"
    text = "שלג"
  } else if (code >= 95) {
    icon = "fa-bolt"
    color = "text-yellow-600"
    bg = "bg-yellow-50/50"
    border = "border-yellow-200/50"
    text = "סופת רעמים"
  }

  return (
    <div className={`p-4 rounded-2xl shadow-sm border ${bg} ${border} flex items-center justify-between transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${color} shadow-sm border border-white/50`}>
          <i className={`fas ${icon} text-xl`}></i>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm">מזג אוויר עכשיו</span>
          <span className="text-xs text-gray-500">{text}</span>
        </div>
      </div>
      <div className="text-2xl font-black text-gray-800" style={{ direction: "ltr" }}>
        {Math.round(weather.temperature)}°
      </div>
    </div>
  )
}
