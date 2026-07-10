import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Função de migração segura para preparar o banco de dados Firestore para o suporte de ACL (Access Control Lists).
 * 
 * DESIGN DE SEGURANÇA:
 * - Evita re-execução (trava idempotente na coleção 'config/acl').
 * - Preserva dados originais (verifica se o campo já existe e usa `updateDoc` de forma cirúrgica para não sobrescrever).
 * - Criação da Casa Principal vinculada ao MASTER.
 */
export async function executarMigracao(): Promise<{ sucesso: boolean; mensagem: string }> {
  console.log('[MIGRAÇÃO] Iniciando verificação de pré-requisitos para o ACL...');

  try {
    // 1. Verificar se a migração já foi executada (trava em config/acl)
    const aclConfigRef = doc(db, 'config', 'acl');
    const aclConfigSnap = await getDoc(aclConfigRef);

    if (aclConfigSnap.exists()) {
      const msg = 'Migração já foi executada anteriormente. Operação abortada para segurança.';
      console.log(`[MIGRAÇÃO] ${msg}`);
      return { sucesso: true, mensagem: msg };
    }

    console.log('[MIGRAÇÃO] Nenhuma migração prévia concluída. Iniciando migração segura...');

    // 2. Criar ou validar 'casa_principal' na coleção 'casas_axe'
    console.log('[MIGRAÇÃO] Configurando documento "casa_principal" na coleção "casas_axe"...');
    const casaPrincipalRef = doc(db, 'casas_axe', 'casa_principal');
    await setDoc(casaPrincipalRef, {
      nome: 'Casa Principal',
      admin_email: 'gustavomacedo.consultor@gmail.com',
      created_at: Timestamp.now()
    }, { merge: true });
    console.log('[MIGRAÇÃO] Casa Principal configurada com sucesso.');

    // 3. Atualizar coleção 'users'
    console.log('[MIGRAÇÃO] Processando coleção "users"...');
    const usersColRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersColRef);
    let usersAtualizados = 0;

    for (const docSnap of usersSnapshot.docs) {
      const data = docSnap.data();
      const email = data.email || '';
      const updates: any = {};

      // Atribuição de Role
      if (!data.role) {
        if (email.toLowerCase() === 'gustavomacedo.consultor@gmail.com') {
          updates.role = 'MASTER';
        } else {
          updates.role = 'EDITOR';
        }
      }

      // Atribuição de id_casa
      if (!data.id_casa) {
        updates.id_casa = 'casa_principal';
      }

      // Atribuição de ambiente
      if (!data.ambiente) {
        updates.ambiente = 'producao';
      }

      // Execução parcial e segura (updateDoc atualiza campos específicos e preserva o restante do objeto)
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'users', docSnap.id), updates);
        usersAtualizados++;
      }
    }
    console.log(`[MIGRAÇÃO] Coleção "users" atualizada. Documentos modificados: ${usersAtualizados}`);

    // 4. Atualizar coleções secundárias: 'membros', 'financeiro', 'eventos', 'itens_necessidade', 'audit_logs'
    const colecoesSecundarias = ['membros', 'financeiro', 'eventos', 'itens_necessidade', 'audit_logs'];
    
    for (const colName of colecoesSecundarias) {
      console.log(`[MIGRAÇÃO] Processando coleção "${colName}"...`);
      let colAtualizados = 0;
      
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const updates: any = {};

          if (!data.id_casa) {
            updates.id_casa = 'casa_principal';
          }
          if (!data.ambiente) {
            updates.ambiente = 'producao';
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, colName, docSnap.id), updates);
            colAtualizados++;
          }
        }
        console.log(`[MIGRAÇÃO] Coleção "${colName}" concluída. Documentos modificados: ${colAtualizados}`);
      } catch (colErr: any) {
        console.error(`[MIGRAÇÃO][ERRO] Falha ao processar a coleção "${colName}":`, colErr);
        throw new Error(`Erro na coleção "${colName}": ${colErr.message || colErr}`);
      }
    }

    // 5. Configurar trava de segurança final em config/acl
    console.log('[MIGRAÇÃO] Criando trava de segurança de ACL em "config/acl"...');
    await setDoc(aclConfigRef, {
      testers: [],
      updated_at: Timestamp.now(),
      updated_by: 'gustavomacedo.consultor@gmail.com'
    });
    console.log('[MIGRAÇÃO] Trava de segurança registrada com sucesso.');

    console.log('[MIGRAÇÃO] Processo de migração de ACL concluído com 100% de sucesso.');
    return {
      sucesso: true,
      mensagem: 'Migração concluída com sucesso em todas as coleções!'
    };

  } catch (error: any) {
    console.error('[MIGRAÇÃO][ERRO CRÍTICO] Falha geral na migração:', error);
    return {
      sucesso: false,
      mensagem: `Erro na migração do ACL: ${error.message || error}`
    };
  }
}
