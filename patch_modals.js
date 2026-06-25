const fs = require('fs');
let html = fs.readFileSync('tenant-app/public/admin.html', 'utf8');

// Update closeWorkersModal
html = html.replace(
    "function closeWorkersModal() { document.getElementById('workersModal').classList.add('hidden'); }",
    "function closeWorkersModal() { document.getElementById('workersModal').classList.add('hidden'); document.body.style.overflow = ''; openSettingsMainModal(); }"
);

// Update closeConfigModal
html = html.replace(
    "function closeConfigModal() {",
    "function closeConfigModal() {\n            document.body.style.overflow = '';\n            openSettingsMainModal();"
);

// Update closeQrConfigModal
html = html.replace(
    "function closeQrConfigModal() {",
    "function closeQrConfigModal() {\n            document.body.style.overflow = '';\n            openSettingsMainModal();"
);

// Update closeTeamsModal
html = html.replace(
    "function closeTeamsModal() {",
    "function closeTeamsModal() {\n            document.body.style.overflow = '';\n            openSettingsMainModal();"
);

// Add overflow hidden to open handlers
html = html.replace("function openWorkersModal() {", "function openWorkersModal() { document.body.style.overflow = 'hidden';");
html = html.replace("function openConfigModal() {", "function openConfigModal() { document.body.style.overflow = 'hidden';");
html = html.replace("async function openQrConfigModal() {", "async function openQrConfigModal() { document.body.style.overflow = 'hidden';");
html = html.replace("function openTeamsModal() {", "function openTeamsModal() { document.body.style.overflow = 'hidden';");

// Update SettingsMainModal open/close
html = html.replace(
    "function openSettingsMainModal() {",
    "function openSettingsMainModal() { document.body.style.overflow = 'hidden';"
);
html = html.replace(
    "function closeSettingsMainModal() {",
    "function closeSettingsMainModal() { document.body.style.overflow = '';"
);

// Ensure other modals like Reports, QrModal also have it just in case
html = html.replace("function openReportsModal() {", "function openReportsModal() { document.body.style.overflow = 'hidden';");
html = html.replace("function closeReportsModal() {", "function closeReportsModal() { document.body.style.overflow = '';");

html = html.replace("function openQrModal() {", "function openQrModal() { document.body.style.overflow = 'hidden';");
html = html.replace("function closeQrModal() {", "function closeQrModal() { document.body.style.overflow = '';");

fs.writeFileSync('tenant-app/public/admin.html', html);
console.log('Updated open/close modal functions');
