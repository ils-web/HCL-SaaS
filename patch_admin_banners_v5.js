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

// Ensure the button inside bannersSettingsModal is gone
const oldBtn = `                <button onclick="closeSettingsMainModal(); openBannersSettingsModal();" class="w-full flex items-center justify-between bg-amber-50 text-amber-800 p-4 rounded-xl font-bold hover:bg-amber-100 shadow-sm border border-amber-200 transition-colors text-lg">
                    <span><i class="fas fa-columns ml-3 text-xl"></i>הגדרות באנרים</span>
                    <i class="fas fa-chevron-left text-amber-400"></i>
                </button>`;
const modalIdx = html.indexOf('bannersSettingsModal');
if (modalIdx > -1) {
    const afterModal = html.substring(modalIdx);
    if (afterModal.includes(oldBtn)) {
        const newAfterModal = afterModal.replace(oldBtn, '');
        html = html.substring(0, modalIdx) + newAfterModal;
        fs.writeFileSync('tenant-app/public/admin.html', html);
        console.log('Removed duplicate button!');
    }
}
