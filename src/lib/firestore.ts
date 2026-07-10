import { addDoc as firestoreAddDoc, collection, DocumentData, WithFieldValue } from 'firebase/firestore';
import { db } from '../firebase';

export async function addDoc(colName: string, data: WithFieldValue<DocumentData>) {
  return firestoreAddDoc(collection(db, colName), {
    ...data,
    data_criacao: new Date().toISOString()
  });
}
