# Changelog e Melhorias do Sistema

## Atualizações Recentes

### 1. Funcionalidade de Representação (Modo Master)
- **Arquivo(s) alterado(s):** `src/contexts/AuthContext.tsx`, `src/contexts/DataContext.tsx`, `src/components/Layout.tsx`, `src/pages/Admin.tsx` e páginas listadas (`Dashboard`, `Financeiro`, `Membros`, `Eventos`)
- **Descrição:** O usuário Master (`gustavomacedo.consultor@gmail.com`) agora possui um botão "Entrar na Casa" na lista de Casas de Axé (tela Admin). Ao clicar neste botão, o sistema assume o `id_casa` escolhido, filtrando todos os dados do sistema para visualizar apenas os dados correspondentes àquela casa, exatamente como o administrador dela veria. Adicionado um banner amarelo no topo alertando sobre o Modo Master com botão para retornar ao Admin.

### 2. Correção no Botão "Remover Membros"
- **Arquivo(s) alterado(s):** `src/contexts/DataContext.tsx`
- **Descrição:** Corrigido o bug em que membros importados não podiam ser removidos corretamente. O ID dos documentos provindos do banco de dados (que gerencia as deleções) estava sendo sobrescrito por IDs contidos nos arquivos importados. A correção foi inverter a ordem do destructuring (`{...doc.data(), id: doc.id}`) para garantir que o ID do Firestore seja sempre mantido.

### 3. Melhoria na Importação de Dados de Membros (Planilha)
- **Arquivo(s) alterado(s):** `src/pages/Membros.tsx`
- **Descrição:** A ferramenta de Importar Membros agora aceita arquivos Excel (`.xlsx`, `.xls`) e `.csv`. Adicionado também um botão **"Baixar Modelo"**, que faz o download de uma planilha pronta com as colunas corretas (nome, endereço, cpf, etc) para facilitar o preenchimento de novos membros. Membros existentes com mesmo CPF ou Nome continuarão sendo ignorados para evitar duplicidade.