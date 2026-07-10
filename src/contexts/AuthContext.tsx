/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Role, UserRole, ROLE_HIERARCHY } from '../types/roles';

export interface CasaAxe {
  id: string;
  nome: string;
  admin_email: string;
  admin_nome: string;
  whatsapp: string;
  status: 'trial' | 'ativo' | 'suspenso';
  trial_ate?: string;
  plano?: string;
}

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  casa: CasaAxe | null;
  loading: boolean;
  temPermissao: (nivelMinimo: Role) => boolean;
  podeVerCasa: (id_casa: string) => boolean;
  podeEditar: () => boolean;
  isMaster: boolean;
  isTester: boolean;
  refreshCasa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [casa, setCasa] = useState<CasaAxe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const EMAILS_MASTER = ['gustavomacedo.consultor@gmail.com'];
          if (firebaseUser.email && EMAILS_MASTER.includes(firebaseUser.email.toLowerCase())) {
            const masterRoleData: UserRole = {
              uid: firebaseUser.uid,
              email: firebaseUser.email.toLowerCase(),
              role: Role.MASTER,
              id_casa: 'master',
              ambiente: 'producao'
            };
            setUser(firebaseUser);
            setUserRole(masterRoleData);
            setLoading(false);
            
            // Try to update Firestore, but don't block
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                uid: firebaseUser.uid,
                email: firebaseUser.email.toLowerCase(),
                role: 'MASTER',
                id_casa: 'master',
                ambiente: 'producao',
                ultimo_login: serverTimestamp()
              }, { merge: true });
            } catch (e) {
              console.error('Failed to update master role in firestore', e);
            }
            return;
          }

          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap = await getDoc(userRef);

          // Sincroniza/Cria documento se não existir
          if (!userSnap.exists()) {
            const hasMasterEmail = firebaseUser.email?.toLowerCase() === 'gustavomacedo.consultor@gmail.com';
            const defaultRole = hasMasterEmail ? Role.MASTER : Role.EDITOR;

            const initialData = {
              uid: firebaseUser.uid,
              nome: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              foto: firebaseUser.photoURL || '',
              ultimo_login: serverTimestamp(),
              role: defaultRole,
              id_casa: null, // Force null, require assignment
              ambiente: 'producao',
              bloqueado: false
            };

            await setDoc(userRef, initialData);
            userSnap = await getDoc(userRef);
          } else {
            // Atualiza apenas o último login se já existir
            await setDoc(userRef, { ultimo_login: serverTimestamp() }, { merge: true });
          }

          const userData = userSnap.data();

          // Validação de segurança para usuários bloqueados
          if (userData?.bloqueado === true || userData?.role === Role.BLOQUEADO) {
            console.warn(`[ACL] Acesso bloqueado para o usuário: ${firebaseUser.email}`);
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }

          // Preenche a estrutura UserRole de forma segura com fallbacks
          const roleFromDb = userData?.role as Role;
          let resolvedRole = Object.values(Role).includes(roleFromDb) ? roleFromDb : Role.EDITOR;

          let id_casa_resolved = userData?.id_casa || null;

          if (!id_casa_resolved && firebaseUser.email && !['gustavomacedo.consultor@gmail.com'].includes(firebaseUser.email.toLowerCase())) {
            try {
              const casasSnap = await getDocs(
                query(collection(db, 'casas_axe'), where('admin_email', '==', firebaseUser.email))
              );
              
              if (!casasSnap.empty) {
                id_casa_resolved = casasSnap.docs[0].id;
                resolvedRole = Role.ADMIN_CASA; // If they are the admin, they should be ADMIN_CASA
                await updateDoc(userRef, {
                  id_casa: id_casa_resolved,
                  role: resolvedRole
                });
                console.log('✅ id_casa corrigido:', id_casa_resolved);
              }
            } catch (err) {
              console.error('Erro ao buscar casa por email no AuthContext:', err);
            }
          }

          if (resolvedRole === Role.TESTADOR) {
            const aclRef = doc(db, 'config', 'acl');
            const aclSnap = await getDoc(aclRef);
            const testers: string[] = aclSnap.exists() ? (aclSnap.data()?.testers || []) : [];
            const testersLower = testers.map(e => e.toLowerCase());
            const userEmail = firebaseUser.email?.toLowerCase() || '';

            if (!testersLower.includes(userEmail)) {
              console.warn(`[ACL_GUARD] TESTADOR não autorizado tentou logar: ${userEmail}`);
              try {
                const { registrarTentativaInvasao } = await import('../utils/aclGuard');
                await registrarTentativaInvasao(
                  firebaseUser.uid,
                  firebaseUser.email || '',
                  'auth/login',
                  'Acesso de teste não autorizado (e-mail ausente na lista de testers)'
                );
              } catch (securityErr) {
                console.error('Falha ao registrar tentativa nos logs de segurança:', securityErr);
              }

              alert("Acesso de teste não autorizado");
              await signOut(auth);
              setUser(null);
              setUserRole(null);
              setLoading(false);
              return;
            }
          }

          setUser(firebaseUser);

          const userRoleData: any = {
            uid: firebaseUser.uid,
            email: (firebaseUser.email || '').toLowerCase(),
            role: resolvedRole,
            id_casa: id_casa_resolved,
            ambiente: userData?.ambiente || 'producao',
          };

          try {
            if (userRoleData.id_casa) {
              const casaRef = doc(db, 'casas_axe', userRoleData.id_casa);
              const casaSnap = await getDoc(casaRef);
              if (casaSnap.exists()) {
                const casaData = casaSnap.data();
                setCasa({
                  id: userRoleData.id_casa,
                  nome: casaData.nome,
                  admin_email: casaData.admin_email,
                  admin_nome: casaData.admin_nome,
                  whatsapp: casaData.whatsapp || '',
                  status: casaData.status || 'trial',
                  trial_ate: casaData.trial_ate,
                  plano: casaData.plano || 'essencial'
                });
              } else {
                setCasa(null);
              }
            } else {
              setCasa(null);
            }
          } catch (casaErr) {
            console.error('Erro ao obter dados da casa:', casaErr);
            setCasa(null);
          }

          setUserRole(userRoleData);
        } else {
          setUser(null);
          setUserRole(null);
          setCasa(null);
        }
      } catch (err) {
        console.error('[ACL] Erro ao sincronizar ou obter permissões do usuário:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // MASTER = 100, ADMIN_CASA = 80, EDITOR = 50, TESTADOR = 30, BLOQUEADO = 0
  const temPermissao = (nivelMinimo: Role): boolean => {
    if (!userRole) return false;
    const userNivel = ROLE_HIERARCHY[userRole.role] || 0;
    const minimoNivel = ROLE_HIERARCHY[nivelMinimo] || 0;
    return userNivel >= minimoNivel;
  };

  const podeVerCasa = (id_casa: string): boolean => {
    if (!userRole) return false;
    if (userRole.role === Role.MASTER) return true;
    return userRole.id_casa === id_casa;
  };

  const podeEditar = (): boolean => {
    if (!userRole) return false;
    const userNivel = ROLE_HIERARCHY[userRole.role] || 0;
    const editorNivel = ROLE_HIERARCHY[Role.EDITOR] || 50;
    return userNivel >= editorNivel;
  };

  const isMaster = userRole?.role === Role.MASTER;
  const isTester = userRole?.role === Role.TESTADOR;

  const refreshCasa = async () => {
    const activeIdCasa = userRole?.id_casa;
    if (!activeIdCasa) return;
    try {
      const casaRef = doc(db, 'casas_axe', activeIdCasa);
      const casaSnap = await getDoc(casaRef);
      if (casaSnap.exists()) {
        const casaData = casaSnap.data();
        setCasa({
          id: activeIdCasa,
          nome: casaData.nome,
          admin_email: casaData.admin_email,
          admin_nome: casaData.admin_nome,
          whatsapp: casaData.whatsapp || '',
          status: casaData.status || 'trial',
          trial_ate: casaData.trial_ate,
          plano: casaData.plano || 'essencial'
        });
      }
    } catch (e) {
      console.error('Erro ao recarregar dados do terreiro:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        casa,
        loading,
        temPermissao,
        podeVerCasa,
        podeEditar,
        isMaster,
        isTester,
        refreshCasa
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
