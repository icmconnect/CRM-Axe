# Rotas e Navegação (Routes and Navigation)

Este documento mapeia todas as rotas de navegação da plataforma **Ase Connect (Portal dos Sacerdotes)**, descrevendo seus mecanismos de proteção, papéis de acesso e fontes de dados.

---

## 🗺️ Tabela de Rotas da Aplicação

| Rota | Componente de Página | Tipo | Nível de Proteção | Papel Mínimo Requerido | Menus / Botões de Acesso | Fonte de Dados Principal | Estado | Observações |
|---|---|---|---|---|---|---|---|---|
| `/` | `LandingPage.tsx` | Pública (Se deslogado) | Nenhuma | Visitante (Qualquer um) | URL Direta / Home | Arquivo estático local | **Funcional** | Funciona como landing page para captação de clientes se o usuário não estiver logado. |
| `/` | `Dashboard.tsx` | Autenticada | `ProtectedRoute` genérica | `Role.TESTADOR` (Ver nota) | Sidebar: "Início" / Logo | Firestore (`casas_axe`, `users`, `membros`, `financeiro`) | **Funcional** | Exibe gráficos, atalhos rápidos e status da conta. |
| `/login` | `Login.tsx` | Pública | Redireciona para `/` se logado | Visitante | Header da Landing / URL Direta | Firebase Auth | **Funcional** | Permite login com e-mail/senha ou Conta Google. |
| `/cadastro` | `CadastroCasa.tsx` | Pública | Redireciona para `/boas-vindas` se logado | Visitante | Landing Page ("Cadastrar Terreiro") | Input de Formulário | **Funcional** | Cria um novo registro de terreiro no Firestore. |
| `/recuperar-senha` | `RecuperarSenha.tsx`| Pública | Nenhuma | Visitante | Link "Esqueci minha senha" no Login | Firebase Auth | **Funcional** | Dispara e-mail nativo de redefinição de senha. |
| `/boas-vindas` | `BoasVindas.tsx` | Autenticada | `ProtectedRoute` genérica | `Role.TESTADOR` | Redirecionado após o cadastro | Input do Usuário | **Funcional** | Tela de boas-vindas introdutória e onboarding inicial. |
| `/suspenso` | `ContaSuspensa.tsx` | Autenticada | Bloqueio de roteador e estado | Qualquer logado com casa suspensa | Redirecionamento forçado se status da casa for `suspenso` | Firestore (`casas_axe`) | **Funcional** | Bloqueia interações em caso de falta de pagamento ou cancelamento. |
| `/admin/debug-tenant`| `AdminDebug.tsx` | Autenticada | Nível de desenvolvimento | Qualquer um logado (Risco!) | URL Direta | Firestore | **Funcional** | Tela experimental para depurar contexto e multi-tenancy. |
| `/membros` | `Membros.tsx` | Autenticada | `ProtectedRoute` | `Role.TESTADOR` | Sidebar: "Membros" / Atalho do Dashboard | Firestore (`membros`) | **Funcional** | Gestão de membros, importação Excel/CSV, filtros e dependentes. |
| `/financeiro` | `Financeiro.tsx` | Autenticada | `ProtectedRoute` | `Role.TESTADOR` | Sidebar: "Financeiro" / Atalho do Dashboard | Firestore (`financeiro`) | **Funcional** | Fluxo de caixa, entradas/saídas e upload de comprovantes. |
| `/eventos` | `Eventos.tsx` | Autenticada | `ProtectedRoute` | `Role.TESTADOR` | Sidebar: "Eventos" / Atalho do Dashboard | Firestore (`eventos`, `itens_necessidade`) | **Funcional** | Criação de festas, metas financeiras e voluntariado de doações. |
| `/relatorios` | `Relatorios.tsx` | Autenticada | `ProtectedRoute` | `Role.ADMIN_CASA` | Sidebar: "Relatórios" / Atalho do Dashboard | Firestore (`membros`, `financeiro`, `eventos`) | **Funcional** | Consolidado gerencial com exportações para PDF e Excel. |
| `/admin` | `Admin.tsx` | Autenticada | `ProtectedRoute` | `Role.MASTER` | Sidebar: "Super Admin" (Visível apenas para Master) | Firestore (`casas_axe`, `users`) | **Funcional** | Controle de faturamento, representação de terreiro e credenciamento. |

