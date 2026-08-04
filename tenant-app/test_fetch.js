fetch('http://localhost:3000/api/123?action=getOpenTasks').then(r=>r.text()).then(console.log).catch(console.error);
