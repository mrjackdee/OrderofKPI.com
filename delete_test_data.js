import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const nomSnap = await getDocs(collection(db, 'dean_nominations'));
  let nomCount = 0;
  for (const d of nomSnap.docs) {
    const data = d.data();
    if (data.nominee_first_name === 'John' || data.nominee_first_name === 'Test') {
      await deleteDoc(d.ref);
      nomCount++;
    }
  }
  console.log('Deleted nominations:', nomCount);
  
  const voteSnap = await getDocs(collection(db, 'dean_votes'));
  let voteCount = 0;
  for (const d of voteSnap.docs) {
    const data = d.data();
    if (data.nominee_name && (data.nominee_name.includes('John') || data.nominee_name.includes('Test'))) {
      await deleteDoc(d.ref);
      voteCount++;
    }
  }
  console.log('Deleted votes:', voteCount);
  
  process.exit(0);
}
run();
