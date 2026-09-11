import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export function SubscriptionCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'active' | 'expired'>('loading');

  useEffect(() => {
    if (!user) return;
    const checkStatus = async () => {
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
          const data = snap.data();
          const isSubscribed = data.subscriptionStatus === 'active';
          
          let createdAtMillis = Date.now();
          if (data.createdAt) {
            createdAtMillis = data.createdAt.toDate().getTime();
          } else if (user.metadata && user.metadata.creationTime) {
            createdAtMillis = new Date(user.metadata.creationTime).getTime();
          }
          
          const trialEndsAt = new Date(createdAtMillis + 7 * 24 * 60 * 60 * 1000);
          const now = new Date();
          
          if (isSubscribed || now < trialEndsAt) {
            setStatus('active');
          } else {
            setStatus('expired');
          }
        } else {
          setStatus('active'); // Fallback se não houver doc
        }
      } catch (err) {
        console.error('Erro ao checar subscription', err);
        setStatus('active'); // Libera em caso de erro para não travar indevidamente
      }
    };
    checkStatus();
  }, [user]);

  if (status === 'loading') {
    return <div className="flex h-screen w-full items-center justify-center">Verificando assinatura...</div>;
  }
  
  if (status === 'expired') {
    // Redireciona para a página principal (onde estão os planos) e pode exibir um modal/alerta
    return <Navigate to="/?expired=true" replace />;
  }

  return <>{children}</>;
}
