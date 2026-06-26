const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

const target = '<button onclick="closeSettingsMainModal(); openQrConfigModal();"';
const injection = `
                <button onclick="closeSettingsMainModal(); openBannersSettingsModal();" class="w-full flex items-center justify-between bg-amber-50 text-amber-800 p-4 rounded-xl font-bold hover:bg-amber-100 shadow-sm border border-amber-200 transition-colors text-lg">
                    <span><i class="fas fa-columns ml-3 text-xl"></i>הגדרות באנרים</span>
                    <i class="fas fa-chevron-left text-amber-400"></i>
                </button>
`;

if (html.includes(target) && !html.includes('openBannersSettingsModal();" class="w-full')) {
    html = html.replace(target, injection + target);
    fs.writeFileSync('tenant-app/public/admin.html', html);
    console.log('Successfully injected button!');
} else {
    console.log('Failed to inject or already injected');
}

// Ensure spacing for banners
// Let's add xl:max-w-4xl to mainApp to give more space for the banners so they aren't "glued".
html = html.replace(
    '<div id="mainApp" class="hidden relative z-10 max-w-5xl mx-auto p-4 md:p-6 print:p-0 print:max-w-full">',
    '<div id="mainApp" class="hidden relative z-10 max-w-5xl xl:max-w-4xl 2xl:max-w-5xl mx-auto p-4 md:p-6 print:p-0 print:max-w-full">'
);
fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Updated mainApp max width for xl screens.');

