import codecs

path = r'tenant-app\public\admin.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

edit_func = '''
        function editDefect(realIdx) {
            const task = allTasks[realIdx];
            const newVal = prompt(" ???? ?? ????? ?????:\, task.defect);
 if(newVal !== null && newVal.trim() !== '' && newVal !== task.defect) {
 showLoader(\????? ????...\);
 fetch(API_URL, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: \UPDATE_TASK_DEFECT\, id: task.id, defect: newVal.trim() })
 }).then(res => res.json()).then(out => {
 if(out.status === 'success') {
 showToast(\???? ?????? ??????\, \success\);
 loadTasks();
 } else {
 showToast(\????? ??????\, \error\);
 hideLoader();
 }
 }).catch(e => {
 console.error(e);
 showToast(\????? ??????\, \error\);
 hideLoader();
 });
 }
 }

 function renderTasks() {
'''

text = text.replace(' function renderTasks() {', edit_func)

with open(path, 'w', encoding='utf-8') as f:
 f.write(text)
