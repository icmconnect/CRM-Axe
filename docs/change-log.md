# Histórico de Alterações (Change Log)

Este documento registra o histórico de modificações técnicas, correções e novas funcionalidades introduzidas no sistema **Ase Connect**.

---

## 📅 Registro Recente

### [3 de Setembro de 2026] Patch Mínimo de Segurança e Acessibilidade (Pós-Auditoria)
- **Tipo de Alteração:** Patch de Segurança, Acessibilidade e LGPD (Mínimo e Retrocompatível).
- **Arquivos Afetados:** `src/App.tsx`, `src/pages/Login.tsx`, `src/pages/Membros.tsx`, `src/pages/Financeiro.tsx`, `src/pages/LandingPage.tsx`, `src/components/TrialBanner.tsx`, `src/pages/ContaSuspensa.tsx`, criação de `/docs/production-safe-patch-ase-connect.md`.
- **Descrição:** Proteção visual da rota `/admin/debug-tenant` usando `<ProtectedRoute nivelMinimo={Role.MASTER}>`, adição de `rel="noopener noreferrer"` em links `target="_blank"`, inclusão de `aria-label` em português em botões somente de ícone, e inserção do aviso discreto sobre computadores compartilhados na tela de Login. Nenhuma alteração em regras do Firebase, Firestore, autenticação ou deploy para Hostinger.
- **Status:** Concluído com sucesso (Build verificado e aprovado).

### [3 de Setembro de 2026] Inventário Técnico Inicial
- **Tipo de Alteração:** Documentação & Inventário Técnico.
- **Arquivos Afetados:** Criação e complementação de todos os arquivos do diretório `/docs`.
- **Descrição:** Criação da linha de base de documentação abrangendo visão geral do sistema, inventário completo de funcionalidades, mapeamento de rotas e navegação, modelo de dados das coleções Firestore, mapa de componentes React e hooks, matriz de acessibilidade e auditoria técnica de segurança somente-leitura.
- **Motivo:** Cumprimento de auditoria técnica para mapeamento funcional pré-produção.
- **Status:** Concluído.
- **Observações:** **Inventário técnico inicial gerado em 3 de Setembro de 2026. Nenhuma funcionalidade do aplicativo foi alterada nesta etapa.**

---

## ⏳ Alterações Históricas Preservadas

### [Atualização Anterior] Funcionalidade de Representação (Modo Master)
- **Tipo de Alteração:** Nova Funcionalidade (SaaS Multi-tenant).
- **Arquivos Afetados:** `src/contexts/AuthContext.tsx`, `src/contexts/DataContext.tsx`, `src/components/Layout.tsx`, `src/pages/Admin.tsx` e páginas de visualização (`Dashboard`, `Financeiro`, `Membros`, `Eventos`).
- **Descrição:** O usuário Master (`gustavomacedo.consultor@gmail.com`) agora possui um botão "Entrar na Casa" na lista de Casas de Axé (tela Admin). Ao clicar neste botão, o sistema assume o `id_casa` escolhido, filtrando todos os dados do sistema para visualizar apenas os dados correspondentes àquela casa, exatamente como o administrador dela veria. Adicionado um banner amarelo no topo alertando sobre o Modo Master com botão para retornar ao Admin.
- **Status:** Concluído.

### [Atualização Anterior] Correção no Botão "Remover Membros"
- **Tipo de Alteração:** Correção de Bug (Bugfix).
- **Arquivos Afetados:** `src/contexts/DataContext.tsx`
- **Descrição:** Corrigido o bug em que membros importados não podiam ser removidos corretamente. O ID dos documentos provindos do banco de dados (que gerencia as deleções) estava sendo sobrescrito por IDs contidos nos arquivos importados. A correção foi inverter a ordem do destructuring (`{...doc.data(), id: doc.id}`) para garantir que o ID do Firestore seja sempre mantido.
- **Status:** Concluído.

### [Atualização Anterior] Melhoria na Importação de Dados de Membros (Planilha)
- **Tipo de Alteração:** Melhoria de Usabilidade (Feature Enhancement).
- **Arquivos Afetados:** `src/pages/Membros.tsx`
- **Descrição:** A ferramenta de Importar Membros agora aceita arquivos Excel (`.xlsx`, `.xls`) e `.csv`. Adicionado também um botão **"Baixar Modelo"**, que faz o download de uma planilha pronta com as colunas corretas (nome, endereço, cpf, etc) para facilitar o preenchimento de novos membros. Membros existentes com mesmo CPF ou Nome continuarão sendo ignorados para evitar duplicidade.
- **Status:** Concluído.
