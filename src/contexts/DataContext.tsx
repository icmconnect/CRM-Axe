import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Membro, Financeiro, Evento, ItemNecessidade, AuditLog } from '../types';
import { useAuth } from './AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface DataContextType {
  membros: Membro[];
  financeiro: Financeiro[];
  eventos: Evento[];
  itens: ItemNecessidade[];
  auditLogs: AuditLog[];
  loading: boolean;
  isDataFiltered: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, userRole, assumedCasaId, loading: authLoading } = useAuth();
  
  const [rawMembros, setRawMembros] = useState<Membro[]>([]);
  const [rawFinanceiro, setRawFinanceiro] = useState<Financeiro[]>([]);
  const [rawEventos, setRawEventos] = useState<Evento[]>([]);
  const [rawItens, setRawItens] = useState<ItemNecessidade[]>([]);
  const [rawLogs, setRawLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    let loaded = 0;
    const checkLoading = () => {
      loaded++;
      if (loaded === 5) setLoading(false);
    };

    const processSnapshot = (snapshot: any, setter: any, type: string) => {
      const dadosBrutos = snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id
      }));
      
      // FILTRO ZERO TOLERÂNCIA
      let dadosFiltrados;
      
      if (!userRole) {
        // Sem userRole carregado, não mostrar nada
        dadosFiltrados = [];
      } else if (userRole.role === 'MASTER') {
        if (assumedCasaId) {
          dadosFiltrados = dadosBrutos.filter((doc: any) => doc.id_casa === assumedCasaId);
        } else {
          // MASTER vê tudo
          dadosFiltrados = dadosBrutos;
        }
      } else if (!userRole.id_casa) {
        // Se não for MASTER e não tiver casa, não vê nada
        dadosFiltrados = [];
      } else if (userRole.role === 'TESTADOR') {
        // TESTADOR só vê ambiente='teste'
        dadosFiltrados = dadosBrutos.filter((doc: any) => doc.ambiente === 'teste');
      } else {
        // OUTROS: filtro ESTRITO por id_casa
        dadosFiltrados = dadosBrutos.filter((doc: any) => {
          // Se o documento não tem id_casa, BLOQUEAR
          if (!doc.id_casa) {
            console.warn(`Documento ${type} sem id_casa bloqueado:`, doc.id);
            return false;
          }
          // Só mostrar se id_casa for EXATAMENTE igual
          return doc.id_casa === userRole.id_casa;
        });
      }
      
      setter(dadosFiltrados);
      checkLoading();
    };

    const unsubMembros = onSnapshot(query(collection(db, 'membros')), (snapshot) => {
      processSnapshot(snapshot, setRawMembros, 'membros');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'membros');
      checkLoading();
    });

    const qFin = query(collection(db, 'financeiro'), orderBy('data', 'desc'));
    const unsubFin = onSnapshot(qFin, (snapshot) => {
      processSnapshot(snapshot, setRawFinanceiro, 'financeiro');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'financeiro');
      checkLoading();
    });

    const unsubEventos = onSnapshot(query(collection(db, 'eventos')), (snapshot) => {
      processSnapshot(snapshot, setRawEventos, 'eventos');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'eventos');
      checkLoading();
    });

    const unsubItens = onSnapshot(query(collection(db, 'itens_necessidade')), (snapshot) => {
      processSnapshot(snapshot, setRawItens, 'itens_necessidade');
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'itens_necessidade');
      checkLoading();
    });

    const qLogs = query(collection(db, 'audit_logs'), orderBy('data', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      // Regra especial para logs: testador não vê nada
      const dadosBrutos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      let dadosFiltrados;
      if (!userRole || userRole.role === 'TESTADOR') {
        dadosFiltrados = [];
      } else if (userRole.role === 'MASTER') {
        if (assumedCasaId) {
          dadosFiltrados = dadosBrutos.filter((doc: any) => doc.id_casa === assumedCasaId);
        } else {
          dadosFiltrados = dadosBrutos;
        }
      } else {
        dadosFiltrados = dadosBrutos.filter((doc: any) => {
          if (!doc.id_casa) return false;
          return doc.id_casa === userRole.id_casa;
        });
      }
      setRawLogs(dadosFiltrados);
      checkLoading();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
      checkLoading();
    });

    return () => {
      unsubMembros();
      unsubFin();
      unsubEventos();
      unsubItens();
      unsubLogs();
    };
  }, [user, userRole, assumedCasaId, authLoading]);

  const membros = rawMembros;
  const financeiro = rawFinanceiro;
  const eventos = rawEventos;
  const itens = rawItens;
  const auditLogs = rawLogs;

  const isDataFiltered = useMemo(() => {
    return userRole?.role !== 'MASTER';
  }, [userRole]);

  return (
    <DataContext.Provider value={{ membros, financeiro, eventos, itens, auditLogs, loading, isDataFiltered }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
