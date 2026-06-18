const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
const depts = new Set();
tasks.forEach(t => depts.add(t.dept));
console.log(Array.from(depts));
