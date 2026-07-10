import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function fetchFirestoreData() {
  console.log('--- CASAS ---');
  const casasSnap = await getDocs(collection(db, 'casas_axe'));
  console.log(`Total de casas: ${casasSnap.size}`);
  casasSnap.forEach(doc => {
    console.log(`Nome: ${doc.data().nome} | Admin: ${doc.data().admin_email} | ID: ${doc.id}`);
  });

  console.log('\n--- USERS ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  const marcos = usersSnap.docs.find(d => d.data().email === 'marcosfrota@gmail.com');
  const girinoc = usersSnap.docs.find(d => d.data().email === 'girinoc@gmail.com');
  
  if (marcos) {
    console.log(`marcosfrota@gmail.com: id_casa: ${marcos.data().id_casa} | role: ${marcos.data().role}`);
  }
  if (girinoc) {
    console.log(`girinoc@gmail.com: id_casa: ${girinoc.data().id_casa} | role: ${girinoc.data().role}`);
  }
}

fetchFirestoreData().then(() => process.exit(0)).catch(console.error);
