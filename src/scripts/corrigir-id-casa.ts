import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function corrigirTransacoesSemCasa() {
  const snapshot = await getDocs(collection(db, 'financeiro'));
  const usersSnap = await getDocs(collection(db, 'users'));
  
  for (const document of snapshot.docs) {
    const data = document.data();
    
    // Se não tem id_casa, tenta descobrir pelo email
    if (!data.id_casa && data.modificado_por_email) {
      // Buscar o usuário pelo email
      const usuario = usersSnap.docs.find(u => u.data().email === data.modificado_por_email);
      
      if (usuario) {
        const id_casa = usuario.data().id_casa;
        await updateDoc(doc(db, 'financeiro', document.id), {
          id_casa: id_casa || 'casa_principal',
          ambiente: 'producao'
        });
        console.log(`✅ Transação ${document.id} corrigida para casa ${id_casa}`);
      }
    }
  }
}
