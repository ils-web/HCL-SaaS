"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TaskCard, type Task } from "@/components/ui/TaskCard"
import { SidebarBanner } from "@/components/ui/SidebarBanner"
import { MasonryGrid } from "@/components/ui/MasonryGrid"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Checkbox } from "@/components/ui/Checkbox"
import { Modal } from "@/components/ui/Modal"
import { toast } from "@/components/ui/Toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { format } from "date-fns"

export default function AdminReactPage() {
  const router = useRouter()
  
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [workers, setWorkers] = React.useState<{id:string, name:string}[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tenantId, setTenantId] = React.useState<string | null>(null)
  
  // Modals & Print
  const [printModalOpen, setPrintModalOpen] = React.useState(false)
  const [printLang, setPrintLang] = React.useState("he")
  const [printWorker, setPrintWorker] = React.useState("")
  const [printMode, setPrintMode] = React.useState<"print" | "app">("print")
  
  // Filters
  const [currentTab, setCurrentTab] = React.useState("ALL")
  const [filterDept, setFilterDept] = React.useState("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)
  
  // Selection
  const [selectedTasks, setSelectedTasks] = React.useState<Set<number>>(new Set())

  const workerStats = React.useMemo(() => {
    const stats: Record<string, { total: number, done: number }> = {}
    tasks.forEach(t => {
      const w = t.worker || "לא שויך"
      if (!stats[w]) stats[w] = { total: 0, done: 0 }
      stats[w].total++
      if (t.status === "הושלם" || t.status === "סגור") stats[w].done++
    })
    return Object.entries(stats).map(([name, data]) => ({
      name,
      value: `${data.done} / ${data.total}`
    }))
  }, [tasks])

  // Load data
  const loadTasks = React.useCallback(async (overrideTenantId?: string) => {
    const role = localStorage.getItem("hcl_role")
    const paramTenantId = new URLSearchParams(window.location.search).get("tenantId")
    const localTenantId = localStorage.getItem("hcl_tenantId")
    
    let tId = overrideTenantId || localTenantId
    if (!overrideTenantId && role === "SUPERADMIN" && paramTenantId) {
      tId = paramTenantId
    }

    if (!tId) {
      // Dev mode auto-fallback
      try {
        const devRes = await fetch("/api/dev/default-tenant")
        if (devRes.ok) {
          const devData = await devRes.json()
          if (devData.tenantId) {
            tId = devData.tenantId
            localStorage.setItem("hcl_tenantId", tId)
          }
        }
      } catch (e) {
        console.warn("Could not fetch default dev tenant")
      }
    }

    if (!tId) {
      setLoading(false)
      setTenantId(null) // Make sure tenantId is null so we can show the prompt
      return
    }
    setTenantId(tId)
    setLoading(true)

    try {
      const res = await fetch(`/api/${tId}?action=getOpenTasks`)
      const data = await res.json()
      if (data.tasks) {
        setTasks(data.tasks)
      } else {
        toast("שגיאה בטעינת נתונים", "error")
        setTasks([])
      }

      // Also load workers
      const settingsRes = await fetch(`/api/${tId}?action=getSettings`)
      const settingsData = await settingsRes.json()
      if (settingsData.workers) {
        setWorkers(settingsData.workers)
      }
    } catch (e) {
      console.error(e)
      toast("שגיאת תקשורת", "error")
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const activeTabs = Array.from(new Set(tasks.map(t => t.sheet).filter(Boolean)))
  if (currentTab !== "ALL" && !activeTabs.includes(currentTab) && activeTabs.length > 0) {
    setCurrentTab("ALL")
  }

  const activeDepts = Array.from(new Set(tasks.map(t => t.dept).filter(Boolean)))

  // Compute task dates for calendar dots
  const taskDates = new Set<string>()
  tasks.forEach(t => {
    if (t.dateStr && t.dateStr.includes("/")) {
      const p = t.dateStr.split(" ")[0].split("/")
      if (p.length >= 3) {
        taskDates.add(`${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`)
      }
    }
  })

  let filtered = tasks
  if (currentTab !== "ALL") {
    filtered = filtered.filter(t => t.sheet === currentTab)
  }
  if (filterDept !== "ALL") {
    filtered = filtered.filter(t => t.dept === filterDept)
  }
  if (filterDate) {
    const filterIso = format(filterDate, "yyyy-MM-dd")
    filtered = filtered.filter(t => {
      if (!t.dateStr || !t.dateStr.includes("/")) return false
      const p = t.dateStr.split(" ")[0].split("/")
      if (p.length < 3) return false
      const taskIso = `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`
      return taskIso === filterIso
    })
  }
  if (searchQuery) {
    const sq = searchQuery.toLowerCase()
    filtered = filtered.filter(t => 
      (t.room && t.room.toLowerCase().includes(sq)) || 
      (t.defect && t.defect.toLowerCase().includes(sq)) || 
      (t.comment && t.comment.toLowerCase().includes(sq)) ||
      (t.dept && t.dept.toLowerCase().includes(sq)) ||
      (t.worker && t.worker.toLowerCase().includes(sq))
    )
  }

  // Sort: QR tasks first
  filtered.sort((a, b) => {
    const aIsQr = (a.defect.includes("דיווח") || a.defect.includes("תקלה חדשה") || a.inspector.includes("צוות")) ? 1 : 0
    const bIsQr = (b.defect.includes("דיווח") || b.defect.includes("תקלה חדשה") || b.inspector.includes("צוות")) ? 1 : 0
    return bIsQr - aIsQr
  })

  // Handlers
  const handleToggleCheck = (id: number) => {
    const newSet = new Set(selectedTasks)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedTasks(newSet)
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === filtered.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filtered.map(t => t.id)))
    }
  }

  const handleAction = async (id: number, actionType: string, bodyData: any = {}) => {
    const tId = tenantId || localStorage.getItem("hcl_tenantId") || new URLSearchParams(window.location.search).get("tenantId")
    if (!tId) return
    try {
      const res = await fetch(`/api/${tId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, ...bodyData })
      })
      const data = await res.json()
      if (data.status === "success") {
        toast(`פעולה בוצעה בהצלחה`, "success")
        loadTasks()
      } else {
        toast("שגיאה בביצוע פעולה", "error")
      }
    } catch (e) {
      toast("שגיאת תקשורת", "error")
    }
  }

  const handleApprove = (id: number) => handleAction(id, "CLOSE_TASK", { id })
  const handleReturnToOpen = (id: number) => handleAction(id, "UNMARK_PRINTED", { tasks: [{id}] })
  
  const handlePrintSelected = () => {
    if (selectedTasks.size === 0) return toast("לא נבחרו משימות", "error")
    setPrintMode("print")
    setPrintModalOpen(true)
  }
  
  const handleSendToApp = () => {
    if (selectedTasks.size === 0) return toast("לא נבחרו משימות", "error")
    setPrintMode("app")
    setPrintModalOpen(true)
  }

  const executeOutputSequence = async () => {
    if (!tenantId) return
    setPrintModalOpen(false)
    const selectedList = tasks.filter(t => selectedTasks.has(t.id))
    const tasksToUpdate = selectedList.map(t => ({ id: t.id }))
    
    // Call MARK_PRINTED API
    const res = await fetch(`/api/${tenantId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_PRINTED", tasks: tasksToUpdate, worker: printWorker })
    })
    const data = await res.json()
    if (data.status === "success") {
      toast(printMode === "print" ? "נשלח להדפסה" : "נשלח לאפליקציה (WorkerApp)", "success")
      setSelectedTasks(new Set())
      loadTasks()
      // In a full implementation, this is where window.print() or PDF generation would happen for printMode === 'print'
      if (printMode === "print") {
        setTimeout(() => {
            alert("פונקציית ההדפסה במצב פיתוח: המשימות סומנו 'מודפס/בעבודה' במסד הנתונים, אך פלט המדפסת ישולב בגרסה הבאה.")
        }, 500)
      }
    } else {
      toast("שגיאה בביצוע פעולה", "error")
    }
  }

  if (!tenantId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-key"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">חסר זיהוי לקוח</h2>
          <p className="text-gray-500 mb-6 text-sm">הזן את ה-Tenant ID שלך כדי להמשיך (למשל: test-tenant)</p>
          <input 
            type="text" 
            id="manualTenantInput"
            className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-center font-mono" 
            placeholder="Tenant ID..." 
          />
          <Button className="w-full" onClick={() => {
            const val = (document.getElementById('manualTenantInput') as HTMLInputElement).value;
            if (val) {
              localStorage.setItem("hcl_tenantId", val);
              loadTasks(val);
            }
          }}>
            המשך
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8" dir="rtl">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-10 object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
          <h1 className="text-2xl font-black text-gray-800">פאנל ניהול (React)</h1>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap lg:flex-nowrap justify-end">
          <div className="w-full lg:w-64 ml-auto lg:ml-4">
            <Input 
              placeholder="חפש חדר, תקלה, עובד..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-gray-200 h-10"
            />
          </div>
          <Button variant="outline" onClick={loadTasks} disabled={loading}>
            <svg className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            רענן נתונים
          </Button>
          <Button variant="danger" onClick={() => { localStorage.clear(); window.location.href = '/' }}>
            התנתק
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col 2xl:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full 2xl:w-64 shrink-0 z-0">
          <SidebarBanner 
            title="סטטוס משימות"
            items={workerStats}
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          
          {(() => {
            const unstartedCount = tasks.filter(t => t.status !== "בעבודה" && t.status !== "מודפס" && t.status !== "הושלם" && t.status !== "סגור").length
            let delayedCount = 0
            tasks.forEach(t => {
              if ((t.status === "בעבודה" || t.status === "מודפס") && t.dateStr) {
                const p = t.dateStr.split(" ")[0]?.split("/")
                const tm = t.dateStr.split(" ")[1] ? t.dateStr.split(" ")[1].split(":") : ["00", "00"]
                if (p && p.length === 3) {
                  const taskDate = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]), parseInt(tm[0]), parseInt(tm[1]))
                  const diffHours = (new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60)
                  if (diffHours >= 48) delayedCount++
                }
              }
            })
            if (unstartedCount === 0 && delayedCount === 0) return null
            return (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-5 shadow-sm text-center">
                <div className="text-red-500 font-black mb-3 text-lg flex items-center justify-center gap-2">
                  <i className="fas fa-exclamation-triangle"></i> משימות דחופות
                </div>
                {unstartedCount > 0 && (
                  <div className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-red-100">
                    <div className="text-2xl font-black text-red-600">{unstartedCount}</div>
                    <div className="text-sm font-bold text-red-800">טרם יצאו לעבודה</div>
                  </div>
                )}
                {delayedCount > 0 && (
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-orange-100">
                    <div className="text-2xl font-black text-orange-600">{delayedCount}</div>
                    <div className="text-sm font-bold text-orange-800">בעבודה מעל 48 שעות</div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto space-y-6">
          
          {/* TAB BAR (Departments) */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b mb-6 no-scrollbar">
            <button 
              onClick={() => setCurrentTab("ALL")}
              className={`px-4 py-2 whitespace-nowrap transition-colors ${currentTab === "ALL" ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold bg-white' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              הכל
            </button>
            {activeTabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-4 py-2 whitespace-nowrap transition-colors ${currentTab === tab ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold bg-white' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                {tab.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* FILTERS & SEARCH */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
            <div className="w-48 z-40">
              <label className="block text-sm font-bold text-gray-700 mb-1">תאריך</label>
              <DatePicker 
                value={filterDate}
                onChange={setFilterDate}
                taskDates={taskDates}
              />
            </div>
            <div className="w-48 z-30">
              <label className="block text-sm font-bold text-gray-700 mb-1">מחלקה</label>
              <Select 
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full h-12 rounded-xl border-gray-300 font-medium"
                dir="rtl"
              >
                <option value="ALL">כל המחלקות</option>
                {activeDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Mass Actions */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
            <Button variant="outline" onClick={handleSelectAll}>
              {selectedTasks.size === filtered.length && filtered.length > 0 ? "בטל בחירה" : "בחר הכל"}
            </Button>
            <div className="w-px h-8 bg-gray-200 mx-2"></div>
            <Button onClick={handlePrintSelected}>
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              הדפס נבחרים ({selectedTasks.size})
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handleSendToApp}>
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              שייך לאפליקציה (WorkerApp)
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {activeTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={cn(
                  "px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all shadow-sm",
                  currentTab === tab 
                    ? "bg-blue-600 text-white shadow-md transform -translate-y-0.5" 
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                )}
              >
                {tab.replace(/_/g, " ")}
              </button>
            ))}
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
          ) : (
            <MasonryGrid>
              {filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  checked={selectedTasks.has(task.id)}
                  onToggleCheck={handleToggleCheck}
                  onApprove={handleApprove}
                  onReturnToOpen={handleReturnToOpen}
                />
              ))}
            </MasonryGrid>
          )}

        </div>
      </div>

      {/* Print/Worker Modal */}
      <Modal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} title={printMode === "print" ? "הגדרות הדפסה" : "שיוך לאפליקציית עובד"}>
        <div className="space-y-4">
          {printMode === "print" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">שפת הדפסה</label>
              <Select value={printLang} onChange={e => setPrintLang(e.target.value)}>
                <option value="he">עברית</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">שיוך לעובד (אופציונלי)</label>
            <Select value={printWorker} onChange={e => setPrintWorker(e.target.value)}>
              <option value="">-- ללא שיוך מיוחד --</option>
              {workers.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="pt-4 flex gap-3">
            <Button className="w-full" onClick={executeOutputSequence}>אישור</Button>
            <Button variant="outline" className="w-full" onClick={() => setPrintModalOpen(false)}>ביטול</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
