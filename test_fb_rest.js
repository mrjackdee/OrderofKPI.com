import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

async function run() {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url);
  const data = await res.text();
  console.log(data);
}
run().catch(console.error);
