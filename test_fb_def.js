import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'applications'));
  console.log('default DB applications:', snap.size);
  const snap2 = await getDocs(collection(db, 'membership_applications'));
  console.log('default DB membership_applications:', snap2.size);
  const snap3 = await getDocs(collection(db, 'candidates'));
  console.log('default DB candidates:', snap3.size);
  process.exit(0);
}
run().catch(console.error);
