import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function corrigirFestaCiganos() {
  try {
    // Encontrar evento
    const eventosSnap = await getDocs(collection(db, 'eventos'));
    const festa = eventosSnap.docs.find(d => 
      d.data().nome?.toLowerCase().includes('cigano')
    );
    
    if (!festa) {
      console.log('❌ Festa de Ciganos não encontrada');
      return;
    }
    
    console.log('Evento encontrado:', festa.data().nome, '| id_casa atual:', festa.data().id_casa);
    
    // Encontrar casa do teste@teste
    const usersSnap = await getDocs(collection(db, 'users'));
    const userTeste = usersSnap.docs.find(d => d.data().email === 'teste@teste');
    
    if (!userTeste) {
      console.log('❌ Usuário teste não encontrado');
      return;
    }
    
    const idCasa = userTeste.data().id_casa;
    console.log('Casa do teste@teste:', idCasa);
    
    // Corrigir
    await updateDoc(doc(db, 'eventos', festa.id), {
      id_casa: idCasa,
      ambiente: 'producao'
    });
    
    console.log('✅ Festa de Ciganos movida para casa:', idCasa);
  } catch(error) {
    console.error('❌ Erro:', error);
  }
}

corrigirFestaCiganos().then(() => process.exit(0)).catch(console.error);
