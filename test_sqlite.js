import Database from 'better-sqlite3';
const db = new Database('kpi_members_v2.db');
const count = db.prepare('SELECT count(*) as c FROM candidates').get();
console.log('candidates count:', count.c);
const apps = db.prepare('SELECT count(*) as c FROM membership_applications').get();
console.log('applications count:', apps.c);
