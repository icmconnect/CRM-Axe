import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDebug() {
  const { userRole } = useAuth();
  const [data, setData] = useState<any>({ users: [], casas: [], loading: true });

  useEffect(() => {
    if (!userRole || userRole.role === 'TESTADOR' || userRole.role === 'BLOQUEADO') return;

    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const casasSnap = await getDocs(collection(db, 'casas_axe'));

      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const casas = casasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const marcos = users.find((u: any) => u.email === 'marcosfrota@gmail.com');
      const tiriri = casas.find((c: any) => c.nome === 'Exu Tiriri');
      
      setData({
        users,
        casas,
        marcos: marcos || null,
        tiriri: tiriri || null,
        loading: false
      });
    };
    fetchData();
  }, [userRole]);

  if (!userRole || userRole.role === 'TESTADOR' || userRole.role === 'BLOQUEADO') return <Navigate to="/" />;
  if (data.loading) return <div className="p-10">Carregando dados...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Tenant</h1>
      
      <div className="mb-8 p-4 bg-white rounded-lg shadow border border-slate-200">
        <h2 className="text-lg font-bold mb-2">Conclusão do Diagnóstico</h2>
        {data.marcos && data.tiriri ? (
           <p className={data.marcos.id_casa === data.tiriri.id ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
             Vínculo Marcos/Tiriri: {data.marcos.id_casa === data.tiriri.id ? "CORRETO ✅" : "ERRADO ❌"}
           </p>
        ) : <p>Dados não encontrados.</p>}
      </div>

      <h2 className="text-lg font-bold mb-4">Usuários</h2>
      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto text-xs mb-8">
        {JSON.stringify(data.users, null, 2)}
      </pre>

      <h2 className="text-lg font-bold mb-4">Casas de Axé</h2>
      <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto text-xs">
        {JSON.stringify(data.casas, null, 2)}
      </pre>
    </div>
  );
}
