"use client"

import * as React from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { toast } from "@/components/ui/Toast"
import { type Task } from "@/components/ui/TaskCard"

interface AdminTaskWorkflowModalsProps {
  tenantId: string | null
  createTaskModalOpen: boolean
  setCreateTaskModalOpen: (val: boolean) => void
  reworkModalTask: Task | null
  setReworkModalTask: (task: Task | null) => void
  workers: { id: string; name: string; teamId?: string }[]
  teams: { id: string; name: string }[]
  activeDepts: string[]
  categories: Record<string, string[]> | null
  onSuccess: () => void
}

export function AdminTaskWorkflowModals({
  tenantId,
  createTaskModalOpen,
  setCreateTaskModalOpen,
  reworkModalTask,
  setReworkModalTask,
  workers,
  teams,
  activeDepts,
  categories,
  onSuccess,
}: AdminTaskWorkflowModalsProps) {
  // --- Create Task Modal State ---
  const [deptMode, setDeptMode] = React.useState<"select" | "custom">("select")
  const [selectedDept, setSelectedDept] = React.useState("")
  const [customDept, setCustomDept] = React.useState("")
  const [room, setRoom] = React.useState("")
  const [teamName, setTeamName] = React.useState("")
  const [actionType, setActionType] = React.useState<1 | 2>(2) // 2 = repair, 1 = replace
  const [defect, setDefect] = React.useState("")
  const [comment, setComment] = React.useState("")
  const [assignedWorker, setAssignedWorker] = React.useState("")
  const [photoData, setPhotoData] = React.useState<string | null>(null)
  const [isPhotoUploading, setIsPhotoUploading] = React.useState(false)
  const [isSubmittingCreate, setIsSubmittingCreate] = React.useState(false)

  // Reset form when opening Create Task Modal
  React.useEffect(() => {
    if (createTaskModalOpen) {
      if (activeDepts.length > 0) {
        setDeptMode("select")
        setSelectedDept(activeDepts[0])
      } else {
        setDeptMode("custom")
        setSelectedDept("")
      }
      setCustomDept("")
      setRoom("")
      setTeamName(teams.length > 0 ? teams[0].name : "")
      setActionType(2)
      setDefect("")
      setComment("")
      setAssignedWorker("")
      setPhotoData(null)
    }
  }, [createTaskModalOpen, activeDepts, teams])

  // Auto-select worker's team if worker is chosen
  const handleWorkerChange = (wName: string) => {
    setAssignedWorker(wName)
    if (wName) {
      const wObj = workers.find(w => w.name === wName)
      if (wObj?.teamId) {
        const tObj = teams.find(t => t.id === wObj.teamId)
        if (tObj) setTeamName(tObj.name)
      }
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsPhotoUploading(true)
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            const scale = Math.min(1000 / img.width, 1000 / img.height, 1)
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL("image/jpeg", 0.7))
          }
          img.onerror = reject
          img.src = ev.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setPhotoData(base64Data)
    } catch (err) {
      console.error(err)
      toast("שגיאה בעיבוד התמונה", "error")
    } finally {
      setIsPhotoUploading(false)
    }
  }

  const handleCreateSubmit = async () => {
    if (!tenantId) return
    const finalDept = (deptMode === "custom" ? customDept : selectedDept).trim() || "כללי"
    if (!room.trim() && !defect.trim()) {
      return toast("נא להזין חדר ותיאור משימה / תקלה", "error")
    }

    setIsSubmittingCreate(true)
    try {
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADMIN_CREATE_TASK",
          department: finalDept,
          room: room.trim() || "כללי",
          teamName: teamName.trim(),
          actionType,
          defect: defect.trim() || "משימת מנהל",
          comment: comment.trim(),
          photo: photoData,
          workerName: assignedWorker.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.status === "success") {
        toast(
          assignedWorker
            ? `המשימה נוצרה ונשלחה ישירות ל-${assignedWorker} ב-WorkerApp!`
            : "המשימה נוצרה בהצלחה ונוספה לרשימה!",
          "success"
        )
        setCreateTaskModalOpen(false)
        onSuccess()
      } else {
        toast(data.message || "שגיאה ביצירת המשימה", "error")
      }
    } catch (err) {
      console.error(err)
      toast("שגיאת תקשורת עם השרת", "error")
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  // --- Rework Task Modal State ---
  const [reworkTarget, setReworkTarget] = React.useState<string>("") // worker name or "__OPEN__"
  const [reworkComment, setReworkComment] = React.useState<string>("")
  const [isSubmittingRework, setIsSubmittingRework] = React.useState(false)

  React.useEffect(() => {
    if (reworkModalTask) {
      if (reworkModalTask.worker) {
        setReworkTarget(reworkModalTask.worker)
      } else if (workers.length > 0) {
        setReworkTarget(workers[0].name)
      } else {
        setReworkTarget("__OPEN__")
      }
      setReworkComment("")
    }
  }, [reworkModalTask, workers])

  const quickReworkReasons = [
    "לא בוצע במלואו — נדרשת השלמה",
    "התקלה עדיין קיימת, נא לבדוק שוב",
    "נדרש ניקיון וסידור של אזור העבודה",
    "נא לצלם תמונה ברורה לאחר התיקון",
  ]

  const handleReworkSubmit = async () => {
    if (!tenantId || !reworkModalTask) return
    setIsSubmittingRework(true)
    const isReturnToOpen = reworkTarget === "__OPEN__" || !reworkTarget
    try {
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REWORK_TASK",
          taskId: reworkModalTask.id,
          returnToOpen: isReturnToOpen,
          workerName: isReturnToOpen ? null : reworkTarget,
          comment: reworkComment.trim(),
        }),
      })
      const data = await res.json()
      if (data.status === "success") {
        toast(
          isReturnToOpen
            ? "המשימה הוחזרה לרשימת המשימות הפתוחות"
            : `המשימה נשלחה לתיקון חוזר אצל ${reworkTarget} ב-WorkerApp!`,
          "success"
        )
        setReworkModalTask(null)
        onSuccess()
      } else {
        toast(data.message || "שגיאה בהחזרת המשימה", "error")
      }
    } catch (err) {
      console.error(err)
      toast("שגיאת תקשורת עם השרת", "error")
    } finally {
      setIsSubmittingRework(false)
    }
  }

  // Collect all unique system suggestions from categories
  const systemSuggestions = React.useMemo(() => {
    if (!categories) return []
    const all: string[] = []
    Object.values(categories).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(s => {
          if (s && !all.includes(s)) all.push(s)
        })
      }
    })
    return all
  }, [categories])

  return (
    <>
      {/* 1. Create New Task Modal */}
      <Modal
        isOpen={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        title="➕ יצירת משימה חדשה ושליחה לעובד"
      >
        <div className="space-y-4 text-right" dir="rtl">
          {/* Department & Room Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700">מחלקה / אגף:</label>
                {activeDepts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeptMode(deptMode === "select" ? "custom" : "select")}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {deptMode === "select" ? "+ הקלד מחלקה חדשה" : "בחר מרשימה קיימת"}
                  </button>
                )}
              </div>
              {deptMode === "select" && activeDepts.length > 0 ? (
                <Select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full h-10"
                >
                  {activeDepts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  placeholder="לדוגמה: מחלקה פנימית א' / קבלה"
                  value={customDept}
                  onChange={e => setCustomDept(e.target.value)}
                  className="h-10"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">חדר / מיקום מדויק:</label>
              <Input
                placeholder="לדוגמה: 204 / לובי כניסה / מטבח"
                value={room}
                onChange={e => setRoom(e.target.value)}
                className="h-10 font-bold"
              />
            </div>
          </div>

          {/* Action Type & Team Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">סוג פעולה נדרשת:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType(2)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                    actionType === 2
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <i className="fas fa-wrench"></i> תיקון
                </button>
                <button
                  type="button"
                  onClick={() => setActionType(1)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all ${
                    actionType === 1
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <i className="fas fa-sync-alt"></i> החלפה
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">שיוך לצוות מקצועי:</label>
              <Select
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full h-10"
              >
                <option value="כללי">כללי</option>
                {teams.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Defect / Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">נושא המשימה / המערכת (מה התקלה?):</label>
            <Input
              list="admin-systems-datalist"
              placeholder="לדוגמה: נזילה בכיור / החלפת מנעול בדלת / מזגן לא מקרר"
              value={defect}
              onChange={e => setDefect(e.target.value)}
              className="h-10 font-bold"
            />
            <datalist id="admin-systems-datalist">
              {systemSuggestions.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">פירוט והנחיות לעובד (יתורגם אוטומטית לשפת העובד):</label>
            <textarea
              rows={3}
              placeholder="כתוב כאן כל הערה או הנחיה חשובה למבצע (אפשר בעברית או ברוסית)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Optional Photo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">תמונה להמחשה (אופציונלי):</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {isPhotoUploading ? (
                <span className="text-xs font-bold text-indigo-600"><i className="fas fa-spinner fa-spin ml-1"></i> מעבד תמונה...</span>
              ) : photoData ? (
                <div className="flex items-center gap-3">
                  <img src={photoData} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                  <span className="text-xs font-bold text-emerald-600"><i className="fas fa-check-circle ml-1"></i> תמונה צורפה (לחץ להחלפה)</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-500"><i className="fas fa-camera ml-1 text-indigo-500"></i> לחץ לצירוף תמונה מהמחשב או מהטלפון</span>
              )}
            </label>
          </div>

          {/* Direct Worker Assignment Box */}
          <div className="bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl p-3.5">
            <label className="block text-xs font-black text-indigo-950 mb-1.5 flex items-center gap-1.5">
              <i className="fas fa-mobile-alt text-indigo-600 text-sm"></i>
              שליחה ישירה לעובד ב-WorkerApp (או השארה ברשימה הפתוחה):
            </label>
            <Select
              value={assignedWorker}
              onChange={e => handleWorkerChange(e.target.value)}
              className="w-full h-11 bg-white font-bold text-indigo-950 border-indigo-300"
            >
              <option value="">📋 השאר ברשימת המשימות הפתוחות (ללא שליחה מיידית לעובד)</option>
              {workers.map(w => (
                <option key={w.id || w.name} value={w.name}>
                  📱 שלח מיד ל-WorkerApp של: {w.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmittingCreate || isPhotoUploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black h-11 rounded-xl shadow-md"
            >
              {isSubmittingCreate ? (
                <><i className="fas fa-spinner fa-spin ml-2"></i> שומר...</>
              ) : assignedWorker ? (
                <><i className="fas fa-paper-plane ml-2"></i> צור משימה ושלח ל-{assignedWorker}</>
              ) : (
                <><i className="fas fa-plus-circle ml-2"></i> צור משימה חדשה</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCreateTaskModalOpen(false)}
              className="h-11 px-5 rounded-xl font-bold"
            >
              ביטול
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Return Task for Rework Modal */}
      <Modal
        isOpen={Boolean(reworkModalTask)}
        onClose={() => setReworkModalTask(null)}
        title="🔄 החזרת משימה לתיקון חוזר / השלמה"
      >
        {reworkModalTask && (
          <div className="space-y-4 text-right" dir="rtl">
            {/* Task Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm">
              <div className="font-black text-gray-900">
                מחלקה: <span className="text-indigo-700">{reworkModalTask.dept}</span> • חדר: <span className="text-indigo-700">{reworkModalTask.room}</span>
              </div>
              <div className="font-bold text-gray-700 mt-0.5">
                משימה: {reworkModalTask.defect}
              </div>
              {reworkModalTask.worker && (
                <div className="text-xs font-bold text-emerald-700 mt-1">
                  בוצע לאחרונה ע&quot;י: {reworkModalTask.worker}
                </div>
              )}
            </div>

            {/* Choose Worker (Same, Another, or Open List) */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1.5">
                למי להחזיר את המשימה לביצוע חוזר?
              </label>
              <Select
                value={reworkTarget}
                onChange={e => setReworkTarget(e.target.value)}
                className="w-full h-11 font-bold border-orange-300 bg-orange-50/40"
              >
                {reworkModalTask.worker && (
                  <option value={reworkModalTask.worker}>
                    🔄 החזר לאותו עובד ב-WorkerApp: {reworkModalTask.worker} (מומלץ)
                  </option>
                )}
                {workers
                  .filter(w => w.name !== reworkModalTask.worker)
                  .map(w => (
                    <option key={w.id || w.name} value={w.name}>
                      👤 העבר לעובד אחר ב-WorkerApp: {w.name}
                    </option>
                  ))}
                <option value="__OPEN__">📋 החזר לרשימת המשימות הפתוחות (ללא שיוך לעובד)</option>
              </Select>
            </div>

            {/* Manager Rework Comment */}
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1.5">
                הערת מנהל לתיקון (תוצג בהבלטה לעובד ותתורגם לשפתו):
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickReworkReasons.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() =>
                      setReworkComment(prev => (prev ? `${prev} — ${reason}` : reason))
                    }
                    className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold px-2.5 py-1 rounded-full transition-colors"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="כתוב מה לא בוצע כראוי או מה העובד צריך לתקן/להשלים..."
                value={reworkComment}
                onChange={e => setReworkComment(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleReworkSubmit}
                disabled={isSubmittingRework}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black h-11 rounded-xl shadow-md"
              >
                {isSubmittingRework ? (
                  <><i className="fas fa-spinner fa-spin ml-2"></i> שולח...</>
                ) : reworkTarget === "__OPEN__" ? (
                  <><i className="fas fa-undo ml-2"></i> החזר לרשימה הפתוחה</>
                ) : (
                  <><i className="fas fa-paper-plane ml-2"></i> החזר לתיקון אצל {reworkTarget}</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setReworkModalTask(null)}
                className="h-11 px-5 rounded-xl font-bold"
              >
                ביטול
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
