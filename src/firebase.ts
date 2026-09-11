import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Inicializa o Firestore com o databaseId correto e cache configurado
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Habilita persistência offline do Firestore com tratamento para múltiplas abas
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência desativada: múltiplas abas abertas simultaneamente.');
  } else if (err.code === 'unimplemented') {
    console.warn('Navegador atual não suporta persistência offline do Firestore.');
  } else {
    console.warn('Erro ao ativar persistência do Firestore:', err);
  }
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export { db };

// Teste de conexão inicial conforme diretrizes
import { doc, getDocFromServer } from "firebase/firestore";
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Conexão com Firestore estabelecida com sucesso.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Erro de conexão: O cliente está offline. Verifique a configuração do Firebase.");
    }
  }
}
testConnection();

