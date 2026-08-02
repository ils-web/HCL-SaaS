"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TaskCard, type Task } from "@/components/ui/TaskCard"
import { SidebarBanner } from "@/components/ui/SidebarBanner"
import { WeatherWidget } from "@/components/ui/WeatherWidget"
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
  const [workers, setWorkers] = React.useState<{id:string, name:string, teamId?:string}[]>([])
  const [categories, setCategories] = React.useState<any>(null)
  const [systemTeams, setSystemTeams] = React.useState<Record<string, string>>({})
  const [teams, setTeams] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tenantId, setTenantId] = React.useState<string | null>(null)
  
  // Modals & Print
  const [printModalOpen, setPrintModalOpen] = React.useState(false)
  const [printLang, setPrintLang] = React.useState("he")
  const [printWorker, setPrintWorker] = React.useState("")
  const [printMode, setPrintMode] = React.useState<"print" | "app">("print")
  
  // Print State for Reports
  const [printDocumentData, setPrintDocumentData] = React.useState<{title: string, data: any[], type: 'manager' | 'reports'} | null>(null);
  const [printCardsData, setPrintCardsData] = React.useState<any[] | null>(null);

  // Custom Modals
  const [confirmModalData, setConfirmModalData] = React.useState<{isOpen: boolean, title: string, onConfirm: () => void}>({isOpen: false, title: "", onConfirm: () => {}});
  const [promptModalData, setPromptModalData] = React.useState<{isOpen: boolean, title: string, value: string, onConfirm: (val: string) => void}>({isOpen: false, title: "", value: "", onConfirm: () => {}});
  const [reportsModalOpen, setReportsModalOpen] = React.useState(false);
  const [reportsData, setReportsData] = React.useState<any[]>([]);
  const [reportsStart, setReportsStart] = React.useState("");
  const [reportsEnd, setReportsEnd] = React.useState("");
  const [isReportsLoading, setIsReportsLoading] = React.useState(false);

  const confirmAction = (title: string, onConfirm: () => void) => {
    setConfirmModalData({ isOpen: true, title, onConfirm });
  };

  const promptAction = (title: string, onConfirm: (val: string) => void) => {
    setPromptModalData({ isOpen: true, title, value: "", onConfirm });
  };

  const loadReports = async () => {
    if (!reportsStart || !reportsEnd) return toast("יש לבחור תאריכים", "error");
    setIsReportsLoading(true);
    try {
      const res = await fetch(`/api/${tenantId}?action=getReports&startDate=${reportsStart}&endDate=${reportsEnd}`);
      const data = await res.json();
      setReportsData(data.tasks || []);
    } catch(e) {
      toast("שגיאה בטעינת דוחות", "error");
    } finally {
      setIsReportsLoading(false);
    }
  };

  const handlePrintReports = () => {
    setPrintDocumentData({ title: `דוח פחת / חריגים (${reportsStart || 'הכל'} עד ${reportsEnd || 'הכל'})`, data: reportsData, type: 'reports' });
    setTimeout(() => {
      window.print();
      setPrintDocumentData(null);
    }, 500);
  };

  const handleManagerReportPrint = () => {
    const selDate = filterDate || 'כל התאריכים';
    const selDept = filterDept || 'כל המחלקות';
    setPrintDocumentData({ title: `דוח מנהל - ${selDept} (${selDate})`, data: filtered, type: 'manager' });
    setTimeout(() => {
      window.print();
      setPrintDocumentData(null);
    }, 500);
  };

  const [qrModalOpen, setQrModalOpen] = React.useState(false)
  const [workerQrModalOpen, setWorkerQrModalOpen] = React.useState(false)
  const [workerQrGeneratedUrl, setWorkerQrGeneratedUrl] = React.useState("")
  const [configModalOpen, setConfigModalOpen] = React.useState(false)
  const [teamsModalOpen, setTeamsModalOpen] = React.useState(false)
  const [workersModalOpen, setWorkersModalOpen] = React.useState(false)
  
  const [qrDept, setQrDept] = React.useState("")
  const [qrCustomDept, setQrCustomDept] = React.useState("")
  const [qrGeneratedUrl, setQrGeneratedUrl] = React.useState("")
  const [tenantName, setTenantName] = React.useState("מוסד לבדיקה")
  
  // Integrations State
  const [integrationsModalOpen, setIntegrationsModalOpen] = React.useState(false)
  const [telegramBotToken, setTelegramBotToken] = React.useState("")
  const [telegramChatId, setTelegramChatId] = React.useState("")
  const [whatsappInstance, setWhatsappInstance] = React.useState("")
  const [whatsappToken, setWhatsappToken] = React.useState("")
  
  const [activeConfigArea, setActiveConfigArea] = React.useState<string | null>(null)
  
  // Filters
  const [currentTab, setCurrentTab] = React.useState("ALL")
  const [filterDept, setFilterDept] = React.useState("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)
  // View Mode
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards")
  
  // Selection
  const [selectedTasks, setSelectedTasks] = React.useState<Set<number>>(new Set())

  // Clear selections when any filter changes
  React.useEffect(() => {
    setSelectedTasks(new Set())
  }, [currentTab, filterDept, filterDate, searchQuery])

  const workerStats = React.useMemo(() => {
    const stats: Record<string, { total: number, done: number }> = {}
    tasks.forEach(t => {
      const w = t.worker || "ללא שיוך"
      if (!stats[w]) stats[w] = { total: 0, done: 0 }
      stats[w].total++
      if (t.status === "בוצע") stats[w].done++
    })
    return Object.entries(stats).map(([w, s]) => (
      <div key={w} className="flex justify-between text-sm items-center border-b border-gray-100 pb-1">
        <span className="font-semibold text-indigo-900">{w}</span>
        <span className="bg-indigo-100 text-indigo-700 px-2 rounded-full text-xs font-bold">{s.done}/{s.total}</span>
      </div>
    ))
  }, [tasks])

  const warningStats = React.useMemo(() => {
    let notStarted = 0;
    let over48h = 0;
    const now = new Date();

    tasks.forEach(t => {
      if (t.status === "פתוח" || t.status === "ממתין") {
        notStarted++;
      }
      
      if (t.status === "בעבודה" && t.dateStr && t.dateStr.includes("/")) {
        const p = t.dateStr.split(" ")[0].split("/");
        const tm = t.dateStr.split(" ")[1] ? t.dateStr.split(" ")[1].split(":") : ["00", "00"];
        const taskDate = new Date(
          parseInt(p[2]), 
          parseInt(p[1]) - 1, 
          parseInt(p[0]), 
          parseInt(tm[0]), 
          parseInt(tm[1])
        );
        const diffMs = now.getTime() - taskDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours > 48) {
          over48h++;
        }
      }
    });

    const items = [];
    if (notStarted > 0) items.push(<div key="not-started" className="flex justify-between text-rose-600 font-bold"><span>טרם יצאו לעבודה:</span><span>{notStarted}</span></div>);
    if (over48h > 0) items.push(<div key="over-48h" className="flex justify-between text-amber-600 font-bold"><span>בטיפול מעל 48 שעות:</span><span>{over48h}</span></div>);
    if (items.length === 0) items.push(<div key="all-good" className="text-emerald-500 font-bold text-center">אין חריגות, עבודה מעולה!</div>);

    return items;
  }, [tasks]);

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
            if (tId) localStorage.setItem("hcl_tenantId", tId)
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

      // Also load settings
      const settingsRes = await fetch(`/api/${tId}?action=getSettings`)
      const settingsData = await settingsRes.json()
      if (settingsData.workers) {
        setWorkers(settingsData.workers)
      }
      if (settingsData.categories) setCategories(settingsData.categories)
      if (settingsData.systemTeams) setSystemTeams(settingsData.systemTeams)
      if (settingsData.teamsData) setTeams(settingsData.teamsData)
      if (settingsData.tenantName) setTenantName(settingsData.tenantName)
      
      if (settingsData.telegramBotToken) setTelegramBotToken(settingsData.telegramBotToken)
      if (settingsData.telegramChatId) setTelegramChatId(settingsData.telegramChatId)
      if (settingsData.whatsappInstance) setWhatsappInstance(settingsData.whatsappInstance)
      if (settingsData.whatsappToken) setWhatsappToken(settingsData.whatsappToken)
      
      // Auto select first dept for QR if available
      if (settingsData.categories?.departments && Object.keys(settingsData.categories.departments).length > 0) {
        setQrDept(Object.keys(settingsData.categories.departments)[0])
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
    // Trigger the 48-hour rule check
    fetch("/api/cron").catch(() => {})
  }, [loadTasks])

  const activeTabs = Array.from(new Set([
    ...teams.map((t: any) => t.name),
    ...tasks.map(t => t.sheet)
  ].filter(Boolean)))
  
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

  let filtered = tasks.filter(t => t.status !== "סגור")
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
    const allFilteredIds = filtered.map(t => t.id);
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedTasks.has(id));
    
    const newSet = new Set(selectedTasks);
    if (allSelected) {
      // Deselect all visible
      allFilteredIds.forEach(id => newSet.delete(id));
    } else {
      // Select all visible
      allFilteredIds.forEach(id => newSet.add(id));
    }
    setSelectedTasks(newSet);
  }

  const handleAction = async (id: number, actionType: string, bodyData: any = {}) => {
    const tId = tenantId || localStorage.getItem("hcl_tenantId") || new URLSearchParams(window.location.search).get("tenantId")
    if (!tId) return
    try {
      const res = await fetch(`/api/${tId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, taskId: id, ...bodyData })
      })
      const data = await res.json()
      if (data.tenantId) setTenantId(data.tenantId)
      if (data.status === "success") {
        setTeams(data.teams || [])
        setTasks(data.tasks || [])
        loadTasks()
      } else {
        toast(data.message || "שגיאה", "error")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleTeamChange = async (id: number, teamName: string) => {
    await handleAction(id, "MOVE_TASK", { teamName })
  }

  const handleEditDefect = async (id: number) => {
    promptAction("ערוך בעיה (תיאור התקלה):", async (newVal) => {
      if (newVal !== null && newVal.trim() !== "") {
        await handleAction(id, "EDIT_DEFECT", { newDefect: newVal.trim() })
      }
    });
  }
  const handleApprove = (id: number) => handleAction(id, "CLOSE_TASK", { id })
  const handleReturnToOpen = (id: number) => handleAction(id, "UNMARK_PRINTED", { tasks: [{id}] })
  const handleReturnToOpenMass = () => {
    if (selectedTasks.size === 0) return toast("לא נבחרו משימות", "error")
    confirmAction("להחזיר את כל המשימות הנבחרות לסטטוס פתוח?", () => {
      handleAction(0, "UNMARK_PRINTED", { tasks: Array.from(selectedTasks).map(id => ({id})) })
      setSelectedTasks(new Set())
    });
  }
  const handleCloseMass = () => {
    if (selectedTasks.size === 0) return toast("לא נבחרו משימות", "error")
    confirmAction("האם לסגור את המשימות הנבחרות?", () => {
      handleAction(0, "CLOSE_TASK", { tasks: Array.from(selectedTasks).map(id => ({id})) })
      setSelectedTasks(new Set())
    });
  }
  
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

  const executeOutputSequence = async (eOrSkip?: React.MouseEvent | boolean) => {
    const skipConfirmation = typeof eOrSkip === "boolean" ? eOrSkip : false;
    if (!tenantId) return
    const allSelectedList = tasks.filter(t => selectedTasks.has(t.id))
    
    // Only 'פתוח' (NEW) tasks should be marked in-progress or assigned to worker app.
    const validToUpdate = allSelectedList.filter(t => t.status === "פתוח")
    
    if (allSelectedList.length > validToUpdate.length && !skipConfirmation) {
      confirmAction("שים לב! בחרת משימות שכבר נמצאות בטיפול. הן לא יודפסו שוב ולא ישלחו לאפליקציה. האם להמשיך עם שאר המשימות (או לבטל)?", () => {
        executeOutputSequence(true);
      });
      return;
    }
    
    setPrintModalOpen(false)

    if (validToUpdate.length === 0) {
      toast("אין משימות חדשות להדפסה", "error")
      return
    }

    const taskIds = validToUpdate.map(t => t.id)
    const tasksToUpdate = validToUpdate.map(t => ({ id: t.id }))
    
    if (printMode === "app") {
      // SEND_TO_APP API logic
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_TO_APP", taskIds: taskIds, workerName: printWorker })
      })
      const data = await res.json()
      if (data.status === "success") {
        toast("נשלח לאפליקציה (WorkerApp)", "success")
        setSelectedTasks(new Set())
        loadTasks()
      } else {
        toast("שגיאה בשליחה", "error")
      }
    } else {
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_PRINTED", tasks: tasksToUpdate, worker: printWorker })
      })
      const data = await res.json()
      if (data.status === "success") {
        toast("סומן בהצלחה", "success")
        setSelectedTasks(new Set())
        loadTasks()
        
        let finalSelectedList = [...validToUpdate];
        
        if (printLang !== 'he') {
           try {
             const trRes = await fetch(`/api/${tenantId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "TRANSLATE_TASKS", targetLang: printLang, tasks: validToUpdate.map(t => ({ id: t.id, defect: t.defect, comment: t.comment, actT: t.actionType === 1 ? 'החלפה' : 'תיקון' })) })
             });
             const trData = await trRes.json();
             if (trData.status === 'success' && trData.translations) {
                 finalSelectedList = validToUpdate.map(t => {
                     const trItem = trData.translations.find((x:any) => x.id === t.id);
                     if (trItem) {
                         return { ...t, defect: trItem.defect, comment: trItem.comment, actionStrOverride: trItem.actT, translatedLabels: trItem.labels };
                     }
                     return t;
                 });
             }
           } catch(e) {
             console.error("Translation failed", e);
           }
        }
        
        // Prepare print layout
        const printNowStr = new Date().toLocaleString('en-GB')
        
        // Group by department first
        const groupedByDept = finalSelectedList.reduce((acc: Record<string, any[]>, t) => {
          const dept = (t as any).department || t.dept || 'Unknown';
          if (!acc[dept]) acc[dept] = [];
          acc[dept].push(t);
          return acc;
        }, {});

        // chunk the tasks into pages of 4, keeping departments separate
        let pages: any[] = [];
        Object.keys(groupedByDept).forEach(dept => {
          const deptTasks = groupedByDept[dept];
          for(let i=0; i<deptTasks.length; i+=4) {
             pages.push({
               id: `${dept}-${i}`,
               tasks: deptTasks.slice(i, i+4),
               printedTime: printNowStr,
               tabName: currentTab.replace(/_/g, ' ')
             });
          }
        });
        setPrintCardsData(pages)
        
        setTimeout(() => {
          window.print()
          setTimeout(() => setPrintCardsData(null), 1000)
        }, 800)
      } else {
        toast("שגיאה בהפקה", "error")
      }
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
    <>
    <div className="min-h-screen bg-[#858d9c] p-4 lg:p-8 print:hidden" dir="rtl">
      {/* Top Header */}
      <header className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-blue-700 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3">
            <i className="fas fa-building text-blue-500 opacity-80"></i>
            {tenantName}
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap justify-center xl:justify-end">
          {/* QR Buttons moved to header */}
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-bold px-4 h-10" onClick={() => setWorkerQrModalOpen(true)}>
            <i className="fas fa-qrcode ml-2"></i>Worker QR
          </Button>
          <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50 font-bold px-4 h-10" onClick={() => setQrModalOpen(true)}>
            <i className="fas fa-mobile-alt ml-2"></i>Inspektor QR
          </Button>

          <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" onClick={() => setWorkersModalOpen(true)} title="ניהול עובדים"><i className="fas fa-user-friends"></i></Button>
          <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={() => setTeamsModalOpen(true)} title="ניהול צוותים"><i className="fas fa-users-cog"></i></Button>
          <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100" onClick={() => setConfigModalOpen(true)} title="הגדרות"><i className="fas fa-cog"></i></Button>
          <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100" onClick={() => setIntegrationsModalOpen(true)} title="אינטגרציות"><i className="fas fa-plug"></i></Button>

          <div className="w-full sm:w-64">
            <Input 
              placeholder="חפש חדר, תקלה, עובד..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border-gray-200 h-10 w-full"
            />
          </div>
          <Button variant="outline" onClick={() => loadTasks()} disabled={loading} className="h-10">
            <svg className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            רענן נתונים
          </Button>
          <Button variant="danger" className="h-10" onClick={() => { localStorage.clear(); window.location.href = '/' }}>
            התנתק
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col 2xl:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full 2xl:w-64 shrink-0 z-0">
          <SidebarBanner 
            title="התראות וחריגים"
            items={warningStats}
            className="bg-[#d2cbd0] border-transparent"
            icon={
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <SidebarBanner 
            title="סטטוס משימות"
            items={workerStats}
            className="bg-[#b0b4be] border-transparent"
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          
          <WeatherWidget />
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto space-y-4">
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
              {selectedTasks.size === filtered.length && filtered.length > 0 ? "בטל בחירה" : "בחר הכל"}
            </Button>
            
            <Button variant="outline" className="text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm border-gray-300" onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}>
              {viewMode === "cards" ? <><i className="fas fa-list ml-2"></i> תצוגת רשימה</> : <><i className="fas fa-th-large ml-2"></i> תצוגת כרטיסיות</>}
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
              שייך לאפליקציה (WorkerApp) ({selectedTasks.size})
            </Button>
            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={handleCloseMass}>
              <i className="fas fa-check ml-2"></i> סגור נבחרים ({selectedTasks.size})
            </Button>

            <div className="flex-grow"></div>
            
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-orange-50" onClick={handleReturnToOpenMass}>
              <i className="fas fa-undo ml-2"></i> חזור לפתוח
            </Button>
          </div>

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

        </div>
      </div>

      {/* Print Modal */}
      <Modal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} title="הגדרות הדפסה">
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">שפת הדפסה</label>
            <Select value={printLang} onChange={e => setPrintLang(e.target.value)} className="w-full">
              <option value="he">עברית</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">שיוך לעובד (אופציונלי)</label>
            <Select value={printWorker} onChange={e => setPrintWorker(e.target.value)} className="w-full">
              <option value="">-- ללא שיוך מיוחד --</option>
              {workers.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="pt-4 flex gap-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={executeOutputSequence}>אישור</Button>
            <Button variant="outline" className="w-full" onClick={() => setPrintModalOpen(false)}>ביטול</Button>
          </div>
        </div>
      </Modal>

      {/* Worker QR Modal */}
      <Modal isOpen={workerQrModalOpen} onClose={() => setWorkerQrModalOpen(false)} title="אפליקציית דיווח (QR)">
        <div className="space-y-4 text-center">
          <p className="text-gray-600 mb-4 font-medium">יצירת קוד QR לדיווח תקלות כללי (עבור עובדים ואורחים)</p>
          
          <div className="flex flex-col gap-2 mb-4 text-right" dir="rtl">
            <label className="font-bold text-gray-700">בחר מחלקה לדיווח (אופציונלי):</label>
            <div className="flex gap-2">
              <select 
                className="flex-grow p-3 bg-gray-50 border rounded-xl font-bold outline-none"
                value={qrDept}
                onChange={(e) => setQrDept(e.target.value)}
              >
                <option value="">-- כללי (ללא מחלקה) --</option>
                {categories?.departments && Object.keys(categories.departments).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="custom">-- אחר (הזן ידנית) --</option>
              </select>
            </div>
            {qrDept === 'custom' && (
              <Input 
                placeholder="הכנס שם מחלקה..." 
                value={qrCustomDept} 
                onChange={(e) => setQrCustomDept(e.target.value)} 
                className="mt-2 text-right"
              />
            )}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" onClick={() => {
            const deptToUse = qrDept === 'custom' ? qrCustomDept : qrDept;
            const url = window.location.origin + "/report.html?tenantId=" + tenantId + (deptToUse ? "&dept=" + encodeURIComponent(deptToUse) : "");
            setWorkerQrGeneratedUrl(url);
          }}>
            <i className="fas fa-qrcode ml-2"></i> הכן קוד QR לדיווח
          </Button>

          {workerQrGeneratedUrl && (
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border mt-4">
              <p className="text-gray-700 font-bold mb-2">סרוק את הקוד מטה:</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(workerQrGeneratedUrl)}`} alt="QR Code" className="w-48 h-48 border bg-white p-2 rounded shadow-sm" />
              <a href={workerQrGeneratedUrl} target="_blank" className="mt-3 text-sm font-medium text-blue-600 hover:underline break-all text-center px-4">{workerQrGeneratedUrl}</a>
              <div className="mt-4 flex gap-2 w-full">
                <Button variant="outline" className="flex-1 font-bold border-blue-600 text-blue-600" onClick={() => window.open(workerQrGeneratedUrl, "_blank")}>פתח קישור</Button>
                <Button variant="outline" className="flex-1 font-bold border-orange-500 text-orange-600" onClick={() => {
                  const deptToUse = qrDept === 'custom' ? qrCustomDept : qrDept;
                  const deptText = deptToUse ? ` - ${deptToUse}` : '';
                  const win = window.open('', '_blank');
                  if(!win) return;
                  win.document.write(`
                    <html dir="rtl"><head><title>Print QR</title></head>
                    <body style="text-align:center; padding:50px; font-family:sans-serif;">
                      <h2>דיווח תקלות - ${tenantName}${deptText}</h2>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(workerQrGeneratedUrl)}" />
                      <br><br><button onclick="window.print(); window.close();" style="padding:15px 30px; font-size:18px; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">הדפס</button>
                    </body></html>
                  `);
                  win.document.close();
                }}>הדפס</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Inspector QR Modal */}
      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="אפליקציית מפקח (QR)">
        <div className="space-y-4 text-center">
          <p className="text-gray-600 mb-4 font-medium">יצירת קוד QR מהיר לאפליקציית מפקח (כללי לארגון)</p>
          
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" onClick={() => {
            setQrGeneratedUrl(window.location.origin + "/inspector.html?tenantId=" + tenantId);
          }}>
            <i className="fas fa-qrcode ml-2"></i> הכן קוד QR למפקח
          </Button>

          {qrGeneratedUrl && (
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border mt-4">
              <p className="text-gray-700 font-bold mb-2">סרוק את הקוד מטה:</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrGeneratedUrl)}`} alt="QR Code" className="w-48 h-48 border bg-white p-2 rounded shadow-sm" />
              <a href={qrGeneratedUrl} target="_blank" className="mt-3 text-sm font-medium text-blue-600 hover:underline break-all text-center px-4">{qrGeneratedUrl}</a>
              <div className="mt-4 flex gap-2 w-full">
                <Button variant="outline" className="flex-1 font-bold border-blue-600 text-blue-600" onClick={() => window.open(qrGeneratedUrl, "_blank")}>פתח קישור</Button>
                <Button variant="outline" className="flex-1 font-bold border-orange-500 text-orange-600" onClick={() => {
                  const win = window.open('', '_blank');
                  if(!win) return;
                  win.document.write(`
                    <html dir="rtl"><head><title>Print QR</title></head>
                    <body style="text-align:center; padding:50px; font-family:sans-serif;">
                      <h2>אפליקציית מפקח - כללי</h2>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrGeneratedUrl)}" />
                      <br><br><button onclick="window.print(); window.close();" style="padding:15px 30px; font-size:18px; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">הדפס</button>
                    </body></html>
                  `);
                  win.document.close();
                }}>הדפס</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Workers Management Modal */}
      <Modal isOpen={workersModalOpen} onClose={() => setWorkersModalOpen(false)} title="ניהול עובדים">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
          {workers.length === 0 ? (
            <div className="text-center text-gray-400 p-4">אין עובדים ברשימה</div>
          ) : (
            workers.map((w, idx) => (
              <div key={idx} className="flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-200 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-600 w-16">שם:</label>
                  <Input 
                    className="flex-1 border-gray-300 rounded shadow-sm px-2 py-1 font-bold text-gray-700" 
                    value={w.name} 
                    onChange={e => {
                      const newW = [...workers];
                      newW[idx] = { ...newW[idx], name: e.target.value };
                      setWorkers(newW);
                    }} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-600 w-16">צוות:</label>
                  <Select 
                    className="flex-1 border-gray-300 rounded shadow-sm px-2 py-1 text-sm font-bold" 
                    value={w.teamId || ""}
                    onChange={e => {
                      const newW = [...workers];
                      newW[idx] = { ...newW[idx], teamId: e.target.value };
                      setWorkers(newW);
                    }}
                  >
                    <option value="" className="text-gray-400">-- בחר צוות --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 mt-1">
                  <Button variant="outline" className="text-blue-600 hover:text-blue-800 p-2 font-bold bg-blue-50 border-blue-200 h-auto" title="הדפס QR לאפליקציית עובד" onClick={() => {
                    const url = window.location.origin + "/worker.html?tenantId=" + tenantId + "&workerId=" + w.id;
                    const win = window.open('', '_blank');
                    if(!win) return;
                    win.document.write(`
                      <html dir="rtl"><head><title>Print Worker QR</title></head>
                      <body style="text-align:center; padding:50px; font-family:sans-serif;">
                        <h2>אפליקציית עובד - ${w.name}</h2>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" />
                        <br><br><button onclick="window.print(); window.close();" style="padding:15px 30px; font-size:18px; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">הדפס</button>
                      </body></html>
                    `);
                    win.document.close();
                  }}><i className="fas fa-qrcode ml-2"></i>QR עובד</Button>
                  <Button variant="danger" className="p-2 h-auto" onClick={() => {
                    const newW = [...workers];
                    newW.splice(idx, 1);
                    setWorkers(newW);
                  }}><i className="fas fa-trash-alt"></i></Button>
                </div>
              </div>
            ))
          )}
          
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <Input 
              id="newWorkerName"
              placeholder="שם העובד החדש..." 
              className="flex-grow"
              onKeyDown={e => {
                if(e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if(val) {
                    if(workers.find(wx => wx.name === val)) return toast("שם עובד כבר קיים", "error");
                    setWorkers([...workers, { id: "", name: val }]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              const inp = document.getElementById("newWorkerName") as HTMLInputElement;
              const val = inp.value.trim();
              if(val) {
                if(workers.find(wx => wx.name === val)) return toast("שם עובד כבר קיים", "error");
                setWorkers([...workers, { id: "", name: val }]);
                inp.value = "";
              }
            }}><i className="fas fa-plus"></i></Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button className="w-full" onClick={async () => {
              const inp = document.getElementById("newWorkerName") as HTMLInputElement;
              const val = inp?.value.trim();
              let finalWorkers = [...workers];
              if(val) {
                if(!finalWorkers.find(wx => wx.name === val)) {
                  finalWorkers.push({ id: "", name: val });
                }
              }
              setLoading(true);
              try {
                const res = await fetch(`/api/${tenantId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: "SAVE_WORKERS", workers: finalWorkers })
                });
                const out = await res.json();
                if(out.status === "success") {
                  toast("רשימת העובדים נשמרה", "success");
                  setWorkersModalOpen(false);
                  loadTasks();
                } else {
                  toast(out.message || "שגיאה בשמירה", "error");
                }
              } catch(e) { toast("שגיאת תקשורת", "error"); }
              setLoading(false);
            }}>שמור שינויים</Button>
            <Button variant="outline" className="w-full" onClick={() => { setWorkersModalOpen(false); loadTasks(); }}>ביטול</Button>
          </div>
        </div>
      </Modal>

      {/* Teams Management Modal */}
      <Modal isOpen={teamsModalOpen} onClose={() => setTeamsModalOpen(false)} title="ניהול צוותים">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
          {teams.length === 0 ? (
            <div className="text-center text-gray-400 p-4">אין צוותים מוגדרים</div>
          ) : (
            teams.map((t, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 gap-2">
                <span className="font-bold text-gray-800">{t.name}</span>
                {t.name !== 'QR' && t.name !== 'כללי' && (
                  <Button variant="danger" className="p-2 h-auto" onClick={() => {
                    const newT = [...teams];
                    newT.splice(idx, 1);
                    setTeams(newT);
                  }}><i className="fas fa-trash-alt"></i></Button>
                )}
              </div>
            ))
          )}
          
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <Input 
              id="newTeamName"
              placeholder="שם צוות חדש..." 
              className="flex-grow"
              onKeyDown={e => {
                if(e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if(val) {
                    if(teams.find(tx => tx.name === val)) return toast("צוות כבר קיים", "error");
                    setTeams([...teams, { id: "t_"+Date.now(), name: val }]);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              const inp = document.getElementById("newTeamName") as HTMLInputElement;
              const val = inp.value.trim();
              if(val) {
                if(teams.find(tx => tx.name === val)) return toast("צוות כבר קיים", "error");
                setTeams([...teams, { id: "t_"+Date.now(), name: val }]);
                inp.value = "";
              }
            }}><i className="fas fa-plus"></i></Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
              const inp = document.getElementById("newTeamName") as HTMLInputElement;
              const val = inp?.value.trim();
              let finalTeams = [...teams];
              if(val) {
                if(!finalTeams.find(tx => tx.name === val)) {
                  finalTeams.push({ id: "t_"+Date.now(), name: val });
                }
              }
              setLoading(true);
              try {
                const res = await fetch(`/api/${tenantId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: "SAVE_TEAMS", teams: finalTeams.map(t => t.name) })
                });
                const out = await res.json();
                if(out.status === "success" || !out.error) {
                  toast("רשימת הצוותים נשמרה", "success");
                  setTeamsModalOpen(false);
                  loadTasks();
                } else {
                  toast(out.message || "שגיאה בשמירה", "error");
                }
              } catch(e) { toast("שגיאת תקשורת", "error"); }
              setLoading(false);
            }}>שמור שינויים</Button>
            <Button variant="outline" className="w-full" onClick={() => { setTeamsModalOpen(false); loadTasks(); }}>ביטול</Button>
          </div>
        </div>
      </Modal>

      {/* Config Modal (Categories & Systems) */}
      <Modal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} title="ניהול מערכות נבדקות">
        <div className="space-y-4 max-h-[70vh] flex flex-col md:flex-row gap-4 p-1">
          {/* Areas List (Right in RTL) */}
          <div className="w-full md:w-1/2 flex flex-col gap-2 border-l pl-4 overflow-y-auto bg-gray-50/50 p-2 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2 border-b pb-2 text-center">אזורי בדיקה (כמו אמבטיה, חדר)</h3>
            
            <div className="flex gap-2 mb-4">
              <Input 
                id="newAreaName"
                placeholder="הוסף אזור..." 
                className="flex-grow text-sm"
                onKeyDown={e => {
                  if(e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if(val && (!categories || !categories[val])) {
                      setCategories({ ...(categories || {}), [val]: [] });
                      (e.target as HTMLInputElement).value = "";
                      setActiveConfigArea(val);
                    }
                  }
                }}
              />
              <Button className="bg-indigo-600 hover:bg-indigo-700 px-3" onClick={() => {
                const inp = document.getElementById("newAreaName") as HTMLInputElement;
                const val = inp.value.trim();
                if(val && (!categories || !categories[val])) {
                  setCategories({ ...(categories || {}), [val]: [] });
                  inp.value = "";
                  setActiveConfigArea(val);
                }
              }}><i className="fas fa-plus"></i></Button>
            </div>

            {categories && Object.keys(categories).map(area => (
              <div 
                key={area} 
                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer border transition-colors ${activeConfigArea === area ? 'bg-indigo-100 border-indigo-300 shadow-inner' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'}`}
                onClick={() => setActiveConfigArea(area)}
              >
                {area !== 'כללי' ? (
                  <button className="text-red-500 hover:text-red-700 p-1" onClick={(e) => {
                    e.stopPropagation();
                    const newC = {...categories};
                    delete newC[area];
                    setCategories(newC);
                    if(activeConfigArea === area) setActiveConfigArea(null);
                  }}>
                    <i className="fas fa-trash-alt"></i>
                  </button>
                ) : <div className="w-6"></div>}
                <span className="font-bold text-gray-800 ml-auto mr-4">{area}</span>
              </div>
            ))}
          </div>

          {/* Systems List (Left in RTL) */}
          <div className="w-full md:w-1/2 flex flex-col gap-2 overflow-y-auto pr-4">
            <h3 className="font-bold text-gray-800 mb-2 border-b pb-2 text-center bg-gray-100 rounded py-1">מערכות ב: {activeConfigArea || '...'}</h3>
            {!activeConfigArea ? (
              <div className="text-gray-400 text-center py-4">בחר אזור מימין</div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Input 
                    id="newSystemName"
                    placeholder="הוסף מערכת (כמו דוש, שקע)..." 
                    className="flex-grow text-sm"
                    onKeyDown={e => {
                      if(e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if(val && !(categories[activeConfigArea] || []).includes(val)) {
                          const newC = {...categories};
                          if(!newC[activeConfigArea]) newC[activeConfigArea] = [];
                          newC[activeConfigArea].push(val);
                          setCategories(newC);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                  <Button className="bg-indigo-600 hover:bg-indigo-700 px-3" onClick={() => {
                    const inp = document.getElementById("newSystemName") as HTMLInputElement;
                    const val = inp.value.trim();
                    if(val && !(categories[activeConfigArea] || []).includes(val)) {
                      const newC = {...categories};
                      if(!newC[activeConfigArea]) newC[activeConfigArea] = [];
                      newC[activeConfigArea].push(val);
                      setCategories(newC);
                      inp.value = "";
                    }
                  }}><i className="fas fa-plus"></i></Button>
                </div>

                {(categories[activeConfigArea] || []).length === 0 ? (
                  <div className="text-center text-gray-400 p-4">אין מערכות מוגדרות</div>
                ) : (
                  (categories[activeConfigArea] || []).map((sys: string, idx: number) => (
                    <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-3">
                      <div className="flex justify-between items-start w-full">
                        <button className="text-red-500 hover:text-red-700" onClick={() => {
                          const newC = {...categories};
                          newC[activeConfigArea] = newC[activeConfigArea].filter((s: string) => s !== sys);
                          setCategories(newC);
                        }}>
                          <i className="fas fa-times"></i>
                        </button>
                        <span className="font-bold text-gray-800 text-sm ml-auto" dir="ltr">{sys}</span>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <Select 
                          className="w-40 h-8 text-xs py-0 pl-2 pr-6 rounded-md border-gray-300"
                          value={systemTeams[sys] || ""}
                          onChange={(e) => {
                            setSystemTeams({...systemTeams, [sys]: e.target.value})
                          }}
                          dir="rtl"
                        >
                          <option value="">-- ללא משויך --</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </Select>
                        <span className="text-xs text-gray-500">צוות מטפל:</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg" onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch(`/api/${tenantId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "SAVE_CATEGORIES", categories, systemTeams })
              });
              const out = await res.json();
              if(out.status === "success" || !out.error) {
                toast("הגדרות נשמרו בהצלחה", "success");
                setConfigModalOpen(false);
                loadTasks();
              } else {
                toast(out.message || "שגיאה בשמירה", "error");
              }
            } catch(e) { toast("שגיאת תקשורת", "error"); }
            setLoading(false);
          }}>שמור שינויים</Button>
          <Button variant="outline" className="w-full" onClick={() => { setConfigModalOpen(false); loadTasks(); }}>סגור</Button>
        </div>
      </Modal>

      {/* Integrations Modal */}
      <Modal isOpen={integrationsModalOpen} onClose={() => setIntegrationsModalOpen(false)} title="אינטגרציות (Telegram / WhatsApp)">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto p-1 custom-scrollbar" dir="rtl">
          {/* Telegram Block */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <i className="fab fa-telegram text-2xl text-blue-500"></i>
              <h3 className="font-bold text-gray-800 text-lg">Telegram Bot</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bot API Token</label>
                <Input value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" className="font-mono text-sm text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Chat ID (קבוצה)</label>
                <Input value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="-1001234567890" className="font-mono text-sm text-left" dir="ltr" />
              </div>
            </div>

            <details className="mt-4 text-sm text-gray-600 bg-white p-3 rounded-xl border border-blue-50 cursor-pointer">
              <summary className="font-bold text-blue-600 flex items-center gap-2"><i className="fas fa-info-circle"></i> הוראות הגדרת Telegram</summary>
              <ol className="list-decimal pl-5 pr-5 mt-2 space-y-1">
                <li>מצאו בטלגרם את הבוט <b>@BotFather</b>.</li>
                <li>שלחו את הפקודה <code>/newbot</code>, בחרו שם ו-username.</li>
                <li>העתיקו את ה-<b>HTTP API Token</b> שקיבלתם לשדה למעלה.</li>
                <li>צרפו את הבוט שיצרתם לקבוצת העבודה שלכם.</li>
                <li>העבירו הודעה מהקבוצה לבוט <b>@RawDataBot</b> כדי לגלות את ה-<b>Chat ID</b> של הקבוצה (מתחיל במינוס).</li>
                <li>הדביקו את ה-<b>Chat ID</b> ושמרו.</li>
              </ol>
            </details>
          </div>

          {/* WhatsApp Block */}
          <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <i className="fab fa-whatsapp text-2xl text-green-500"></i>
              <h3 className="font-bold text-gray-800 text-lg">WhatsApp (Green-API)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Instance ID</label>
                <Input value={whatsappInstance} onChange={e => setWhatsappInstance(e.target.value)} placeholder="7103123456" className="font-mono text-sm text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">API Token</label>
                <Input value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} placeholder="a1b2c3d4..." className="font-mono text-sm text-left" dir="ltr" />
              </div>
            </div>

            <details className="mt-4 text-sm text-gray-600 bg-white p-3 rounded-xl border border-green-50 cursor-pointer">
              <summary className="font-bold text-green-600 flex items-center gap-2"><i className="fas fa-info-circle"></i> הוראות הגדרת WhatsApp</summary>
              <ol className="list-decimal pl-5 pr-5 mt-2 space-y-1">
                <li>הירשמו לשירות <a href="https://green-api.com" target="_blank" className="text-blue-500 underline">Green-API</a>.</li>
                <li>צרו Instance חדש באזור האישי.</li>
                <li>סרקו את קוד ה-QR כדי לחבר את מספר הווטסאפ שלכם.</li>
                <li>העתיקו את <b>Instance ID</b> ואת <b>API Token Instance</b> והדביקו כאן.</li>
              </ol>
            </details>
          </div>

          <Button onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch(`/api/${tenantId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "SAVE_INTEGRATIONS", telegramBotToken, telegramChatId, whatsappInstance, whatsappToken })
              });
              const out = await res.json();
              if(out.status === "success") {
                toast("אינטגרציות נשמרו בהצלחה", "success");
                setIntegrationsModalOpen(false);
                loadTasks();
              } else {
                toast(out.message || "שגיאה בשמירת אינטגרציות", "error");
              }
            } catch(e) { toast("שגיאת רשת", "error"); }
            setLoading(false);
          }} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg">שמור אינטגרציות</Button>
        </div>
      </Modal>

      {/* Prompt Modal */}
      <Modal isOpen={promptModalData.isOpen} onClose={() => setPromptModalData({...promptModalData, isOpen: false})} title="עריכה">
        <div className="space-y-6 pt-4">
          <p className="text-lg font-medium text-gray-800">{promptModalData.title}</p>
          <Input 
            autoFocus
            value={promptModalData.value} 
            onChange={(e) => setPromptModalData({...promptModalData, value: e.target.value})} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                promptModalData.onConfirm(promptModalData.value);
                setPromptModalData({...promptModalData, isOpen: false});
              }
            }}
          />
          <div className="flex gap-4">
            <Button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800" onClick={() => setPromptModalData({...promptModalData, isOpen: false})}>ביטול</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => {
              promptModalData.onConfirm(promptModalData.value);
              setPromptModalData({...promptModalData, isOpen: false});
            }}>שמור</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal isOpen={confirmModalData.isOpen} onClose={() => setConfirmModalData({...confirmModalData, isOpen: false})} title="אישור פעולה">
        <div className="space-y-6 pt-4">
          <p className="text-lg text-center font-medium text-gray-800">{confirmModalData.title}</p>
          <div className="flex gap-4">
            <Button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800" onClick={() => setConfirmModalData({...confirmModalData, isOpen: false})}>ביטול</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => {
              confirmModalData.onConfirm();
              setConfirmModalData({...confirmModalData, isOpen: false});
            }}>אישור</Button>
          </div>
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal isOpen={reportsModalOpen} onClose={() => setReportsModalOpen(false)} title="דוחות פחת / חריגים" className="max-w-6xl w-full">
        <div className="flex flex-col md:min-w-[900px] h-[80vh] max-h-full">
           <div className="flex flex-wrap items-end gap-6 mb-6">
             <div className="flex-1 min-w-[200px]">
               <label className="block text-sm text-gray-500 mb-2 font-bold">מתאריך</label>
               <DatePicker value={reportsStart ? new Date(reportsStart) : undefined} onChange={d => setReportsStart(d ? format(d, "yyyy-MM-dd") : "")} />
             </div>
             <div className="flex-1 min-w-[200px]">
               <label className="block text-sm text-gray-500 mb-2 font-bold">עד תאריך</label>
               <DatePicker value={reportsEnd ? new Date(reportsEnd) : undefined} onChange={d => setReportsEnd(d ? format(d, "yyyy-MM-dd") : "")} />
             </div>
             <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow px-8 h-12 text-lg font-bold" onClick={loadReports}>
               {isReportsLoading ? "טוען..." : "חפש"}
             </Button>
           </div>
           
           <div className="flex-grow overflow-auto border border-gray-200 rounded-xl mb-4 bg-white shadow-inner custom-scrollbar relative">
             <table className="w-full text-sm text-right border-collapse">
               <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                 <tr>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">תאריך</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">מחלקה</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">חדר</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">מערכת / תקלה</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">הערות</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">סטטוס</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">משויך ל</th>
                   <th className="p-4 font-bold text-gray-700 border-b border-gray-200">מפקח</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {reportsData.length === 0 ? (
                   <tr><td colSpan={8} className="p-12 text-center text-gray-500 text-lg font-bold bg-gray-50/50">אין נתונים לתאריכים אלו</td></tr>
                 ) : (
                   reportsData.map(t => (
                     <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                       <td className="p-4 whitespace-nowrap text-gray-600">{t.dateStr}</td>
                       <td className="p-4 font-medium text-gray-800">{t.department}</td>
                       <td className="p-4 text-gray-700">{t.room}</td>
                       <td className="p-4 font-bold text-indigo-700">{t.defect}</td>
                       <td className="p-4 text-gray-600 max-w-xs truncate" title={t.comment}>{t.comment}</td>
                       <td className="p-4 whitespace-nowrap">
                         <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${t.status === 'הושלם' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                           {t.status}
                         </span>
                       </td>
                       <td className="p-4 whitespace-nowrap text-gray-700 font-medium">{t.worker}</td>
                       <td className="p-4 text-gray-600">{t.inspector}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
             <div className="font-bold text-gray-700 text-lg">סה"כ משימות: {reportsData.length}</div>
             <Button className="bg-gray-800 text-white hover:bg-gray-700 font-bold" onClick={handlePrintReports}>
               <i className="fas fa-print ml-2"></i>הדפסת דוח
             </Button>
           </div>
        </div>
      </Modal>

    </div>

    {printDocumentData && (
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black" dir="rtl">
        <h1 className="text-3xl font-bold text-center mb-6">{printDocumentData.title}</h1>
        <table className="w-full text-right border-collapse border border-gray-300">
          <thead className="bg-gray-100 print:bg-gray-200">
            <tr>
              <th className="border border-gray-300 p-2 font-bold text-sm">תאריך</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">מחלקה</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">חדר</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">מערכת / תקלה</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">הערות</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">סטטוס</th>
              <th className="border border-gray-300 p-2 font-bold text-sm">{printDocumentData.type === 'manager' ? 'עובד' : 'משויך ל'}</th>
              {printDocumentData.type === 'reports' && <th className="border border-gray-300 p-2 font-bold text-sm">מפקח</th>}
            </tr>
          </thead>
          <tbody>
            {printDocumentData.data.map(t => (
              <tr key={t.id}>
                <td className="border border-gray-300 p-2 text-sm">{t.dateStr}</td>
                <td className="border border-gray-300 p-2 text-sm">{t.department}</td>
                <td className="border border-gray-300 p-2 text-sm">{t.room}</td>
                <td className="border border-gray-300 p-2 text-sm font-bold">{t.defect}</td>
                <td className="border border-gray-300 p-2 text-sm">{t.comment}</td>
                <td className="border border-gray-300 p-2 text-sm font-bold">{t.status}</td>
                <td className="border border-gray-300 p-2 text-sm">{t.worker}</td>
                {printDocumentData.type === 'reports' && <td className="border border-gray-300 p-2 text-sm">{t.inspector}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {printCardsData && (
      <div id="printCardsContainer" dir={printLang === "ru" || printLang === "en" ? "ltr" : "rtl"} className="hidden print:block w-full bg-white text-black m-0 p-0">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            [data-sonner-toaster], .Toastify, #toast-container, div[role="status"], div[role="region"][aria-label="Notifications"] { display: none !important; }
            @page { margin: 0; size: A4 portrait; }
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-page { width: 210mm; height: 296mm; margin: 0 auto; padding: 10mm; box-sizing: border-box; display: flex; flex-direction: column; background: white; overflow: hidden; page-break-after: always; break-after: page; }
            .print-page:last-child { page-break-after: auto; break-after: auto; }
            .print-page-header { font-size: 19px; font-weight: bold; text-align: center; border-bottom: 3px solid #000; padding-bottom: 5px; margin-bottom: 8px; height: 40px; display: flex; flex-direction: column; justify-content: center; color: black; }
            .print-page-header-sub { font-size: 13px; font-weight: normal; color: #555; margin-top: 2px; }
            .print-cards-grid { display: flex; flex-wrap: wrap; justify-content: space-between; align-content: flex-start; flex-grow: 1; height: calc(100% - 50px); }
            .print-card { width: 49%; height: 48%; margin-bottom: 2%; border: 2px solid #000; border-radius: 10px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; page-break-inside: avoid; break-inside: avoid; overflow: hidden; background: white; color: black; }
            .print-card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; color: black; }
            .print-card-body { display: flex; gap: 10px; flex-grow: 1; align-items: stretch; overflow: hidden; }
            .print-photo { width: 62%; height: 100%; max-height: 100%; object-fit: cover; object-position: center; border: 2px solid #cbd5e1; border-radius: 8px; }
            .print-info { width: 38%; display: flex; flex-direction: column; color: black; overflow: hidden; padding: 0 4px; }
            .defect-title { font-size: 18px; font-weight: 900; margin-bottom: 6px; line-height: 1.2; word-break: break-word; overflow-wrap: break-word; hyphens: auto; }
            .defect-comment { font-size: 14px; color: #374151; line-height: 1.2; }
            .signature-box { border-top: 2px dashed #000; margin-top: 8px; padding-top: 6px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; color: black;}
          }
        `}} />
        
        {printCardsData.map((page, pIdx) => (
          <div key={pIdx} className="print-page">
            <div className="print-page-header">
              <div>סיור: {page.tabName} | מחלקה: {page.tasks[0]?.department || page.tasks[0]?.dept || ''} | תאריך: {page.tasks[0]?.dateStr?.split(' ')[0]}</div>
              <div className="print-page-header-sub">הודפס בתאריך: {page.printedTime}</div>
            </div>
            
            <div className="print-cards-grid">
              {page.tasks.map((t: any) => {
                 const isQr = t.defect?.includes("בקרת ניקיון") || t.defect?.includes("פח אשפה") || (t.inspector && t.inspector.includes("סורק"))
                 const actT = t.actionStrOverride ? t.actionStrOverride : (t.actionType === 1 ? "החלפה" : "תיקון")
                 const workerVal = printWorker ? printWorker : "_________"
                 const labels = t.translatedLabels || { room: 'חדר: ', name: 'שם: ', date: 'תאריך: ', sign: 'חתימה: ' };
                 
                 return (
                  <div key={t.id} className="print-card">
                    <div className="print-card-top">
                      <span style={{fontWeight: 900, fontSize: '20px'}}>{labels.room}{t.room}</span>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {isQr && <span style={{background:'#fbcfe8', color:'#be185d', padding:'2px 8px', borderRadius:'6px', fontSize:'14px', fontWeight:900}}>QR</span>}
                        <span style={{border: '1px solid #ccc', padding: '2px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold'}}>{actT}</span>
                      </div>
                    </div>
                    
                    <div className="print-card-body">
                      {t.photoUrl || t.photo ? (
                        <img src={t.photoUrl || t.photo} className="print-photo" />
                      ) : (
                        <div className="print-photo" style={{display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', border:'2px dashed #ccc'}}>
                          <span style={{color: '#9ca3af', fontWeight:'bold'}}>אין תמונה</span>
                        </div>
                      )}
                      
                      <div className="print-info">
                        <p className="defect-title">{t.defect}</p>
                        <p className="defect-comment">{t.notes || t.comment}</p>
                      </div>
                    </div>
                    
                    <div className="signature-box">
                      <span>{labels.name}<strong>{workerVal}</strong></span>
                      <span>{labels.date}_________</span>
                      <span>{labels.sign}_________</span>
                    </div>
                  </div>
                 )
              })}
            </div>
          </div>
        ))}
      </div>
    )}
    
      {/* Scroll to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 hover:-translate-y-1 transition-all z-50 print:hidden"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
      
    </>
  )
}
