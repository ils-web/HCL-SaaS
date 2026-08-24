import React from "react"

interface AdminPrintLayoutsProps {
  printDocumentData: { title: string; data: any[]; type: "manager" | "reports" } | null
  printCardsData: any[] | null
  printLang: string
  printWorker: string
}

export function AdminPrintLayouts({
  printDocumentData,
  printCardsData,
  printLang,
  printWorker,
}: AdminPrintLayoutsProps) {
  return (
    <>
      {printDocumentData && (
        <div id="printDocumentContainer" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black" dir="rtl">
          <h1 className="text-3xl font-bold text-center mb-6">{printDocumentData.title}</h1>
          <table className="w-full text-right border-collapse border border-gray-300">
            <thead className="bg-gray-100 print:bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-2 font-bold text-sm">תאריך</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">מחלקה</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">חדר</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">תיאור / תקלה</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">הערות</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">סטטוס</th>
                <th className="border border-gray-300 p-2 font-bold text-sm">{printDocumentData.type === 'manager' ? 'עובד' : 'משויך ל'}</th>
                {printDocumentData.type === 'reports' && <th className="border border-gray-300 p-2 font-bold text-sm">מפקח</th>}
              </tr>
            </thead>
            <tbody>
              {printDocumentData.data.map((t: any) => (
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
              .print-page { width: 210mm; height: 296mm; margin: 0 auto; padding: 8mm 10mm; box-sizing: border-box; display: flex; flex-direction: column; background: white; overflow: hidden; page-break-after: always; break-after: page; }
              .print-page:last-child { page-break-after: auto; break-after: auto; }
              .print-page-header { font-size: 19px; font-weight: bold; text-align: center; border-bottom: 3px solid #000; padding-bottom: 4px; margin-bottom: 6px; height: 38px; display: flex; flex-direction: column; justify-content: center; color: black; }
              .print-page-header-sub { font-size: 12px; font-weight: normal; color: #555; margin-top: 1px; }
              .print-cards-grid { display: flex; flex-wrap: wrap; justify-content: space-between; align-content: flex-start; flex-grow: 1; height: calc(100% - 44px); }
              .print-card { width: 49%; height: 48.5%; margin-bottom: 1.5%; border: 2px solid #000; border-radius: 10px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; page-break-inside: avoid; break-inside: avoid; overflow: hidden; background: white; color: black; }
              .print-card-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; color: black; }
              .print-card-body { display: flex; gap: 8px; flex-grow: 1; align-items: stretch; overflow: hidden; }
              .print-photo { width: 72%; height: 100%; max-height: 100%; object-fit: cover; object-position: center; border: 1.5px solid #cbd5e1; border-radius: 8px; }
              .print-info { width: 28%; display: flex; flex-direction: column; color: black; overflow: hidden; padding: 0 2px; }
              .defect-title { font-size: 16px; font-weight: 900; margin-bottom: 4px; line-height: 1.2; word-break: break-word; overflow-wrap: break-word; hyphens: auto; }
              .defect-comment { font-size: 13px; color: #1f2937; line-height: 1.2; word-break: break-word; }
              .signature-box { border-top: 2px dashed #000; margin-top: 6px; padding-top: 5px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; color: black;}
            }
          `}} />
          
          {printCardsData.map((page: any, pIdx: number) => (
            <div key={pIdx} className="print-page">
              <div className="print-page-header">
                <div>צוות: {page.tabName} | מחלקה: {page.tasks[0]?.department || page.tasks[0]?.dept || ''} | תאריך: {page.tasks[0]?.dateStr?.split(' ')[0]}</div>
                <div className="print-page-header-sub">הודפס בתאריך: {page.printedTime}</div>
              </div>
              
              <div className="print-cards-grid">
                {page.tasks.map((t: any) => {
                   const isQr = t.defect?.includes("בקרת ניקיון") || t.defect?.includes("פח אשפה") || (t.inspector && t.inspector.includes("סורק"))
                   const actT = t.actionStrOverride ? t.actionStrOverride : (t.actionType === 1 ? "החלפה" : "תיקון")
                   const workerVal = printWorker ? printWorker : "_________"
                   const labels = t.translatedLabels || { room: 'חדר: ', name: 'שם: ', date: 'תאריך: ', sign: 'חתימה: ' };
                   
                   let displayDept = t.dept || t.department;
                   let displayRoom = t.room;
                   if ((displayDept === "QR" || displayDept === "כללי") && displayRoom && displayRoom.includes(" / ")) {
                     const parts = displayRoom.split(" / ");
                     displayDept = parts[0];
                     displayRoom = parts.slice(1).join(" / ");
                   }
                   
                   return (
                    <div key={t.id} className="print-card">
                      <div className="print-card-top">
                        <span style={{fontWeight: 900, fontSize: '20px'}}>{displayDept} | {labels.room}{displayRoom}</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          {isQr && <span style={{background:'#fbcfe8', color:'#be185d', padding:'2px 8px', borderRadius:'6px', fontSize:'14px', fontWeight:900}}>QR</span>}
                          <span style={{border: '1px solid #ccc', padding: '2px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold'}}>{actT}</span>
                        </div>
                      </div>
                      
                      <div className="print-card-body">
                        {t.photoUrl || t.photo ? (
                          <img src={t.photoUrl || t.photo} className="print-photo" alt="defect" />
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
    </>
  )
}
