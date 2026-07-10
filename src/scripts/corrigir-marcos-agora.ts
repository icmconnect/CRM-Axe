import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function corrigirMarcos() {
  const email = 'marcosfrota@gmail.com';
  
  // 1. Encontrar usuário
  const usersSnap = await getDocs(collection(db, 'users'));
  const userDoc = usersSnap.docs.find(d => d.data().email === email);
  
  if (!userDoc) {
    console.log('❌ Marcos não encontrado');
    return;
  }
  
  console.log('Dados atuais do Marcos:', userDoc.data());
  
  // 2. Encontrar casa "Exu Tiriri"
  const casasSnap = await getDocs(collection(db, 'casas_axe'));
  const casaDoc = casasSnap.docs.find(d => 
    d.data().nome?.toLowerCase().includes('exu tiriri') ||
    d.data().admin_email === email
  );
  
  if (casaDoc) {
    // Vincular à casa encontrada
    await updateDoc(doc(db, 'users', userDoc.id), {
      id_casa: casaDoc.id,
      role: 'ADMIN_CASA'
    });
    console.log('✅ Marcos vinculado à casa:', casaDoc.data().nome, casaDoc.id);
  } else {
    // Criar casa para ele
    const newCasaRef = doc(collection(db, 'casas_axe'));
    await updateDoc(newCasaRef, {
      nome: 'Exu Tiriri',
      admin_email: email,
      created_at: new Date().toISOString(),
      status: 'trial'
    });
    
    await updateDoc(doc(db, 'users', userDoc.id), {
      id_casa: newCasaRef.id,
      role: 'ADMIN_CASA'
    });
    console.log('✅ Casa Exu Tiriri criada e Marcos vinculado:', newCasaRef.id);
  }
}
