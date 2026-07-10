import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export async function recriarExuTiriri() {
  const email = 'marcosfrota@gmail.com';
  
  try {
    // 1. Verificar se já existe
    const casasSnap = await getDocs(collection(db, 'casas_axe'));
    const existe = casasSnap.docs.find(d => 
      d.data().nome?.toLowerCase().includes('exu') ||
      d.data().admin_email === email
    );
    
    if (existe) {
      console.log('✅ Exu Tiriri já existe:', existe.id, existe.data());
      
      // Vincular marcosfrota
      const usersSnap = await getDocs(collection(db, 'users'));
      const marcos = usersSnap.docs.find(d => d.data().email === email);
      
      if (marcos) {
        await updateDoc(doc(db, 'users', marcos.id), {
          id_casa: existe.id,
          role: 'ADMIN_CASA'
        });
        console.log('✅ Marcos vinculado à Exu Tiriri');
      }
      return;
    }
    
    // 2. Se não existe, criar
    console.log('Criando Exu Tiriri...');
    const casaRef = await addDoc(collection(db, 'casas_axe'), {
      nome: 'Exu Tiriri',
      admin_email: email,
      created_at: new Date().toISOString(),
      status: 'trial'
    });
    
    console.log('✅ Exu Tiriri criada:', casaRef.id);
    
    // Vincular marcosfrota
    const usersSnap = await getDocs(collection(db, 'users'));
    const marcos = usersSnap.docs.find(d => d.data().email === email);
    
    if (marcos) {
      await updateDoc(doc(db, 'users', marcos.id), {
        id_casa: casaRef.id,
        role: 'ADMIN_CASA'
      });
      console.log('✅ Marcos vinculado à Exu Tiriri');
    }
  } catch(error) {
    console.error('Erro na recriacao:', error);
  }
}

// Para usar na CLI, descomente abaixo ou rode o app:
recriarExuTiriri().then(() => process.exit(0)).catch(console.error);
