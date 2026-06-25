const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

// 1. Remove viewModeBtn
html = html.replace(/<button onclick="toggleViewMode\(\)" id="viewModeBtn" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 shadow border border-gray-300"><i class="fas fa-list ml-2"><\/i>שינוי תצוגה<\/button>\r?\n\s*/g, '');

// 2. Remove the 4 green buttons
html = html.replace(/<button onclick="openTeamsModal\(\)" class="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 shadow border border-blue-200"><i class="fas fa-users-cog ml-2"><\/i>ניהול צוותים<\/button>\r?\n\s*/g, '');
html = html.replace(/<button onclick="openQrConfigModal\(\)" class="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-100 shadow border border-purple-200"><i class="fas fa-qrcode ml-2"><\/i>הגדרות QR<\/button>\r?\n\s*/g, '');
html = html.replace(/<button onclick="openConfigModal\(\)" class="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 shadow"><i class="fas fa-cogs ml-2"><\/i>ניהול מערכות נבדקות<\/button>\r?\n\s*/g, '');
html = html.replace(/<button onclick="openWorkersModal\(\)" class="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 shadow"><i class="fas fa-users ml-2"><\/i>ניהול עובדים<\/button>\r?\n\s*/g, '');

// 3. Remove the closeSelectedTasks and revertSelectedTasks
html = html.replace(/<button onclick="closeSelectedTasks\(\)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-500 shadow"><i class="fas fa-check-double ml-2"><\/i>סגור נבחרים<\/button>\r?\n\s*/g, '');
html = html.replace(/<button onclick="revertSelectedTasks\(\)" class="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold hover:bg-orange-200 shadow border border-orange-300"><i class="fas fa-undo ml-2"><\/i>החזר לפתוח<\/button>\r?\n\s*/g, '');

// 4. Remove loadTasks button
html = html.replace(/<button onclick="loadTasks\(\)" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-200"><i class="fas fa-sync-alt"><\/i><\/button>\r?\n\s*/g, '');

// 5. Remove selectAllBtn row wrapper and selectAllBtn
html = html.replace(/<div class="flex items-end"><button onclick="toggleSelectAll\(\)" id="selectAllBtn" class="bg-indigo-50 text-indigo-700 h-\[50px\] px-4 rounded-xl font-bold hover:bg-indigo-100 shadow border border-indigo-200 flex items-center justify-center"><i class="fas fa-check-square ml-2"><\/i><span>בחר הכל<\/span><\/button><\/div>\r?\n\s*/g, '');

// 6. Insert new settings button
html = html.replace(
    '<button onclick="openReportsModal()" class="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 shadow border border-indigo-200"><i class="fas fa-chart-bar ml-2"></i>דוחות</button>',
    '<button onclick="openReportsModal()" class="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 shadow border border-indigo-200"><i class="fas fa-chart-bar ml-2"></i>דוחות</button>\n                        <button onclick="openSettingsMainModal()" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 shadow border border-gray-300"><i class="fas fa-cog ml-2"></i>הגדרות</button>'
);

// 7. Insert the new panel before dynamicTabsContainer
const newPanel = `
            <div class="flex flex-wrap items-center gap-3 mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <button onclick="toggleSelectAll()" id="selectAllBtn" class="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-xl font-bold hover:bg-indigo-100 shadow-sm border border-indigo-200 flex items-center justify-center transition-colors"><i class="fas fa-check-square ml-2"></i><span>בחר הכל</span></button>
                <button onclick="loadTasks()" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-200 shadow-sm border border-indigo-200 transition-colors"><i class="fas fa-sync-alt"></i></button>
                <div class="w-px h-8 bg-gray-200 mx-1 hidden sm:block"></div>
                <button onclick="closeSelectedTasks()" class="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-500 shadow-sm transition-colors"><i class="fas fa-check-double ml-2"></i>סגור נבחרים</button>
                <button onclick="revertSelectedTasks()" class="bg-orange-100 text-orange-700 px-5 py-2 rounded-xl font-bold hover:bg-orange-200 shadow-sm border border-orange-300 transition-colors"><i class="fas fa-undo ml-2"></i>החזר לפתוח</button>
                <div class="flex-grow"></div>
                <button onclick="toggleViewMode()" id="viewModeBtn" class="bg-gray-100 text-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-200 shadow-sm border border-gray-300 transition-colors"><i class="fas fa-list ml-2"></i>שינוי תצוגה</button>
            </div>
`;
html = html.replace('<div id="dynamicTabsContainer"', newPanel + '            <div id="dynamicTabsContainer"');

// 8. Append settingsMainModal to the end of body
const settingsModalHtml = `
    <!-- Settings Main Modal -->
    <div id="settingsMainModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden items-center justify-center z-50 transition-opacity" style="z-index: 100;">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
            <div class="bg-gray-800 p-5 flex justify-between items-center text-white">
                <h2 class="text-2xl font-black"><i class="fas fa-cog ml-2"></i>הגדרות מערכת</h2>
                <button onclick="closeSettingsMainModal()" class="text-gray-300 hover:text-white transition-colors"><i class="fas fa-times text-xl"></i></button>
            </div>
            <div class="p-6 overflow-y-auto space-y-4">
                <button onclick="closeSettingsMainModal(); openTeamsModal();" class="w-full flex items-center justify-between bg-blue-50 text-blue-800 p-4 rounded-xl font-bold hover:bg-blue-100 shadow-sm border border-blue-200 transition-colors text-lg">
                    <span><i class="fas fa-users-cog ml-3 text-xl"></i>ניהול צוותים</span>
                    <i class="fas fa-chevron-left text-blue-400"></i>
                </button>
                <button onclick="closeSettingsMainModal(); openWorkersModal();" class="w-full flex items-center justify-between bg-indigo-50 text-indigo-800 p-4 rounded-xl font-bold hover:bg-indigo-100 shadow-sm border border-indigo-200 transition-colors text-lg">
                    <span><i class="fas fa-users ml-3 text-xl"></i>ניהול עובדים</span>
                    <i class="fas fa-chevron-left text-indigo-400"></i>
                </button>
                <button onclick="closeSettingsMainModal(); openConfigModal();" class="w-full flex items-center justify-between bg-cyan-50 text-cyan-800 p-4 rounded-xl font-bold hover:bg-cyan-100 shadow-sm border border-cyan-200 transition-colors text-lg">
                    <span><i class="fas fa-cogs ml-3 text-xl"></i>ניהול מערכות נבדקות</span>
                    <i class="fas fa-chevron-left text-cyan-400"></i>
                </button>
                <button onclick="closeSettingsMainModal(); openQrConfigModal();" class="w-full flex items-center justify-between bg-purple-50 text-purple-800 p-4 rounded-xl font-bold hover:bg-purple-100 shadow-sm border border-purple-200 transition-colors text-lg">
                    <span><i class="fas fa-qrcode ml-3 text-xl"></i>הגדרות QR</span>
                    <i class="fas fa-chevron-left text-purple-400"></i>
                </button>
            </div>
        </div>
    </div>
`;
html = html.replace('</body>', settingsModalHtml + '\n</body>');

// 9. Add modal open/close functions
const scriptToAdd = `
        function openSettingsMainModal() {
            document.getElementById('settingsMainModal').classList.remove('hidden');
            document.getElementById('settingsMainModal').classList.add('flex');
        }
        function closeSettingsMainModal() {
            document.getElementById('settingsMainModal').classList.add('hidden');
            document.getElementById('settingsMainModal').classList.remove('flex');
        }
`;
html = html.replace('function openReportsModal() {', scriptToAdd + '\n        function openReportsModal() {');

fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Done restructuring');
