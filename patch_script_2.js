const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

// Revert printManagerReport to its original implementation
const oldPrintManagerReport = `        function printManagerReport() { 
            const printTitle = document.getElementById('printTitleManager'); const printTable = document.getElementById('managerTable'); const selDate = document.getElementById('filterDate').value || 'כל התאריכים';
            printTitle.innerText = \`דוח מנהל - \${currentTab} (\${selDate})\`; printTitle.classList.add('print-active'); printTable.classList.add('print-active');
            setTimeout(() => { window.print(); printTitle.classList.remove('print-active'); printTable.classList.remove('print-active'); }, 300); 
        }`;

// Find current printManagerReport and replace it
const startIndex = html.indexOf('function printManagerReport() {');
if (startIndex !== -1) {
    const processOutputIndex = html.indexOf('function processOutput(mode) {');
    if (processOutputIndex !== -1) {
        // Find the start of function printManagerReport() {
        const startToReplace = html.lastIndexOf('        function printManagerReport() {', processOutputIndex);
        if (startToReplace !== -1) {
            html = html.substring(0, startToReplace) + oldPrintManagerReport + '\n\n' + html.substring(processOutputIndex);
        }
    }
}

// Fix the inspector column in generateReport()
html = html.replace('<td class="p-2 border-b">${t.sheet}</td>', '<td class="p-2 border-b">${(t.inspector && t.inspector.startsWith("צוות: ")) ? t.inspector.replace("צוות: ", "") : (t.inspector && t.inspector.startsWith("צוות") ? "דיווח עובד" : (t.inspector || "-"))}</td>');

fs.writeFileSync('tenant-app/public/admin.html', html, 'utf8');
console.log('Fixed successfully');
