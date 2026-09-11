/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Membros from './pages/Membros';
import Financeiro from './pages/Financeiro';
import Eventos from './pages/Eventos';
import Relatorios from './pages/Relatorios';
import Admin from './pages/Admin';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import CadastroCasa from './pages/CadastroCasa';
import BoasVindas from './pages/BoasVindas';
import RecuperarSenha from './pages/RecuperarSenha';
import ContaSuspensa from './pages/ContaSuspensa';
import AdminDebug from './pages/AdminDebug';
import { DataProvider } from './contexts/DataContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types/roles';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDebug from './components/ErrorDebug';

import { useKeepAwake } from './hooks/useKeepAwake';

function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-[#FDE68A] shadow-lg rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4">
      <div className="text-sm font-medium text-slate-800">
        <span className="text-[#D97706] font-bold mr-1">Nova versão disponível!</span>
      </div>
      <button 
        onClick={onUpdate}
        className="bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
      >
        Clique aqui para atualizar
      </button>
    </div>
  );
}

function InstallPrompt({ deferredPrompt, onInstall }: { deferredPrompt: any, onInstall: () => void }) {
  if (!deferredPrompt) return null;
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white border border-[#FDE68A] shadow-lg rounded-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-4 max-w-[90%] w-80">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-800">Instalar Aplicativo</h3>
        <p className="text-sm text-slate-600 mt-1">Instale o Ase Connect para acesso rápido e offline!</p>
      </div>
      <button 
        onClick={onInstall}
        className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
      >
        Clique aqui para instalar
      </button>
    </div>
  );
}

export default function App() {
  useKeepAwake();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    let unsubscribeBlock: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Monitorar status de bloqueio em tempo real
        unsubscribeBlock = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
          if (snapshot.exists() && snapshot.data()?.bloqueado) {
            signOut(auth);
            setUser(null);
          }
        });
      } else {
        if (unsubscribeBlock) {
          unsubscribeBlock();
          unsubscribeBlock = null;
        }
      }
      setUser(user);
      setLoading(false);
    });

    // PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Service Worker Registration & Update Logic
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.register('/sw.js').then(registration => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });
      }).catch(err => console.error('SW registration failed:', err));
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeBlock) unsubscribeBlock();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  const handleUpdate = () => {
    setUpdateAvailable(false);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7] text-[#D97706] font-medium">Carregando...</div>;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <DataProvider>
              <Router>
                {updateAvailable && <UpdateToast onUpdate={handleUpdate} />}
                {deferredPrompt && <InstallPrompt deferredPrompt={deferredPrompt} onInstall={handleInstall} />}
                <Routes>
                  <Route path="/cadastro" element={user ? <Navigate to="/boas-vindas" /> : <CadastroCasa />} />
                  <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                  <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                  <Route path="/suspenso" element={user ? <ContaSuspensa /> : <Navigate to="/login" />} />
                  <Route path="/admin/debug-tenant" element={
                    <ProtectedRoute nivelMinimo={Role.MASTER}>
                      <AdminDebug />
                    </ProtectedRoute>
                  } />
                  <Route path="/boas-vindas" element={user ? <BoasVindas /> : <Navigate to="/login" />} />

                  {user ? (
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="membros" element={
                        <ProtectedRoute nivelMinimo={Role.TESTADOR}>
                          <Membros />
                        </ProtectedRoute>
                      } />
                      <Route path="financeiro" element={
                        <ProtectedRoute nivelMinimo={Role.TESTADOR}>
                          <Financeiro />
                        </ProtectedRoute>
                      } />
                      <Route path="eventos" element={
                        <ProtectedRoute nivelMinimo={Role.TESTADOR}>
                          <Eventos />
                        </ProtectedRoute>
                      } />
                      <Route path="relatorios" element={
                        <ProtectedRoute nivelMinimo={Role.ADMIN_CASA}>
                          <Relatorios />
                        </ProtectedRoute>
                      } />
                      <Route path="admin" element={
                        <ProtectedRoute nivelMinimo={Role.MASTER}>
                          <Admin />
                        </ProtectedRoute>
                      } />
                    </Route>
                  ) : (
                    <Route path="/" element={<ErrorDebug componentName="LandingPage"><LandingPage /></ErrorDebug>} />
                  )}

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
          </DataProvider>
        </UserProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
