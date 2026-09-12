const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

const insertLogic = `
  const handleRemoveLogo = async () => {
    if (!casa?.id) return;
    setUploading(true);
    try {
      const casaRef = doc(db, 'casas_axe', casa.id);
      await updateDoc(casaRef, { logoUrl: '' });
      setLogoUrl('');
      alert('Logo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      alert('Erro ao remover imagem.');
    } finally {
      setUploading(false);
    }
  };
`;

code = code.replace(/  const handleSendInvite/, insertLogic + '\n  const handleSendInvite');
fs.writeFileSync('src/pages/Configuracoes.tsx', code);
