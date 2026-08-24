"use client"

import * as React from "react"
import { Modal } from "@/components/ui/Modal"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DatePicker } from "@/components/ui/DatePicker"
import { toast } from "@/components/ui/Toast"
import { format } from "date-fns"

const printHtmlInIframe = (htmlContent: string) => {
  let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }
  
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent + `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 200);
        };
      </script>
    `);
    doc.close();
  }
};

interface AdminModalsProps {
  tenantId: string | null
  tenantName: string
  tasks: any[]
  teams: any[]
  setTeams: (val: any[]) => void
  workers: any[]
  setWorkers: (val: any[]) => void
  categories: any
  setCategories: (val: any) => void
  systemTeams: any
  setSystemTeams: (val: any) => void
  loadTasks: () => void
  loading: boolean
  setLoading: (val: boolean) => void

  printModalOpen: boolean
  setPrintModalOpen: (val: boolean) => void
  printLang: string
  setPrintLang: (val: string) => void
  printWorker: string
  setPrintWorker: (val: string) => void
  printMode?: "print" | "app"
  isOutputProcessing?: boolean
  executeOutputSequence: () => void

  workerQrModalOpen: boolean
  setWorkerQrModalOpen: (val: boolean) => void
  qrModalOpen: boolean
  setQrModalOpen: (val: boolean) => void
  workersModalOpen: boolean
  setWorkersModalOpen: (val: boolean) => void
  teamsModalOpen: boolean
  setTeamsModalOpen: (val: boolean) => void
  configModalOpen: boolean
  setConfigModalOpen: (val: boolean) => void
  integrationsModalOpen: boolean
  setIntegrationsModalOpen: (val: boolean) => void
  
  promptModalData: any
  setPromptModalData: (val: any) => void
  confirmModalData: any
  setConfirmModalData: (val: any) => void
  
  qrSettings: any
  setQrSettings: (val: any) => void
  saveQrSettings: (val: any) => void
  
  reportsModalOpen: boolean
  setReportsModalOpen: (val: boolean) => void
  reportsStart: string
  setReportsStart: (val: string) => void
  reportsEnd: string
  setReportsEnd: (val: string) => void
  isReportsLoading: boolean
  loadReports: () => void
  reportsData: any[]
  handlePrintReports: () => void
  
  telegramBotToken: string
  setTelegramBotToken: (val: string) => void
  telegramChatId: string
  setTelegramChatId: (val: string) => void
  whatsappInstance: string
  setWhatsappInstance: (val: string) => void
  whatsappToken: string
  setWhatsappToken: (val: string) => void

  exportTasksToCSV?: () => void
  handleCleanupTasks?: (days: number) => void
}

