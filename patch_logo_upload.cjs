const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

const newUploadLogic = `
  const handleRemoveLogo = async () => {
    if (!casa?.id) return;
    try {
      const casaRef = doc(db, 'casas_axe', casa.id);
      await updateDoc(casaRef, { logoUrl: null });
      setLogoUrl('');
      alert('Logo removida com sucesso. O sistema usará a logo padrão.');
    } catch (error) {
      console.error("Erro ao remover logo:", error);
      alert('Erro ao remover a logo.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !casa?.id) return;
    
    setUploading(true);
    
    try {
      // Redimensionar e converter para Base64 usando Canvas para evitar problemas de Storage e CORS
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_SIZE = 400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64Url = canvas.toDataURL('image/png', 0.8);
          
          // Verificar tamanho (limite 1MB do Firestore)
          if (base64Url.length > 1000000) {
            alert('A imagem é muito grande mesmo após compressão. Escolha uma imagem mais simples.');
            setUploading(false);
            return;
          }

          try {
            const casaRef = doc(db, 'casas_axe', casa.id);
            await updateDoc(casaRef, { logoUrl: base64Url });
            setLogoUrl(base64Url);
            alert('Logo atualizada com sucesso!');
          } catch (err) {
            console.error("Erro ao salvar no Firestore:", err);
            alert("Erro ao salvar a logo no banco de dados.");
          } finally {
            setUploading(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      alert('Ocorreu um erro ao processar a imagem.');
      setUploading(false);
    }
  };
`;

code = code.replace(/const handleLogoUpload = async[\s\S]*?\} catch \(error\) \{[\s\S]*?console.error\("Erro ao buscar logs:", error\);\n    \}\n  \};\n/, "  };\n\n" + newUploadLogic);

// Add the remove logo button
const buttonsHtml = `
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50">
                    {uploading ? 'Enviando...' : (
                      <>
                        <Upload className="w-4 h-4" />
                        Alterar Logo
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                  
                  {logoUrl && (
                    <button
                      onClick={handleRemoveLogo}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                    >
                      Usar logo do sistema
                    </button>
                  )}
                </div>
`;

code = code.replace(/<div>\s*<label className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50">[\s\S]*?<\/label>\s*<\/div>/, buttonsHtml);

fs.writeFileSync('src/pages/Configuracoes.tsx', code);
