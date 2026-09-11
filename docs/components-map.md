# Mapa de Componentes (Components Map)

Este documento descreve detalhadamente os componentes visuais, páginas de interface, ganchos customizados (hooks) e contextos de gerenciamento de estado da plataforma **Ase Connect**.

---

## 💻 Páginas de Rota (Views)

As páginas representam as telas principais renderizadas pelo roteador da aplicação (`react-router-dom`).

### 1. Página: Dashboard (Painel Geral)
- **Caminho do Arquivo:** `/src/pages/Dashboard.tsx`
- **Tipo:** Página / Tela Inteira
- **Finalidade:** Fornecer ao usuário um painel analítico com gráficos financeiros, aniversariantes do mês da casa espiritual e controle de convites de membros.
- **Estado Interno:**
  - `showActivePlanBanner`: Controle do banner de plano ativo (`boolean`).
  - `showCistModal`: Exibe modal de suporte/SIST (`boolean`).
  - `showPlanosModal`: Exibe modal de troca de plano (`boolean`).
  - `casaInfo`: Objeto com dados básicos da casa de axé.
  - `showInviteUserModal`: Controle do modal de convite de usuário (`boolean`).
- **Hooks Utilizados:** `useState`, `useMemo`, `useEffect`, `useAuth`, `useData`, `useNavigate`.
- **Dados Consumidos:** Transações financeiras, Membros, Eventos, Informações do Terreiro ativo (Modo Master ou Padrão).
- **Risco de Alteração:** Baixo a Médio.

### 2. Página: Membros
- **Caminho do Arquivo:** `/src/pages/Membros.tsx`
- **Tipo:** Página / Tela Inteira
- **Finalidade:** Gerenciamento centralizado de todos os membros do terreiro, suportando importação offline e em lote de planilhas.
- **Estado Interno:**
  - `busca`, `filtroStatus`, `filtroCargo`: Estados para filtragem de busca.
  - `showAddModal`, `showEditModal`: Modais de criação/edição.
  - `membroSelecionado`: Membro focado para visualização ou edição.
  - `fileInputRef`: Referência ao campo de upload de planilha.
- **Hooks Utilizados:** `useState`, `useEffect`, `useData`, `useAuth`.
- **Risco de Alteração:** Médio. Alterações neste arquivo impactam diretamente o ecossistema de controle de fiéis e dependentes.

### 3. Página: Financeiro
- **Caminho do Arquivo:** `/src/pages/Financeiro.tsx`
- **Tipo:** Página / Tela Inteira
- **Finalidade:** Livro de caixa detalhado. Registro de entradas, dízimos, mensalidades e despesas.
- **Estado Interno:**
  - `showAddLancamento`, `tipoLancamento`: Estados para controle de lançamentos.
  - `filtroMes`, `filtroCategoria`: Filtros temporais e categoriais.
  - `uploading`: Estado de carregamento do Firebase Storage (`boolean`).
- **Hooks Utilizados:** `useState`, `useMemo`, `useData`, `useAuth`.
- **Risco de Alteração:** Alto. É a área contábil do terreiro e lida com upload de arquivos binários no Cloud Storage.

### 4. Página: Super Admin
- **Caminho do Arquivo:** `/src/pages/Admin.tsx`
- **Tipo:** Página / Tela Inteira
- **Finalidade:** Tela de controle exclusiva para o Super Admin (Master) credenciar terreiros, gerenciar assinaturas, alterar preços e ativar o Modo Master (Representação).
- **Estado Interno:**
  - `casas`: Lista de terreiros cadastrados (`CasaAxe[]`).
  - `loading`: Controle visual de carregamento.
  - `showEditCasaModal`, `editingCasa`: Edição de informações cadastrais e comerciais.
- **Hooks Utilizados:** `useState`, `useEffect`, `useAuth`.
- **Risco de Alteração:** Crítico. Possui conexões sensíveis de escrita global em múltiplos terreiros.

---

## 🧩 Componentes Globais e Reutilizáveis

### 1. Componente: Layout Principal
- **Caminho do Arquivo:** `/src/components/Layout.tsx`
- **Tipo:** Componente Estrutural (Layout Template)
- **Finalidade:** Fornece a casca visual da aplicação (Sidebar colapsável, Header flutuante, Dark Mode toggle e banners globais).
- **Props/Inputs:** `children` (Elemento retransmitido pelas rotas).
- **Estado Interno:** `isSidebarOpen` (`boolean` para responsividade celular).
- **Hooks Utilizados:** `useAuth`, `useTheme`, `useState`.

### 2. Componente: Modal Genérico
- **Caminho do Arquivo:** `/src/components/Modal.tsx`
- **Tipo:** Componente de Apresentação (UI)
- **Finalidade:** Caixa de diálogo modal flutuante estilizada com Tailwind, contendo animações de entrada e tratamento do botão de fechar e escape.
- **Props/Inputs:**
  - `isOpen`: Estado ativo do modal (`boolean`).
  - `onClose`: Função disparada ao fechar (`() => void`).
  - `title`: Título textual do cabeçalho (`string`).
  - `children`: Conteúdo embutido do corpo do modal (`ReactNode`).
  - `maxWidth`: Limitação de largura responsive (`'sm' | 'md' | 'lg' | 'xl' | '2xl'`).

### 3. Componente: Planos de Assinatura (PlanosCards)
- **Caminho do Arquivo:** `/src/components/PlanosCards.tsx`
- **Tipo:** Componente UI / Comercial
- **Finalidade:** Renderizar os cards comerciais dos planos (Essencial, Comunidade e Federação) destacando limites de membros, usuários e recursos.
- **Props/Inputs:**
  - `onSelectPlano`: Função disparada ao escolher/mudar o plano do terreiro (`(plano: string) => void`).

### 4. Componente: Banner de Avaliação (TrialBanner)
- **Caminho do Arquivo:** `/src/components/TrialBanner.tsx`
- **Tipo:** Componente Informativo / Comercial
- **Finalidade:** Exibir alertas sobre o período trial ativo, dias restantes para vencimento e atalhos rápidos de faturamento.

---

## 🧬 Provedores de Estado Global (Contexts)

### 1. Provedor: AuthContext
- **Caminho do Arquivo:** `/src/contexts/AuthContext.tsx`
- **Finalidade:** Controlar a sessão de autenticação do Firebase, resolver o papel (Role) do usuário no Firestore, gerenciar permissões (RBAC) e orquestrar a representação de terreiro (Modo Master).
- **Dados Exportados:** `user` (Auth), `userRole` (Role), `casa` (Dados da casa espiritual), `assumedCasaId` (ID da casa representada no Modo Master).

### 2. Provedor: DataContext
- **Caminho do Arquivo:** `/src/contexts/DataContext.tsx`
- **Finalidade:** Sincronização em tempo real (listeners ativos `onSnapshot`) com as coleções de Membros, Financeiro e Eventos, garantindo reatividade de dados e suporte offline-first.
- **Dados Exportados:** `membros`, `financeiro`, `eventos`, `loading`, `adicionarMembro`, `removerMembro`, etc.

### 3. Provedor: ThemeContext
- **Caminho do Arquivo:** `/src/contexts/ThemeContext.tsx`
- **Finalidade:** Alternância semântica de classes de tema escuro (`dark`) no nó raiz (`<html>`), salvando a escolha no `localStorage`.
