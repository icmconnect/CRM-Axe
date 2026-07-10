import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function diagnosticarExuTiriri() {
  console.log('🔍 DIAGNÓSTICO EXU TIRIRI');
  
  // 1. Buscar todas as casas
  const casasSnap = await getDocs(collection(db, 'casas_axe'));
  console.log('Total de casas:', casasSnap.size);
  
  casasSnap.forEach(doc => {
    console.log(`Casa: ${doc.data().nome} | ID: ${doc.id} | Admin: ${doc.data().admin_email}`);
  });
  
  // 2. Buscar marcosfrota
  const usersSnap = await getDocs(collection(db, 'users'));
  const marcos = usersSnap.docs.find(d => d.data().email === 'marcosfrota@gmail.com');
  
  if (marcos) {
    console.log('Marcos encontrado:', marcos.data());
  } else {
    console.log('❌ Marcos NÃO encontrado na coleção users');
  }
}

diagnosticarExuTiriri().then(() => process.exit(0)).catch(console.error);
