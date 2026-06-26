const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

const bannersHtml = `
    <!-- Stats Banners -->
    <div id="workersStatsBanner" class="hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 w-64 bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden">
        <div class="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
            <h3 class="font-bold text-gray-800 text-lg">עובדים (החודש)</h3>
            <button onclick="printStats('workers')" class="text-blue-600 hover:text-blue-800 transition-colors" title="הדפס סטטיסטיקה"><i class="fas fa-print"></i></button>
        </div>
        <div id="workersStatsList" class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <!-- Stats rows will be injected here -->
        </div>
    </div>

    <div id="teamsStatsBanner" class="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 w-64 bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden">
        <div class="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
            <button onclick="printStats('teams')" class="text-blue-600 hover:text-blue-800 transition-colors" title="הדפס סטטיסטיקה"><i class="fas fa-print"></i></button>
            <h3 class="font-bold text-gray-800 text-lg">צוותים (החודש)</h3>
        </div>
        <div id="teamsStatsList" class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <!-- Stats rows will be injected here -->
        </div>
    </div>
`;

if (!html.includes('id="workersStatsBanner"')) {
    html = html.replace('<body class="text-gray-800">', '<body class="text-gray-800">\n' + bannersHtml);
}

const jsHtml = `
        async function fetchMonthlyStats() {
            try {
                const res = await fetch('/api/' + tenantId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getMonthlyStats' })
                });
                const data = await res.json();
                if (data.teamsStats && data.workersStats) {
                    renderStatsBanner('teamsStatsList', data.teamsStats);
                    renderStatsBanner('workersStatsList', data.workersStats);
                }
            } catch (e) {
                console.error('Failed to fetch stats', e);
            }
        }

        function renderStatsBanner(elementId, stats) {
            const container = document.getElementById(elementId);
            if (!container) return;
            container.innerHTML = '';
            if (stats.length === 0) {
                container.innerHTML = '<div class="text-sm text-gray-500 text-center py-2">אין נתונים לחודש זה</div>';
                return;
            }
            stats.forEach(item => {
                container.innerHTML += \`
                    <div class="flex justify-between items-center bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                        <span class="font-bold text-gray-700 truncate max-w-[140px]" title="\${item.name}">\${item.name}</span>
                        <span class="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full">\${item.count}</span>
                    </div>
                \`;
            });
        }

        function printStats(type) {
            const isTeams = type === 'teams';
            const title = isTeams ? 'סטטיסטיקה חודשית - צוותים' : 'סטטיסטיקה חודשית - עובדים';
            const containerId = isTeams ? 'teamsStatsList' : 'workersStatsList';
            const container = document.getElementById(containerId);
            if(!container) return;
            
            const listHtml = container.innerHTML;
            
            const win = window.open('', '_blank');
            win.document.write(\`
                <html dir="rtl">
                <head>
                    <title>\${title}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin: 40px; color: #111827; }
                        h1 { color: #4f46e5; margin-bottom: 30px; font-size: 28px; }
                        table { width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                        th, td { padding: 12px 15px; border: 1px solid #e5e7eb; text-align: right; }
                        th { background-color: #f3f4f6; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        .count-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>\${title}</h1>
                    <div style="display:none;" id="rawList">\${listHtml.replace(/\\x60/g, '\\\\x60')}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>שם</th>
                                <th>משימות שהושלמו</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody">
                        </tbody>
                    </table>
                    <script>
                        const raw = document.getElementById('rawList');
                        const spans = raw.querySelectorAll('span.font-bold');
                        const counts = raw.querySelectorAll('span.bg-blue-100');
                        let tbodyHtml = '';
                        for(let i=0; i<spans.length; i++) {
                            tbodyHtml += '<tr><td>' + spans[i].innerText + '</td><td><span class="count-badge">' + counts[i].innerText + '</span></td></tr>';
                        }
                        if(spans.length === 0) {
                            tbodyHtml = '<tr><td colspan="2" style="text-align:center;">אין נתונים לחודש זה</td></tr>';
                        }
                        document.getElementById('tableBody').innerHTML = tbodyHtml;
                        setTimeout(() => window.print(), 800);
                    </script>
                </body>
                </html>
            \`);
            win.document.close();
        }
`;

if (!html.includes('async function fetchMonthlyStats()')) {
    html = html.replace("if ('serviceWorker' in navigator) {", jsHtml + "\n\n        if ('serviceWorker' in navigator) {");
}

if (!html.includes('fetchMonthlyStats();')) {
    html = html.replace('} catch(e) { console.error("Ошибка загрузки:", e); } hideLoader();', '} catch(e) { console.error("Ошибка загрузки:", e); } hideLoader(); fetchMonthlyStats();');
}

fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Successfully patched admin.html');
