import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const collections = ['applications', 'membership_applications', 'candidates', 'users', 'candidate_accounts'];
  for (const coll of collections) {
    const snap = await getDocs(collection(db, coll));
    console.log(`${coll}: ${snap.size}`);
    snap.forEach(d => console.log('  ', d.id));
  }
  process.exit(0);
}
run().catch(console.error);
