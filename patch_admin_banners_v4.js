const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

// 1. Change mainApp to be relative and z-10
html = html.replace(
    '<div id="mainApp" class="hidden max-w-5xl mx-auto p-4 md:p-6 print:p-0 print:max-w-full">',
    '<div id="mainApp" class="hidden relative z-10 max-w-5xl mx-auto p-4 md:p-6 print:p-0 print:max-w-full">'
);

// 2. Change the shadows of the containers inside mainApp to shadow-2xl instead of shadow-sm
html = html.replace(
    '<div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">',
    '<div class="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 mb-6">'
);
html = html.replace(
    '<div id="dynamicTabsContainer" class="flex bg-white rounded-2xl shadow-sm mb-6 overflow-x-auto overflow-y-hidden border border-gray-200">',
    '<div id="dynamicTabsContainer" class="flex bg-white rounded-2xl shadow-2xl mb-6 overflow-x-auto overflow-y-hidden border border-gray-200">'
);

// 3. Move the button out of bannersSettingsModal into settingsMainModal
const buttonCode = `                <button onclick="closeSettingsMainModal(); openBannersSettingsModal();" class="w-full flex items-center justify-between bg-amber-50 text-amber-800 p-4 rounded-xl font-bold hover:bg-amber-100 shadow-sm border border-amber-200 transition-colors text-lg">
                    <span><i class="fas fa-columns ml-3 text-xl"></i>הגדרות באנרים</span>
                    <i class="fas fa-chevron-left text-amber-400"></i>
                </button>`;

html = html.replace(buttonCode, '');

const settingsMenuBtnHtml = `
                <button onclick="closeSettingsMainModal(); openConfigModal();" class="w-full flex items-center justify-between bg-cyan-50 text-cyan-800 p-4 rounded-xl font-bold hover:bg-cyan-100 shadow-sm border border-cyan-200 transition-colors text-lg">
                    <span><i class="fas fa-cogs ml-3 text-xl"></i>ניהול מערכות נבדקות</span>
                    <i class="fas fa-chevron-left text-cyan-400"></i>
                </button>
                <button onclick="closeSettingsMainModal(); openBannersSettingsModal();" class="w-full flex items-center justify-between bg-amber-50 text-amber-800 p-4 rounded-xl font-bold hover:bg-amber-100 shadow-sm border border-amber-200 transition-colors text-lg">
                    <span><i class="fas fa-columns ml-3 text-xl"></i>הגדרות באנרים</span>
                    <i class="fas fa-chevron-left text-amber-400"></i>
                </button>
`;

html = html.replace(
    `                <button onclick="closeSettingsMainModal(); openConfigModal();" class="w-full flex items-center justify-between bg-cyan-50 text-cyan-800 p-4 rounded-xl font-bold hover:bg-cyan-100 shadow-sm border border-cyan-200 transition-colors text-lg">
                    <span><i class="fas fa-cogs ml-3 text-xl"></i>ניהול מערכות נבדקות</span>
                    <i class="fas fa-chevron-left text-cyan-400"></i>
                </button>`,
    settingsMenuBtnHtml
);

// 4. Banners visual changes
html = html.replace(
    /class="hidden xl:flex fixed left-4 top-8 w-64 bg-white\/80 backdrop-blur-md border border-white\/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden"/g,
    'class="hidden xl:flex fixed left-4 top-8 w-64 bg-white/40 backdrop-blur-sm border border-white/40 shadow-sm rounded-3xl p-5 flex-col z-0 print:hidden"'
);
html = html.replace(
    /class="hidden xl:flex fixed right-4 top-8 w-64 bg-white\/80 backdrop-blur-md border border-white\/40 shadow-2xl rounded-3xl p-5 flex-col z-0 print:hidden"/g,
    'class="hidden xl:flex fixed right-4 top-8 w-64 bg-white/40 backdrop-blur-sm border border-white/40 shadow-sm rounded-3xl p-5 flex-col z-0 print:hidden"'
);

fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Patched styling and button successfully');
