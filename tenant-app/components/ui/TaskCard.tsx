"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "./Checkbox"

export interface Task {
  id: string
  isQr?: boolean
  sheet: string
  dept: string
  room: string
  defect: string
  comment: string | null
  status: string
  worker: string | null
  inspector: string
  photo: string | null
  afterPhoto: string | null
  actionType: number
  dateStr: string
  printedTime: string | null
  isSentToApp: boolean
  timestamp?: number
}

interface TaskCardProps {
  task: Task
  checked?: boolean
  onToggleCheck: (id: string) => void
  onEditComment?: (id: string) => void
  onApprove: (id: string) => void
  onReturnToOpen: (id: string) => void
  onDelete?: (id: string) => void
  teams?: any[]
  onChangeTeam?: (id: string, teamName: string) => void
  onEditDefect?: (id: string) => void
  className?: string
}

export function TaskCard({
  task,
  checked = false,
  onToggleCheck,
  onEditComment,
  onApprove,
  onReturnToOpen,
  onDelete,
  teams,
  onChangeTeam,
  onEditDefect,
  className,
}: TaskCardProps) {
  const isPrinted = task.status === "בעבודה" || task.status === "מודפס"
  const isCompleted = task.status === "הושלם"
  const isClosed = task.status === "סגור"
  
  const isQr = Boolean(
    task.isQr ||
    task.sheet === 'QR' ||
    task.dept === 'QR' ||
    task.defect?.includes("דיווח") ||
    task.defect?.includes("תקלה חדשה") ||
    task.inspector?.includes("(QR)") ||
    task.inspector?.includes("צוות")
  );
  let reporterName = ""
  if (isQr) {
    if (task.inspector.startsWith("צוות (QR): ")) {
      reporterName = task.inspector.replace("צוות (QR): ", "")
    } else if (task.inspector.startsWith("צוות: ")) {
      reporterName = task.inspector.replace("צוות: ", "")
    } else if (task.inspector.startsWith("צוות")) {
      reporterName = "דיווח עובד"
    } else {
      reporterName = task.inspector
    }
  }

  // Calculate age classes for unprinted tasks
  let ageClass = ""
  if (!isPrinted && !isCompleted && !isClosed) {
    if (!task.dateStr) return null
    const p = task.dateStr.split(" ")[0]?.split("/")
    const tm = task.dateStr.split(" ")[1] ? task.dateStr.split(" ")[1].split(":") : ["00", "00"]
    if (p && p.length === 3) {
      const taskDate = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]), parseInt(tm[0]), parseInt(tm[1]))
      const diffHours = (new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60)
      if (diffHours >= 48) ageClass = "border-red-400 bg-red-50 ring-2 ring-red-200"
      else if (diffHours >= 24) ageClass = "border-orange-400 bg-orange-50 ring-1 ring-orange-200"
      else if (diffHours >= 12) ageClass = "border-yellow-400 bg-yellow-50"
    }
  }

  const actT = task.actionType === 1 ? "החלפה" : "תיקון"
  const cleanSheetName = task.sheet.replace(/_/g, " ")

  // For QR tasks, the original department is sometimes prepended to the room string (e.g. "G 1 / 100")
  // and the task.dept is hardcoded to "QR". Let's extract it for proper display.
  let displayDept = task.dept;
  let displayRoom = task.room;
  if (task.dept === "QR" && task.room.includes(" / ")) {
    const parts = task.room.split(" / ");
    displayDept = parts[0];
    displayRoom = parts.slice(1).join(" / ");
  }

  // Image helpers
  const getImgUrl = (url: string | null) => {
    if (!url || url.includes("placehold")) return null
    if (url.startsWith("http") || url.startsWith("data:")) return url
    return `/uploads/${url}`
  }

  // Check if task is older than 15 days (ImgBB auto-deletes after 15 days per license)
  const isOver15Days = React.useMemo(() => {
    if (task.timestamp) {
      return (Date.now() - task.timestamp) > 15 * 24 * 60 * 60 * 1000
    }
    return false
  }, [task.timestamp])

  const rawImg = getImgUrl(task.photo)
  const rawAfterImg = task.afterPhoto ? getImgUrl(task.afterPhoto) : null

  const [imgBroken, setImgBroken] = React.useState(false)
  const [afterImgBroken, setAfterImgBroken] = React.useState(false)

  React.useEffect(() => {
    setImgBroken(false)
    setAfterImgBroken(false)
  }, [task.photo, task.afterPhoto])

  const showMainPhoto = Boolean(rawImg && !imgBroken && !(isOver15Days && rawImg.includes("ibb.co")))
  const showAfterPhoto = Boolean(rawAfterImg && !afterImgBroken && !(isOver15Days && rawAfterImg.includes("ibb.co")))

  return (
    <div
      className={cn(
        "bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-5 relative transition-all duration-200 hover:shadow-md",
        {
          "border-green-400 bg-green-50 ring-2 ring-green-200": isCompleted,
          "border-orange-300 bg-orange-50/50": isPrinted && !isCompleted,
          "border-2 border-purple-500 bg-gradient-to-r from-purple-50/90 via-white to-pink-50/70 shadow-lg ring-2 ring-purple-300": isQr && !isPrinted && !isCompleted,
        },
        (!isCompleted && !isPrinted && !isQr) ? ageClass : "",
        "hover:z-50",
        className
      )}
      dir="rtl"
    >
      <div className="absolute top-4 left-4 md:static md:flex md:items-center">
        <Checkbox
          checked={checked}
          onChange={() => onToggleCheck?.(task.id)}
          className="w-7 h-7 rounded shadow-sm"
        />
      </div>

      <div className="relative z-10 w-24 h-24 shrink-0">
        {showMainPhoto && rawImg ? (
          <>
            <img
              src={rawImg}
              className="w-full h-full object-cover rounded-xl border bg-white"
              onLoad={(e) => {
                const el = e.currentTarget
                // ImgBB returns a 180x180 placeholder image when an image is deleted/expired
                if (rawImg.includes("ibb.co") && el.naturalWidth === 180 && el.naturalHeight === 180) {
                  setImgBroken(true)
                }
              }}
              onError={() => setImgBroken(true)}
              alt="Task Photo"
            />
            <div className="absolute -top-2 -right-2 group/img cursor-pointer">
              <svg className="w-6 h-6 relative z-20 bg-white rounded-full p-1 text-gray-500 shadow border hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <div className="hidden group-hover/img:block absolute top-full md:bottom-full md:top-auto -right-4 mb-2 z-[100] p-2 bg-white rounded-2xl shadow-2xl border w-[300px] h-[300px] origin-bottom-right">
                <img src={rawImg} className="w-full h-full object-contain rounded-xl" alt="Task Photo Zoom" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full rounded-xl border border-gray-200 bg-gray-50/90 flex flex-col items-center justify-center text-gray-400 p-1.5 text-center select-none">
            <i className="fas fa-camera text-xl mb-1 opacity-40"></i>
            <span className="text-[10px] font-bold leading-tight text-gray-400">
              {isOver15Days && rawImg ? "נמחק (15 יום)" : "אין תמונה"}
            </span>
          </div>
        )}

        {isCompleted && showAfterPhoto && rawAfterImg && (
          <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-lg border-2 border-green-500 shadow-md group/afterimg cursor-pointer bg-white">
            <img
              src={rawAfterImg}
              className="w-full h-full object-cover rounded-md"
              onLoad={(e) => {
                const el = e.currentTarget
                if (rawAfterImg.includes("ibb.co") && el.naturalWidth === 180 && el.naturalHeight === 180) {
                  setAfterImgBroken(true)
                }
              }}
              onError={() => setAfterImgBroken(true)}
              alt="After Photo"
            />
            <div className="absolute -top-2 -right-2 z-20 bg-green-500 text-white rounded-full p-1 shadow">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <div className="hidden group-hover/afterimg:block absolute top-full md:bottom-full md:top-auto left-0 mb-2 z-[100] p-2 bg-white rounded-2xl shadow-2xl border w-[300px] h-[300px] origin-bottom-left">
              <img src={rawAfterImg} className="w-full h-full object-contain rounded-xl" alt="After Photo Zoom" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow pr-10 md:pr-0 min-w-0 overflow-hidden break-words">
        <div className="flex flex-wrap gap-2 mb-2 items-center">
          {isQr && (
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md ring-2 ring-purple-300/60">
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping"></span>
              <i className="fas fa-qrcode text-sm"></i>
              <span>קריאת QR מהשטח</span>
              {reporterName && reporterName !== "לא ידוע" && reporterName !== "לא הוגדר שם" && reporterName !== "דיווח מהשטח" ? (
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">מדווח: {reporterName}</span>
              ) : null}
            </div>
          )}
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-black border border-blue-200 shadow-sm">
            צוות משויך: {cleanSheetName}
          </div>
          {task.isSentToApp && (
            <div className="inline-flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black border border-indigo-200 shadow-sm">
              WorkerApp
            </div>
          )}
          {task.comment?.includes("[הוחזר לתיקון") && (
            <div className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-3 py-1 rounded-lg text-xs font-black border border-rose-300 shadow-sm">
              <i className="fas fa-undo-alt"></i> הוחזר לתיקון
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">
            {displayDept} | חדר: {displayRoom} <span className="text-sm font-normal px-2 bg-gray-100 rounded text-gray-700 ml-2">{actT}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="font-bold text-gray-800">{task.defect}</p>
        </div>
        <div className="flex items-start gap-2 mt-1">
          <p className="text-gray-700 font-semibold text-sm max-w-lg whitespace-pre-line leading-snug" title={task.comment || ""}>
            {task.comment || "אין הערה"}
          </p>
          <button
            onClick={() => onEditDefect?.(task.id)}
            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
            title="ערוך בעיה"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 font-semibold mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {task.dateStr} | {isQr && reporterName ? `מדווח: ${reporterName}` : task.inspector}
        </p>
      </div>

      {isPrinted && !isCompleted && (
        <div className="hidden md:flex flex-col justify-center items-start border-r-2 border-orange-200 pr-5 w-48 shrink-0 text-right">
          <div className="flex items-center justify-between w-full gap-2">
            <div>
              <span className="text-xs text-orange-800 font-bold block">נמסר לטיפול:</span>
              <span className="font-black text-base text-indigo-950 leading-tight">{task.worker || "לא צוות עובד"}</span>
            </div>
            {task.isSentToApp ? (
              <div className="bg-blue-100 p-1.5 rounded-lg border border-blue-200 shadow-xs shrink-0" title="נשלח לאפליקציה">
                <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            ) : (
              <div className="bg-orange-100 p-1.5 rounded-lg border border-orange-200 shadow-xs shrink-0" title="הודפס">
                <svg className="w-4 h-4 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
            )}
          </div>
          {task.printedTime && (
            <span className="text-[11px] text-orange-900 font-bold mt-0.5">{task.printedTime}</span>
          )}
          <div className="mt-2.5 flex flex-col gap-1.5 w-full">
            <button
              onClick={() => onApprove?.(task.id)}
              className="w-full bg-green-50 text-green-700 border border-green-500 px-2.5 py-1.5 rounded-lg font-bold text-xs hover:bg-green-100 transition-colors flex justify-center items-center gap-1.5"
            >
              <i className="fas fa-check"></i> סגור משימה
            </button>
            <div className="flex gap-1.5 w-full">
              <button
                onClick={() => onReturnToOpen?.(task.id)}
                className="flex-grow bg-orange-50 text-orange-700 border border-orange-300 px-2 py-1.5 rounded-lg font-bold text-xs hover:bg-orange-100 transition-colors flex justify-center items-center gap-1"
                title="החזר לתיקון או שנה עובד"
              >
                <i className="fas fa-undo-alt"></i> החזר / שנה
              </button>
              <button
                onClick={() => onDelete?.(task.id)}
                className="bg-red-50 text-red-600 border border-red-200 w-8 shrink-0 flex justify-center items-center rounded-lg font-bold hover:bg-red-100 transition-colors"
                title="מחק משימה לצמיתות"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {!isPrinted && !isCompleted && teams && (
        <div className="hidden md:flex flex-col justify-center gap-2 border-r-2 border-gray-100 pr-5 w-40 shrink-0">
          <div>
            <span className="text-xs text-gray-400 mb-1 block">שיוך צוות:</span>
            <select 
              className="w-full bg-gray-50 border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg font-bold text-xs outline-none cursor-pointer"
              value={task.sheet}
              onChange={(e) => onChangeTeam?.(task.id, e.target.value)}
            >
              {!teams.some((t: any) => t.name === task.sheet) && (
                <option value={task.sheet}>{task.sheet}</option>
              )}
              {teams.map((t: any) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button
              onClick={() => onApprove?.(task.id)}
              className="flex-grow bg-green-50 text-green-600 border border-green-500 px-2 py-1.5 rounded-lg font-bold text-xs hover:bg-green-100 transition-colors flex justify-center items-center gap-2"
            >
              <i className="fas fa-check"></i> סגור משימה
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="bg-red-50 text-red-600 border border-red-200 w-8 flex justify-center items-center rounded-lg font-bold hover:bg-red-100 transition-colors"
              title="מחק משימה לצמיתות"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="hidden md:flex flex-col justify-center border-r-2 border-green-300 bg-green-100 p-3 rounded-xl pr-5 w-40 shadow-sm shrink-0">
          <span className="text-xs text-green-700 font-bold flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            בוצע ע"י העובד:
          </span>
          <span className="font-black text-gray-900 mt-1">{task.worker || "לא ידוע"}</span>
        </div>
      )}

      {isCompleted && (
        <div className="hidden md:flex flex-col justify-center items-center gap-2 border-r border-gray-100 pr-5 pl-2 shrink-0">
          <button
            onClick={() => onApprove?.(task.id)}
            className="w-full bg-green-500 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-green-600 transition-colors shadow-sm flex justify-center items-center gap-2"
          >
            אישור סופי
          </button>
          <button
            onClick={() => onReturnToOpen?.(task.id)}
            className="w-full bg-orange-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-orange-600 transition-colors shadow-xs flex justify-center items-center gap-1.5"
          >
            <i className="fas fa-undo-alt"></i> החזר לתיקון
          </button>
          <button
            onClick={() => onDelete?.(task.id)}
            className="w-full mt-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors flex justify-center items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i> מחק משימה
          </button>
        </div>
      )}
      
      {/* Mobile delete button (only visible on small screens since desktop has the sidebar) */}
      <div className="md:hidden absolute bottom-4 left-4 z-20">
        <button
          onClick={() => onDelete?.(task.id)}
          className="bg-red-50 text-red-600 border border-red-200 w-9 h-9 flex justify-center items-center rounded-lg shadow-sm hover:bg-red-100 transition-colors"
          title="מחק משימה לצמיתות"
        >
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  )
}
