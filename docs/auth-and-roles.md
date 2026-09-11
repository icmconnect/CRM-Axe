# Autenticação e Papéis (Auth and Roles)

Este documento detalha o sistema de controle de acesso baseado em funções (RBAC - Role-Based Access Control) e a autenticação de usuários na plataforma **Ase Connect**.

---

## 🔐 Mecanismo de Autenticação

A plataforma utiliza o **Firebase Authentication** para autenticação e persistência segura de usuários.

- **Método de Entrada (Login):**
  1. E-mail e Senha de acesso.
  2. Autenticação por Provedor Google (via Pop-up nativo do Firebase).
- **Cadastro (Onboarding):** Realizado por `/cadastro` (`CadastroCasa.tsx`), que gera uma nova Casa de Axé associada ao e-mail do dirigente e, posteriormente, vincula as permissões.
- **Sessão:** A persistência é gerenciada localmente pelo SDK do Firebase Auth (IndexDB/Cookies de sessão). O estado da sessão é monitorado em tempo real por `onAuthStateChanged`.
- **Recuperação de Senha:** Envio de link de redefinição por e-mail via Firebase Auth Service.
- **Logout:** Função `signOut` que limpa a sessão e descarrega os ouvintes ativos de dados.

---

## 👥 Matriz de Papéis (Roles Hierarchy)

Os níveis de acesso são definidos no arquivo `src/types/roles.ts` e regulados pela seguinte hierarquia numérica:

| Papel (Role) | Peso Numérico | Descrição Funcional |
|---|---|---|
| **MASTER** | `100` | Super Admin. Acesso total a todas as Casas de Axé, controle de faturamento, credenciamento de terreiros e representação de dados (Modo Master). |
| **ADMIN_CASA** | `80` | Administrador da Casa (Zelador/Dirigente). Acesso completo aos dados do respectivo terreiro, visualização e exportação de relatórios financeiros confidenciais. |
| **EDITOR** | `50` | Lançador/Operador. Permissão para cadastrar e editar dados de membros, eventos e movimentações de caixa do terreiro. Não visualiza relatórios confidenciais condensados. |
| **TESTADOR** | `30` | Perfil de teste. Permissão de leitura para avaliar recursos. Necessita estar na lista branca (`testers` na coleção `/config/acl`) para logar. |
| **BLOQUEADO** | `0` | Sem permissão de acesso. O sistema expulsa e limpa a sessão imediatamente se o usuário for rotulado ou bloqueado. |

---

## 📊 Matriz de Permissões (Feature Matrix)

| Recurso / Funcionalidade | Visitante | Testador | Editor | Admin Casa | Master |
|---|:---:|:---:|:---:|:---:|:---:|
| Visualizar Landing Page | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cadastrar novo Terreiro (SaaS) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Visualizar Dashboard Geral | ❌ | ✅ | ✅ | ✅ | ✅ |
| Cadastrar/Editar Membros | ❌ | ❌ | ✅ | ✅ | ✅ |
| Importar / Exportar Planilhas | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lançar Entradas / Saídas Caixa | ❌ | ❌ | ✅ | ✅ | ✅ |
| Upload de Comprovante de Pago | ❌ | ❌ | ✅ | ✅ | ✅ |
| Cadastrar Eventos e Insumos | ❌ | ❌ | ✅ | ✅ | ✅ |
| Visualizar Relatórios Confidenciais | ❌ | ❌ | ❌ | ✅ | ✅ |
| Exportar Balanços Gerenciais PDF | ❌ | ❌ | ❌ | ✅ | ✅ |
| Credenciar e Editar Terreiros | ❌ | ❌ | ❌ | ❌ | ✅ |
| Modo Master (Representação) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ajustar preço e faturar terreiros | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Validação de Acesso (Client-side vs. Backend-side)

A validação de segurança é executada em **duas camadas independentes**:

### 1. Camada do Cliente (Frontend - React)
- **Componente `ProtectedRoute`:** Envolve rotas no arquivo `App.tsx` para assegurar que apenas usuários com `userRole >= nivelMinimo` consigam renderizar os componentes na tela.
- **Função `temPermissao()`:** Controla a exibição visual de links de menus, botões e formulários sensíveis de acordo com a regra numérica da hierarquia.
- **Redirecionamento de Bloqueio em Tempo Real:** No arquivo `App.tsx`, há um ouvinte `onSnapshot` conectado ao documento do usuário em `/users/{uid}`. Caso o campo `bloqueado` mude para `true`, a sessão do usuário é destruída instantaneamente no navegador e ele é jogado para a tela de login.

### 2. Camada do Servidor / Banco (Backend - Cloud Firestore Rules)
*Toda e qualquer validação visual é apenas informativa. A segurança real dos dados é efetuada pelas regras do Firebase contidas no arquivo `firestore.rules`:*

- **Isolamento de Locatários (Multi-tenancy):**
  As regras de leitura e escrita do Firestore bloqueiam qualquer requisição em que o `id_casa` do documento seja diferente do `id_casa` vinculado ao perfil do usuário no banco de dados.
- **Exemplo de Regra Base para Membros (`firestore.rules`):**
  ```javascript
  match /membros/{membroId} {
    allow read, update: if isAuthenticated() && (isAdmin() || !('id_casa' in resource.data) || canAccessCasa(resource.data.id_casa));
  }
  ```
- **Proteção do Super Admin (Master):**
  Apenas usuários que possuem e-mail correspondente à expressão regular `(?i)^gustavomacedo\.consultor@gmail\.com$` ou que possuam o cargo `MASTER` no banco de dados conseguem acessar a coleção `/casas_axe` para deletar ou atualizar faturamento.

---

## ⚠️ Riscos Identificados e Mitigações

1. **Risco de Escala de Privilégios no Cliente:** Um invasor pode manipular o estado local do React para alterar seu papel visual para `MASTER`.
   - *Mitigação:* O Firestore Rules não confia no papel enviado pelo cliente. Ele realiza uma consulta interna (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role`) diretamente no banco de dados para conceder ou negar acesso.
2. **Representação Cruzada (Modo Master):** O Super Admin assume o `id_casa` de terceiros usando a função `assumeCasa`.
   - *Mitigação:* Apenas usuários comprovadamente autenticados como `MASTER` conseguem burlar as validações de `id_casa` no Firestore, graças à helper function `isAdmin()` descrita nas regras.
