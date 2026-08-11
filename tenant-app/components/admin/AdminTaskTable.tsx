"use client"

import * as React from "react"
import { TaskCard, type Task } from "@/components/ui/TaskCard"

interface AdminTaskTableProps {
  activeTabs: string[]
  tasks: Task[]
  currentTab: string
  setCurrentTab: (tab: string) => void
  loading: boolean
  filtered: Task[]
  viewMode: "table" | "cards"
  selectedTasks: Set<string>
  handleToggleCheck: (id: string) => void
  handleApprove: (id: string) => void
  handleReturnToOpen: (id: string) => void
  teams: any[]
  handleTeamChange: (taskId: string, teamId: string) => void
  handleEditDefect: (id: string) => void
}

export function AdminTaskTable({
  activeTabs,
  tasks,
  currentTab,
  setCurrentTab,
  loading,
  filtered,
  viewMode,
  selectedTasks,
  handleToggleCheck,
  handleApprove,
  handleReturnToOpen,
  teams,
  handleTeamChange,
  handleEditDefect,
}: AdminTaskTableProps) {
  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {activeTabs.map(tab => {
          const hasNewTasks = tasks.some(t => t.sheet === tab && t.status === "פתוח")
          return (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`relative px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all shadow-sm ${
              currentTab === tab 
                ? "bg-blue-600 text-white shadow-md transform -translate-y-0.5" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab.replace(/_/g, " ")}
            {hasNewTasks && (
              <span className="absolute top-1 right-1 flex h-3 w-3 -mt-1 -mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>
        )})}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">טוען נתונים...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-bold text-lg">אין משימות להצגה</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px]">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-gray-500 font-bold w-12 text-center"><i className="fas fa-check-square"></i></th>
                <th className="p-3 text-gray-500 font-bold">תאריך</th>
                <th className="p-3 text-gray-500 font-bold">מחלקה</th>
                <th className="p-3 text-gray-500 font-bold text-indigo-700">חדר</th>
                <th className="p-3 text-gray-500 font-bold">מערכת / ליקוי</th>
                <th className="p-3 text-gray-500 font-bold">הערות</th>
                <th className="p-3 text-gray-500 font-bold">סטטוס</th>
                <th className="p-3 text-gray-500 font-bold text-orange-900">עובד</th>
                <th className="p-3 text-gray-500 font-bold text-center">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const isCompleted = task.status === "הושלם"
                const isPrinted = task.status === "בעבודה" || task.status === "מודפס"
                const rowClass = isCompleted ? "bg-green-50/50" : (isPrinted ? "bg-orange-50/30" : "")
                const isQr = task.defect.includes("דיווח מהמחלקה") || task.defect.includes("תקלה חדשה") || task.inspector.includes("צוות")

                return (
                  <tr key={task.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${rowClass}`}>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 cursor-pointer"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleToggleCheck(task.id)}
                      />
                    </td>
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{task.dateStr}</td>
                    <td className="p-3 font-bold text-sm">{task.dept}</td>
                    <td className="p-3 font-bold text-indigo-700 text-sm">{task.room}</td>
                    <td className="p-3 font-bold text-sm text-gray-900">
                      {task.defect}
                      {isQr && <span className="text-pink-600 ml-1" title="QR"><i className="fas fa-qrcode"></i></span>}
                    </td>
                    <td className="p-3 text-gray-500 text-sm max-w-[200px] truncate" title={task.comment || ''}>{task.comment || ''}</td>
                    <td className="p-3">
                      {isCompleted ? (
                        <span className="text-green-700 font-bold text-xs bg-green-200 px-2 py-1 rounded"><i className="fas fa-check-double"></i> טיפול הושלם</span>
                      ) : isPrinted ? (
                        <span className="text-orange-700 font-bold text-xs bg-orange-100 px-2 py-1 rounded flex items-center gap-1 w-max">
                          {task.isSentToApp ? <i className="fas fa-mobile-alt text-blue-600"></i> : <i className="fas fa-print text-orange-600"></i>}
                          בביצוע
                        </span>
                      ) : (
                        <span className="text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded">פתוח</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-xs text-orange-900">{task.worker || ''}</td>
                    <td className="p-3 text-center">
                      {isCompleted ? (
                         <button onClick={() => handleApprove(task.id)} className="bg-green-50 text-green-600 border border-green-500 px-3 py-1 rounded-lg font-bold text-xs hover:bg-green-100"><i className="fas fa-check"></i> אושר</button>
                      ) : (
                         <button onClick={() => handleApprove(task.id)} className="bg-blue-50 text-blue-600 border border-blue-500 px-3 py-1 rounded-lg font-bold text-xs hover:bg-blue-100"><i className="fas fa-check"></i> סגור</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full min-h-[600px]">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              checked={selectedTasks.has(task.id)}
              onToggleCheck={handleToggleCheck}
              onApprove={handleApprove}
              onReturnToOpen={handleReturnToOpen}
              teams={teams}
              onChangeTeam={handleTeamChange}
              onEditDefect={handleEditDefect}
            />
          ))}
        </div>
      )}
    </>
  )
}
