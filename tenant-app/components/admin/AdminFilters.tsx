"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { DatePicker } from "@/components/ui/DatePicker"

interface AdminFiltersProps {
  setReportsModalOpen: (val: boolean) => void
  setPrintMode: (val: "print" | "app") => void
  setPrintModalOpen: (val: boolean) => void
  handleManagerReportPrint: () => void
  filterDept: string
  setFilterDept: (val: string) => void
  activeDepts: string[]
  filterDate: Date | undefined
  setFilterDate: (val: Date | undefined) => void
  taskDates: string[]
  
  handleSelectAll: () => void
  selectedTasksSize: number
  filteredLength: number
  viewMode: "table" | "cards"
  setViewMode: (val: "table" | "cards") => void
  handlePrintSelected: () => void
  handleSendToApp: () => void
  handleCloseMass: () => void
  handleReturnToOpenMass: () => void
}

export function AdminFilters({
  setReportsModalOpen,
  setPrintMode,
  setPrintModalOpen,
  handleManagerReportPrint,
  filterDept,
  setFilterDept,
  activeDepts,
  filterDate,
  setFilterDate,
  taskDates,
  handleSelectAll,
  selectedTasksSize,
  filteredLength,
  viewMode,
  setViewMode,
  handlePrintSelected,
  handleSendToApp,
  handleCloseMass,
  handleReturnToOpenMass,
}: AdminFiltersProps) {
  return (
    <>
      {/* Main Action Bar */}
      <div className="bg-white py-3 px-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-center gap-4">
        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="text-blue-600 font-bold border-blue-200 hover:bg-blue-50 h-10" onClick={() => setReportsModalOpen(true)}>
            <i className="fas fa-chart-bar ml-2"></i>דוחות
          </Button>
          <div className="flex bg-orange-500 rounded-lg shadow overflow-hidden h-10">
            <button className="px-5 py-2 text-white font-bold hover:bg-orange-600 flex items-center transition-colors h-full" onClick={() => { setPrintMode("print"); setPrintModalOpen(true); }}>
              <i className="fas fa-print ml-2"></i>הדפס
            </button>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-10" onClick={() => { setPrintMode("app"); setPrintModalOpen(true); }}>
            <i className="fas fa-mobile-alt ml-2"></i>WorkerApp
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold h-10" onClick={handleManagerReportPrint}>
            <i className="fas fa-table ml-2"></i>דוח מנהל
          </Button>
        </div>

        <div className="flex-grow"></div>

        {/* Left Side: Filters */}
        <div className="flex flex-wrap gap-4 items-center" dir="rtl">
          <div className="w-64 lg:w-80 z-30 flex items-center gap-2">
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">מחלקה:</label>
            <Select 
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full h-10 rounded-xl border-gray-300 font-medium"
              dir="rtl"
            >
              <option value="ALL">כל המחלקות</option>
              {activeDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          </div>
          <div className="w-48 z-40 flex items-center gap-2">
            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">תאריך:</label>
            <DatePicker 
              value={filterDate}
              onChange={setFilterDate}
              taskDates={taskDates}
            />
          </div>
          <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 h-10" onClick={() => { setFilterDept("ALL"); setFilterDate(undefined); }}>
            נקה סינון
          </Button>
        </div>
      </div>

      {/* Mass Actions */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
        <Button variant="outline" className="w-28 flex-shrink-0" onClick={handleSelectAll}>
          {selectedTasksSize === filteredLength && filteredLength > 0 ? "בטל בחירה" : "בחר הכל"}
        </Button>
        
        <Button variant="outline" className="text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm border-gray-300" onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}>
          {viewMode === "cards" ? <><i className="fas fa-list ml-2"></i> תצוגת רשימה</> : <><i className="fas fa-th-large ml-2"></i> תצוגת כרטיסיות</>}
        </Button>

        <div className="w-px h-8 bg-gray-200 mx-2"></div>
        
        <Button onClick={handlePrintSelected}>
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          הדפס נבחרים ({selectedTasksSize})
        </Button>
        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleSendToApp}>
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          שייך לאפליקציה (WorkerApp) ({selectedTasksSize})
        </Button>
        <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={handleCloseMass}>
          <i className="fas fa-check ml-2"></i> סגור נבחרים ({selectedTasksSize})
        </Button>

        <div className="flex-grow"></div>
        
        <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-orange-50" onClick={handleReturnToOpenMass}>
          <i className="fas fa-undo ml-2"></i> חזור לפתוח
        </Button>
      </div>
    </>
  )
}
