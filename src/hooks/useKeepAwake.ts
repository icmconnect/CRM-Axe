import { useEffect, useRef } from 'react';

export function useKeepAwake() {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    async function requestWakeLock() {
      // Método 1: Screen Wake Lock API (navegadores modernos)
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('✅ Wake Lock ativado');
          
          // Reconquistar se perder (ex: usuário sai e volta)
          wakeLockRef.current.addEventListener('release', () => {
            console.log('⚠️ Wake Lock perdido, reconquistando...');
            requestWakeLock();
          });
        } catch (err) {
          console.log('⚠️ Wake Lock não disponível:', err);
        }
      }
      
      // Método 2: Ping silencioso (fallback para navegadores antigos)
      // Mantém a conexão viva com o servidor
      const pingInterval = setInterval(async () => {
        try {
          await fetch('/api/heartbeat');
          // console.log('💓 Ping heartbeat');
        } catch {
          // Silencioso - não atrapalha o usuário
        }
      }, 30000); // A cada 30 segundos
      
      return () => clearInterval(pingInterval);
    }
    
    requestWakeLock();
    
    // Liberar wake lock quando sair da página
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);
}
