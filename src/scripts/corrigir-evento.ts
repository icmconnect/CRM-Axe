import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function corrigirEventoFestadeCiganos() {
  const emailTeste = 'teste@teste';
  
  // 1. Encontrar usuário teste
  const usersSnap = await getDocs(collection(db, 'users'));
  const userTeste = usersSnap.docs.find(d => d.data().email === emailTeste);
  
  if (!userTeste) {
    console.log('❌ Usuário teste não encontrado');
    return;
  }
  
  const idCasa = userTeste.data().id_casa;
  console.log('Casa do teste:', idCasa);
  
  // 2. Encontrar evento "Festa de Ciganos" sem id_casa
  const eventosSnap = await getDocs(collection(db, 'eventos'));
  let corrigidos = 0;
  
  for (const docEv of eventosSnap.docs) {
    const data = docEv.data();
    if (data.nome?.toLowerCase().includes('cigano') && !data.id_casa) {
      await updateDoc(doc(db, 'eventos', docEv.id), {
        id_casa: idCasa,
        ambiente: 'producao'
      });
      console.log('✅ Evento corrigido:', data.nome, '→ casa:', idCasa);
      corrigidos++;
    }
  }
  
  console.log(`Total de eventos corrigidos: ${corrigidos}`);
}

corrigirEventoFestadeCiganos().then(() => process.exit(0)).catch(console.error);
