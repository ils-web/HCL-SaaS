const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

const newBannersHtml = `
    <!-- Stats Banners -->
    <div id="leftBanner" class="hidden xl:flex fixed left-4 top-8 w-64 bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden">
        <div class="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
            <h3 class="font-bold text-gray-800 text-lg">טוען...</h3>
            <button class="text-blue-600 hover:text-blue-800 transition-colors" title="הדפס סטטיסטיקה"><i class="fas fa-print"></i></button>
        </div>
        <div id="leftBannerContent" class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <!-- Content will be injected here -->
        </div>
    </div>

    <div id="rightBanner" class="hidden xl:flex fixed right-4 top-8 w-64 bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden">
        <div class="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
            <button class="text-blue-600 hover:text-blue-800 transition-colors" title="הדפס סטטיסטיקה"><i class="fas fa-print"></i></button>
            <h3 class="font-bold text-gray-800 text-lg">טוען...</h3>
        </div>
        <div id="rightBannerContent" class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <!-- Content will be injected here -->
        </div>
    </div>
`;

const bannerRegex = /<!-- Stats Banners -->[\s\S]*?(?=<div id="toastContainer")/g;
if (html.match(bannerRegex)) {
    html = html.replace(bannerRegex, newBannersHtml + '\n\n    ');
}

const bannerSettingsModalHtml = `
    <!-- Banners Settings Modal -->
    <div id="bannersSettingsModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden items-center justify-center z-50 transition-opacity" style="z-index: 100;">
        <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
            <div class="bg-amber-500 p-5 flex justify-between items-center text-white">
                <h2 class="text-xl font-black"><i class="fas fa-columns ml-2"></i>הגדרות באנרים</h2>
                <button onclick="closeBannersSettingsModal()" class="text-amber-100 hover:text-white transition-colors"><i class="fas fa-times text-xl"></i></button>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">באנר ימני</label>
                    <select id="rightBannerSelect" class="w-full border-gray-300 rounded-xl shadow-sm px-4 py-2 focus:ring-amber-500 focus:border-amber-500 font-medium">
                        <option value="none">❌ מוסתר</option>
                        <option value="teams">🛠️ סטטיסטיקת צוותים</option>
                        <option value="workers">👥 סטטיסטיקת עובדים</option>
                        <option value="weather">🌤️ מזג אוויר</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">באנר שמאלי</label>
                    <select id="leftBannerSelect" class="w-full border-gray-300 rounded-xl shadow-sm px-4 py-2 focus:ring-amber-500 focus:border-amber-500 font-medium">
                        <option value="none">❌ מוסתר</option>
                        <option value="teams">🛠️ סטטיסטיקת צוותים</option>
                        <option value="workers">👥 סטטיסטיקת עובדים</option>
                        <option value="weather">🌤️ מזג אוויר</option>
                    </select>
                </div>
                <button onclick="saveBannerConfig()" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4">
                    שמור הגדרות
                </button>
            </div>
        </div>
    </div>
`;

html = html.replace('</body>', bannerSettingsModalHtml + '\n</body>');

const settingsMenuBtn = `
                <button onclick="closeSettingsMainModal(); openBannersSettingsModal();" class="w-full flex items-center justify-between bg-amber-50 text-amber-800 p-4 rounded-xl font-bold hover:bg-amber-100 shadow-sm border border-amber-200 transition-colors text-lg">
                    <span><i class="fas fa-columns ml-3 text-xl"></i>הגדרות באנרים</span>
                    <i class="fas fa-chevron-left text-amber-400"></i>
                </button>
`;
if (!html.includes('openBannersSettingsModal')) {
    html = html.replace('</button>\n            </div>\n        </div>\n    </div>', '</button>\n' + settingsMenuBtn + '            </div>\n        </div>\n    </div>');
}

