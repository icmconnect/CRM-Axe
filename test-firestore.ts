import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, where, getDocs, terminate } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0991807525",
  appId: "1:781411414101:web:16693021614aaf55b524dc",
  apiKey: "AIzaSyCRpwXmiZnwveAuOGSg_HAA86j-6HAGGf4",
  authDomain: "gen-lang-client-0991807525.firebaseapp.com",
  storageBucket: "gen-lang-client-0991807525.firebasestorage.app",
  messagingSenderId: "781411414101"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-651066ca-fc60-47b1-ba9c-89a55bf8a7c2");

async function main() {
  const testEmail = "temp_test_user@axe.com";
  const testPassword = "temporaryPassword123";

  console.log("Authenticating...");
  await signInWithEmailAndPassword(auth, testEmail, testPassword);
  console.log("Logged in!");

  console.log("\n--- Testing Casas de Axé (No query/filters) ---");
  try {
    const snap = await getDocs(collection(db, 'casas_axe'));
    console.log("SUCCESS! Casas size:", snap.size);
  } catch (err: any) {
    console.error("Failed:", err.message || err);
  }

  console.log("\n--- Testing Audit Logs (With orderBy) ---");
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('data', 'desc'));
    const snap = await getDocs(q);
    console.log("SUCCESS! Audit logs size:", snap.size);
  } catch (err: any) {
    console.error("Failed:", err.message || err);
  }

  console.log("\n--- Testing Security Logs (With orderBy) ---");
  try {
    const q = query(collection(db, 'security_logs'), orderBy('data', 'desc'));
    const snap = await getDocs(q);
    console.log("SUCCESS! Security logs size:", snap.size);
  } catch (err: any) {
    console.error("Failed:", err.message || err);
  }

  console.log("\n--- Testing Users (No filters) ---");
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log("SUCCESS! Users size:", snap.size);
  } catch (err: any) {
    console.error("Failed:", err.message || err);
  }

  await signOut(auth);
  await terminate(db);
}

main().catch(console.error);