export function AdminModals({
  tenantId, tenantName, tasks, teams, setTeams, workers, setWorkers,
  categories, setCategories, systemTeams, setSystemTeams, loadTasks,
  loading, setLoading,
  printModalOpen, setPrintModalOpen, printLang, setPrintLang, printWorker, setPrintWorker, printMode, isOutputProcessing, executeOutputSequence,
  workerQrModalOpen, setWorkerQrModalOpen, qrModalOpen, setQrModalOpen,
  workersModalOpen, setWorkersModalOpen, teamsModalOpen, setTeamsModalOpen,
  configModalOpen, setConfigModalOpen, integrationsModalOpen, setIntegrationsModalOpen,
  promptModalData, setPromptModalData, confirmModalData, setConfirmModalData,
  reportsModalOpen, setReportsModalOpen, reportsStart, setReportsStart,
  reportsEnd, setReportsEnd, isReportsLoading, loadReports, reportsData, handlePrintReports,
  telegramBotToken, setTelegramBotToken, telegramChatId, setTelegramChatId,
  whatsappInstance, setWhatsappInstance, whatsappToken, setWhatsappToken,
  qrSettings, setQrSettings, saveQrSettings,
  exportTasksToCSV, handleCleanupTasks
}: AdminModalsProps) {
  const [qrDept, setQrDept] = React.useState("")
  const [qrCustomDept, setQrCustomDept] = React.useState("")
  
  const [localQrMode, setLocalQrMode] = React.useState("24/7")
  const [localQrStart, setLocalQrStart] = React.useState("08:00")
  const [localQrEnd, setLocalQrEnd] = React.useState("17:00")

  React.useEffect(() => {
    if (workerQrModalOpen && qrSettings) {
      setLocalQrMode(qrSettings.mode || "24/7")
      setLocalQrStart(qrSettings.start || "08:00")
      setLocalQrEnd(qrSettings.end || "17:00")
    }
  }, [workerQrModalOpen, qrSettings])

  const [workerQrGeneratedUrl, setWorkerQrGeneratedUrl] = React.useState("")
  const [qrGeneratedUrl, setQrGeneratedUrl] = React.useState("")
  const [activeConfigArea, setActiveConfigArea] = React.useState<string | null>(null)

  return (
    <>
      <Modal 
        isOpen={printModalOpen} 
        onClose={() => !isOutputProcessing && setPrintModalOpen(false)} 
        title={printMode === "app" ? "שליחה לאפליקציית עובד" : "הגדרות הדפסה"}
      >
        <div className="space-y-4">
          {printMode === "print" && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">שפת הדפסה</label>
              <Select value={printLang} onChange={e => setPrintLang(e.target.value)} disabled={isOutputProcessing} className="w-full">
                <option value="he">עברית</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{printMode === "app" ? "בחר עובד לקבלת המשימות" : "שיוך לעובד (אופציונלי)"}</label>
            <Select value={printWorker} onChange={e => setPrintWorker(e.target.value)} disabled={isOutputProcessing} className="w-full">
              <option value="">-- {printMode === "app" ? "כל העובדים / ללא שיוך" : "ללא שיוך מיוחד"} --</option>
              {workers.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </Select>
          </div>
          <div className="pt-4 flex gap-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 flex items-center justify-center gap-2" 
              onClick={executeOutputSequence}
              disabled={isOutputProcessing}
            >
              {isOutputProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>{printMode === "app" ? "שולח לאפליקציה..." : "מעבד ומכין להדפסה..."}</span>
                </>
              ) : (
                <>
                  <i className={printMode === "app" ? "fas fa-paper-plane" : "fas fa-print"}></i>
                  <span>{printMode === "app" ? "שלח לאפליקציה" : "אישור והדפסה"}</span>
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full h-11" disabled={isOutputProcessing} onClick={() => setPrintModalOpen(false)}>ביטול</Button>
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
                {Array.from(new Set(tasks.map(t => t.dept).filter(Boolean))).map(d => (
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
                  printHtmlInIframe(`
                    <!DOCTYPE html>
                    <html dir="rtl">
                    <head>
                      <meta charset="utf-8">
                      <title>Report QR - ${tenantName}</title>
                      <style>
                        @page {
                          size: A4 portrait;
                          margin: 15mm;
                        }
                        * { box-sizing: border-box; }
                        body {
                          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                          text-align: center;
                          background: #f8fafc;
                          color: #0f172a;
                          margin: 0;
                          padding: 30px 15px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          min-height: 100vh;
                        }
                        .print-card {
                          background: white;
                          border: 4px solid #4f46e5;
                          border-radius: 28px;
                          display: inline-block;
                          padding: 36px 44px;
                          max-width: 520px;
                          width: 100%;
                          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
                          position: relative;
                        }
                        .org-title {
                          font-size: 28px;
                          font-weight: 900;
                          color: #3730a3;
                          margin: 0 0 6px 0;
                          line-height: 1.2;
                        }
                        .card-title {
                          font-size: 19px;
                          font-weight: 700;
                          color: #475569;
                          margin: 0 0 16px 0;
                        }
                        .dept-badge {
                          display: inline-block;
                          background: #eef2ff;
                          color: #4338ca;
                          border: 2px dashed #818cf8;
                          padding: 8px 24px;
                          border-radius: 9999px;
                          font-size: 22px;
                          font-weight: 800;
                          margin-bottom: 22px;
                        }
                        .qr-frame {
                          background: #ffffff;
                          border: 3px solid #e2e8f0;
                          border-radius: 22px;
                          padding: 16px;
                          display: inline-block;
                          margin-bottom: 22px;
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                        }
                        .qr-frame img {
                          display: block;
                          width: 260px;
                          height: 260px;
                          border-radius: 12px;
                        }
                        .instructions-box {
                          background: #f8fafc;
                          border: 2px solid #e2e8f0;
                          border-radius: 18px;
                          padding: 14px 18px;
                          display: flex;
                          flex-direction: column;
                          gap: 8px;
                          text-align: center;
                        }
                        .lang-row {
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          gap: 8px;
                          font-weight: 800;
                        }
                        .lang-he { font-size: 18px; color: #1e1b4b; }
                        .lang-ru { font-size: 15px; color: #334155; font-family: 'Segoe UI', Arial, sans-serif; }
                        .lang-ar { font-size: 17px; color: #065f46; font-family: 'Segoe UI', Tahoma, sans-serif; }
                        .lang-icon { font-size: 16px; }
                        .footer-note {
                          margin-top: 16px;
                          font-size: 12px;
                          color: #94a3b8;
                          font-weight: 600;
                        }
                        .no-print {
                          margin-top: 24px;
                        }
                        .print-btn {
                          padding: 12px 36px;
                          font-size: 16px;
                          font-weight: 800;
                          cursor: pointer;
                          background: #4f46e5;
                          color: white;
                          border: none;
                          border-radius: 12px;
                          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);
                          transition: all 0.2s;
                        }
                        .print-btn:hover {
                          background: #4338ca;
                          transform: translateY(-1px);
                        }
                        @media print {
                          body {
                            background: white;
                            padding: 0;
                            min-height: auto;
                          }
                          .print-card {
                            box-shadow: none;
                            border: 4px solid #4338ca;
                            page-break-inside: avoid;
                            margin: 0 auto;
                          }
                          .no-print {
                            display: none !important;
                          }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-card">
                        <div class="org-title">${tenantName}</div>
                        <div class="card-title">דיווח תקלות וליקויים</div>
                        
                        <div class="dept-badge">מחלקה: ${deptToUse || 'כללי'}</div><br>
                        
                        <div class="qr-frame">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(workerQrGeneratedUrl)}" alt="QR Code" />
                        </div>

                        <div class="instructions-box">
                          <div class="lang-row lang-he">
                            <span class="lang-icon">📲</span>
                            <span>סרוק כדי לדווח על תקלה</span>
                          </div>
                          <div class="lang-row lang-ru">
                            <span class="lang-icon">📲</span>
                            <span>Отсканируйте, чтобы сообщить о неполадке</span>
                          </div>
                          <div class="lang-row lang-ar">
                            <span class="lang-icon">📲</span>
                            <span>امسح الرمز للإبلاغ عن عطل</span>
                          </div>
                        </div>

                        <div class="footer-note">HCL Maintenance &amp; Facilities Management</div>
                      </div>

                      <div class="no-print">
                        <button class="print-btn" onclick="window.print(); window.close();">🖨️ הדפס כעת (Print)</button>
                      </div>
                    </body>
                    </html>
                  `);
                }}>הדפס</Button>
              </div>
            </div>
          )}

          <div className="mt-8 border-t pt-6 text-right" dir="rtl">
            <h4 className="text-lg font-bold text-gray-800 mb-4">הגדרות שעות פעילות (לכל הדיווחים)</h4>
            
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input type="radio" id="qrMode247" name="qrMode" value="24/7" checked={localQrMode === '24/7'} onChange={() => setLocalQrMode('24/7')} className="w-5 h-5 text-indigo-600 cursor-pointer" />
                    <label htmlFor="qrMode247" className="font-bold text-gray-700 cursor-pointer flex-1">פתוח תמיד (24/7)</label>
                </div>
                
                <div className="flex flex-col gap-2 border p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                        <input type="radio" id="qrModeSchedule" name="qrMode" value="SCHEDULED" checked={localQrMode === 'SCHEDULED'} onChange={() => setLocalQrMode('SCHEDULED')} className="w-5 h-5 text-indigo-600 cursor-pointer" />
                        <label htmlFor="qrModeSchedule" className="font-bold text-gray-700 cursor-pointer flex-1">לפי שעות פעילות</label>
                    </div>
                    
                    {localQrMode === 'SCHEDULED' && (
                      <div className="flex items-center gap-4 pr-7">
                          <div className="flex flex-col flex-1">
                              <label className="text-xs font-bold text-gray-500 mb-1">שעת התחלה</label>
                              <input type="time" value={localQrStart} onChange={e => setLocalQrStart(e.target.value)} className="px-3 py-2 border rounded-lg outline-none w-full font-bold bg-white" dir="ltr" />
                          </div>
                          <div className="flex flex-col flex-1">
                              <label className="text-xs font-bold text-gray-500 mb-1">שעת סיום</label>
                              <input type="time" value={localQrEnd} onChange={e => setLocalQrEnd(e.target.value)} className="px-3 py-2 border rounded-lg outline-none w-full font-bold bg-white" dir="ltr" />
                          </div>
                      </div>
                    )}
                </div>
            </div>

            <Button className="w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white font-bold h-10" onClick={() => saveQrSettings({ mode: localQrMode, start: localQrStart, end: localQrEnd })}>
              <i className="fas fa-save ml-2"></i> שמור הגדרות פעילות
            </Button>
          </div>

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
                  printHtmlInIframe(`
                    <!DOCTYPE html>
                    <html dir="rtl">
                    <head>
                      <meta charset="utf-8">
                      <title>Inspector QR - ${tenantName}</title>
                      <style>
                        @page { size: A4 portrait; margin: 15mm; }
                        * { box-sizing: border-box; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; background: #f8fafc; color: #0f172a; margin: 0; padding: 30px 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
                        .print-card { background: white; border: 4px solid #059669; border-radius: 28px; display: inline-block; padding: 36px 44px; max-width: 520px; width: 100%; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08); position: relative; }
                        .org-title { font-size: 28px; font-weight: 900; color: #065f46; margin: 0 0 6px 0; line-height: 1.2; }
                        .card-title { font-size: 20px; font-weight: 700; color: #475569; margin: 0 0 20px 0; }
                        .badge { display: inline-block; background: #ecfdf5; color: #059669; border: 2px dashed #6ee7b7; padding: 8px 24px; border-radius: 9999px; font-size: 22px; font-weight: 800; margin-bottom: 22px; }
                        .qr-frame { background: #ffffff; border: 3px solid #e2e8f0; border-radius: 22px; padding: 16px; display: inline-block; margin-bottom: 22px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
                        .qr-frame img { display: block; width: 260px; height: 260px; border-radius: 12px; }
                        .instructions-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 18px; padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; text-align: center; }
                        .lang-row { display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 17px; color: #065f46; }
                        .footer-note { margin-top: 16px; font-size: 12px; color: #94a3b8; font-weight: 600; }
                        .no-print { margin-top: 24px; }
                        .print-btn { padding: 12px 36px; font-size: 16px; font-weight: 800; cursor: pointer; background: #059669; color: white; border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.35); transition: all 0.2s; }
                        .print-btn:hover { background: #047857; transform: translateY(-1px); }
                        @media print {
                          body { background: white; padding: 0; min-height: auto; }
                          .print-card { box-shadow: none; border: 4px solid #059669; page-break-inside: avoid; margin: 0 auto; }
                          .no-print { display: none !important; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="print-card">
                        <div class="org-title">${tenantName}</div>
                        <div class="card-title">אפליקציית מפקח</div>
                        <div class="badge">בדיקת מערכות וחדרים</div><br>
                        <div class="qr-frame">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrGeneratedUrl)}" alt="Inspector QR Code" />
                        </div>
                        <div class="instructions-box">
                          <div class="lang-row">
                            <span>📲</span>
                            <span>סרוק כדי להתחבר לממשק הבדיקה של הארגון</span>
                          </div>
                        </div>
                        <div class="footer-note">HCL Maintenance &amp; Facilities Management</div>
                      </div>
                      <div class="no-print">
                        <button class="print-btn" onclick="window.print(); window.close();">🖨️ הדפס כעת (Print)</button>
                      </div>
                    </body>
                    </html>
                  `);
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
                    printHtmlInIframe(`
                      <html dir="rtl"><head><title>Print Worker QR</title>
                      <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 50px; background: white; color: #111827; }
                        .card { border: 4px solid #db2777; border-radius: 20px; display: inline-block; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
                        h1 { font-size: 36px; margin-bottom: 10px; color: #db2777; font-weight: 900; }
                        p { font-size: 24px; color: #4b5563; font-weight: bold; margin-bottom: 30px; }
                        .name-badge { display: inline-block; background: #fce7f3; color: #be185d; padding: 10px 20px; border-radius: 12px; font-size: 28px; font-weight: 900; margin-bottom: 30px; border: 2px dashed #f472b6; }
                        .qr-container { padding: 20px; border: 3px solid #e5e7eb; border-radius: 16px; display: inline-block; background: #fff; }
                      </style>
                      </head>
                      <body>
                        <div class="card">
                            <h1>אפליקציית עובד</h1>
                            <p>סרוק כדי להתחבר למשימות שלך</p>
                            <div class="name-badge">עובד: ${w.name}</div><br>
                            <div class="qr-container">
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" />
                            </div>
                        </div>
                      </body></html>
                    `);
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar p-1" dir="rtl">
          <p className="text-xs text-gray-500 mb-2">באפשרותך לשנות את סדר הצוותים (והלשוניות) באמצעות החצים למעלה/למטה:</p>
          {teams.length === 0 ? (
            <div className="text-center text-gray-400 p-4">אין צוותים מוגדרים</div>
          ) : (
            teams.map((t, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      className={`w-7 h-7 flex items-center justify-center rounded bg-white border border-gray-200 shadow-xs transition-colors ${idx === 0 ? "opacity-30 cursor-not-allowed text-gray-300" : "hover:bg-blue-50 text-blue-600 hover:border-blue-300"}`}
                      onClick={() => {
                        if (idx > 0) {
                          const newT = [...teams];
                          const [item] = newT.splice(idx, 1);
                          newT.splice(idx - 1, 0, item);
                          setTeams(newT);
                        }
                      }}
                      title="הזז למעלה"
                    >
                      <i className="fas fa-chevron-up text-xs"></i>
                    </button>
                    <button
                      type="button"
                      disabled={idx === teams.length - 1}
                      className={`w-7 h-7 flex items-center justify-center rounded bg-white border border-gray-200 shadow-xs transition-colors ${idx === teams.length - 1 ? "opacity-30 cursor-not-allowed text-gray-300" : "hover:bg-blue-50 text-blue-600 hover:border-blue-300"}`}
                      onClick={() => {
                        if (idx < teams.length - 1) {
                          const newT = [...teams];
                          const [item] = newT.splice(idx, 1);
                          newT.splice(idx + 1, 0, item);
                          setTeams(newT);
                        }
                      }}
                      title="הזז למטה"
                    >
                      <i className="fas fa-chevron-down text-xs"></i>
                    </button>
                  </div>
                  <span className="font-bold text-gray-800 text-sm mr-2">{t.name}</span>
                </div>
                {t.name !== 'QR' && t.name !== 'כללי' && (
                  <Button variant="danger" className="p-2 h-auto" onClick={() => {
                    const newT = [...teams];
                    newT.splice(idx, 1);
                    setTeams(newT);
                  }} title="מחק צוות"><i className="fas fa-trash-alt"></i></Button>
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
        <div className="h-[70vh] flex flex-col md:flex-row gap-4 p-1">
          {/* Areas List (Right in RTL) */}
          <div className="w-full md:w-1/2 flex flex-col gap-2 border-l pl-4 overflow-y-auto custom-scrollbar bg-gray-50/50 p-2 rounded-xl border border-gray-100">
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
          <div className="w-full md:w-1/2 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-4">
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
                    <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-gray-200 shadow-sm gap-2 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start w-full gap-2">
                        <span className="font-bold text-gray-800 text-sm break-words flex-1 text-right">{sys}</span>
                        <button className="text-red-500 hover:text-red-700 p-1 flex-shrink-0" onClick={() => {
                          const newC = {...categories};
                          newC[activeConfigArea] = newC[activeConfigArea].filter((s: string) => s !== sys);
                          setCategories(newC);
                        }}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="flex flex-col gap-1 w-full mt-1 border-t border-gray-50 pt-2">
                        <span className="text-xs text-gray-500 font-medium text-right">צוות מטפל:</span>
                        <Select 
                          className="w-full h-9 text-sm rounded-md border-gray-300 bg-gray-50 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
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
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Data Management Section */}
        <div className="mt-4 p-4 bg-gray-100 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3"><i className="fas fa-database text-indigo-600 ml-2"></i>ניהול נתונים (ארכיון וגיבוי)</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <Button variant="outline" className="flex-1 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-bold shadow-sm" onClick={exportTasksToCSV}>
              <i className="fas fa-file-excel ml-2 text-green-600"></i> ייצא את כל המשימות (CSV)
            </Button>
            
            <div className="flex-1 flex gap-2">
              <Select id="cleanupDays" className="w-1/2 bg-white" defaultValue="180">
                <option value="90">מעל 3 חודשים</option>
                <option value="180">מעל חצי שנה</option>
                <option value="365">מעל שנה</option>
              </Select>
              <Button variant="outline" className="w-1/2 bg-white hover:bg-red-50 border-red-200 text-red-600 font-bold shadow-sm" onClick={() => {
                const val = (document.getElementById('cleanupDays') as HTMLSelectElement).value;
                if (handleCleanupTasks) handleCleanupTasks(parseInt(val));
              }}>
                <i className="fas fa-trash ml-2"></i> נקה סגורות
              </Button>
            </div>
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


    </>
  )
}
