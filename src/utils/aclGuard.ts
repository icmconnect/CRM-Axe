import { getDoc, addDoc, collection, DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Role, UserRole } from '../types/roles';

/**
 * Registra uma tentativa de invasão ou acesso não autorizado na coleção 'security_logs'
 */
export async function registrarTentativaInvasao(uid: string, email: string, docPath: string, motivo: string) {
  try {
    await addDoc(collection(db, 'security_logs'), {
      data: new Date().toISOString(),
      uid,
      email,
      docPath,
      motivo
    });
    console.warn(`[SECURITY_ALERT] Tentativa de invasão por ${email} em ${docPath}. Motivo: ${motivo}`);
  } catch (err) {
    console.error('[SECURITY] Erro ao salvar security_log:', err);
  }
}

/**
 * Valida o acesso de uma UserRole a um documento snapshot.
 * Se falta campo ambiente ou id_casa (conforme o cargo exige), retorna false por segurança.
 */
export function validarAcessoDocumentoSnapshot(docSnap: DocumentSnapshot, userRole: UserRole): boolean {
  if (!docSnap.exists()) {
    return false;
  }

  if (userRole.role === Role.MASTER) {
    return true;
  }

  const data = docSnap.data();
  if (!data) {
    return false;
  }

  if (userRole.role === Role.TESTADOR) {
    if (!data.hasOwnProperty('ambiente')) {
      return false; // falta campo ambiente
    }
    return data.ambiente === 'teste';
  }

  // Outros (ADMIN_CASA, EDITOR, etc.)
  if (!data.hasOwnProperty('id_casa')) {
    return false; // falta campo id_casa
  }
  return data.id_casa === userRole.id_casa;
}

/**
 * Busca o documento e valida o acesso conforme as regras do cargo
 */
export async function validarAcessoDocumento(docRef: DocumentReference, userRole: UserRole): Promise<boolean> {
  try {
    const docSnap = await getDoc(docRef);
    return validarAcessoDocumentoSnapshot(docSnap, userRole);
  } catch (err) {
    console.error('[SECURITY] Erro ao validar acesso de documento:', err);
    return false;
  }
}

/**
 * Realiza um get seguro que valida se o usuário possui acesso ao documento antes de retorná-lo
 */
export async function getDocSeguro(docRef: DocumentReference, userRole: UserRole): Promise<DocumentSnapshot | null> {
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }

    const isValido = validarAcessoDocumentoSnapshot(docSnap, userRole);
    if (isValido) {
      return docSnap;
    }

    // Se inválido, registra a invasão e retorna null
    await registrarTentativaInvasao(
      userRole.uid,
      userRole.email,
      docRef.path,
      `Tentou acessar documento com cargo insuficiente (${userRole.role})`
    );
    return null;
  } catch (err) {
    console.error('[SECURITY] Erro ao obter documento de forma segura:', err);
    return null;
  }
}
