"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "@/components/ui/Toast"
import { format } from "date-fns"
import { type Task } from "@/components/ui/TaskCard"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useAdminState() {
  const router = useRouter()
  const [tenantId, setTenantId] = React.useState<string | null>(null)
  const { data: tasksData, mutate: mutateTasks, isLoading: tasksLoading } = useSWR(tenantId ? `/api/${tenantId}?action=getOpenTasks` : null, fetcher, { refreshInterval: 30000 })
  
  const tasks: Task[] = tasksData?.tasks || []
  const setTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    if (typeof newTasks === 'function') {
      mutateTasks((currentData: any) => ({ ...currentData, tasks: newTasks(currentData?.tasks || []) }), false);
    } else {
      mutateTasks({ tasks: newTasks }, false);
    }
  }

  const [workers, setWorkers] = React.useState<{id:string, name:string, teamId?:string}[]>([])
  const [categories, setCategories] = React.useState<any>(null)
  const [systemTeams, setSystemTeams] = React.useState<Record<string, string>>({})
  const [teams, setTeams] = React.useState<any[]>([])
  const [loadingLocal, setLoadingLocal] = React.useState(true)
  const loading = loadingLocal || tasksLoading
  
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
  const [reportsStart, setReportsStart] = React.useState("");
  const [reportsEnd, setReportsEnd] = React.useState("");

  const { data: reportsSwrData, mutate: mutateReports, isLoading: isReportsLoading } = useSWR(
    (reportsModalOpen && reportsStart && reportsEnd && tenantId) 
      ? `/api/${tenantId}?action=getReports&startDate=${reportsStart}&endDate=${reportsEnd}` 
      : null, 
    fetcher
  );
  const reportsData = reportsSwrData?.tasks || [];
  const setReportsData = (d: any) => {};

  const confirmAction = (title: string, onConfirm: () => void) => {
    setConfirmModalData({ isOpen: true, title, onConfirm });
  };

  const promptAction = (title: string, onConfirm: (val: string) => void) => {
    setPromptModalData({ isOpen: true, title, value: "", onConfirm });
  };

  const loadReports = async () => {
    if (!reportsStart || !reportsEnd) return toast("יש לבחור תאריכים", "error");
    mutateReports();
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
  const [configModalOpen, setConfigModalOpen] = React.useState(false)
  const [teamsModalOpen, setTeamsModalOpen] = React.useState(false)
  const [workersModalOpen, setWorkersModalOpen] = React.useState(false)
  const [tenantName, setTenantName] = React.useState("מוסד לבדיקה")
  
  // Integrations State
  const [integrationsModalOpen, setIntegrationsModalOpen] = React.useState(false)
  const [telegramBotToken, setTelegramBotToken] = React.useState("")
  const [telegramChatId, setTelegramChatId] = React.useState("")
  const [whatsappInstance, setWhatsappInstance] = React.useState("")
  const [whatsappToken, setWhatsappToken] = React.useState("")
  
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
      setLoadingLocal(false)
      setTenantId(null) // Make sure tenantId is null so we can show the prompt
      return
    }
    setTenantId(tId)
    setLoadingLocal(true)

    try {
      // Load settings
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
      
      // We no longer auto-select from settings categories. 
      // The worker QR modal will use active tasks to find existing departments.
    } catch (e) {
      console.error(e)
      toast("שגיאת תקשורת", "error")
    } finally {
      setLoadingLocal(false)
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

    // Optimistic Update
    if (actionType === "CLOSE_TASK") {
       const ids = bodyData.tasks ? bodyData.tasks.map((t:any)=>t.id) : [id];
       setTasks(tasks.map((t:any) => ids.includes(t.id) ? { ...t, status: "בוצע" } : t));
    } else if (actionType === "UNMARK_PRINTED") {
       const ids = bodyData.tasks ? bodyData.tasks.map((t:any)=>t.id) : [id];
       setTasks(tasks.map((t:any) => ids.includes(t.id) ? { ...t, status: "פתוח" } : t));
    } else if (actionType === "MOVE_TASK") {
       setTasks(tasks.map((t:any) => t.id === id ? { ...t, worker: bodyData.teamName } : t));
    } else if (actionType === "EDIT_DEFECT") {
       setTasks(tasks.map((t:any) => t.id === id ? { ...t, defect: bodyData.newDefect } : t));
    }

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
        mutateTasks()
      } else {
        toast(data.message || "שגיאה", "error")
        mutateTasks() // Rollback optimistic update
      }
    } catch (e) {
      console.error(e)
      mutateTasks() // Rollback optimistic update
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

  

  return {
    router, tasks, setTasks, workers, setWorkers, categories, setCategories,
    systemTeams, setSystemTeams, teams, setTeams, loading, setLoading, tenantId, setTenantId,
    printModalOpen, setPrintModalOpen, printLang, setPrintLang, printWorker, setPrintWorker, printMode, setPrintMode,
    printDocumentData, setPrintDocumentData, printCardsData, setPrintCardsData,
    confirmModalData, setConfirmModalData, promptModalData, setPromptModalData,
    reportsModalOpen, setReportsModalOpen, reportsData, setReportsData,
    reportsStart, setReportsStart, reportsEnd, setReportsEnd, isReportsLoading, setIsReportsLoading,
    qrModalOpen, setQrModalOpen, workerQrModalOpen, setWorkerQrModalOpen,
    configModalOpen, setConfigModalOpen, teamsModalOpen, setTeamsModalOpen,
    workersModalOpen, setWorkersModalOpen, tenantName, setTenantName,
    integrationsModalOpen, setIntegrationsModalOpen, telegramBotToken, setTelegramBotToken,
    telegramChatId, setTelegramChatId, whatsappInstance, setWhatsappInstance, whatsappToken, setWhatsappToken,
    currentTab, setCurrentTab, filterDept, setFilterDept, searchQuery, setSearchQuery, filterDate, setFilterDate,
    viewMode, setViewMode, selectedTasks, setSelectedTasks,
    workerStats, warningStats, activeTabs, activeDepts, taskDates, filtered,
    confirmAction, promptAction, loadReports, handlePrintReports, handleManagerReportPrint, loadTasks,
    handleToggleCheck, handleSelectAll, handleAction, handleTeamChange, handleEditDefect,
    handleApprove, handleReturnToOpen, handleReturnToOpenMass, handleCloseMass,
    handlePrintSelected, handleSendToApp, executeOutputSequence
  }
}