const jsFunctions = `
        let bannerConfig = JSON.parse(localStorage.getItem('hcl_banners_config')) || { left: 'workers', right: 'teams' };

        function openBannersSettingsModal() {
            document.getElementById('rightBannerSelect').value = bannerConfig.right;
            document.getElementById('leftBannerSelect').value = bannerConfig.left;
            document.getElementById('bannersSettingsModal').classList.remove('hidden');
            document.getElementById('bannersSettingsModal').classList.add('flex');
            lockScroll();
        }

        function closeBannersSettingsModal() {
            document.getElementById('bannersSettingsModal').classList.add('hidden');
            document.getElementById('bannersSettingsModal').classList.remove('flex');
            unlockScroll();
            openSettingsMainModal();
        }

        function saveBannerConfig() {
            bannerConfig.left = document.getElementById('leftBannerSelect').value;
            bannerConfig.right = document.getElementById('rightBannerSelect').value;
            localStorage.setItem('hcl_banners_config', JSON.stringify(bannerConfig));
            closeBannersSettingsModal();
            updateBannersDisplay();
        }

        let cachedStats = null;
        let cachedWeather = null;

        async function fetchStatsIfNeeded() {
            if(!cachedStats) {
                try {
                    const res = await fetch('/api/' + _tId, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'getMonthlyStats' })
                    });
                    cachedStats = await res.json();
                } catch(e) { console.error('Failed to fetch stats', e); }
            }
            return cachedStats;
        }

        async function fetchWeatherIfNeeded() {
            if(!cachedWeather) {
                try {
                    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=32.0809&longitude=34.7806&current_weather=true');
                    const data = await res.json();
                    cachedWeather = data.current_weather;
                } catch(e) { console.error('Failed to fetch weather', e); }
            }
            return cachedWeather;
        }

        function getWeatherIcon(code) {
            if(code === 0) return 'fa-sun text-yellow-500';
            if(code >= 1 && code <= 3) return 'fa-cloud-sun text-gray-400';
            if(code >= 51 && code <= 67) return 'fa-cloud-rain text-blue-500';
            if(code >= 71 && code <= 77) return 'fa-snowflake text-blue-300';
            if(code >= 95) return 'fa-bolt text-purple-500';
            return 'fa-cloud text-gray-500';
        }

        function getWeatherDescriptionHebrew(code) {
            if(code === 0) return 'בהיר';
            if(code === 1) return 'מעונן חלקית';
            if(code === 2) return 'מעונן חלקית';
            if(code === 3) return 'מעונן';
            if(code >= 51 && code <= 67) return 'גשום';
            if(code >= 71 && code <= 77) return 'שלג';
            if(code >= 95) return 'סופת רעמים';
            return 'מעונן';
        }

        async function renderBannerContent(containerId, type, side) {
            const container = document.getElementById(containerId);
            if(!container) return;
            const parent = container.parentElement;
            const titleEl = parent.querySelector('h3');
            const printBtn = parent.querySelector('button');

            if(type === 'workers') {
                titleEl.innerText = 'עובדים (החודש)';
                printBtn.style.display = 'block';
                printBtn.onclick = () => printStats('workers', containerId);
                const stats = await fetchStatsIfNeeded();
                if(stats && stats.workersStats) renderStatsList(container, stats.workersStats);
            } else if(type === 'teams') {
                titleEl.innerText = 'צוותים (החודש)';
                printBtn.style.display = 'block';
                printBtn.onclick = () => printStats('teams', containerId);
                const stats = await fetchStatsIfNeeded();
                if(stats && stats.teamsStats) renderStatsList(container, stats.teamsStats);
            } else if(type === 'weather') {
                titleEl.innerText = 'מזג אוויר';
                printBtn.style.display = 'none';
                const w = await fetchWeatherIfNeeded();
                if(w) {
                    container.innerHTML = \`
                        <div class="flex flex-col items-center justify-center p-4">
                            <i class="fas \${getWeatherIcon(w.weathercode)} text-5xl mb-4"></i>
                            <div class="text-3xl font-black text-gray-800">\${Math.round(w.temperature)}°C</div>
                            <div class="text-gray-500 mt-2 text-lg font-bold">\${getWeatherDescriptionHebrew(w.weathercode)}</div>
                        </div>
                    \`;
                } else {
                    container.innerHTML = '<div class="text-sm text-gray-500 text-center py-2">שגיאה בטעינת מזג אוויר</div>';
                }
            }
        }

        function renderStatsList(container, stats) {
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

        async function updateBannersDisplay() {
            const leftBanner = document.getElementById('leftBanner');
            const rightBanner = document.getElementById('rightBanner');
            leftBanner.classList.add('hidden'); leftBanner.classList.remove('xl:flex');
            rightBanner.classList.add('hidden'); rightBanner.classList.remove('xl:flex');

            if(bannerConfig.left !== 'none') {
                leftBanner.classList.remove('hidden'); leftBanner.classList.add('xl:flex');
                await renderBannerContent('leftBannerContent', bannerConfig.left, 'left');
            }
            if(bannerConfig.right !== 'none') {
                rightBanner.classList.remove('hidden'); rightBanner.classList.add('xl:flex');
                await renderBannerContent('rightBannerContent', bannerConfig.right, 'right');
            }
        }

        async function fetchMonthlyStats() {
            updateBannersDisplay();
        }

`;

const printStatsFunc = `
        function printStats(type, containerId) {
            const isTeams = type === 'teams';
            const title = isTeams ? 'סטטיסטיקה חודשית - צוותים' : 'סטטיסטיקה חודשית - עובדים';
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
                    <\\/script>
                </body>
                </html>
            \`);
            win.document.close();
        }
`;

const oldJsRegex = /async function fetchMonthlyStats\(\) \{[\s\S]*?win\.document\.close\(\);\s*\}/g;
if (html.match(oldJsRegex)) {
    html = html.replace(oldJsRegex, jsFunctions + printStatsFunc);
}

fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Successfully patched admin.html');
