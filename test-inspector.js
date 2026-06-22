fetch('https://hcl-saa-s.vercel.app/api/c50b014c-376c-46ba-b811-0f3207365632', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inspector: 'Misha',
    department: 'TestDept',
    room: '124',
    items: []
  })
})
.then(r => {
  console.log(r.status);
  return r.text();
})
.then(console.log);