---

## 🧭 Estrutura Visual de Navegação

A interface possui uma estrutura de navegação adaptável por meio dos seguintes componentes:

### 1. Sidebar (Menu Lateral)
- **Logotipo:** Exibe o logo oficial da plataforma "Asè Connect".
- **Links de Navegação Principal:** Início (Dashboard), Membros, Financeiro, Eventos, Relatórios.
- **Botão Administrativo:** "Super Admin" (Exibido condicionalmente apenas se `isMaster === true`).
- **Rodapé da Sidebar:** Informações do usuário logado (Nome, e-mail) e botão de "Sair" (Logout).

### 2. Header (Painel Superior)
- **Alternador de Tema (Dark Mode Toggle):** Botão para alternar entre tema claro e escuro.
- **Indicador do Terreiro:** Nome do terreiro atualmente ativo ou selecionado.
- **Banner Amarelo "Modo Master":** Exibido no topo de todas as páginas quando o Super Admin assume o controle/representação de uma casa específica. Contém um botão de ação rápida: **"Retornar ao Admin"** (para encerrar a representação).

### 3. Navegação Mobile
- O menu lateral é convertido em uma barra lateral retrátil (gaveta) acionada por um botão flutuante ("hambúrguer") no topo esquerdo para otimizar o espaço em telas menores.

---

## 🔒 Fluxo de Autenticação e Redirecionamentos

```text
                  ┌───────────────────────────────┐
                  │   Visitante acessa a URL      │
                  └───────────────┬───────────────┘
                                  │
                    🟢 Está autenticado?
                     /             \
                   SIM              NÃO
                   /                 \
     ┌────────────▼────────────┐   ┌──▼──────────────────────────┐
     │ Casa está suspensa?     │   │ Rota é protegida?           │
     │     /             \     │   │     /             \         │
     │   SIM             NÃO   │   │   SIM             NÃO       │
     │   /                 \   │   │   /                 \       │
┌────▼─────────────┐ ┌─────▼───┐ │ ┌─▼───────────────┐ ┌─────▼───┐
│ Redireciona para │ │ Acessa  │ │ │Redireciona para │ │ Acessa  │
│ `/suspenso`      │ │ `/`     │ │ │`/login`         │ │ Rota    │
└──────────────────┘ └─────────┘ │ └─────────────────┘ └─────────┘
                                 └───────────────────────────────┘
```

---

## ⚠️ Análise de Riscos e Segurança de Rotas

1. **Rotas sem Proteção Física (Client-side Bypass):** O roteamento é controlado via React Router (`HashRouter`). Um usuário com conhecimentos técnicos pode inspecionar as rotas e injetar componentes na tela localmente. Contudo, **os dados são protegidos a nível de banco pelas Firestore Rules**, impedindo o carregamento de qualquer informação caso o UID do usuário não possua autorização.
2. **Rota `/admin/debug-tenant`:** Rota exposta sem verificação rigorosa de `nivelMinimo` no arquivo `App.tsx` (não possui a tag `<ProtectedRoute>`). Embora as regras do banco do Firestore impeçam a escrita indevida, a página é acessível visualmente por qualquer usuário logado. **(Risco Alto - Recomenda-se envolver a rota em uma Proteção de Acesso)**.
3. **Deep Links:** Como o sistema utiliza HashRouter (`#/`), o suporte a deep links é total e funciona sem necessidade de redirecionamento no servidor web (Hostinger/Cloud Run), o que evita erros 404 ao atualizar a página.
