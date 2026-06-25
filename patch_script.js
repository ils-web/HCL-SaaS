const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

// Fix 1: Add HTML2PDF print logic (printManagerReport function)
const printManagerReportLogic = `        function printManagerReport() {
            const selDate = document.getElementById('filterDate').value || 'כל התאריכים';
            const titleText = 'דוח מנהל - ' + currentTab + ' (' + selDate + ')';
            let container = document.createElement('div');
            container.style.direction = 'rtl';
            container.style.width = '297mm';
            container.style.padding = '10mm';
            container.style.backgroundColor = 'white';
            container.style.color = 'black';
            const tableHTML = document.getElementById('managerTable').outerHTML;
            container.innerHTML = '<h2 style="font-size:24px; font-weight:bold; text-align:center; margin-bottom:1rem;">' + titleText + '</h2>' + tableHTML;
            document.body.appendChild(container);
            showLoader('מייצר PDF...');
            const optManager = {
                margin: 5,
                filename: 'manager_report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };
            setTimeout(() => {
                html2pdf().set(optManager).from(container).save().then(() => {
                    document.body.removeChild(container);
                    hideLoader();
                    showToast('קובץ PDF הורד בהצלחה', 'success');
                }).catch(err => {
                    document.body.removeChild(container);
                    hideLoader();
                    showToast('שגיאה ביצירת PDF', 'error');
                });
            }, 500);
        }`;

if (!html.includes('function printManagerReport()')) {
    html = html.replace('function processOutput(mode) {', printManagerReportLogic + '\n\n        function processOutput(mode) {');
}

// Fix 2: Replace window.print() inside printManagerReport with a call to printManagerReport()
html = html.replace("setTimeout(() => { window.print(); printTitle.classList.remove('print-active'); printTable.classList.remove('print-active'); }, 300);", "printManagerReport();");

// Fix 3: Add translate function and translation dictionary
const translateLogic = `        const TRANSLATION_MAP = {
            'he': { 'מחלקה': 'מחלקה', 'תאריך': 'תאריך', 'תקלה': 'תקלה', 'חדר': 'חדר', 'כללי': 'כללי' },
            'ru': { 'מחלקה': 'Отделение', 'תאריך': 'Дата', 'תקלה': 'Дефект', 'חדר': 'Комната', 'כללי': 'Общее' },
            'en': { 'מחלקה': 'Department', 'תאריך': 'Date', 'תקלה': 'Defect', 'חדר': 'Room', 'כללי': 'General' },
            'ar': { 'מחלקה': 'قسم', 'תאריך': 'تاريخ', 'תקלה': 'عطل', 'חדר': 'غرفة', 'כללי': 'عام' }
        };
        function translateHtmlStr(text) {
            const targetLang = document.getElementById('printLang') ? document.getElementById('printLang').value : 'he';
            if (targetLang === 'he' || !TRANSLATION_MAP[targetLang]) return text;
            let out = text;
            for (let k in TRANSLATION_MAP[targetLang]) {
                out = out.replace(new RegExp(k, 'g'), TRANSLATION_MAP[targetLang][k]);
            }
            return out;
        }`;
if (!html.includes('function translateHtmlStr')) {
    html = html.replace('let allTasks = [];', translateLogic + '\n        let allTasks = [];');
}

// Fix 4: Print card blank page fix (remove page-break-after: always)
html = html.replace('.print-page { page-break-after: always; padding: 10mm; width: 210mm; height: 296mm; border: none; }', '.print-page { padding: 10mm; width: 210mm; height: 296mm; border: none; }');

// Fix 5: Apply translateHtmlStr to print chunk headers
html = html.replace('<div>צוות: ${currentTab.replace(/_/g, \' \')} | מחלקה: ${g[0].dept} | תאריך: ${g[0].dDate}</div><div class="print-page-header-sub">הופק בתאריך: ${printNowStr}</div>', 
                    '<div>צוות: ${currentTab.replace(/_/g, \' \')} | ${translateHtmlStr(\'מחלקה\')}: ${translateHtmlStr(g[0].dept)} | ${translateHtmlStr(\'תאריך\')}: ${g[0].dDate}</div><div class="print-page-header-sub">הופק ב${translateHtmlStr(\'תאריך\')}: ${printNowStr}</div>');

// Fix 6: Apply translateHtmlStr to print card body
html = html.replace('<div class="print-card-top"><span class="font-black text-xl">${printLabels.room} ${t.room}</span>', '<div class="print-card-top"><span class="font-black text-xl">${printLabels.room} ${translateHtmlStr(t.room)}</span>');
html = html.replace('<p class="defect-title">${t.defect}</p><p class="defect-comment">${t.comment || ""}</p>', '<p class="defect-title">${translateHtmlStr(t.defect)}</p><p class="defect-comment">${translateHtmlStr(t.comment || "")}</p>');

fs.writeFileSync('tenant-app/public/admin.html', html, 'utf8');
console.log('Fixed successfully');
