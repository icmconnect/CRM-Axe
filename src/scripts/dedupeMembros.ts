import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log('Finding houses...');
  const casasSnap = await getDocs(collection(db, 'casas'));
  let mariaPadilhaCasaId: string | null = null;

  casasSnap.forEach((d) => {
    const data = d.data();
    console.log(`Casa ID: ${d.id} | Nome: ${data.nome_casa || data.nome}`);
    if (
      (data.nome_casa && data.nome_casa.toLowerCase().includes('maria padilha')) ||
      (data.nome && data.nome.toLowerCase().includes('maria padilha'))
    ) {
      mariaPadilhaCasaId = d.id;
    }
  });

  console.log('Maria Padilha Casa ID:', mariaPadilhaCasaId);

  console.log('\nFetching all membros...');
  const membrosSnap = await getDocs(collection(db, 'membros'));
  console.log(`Total membros in DB: ${membrosSnap.size}`);

  const mpMembros: Array<{ id: string; name: string; email: string; cpf: string; id_casa: string }> = [];

  membrosSnap.forEach((d) => {
    const data = d.data();
    const isMP =
      (mariaPadilhaCasaId && data.id_casa === mariaPadilhaCasaId) ||
      (data.casa_nome && data.casa_nome.toLowerCase().includes('maria padilha')) ||
      (!data.id_casa); // Check all if needed

    if (isMP || (data.id_casa && mariaPadilhaCasaId && data.id_casa === mariaPadilhaCasaId)) {
      mpMembros.push({
        id: d.id,
        name: (data.nome || '').trim().toLowerCase(),
        email: (data.email || '').trim().toLowerCase(),
        cpf: (data.cpf || '').trim().toLowerCase(),
        id_casa: data.id_casa
      });
    }
  });

  console.log(`Found ${mpMembros.length} membros associated with Maria Padilha or filter.`);

  // Group by unique identity (name + cpf or name + email or name)
  const seen = new Map<string, string>(); // key -> keepDocId
  const toDelete: string[] = [];

  for (const m of mpMembros) {
    // Generate key
    const key = m.cpf ? `cpf:${m.cpf}` : m.email ? `email:${m.email}` : `name:${m.name}`;
    if (!m.name && !m.cpf && !m.email) continue;

    if (seen.has(key)) {
      console.log(`DUPLICATE found: "${m.name}" (ID: ${m.id}) matches existing (ID: ${seen.get(key)}) key=${key}`);
      toDelete.push(m.id);
    } else {
      seen.set(key, m.id);
    }
  }

  console.log(`\nFound ${toDelete.length} duplicates to remove.`);

  for (const docId of toDelete) {
    console.log(`Deleting duplicate member document: ${docId}`);
    await deleteDoc(doc(db, 'membros', docId));
  }

  console.log('Deduplication complete!');
  process.exit(0);
}

run().catch((e) => {
  console.error('Error deduplicating members:', e);
  process.exit(1);
});
