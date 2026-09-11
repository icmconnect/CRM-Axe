# Portal dos Sacerdotes - Gestão Profissional para Casas de Axé (Ase Connect)

Este diretório contém a documentação técnica, funcional, estrutural e de segurança completa do aplicativo **Portal dos Sacerdotes (Ase Connect)**.

> [!WARNING]
> **AVISO OBRIGATÓRIO:** Este documento foi gerado como inventário técnico e funcional. Ele não confirma que todas as funcionalidades estão prontas para produção, seguras ou validadas em ambiente real.

---

## 📌 Identificação do Projeto

- **Nome Oficial:** Portal dos Sacerdotes - Gestão Profissional para Casas de Axe
- **Nome de Trabalho / Comercial:** Ase Connect
- **Versão Atual:** 1.0.0
- **Data do Inventário:** 3 de Setembro de 2026
- **Objetivo Principal:** ERP para gestão financeira, membros, eventos e auditoria de Casas de Umbanda e Candomblé (Terreiros de Axé).
- **Público-Alvo Principal:** Dirigentes (Sacerdotes), Zeladores, Pais/Mães de Santo, Administradores Financeiros e Membros de Casas de Axé.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, HashRouter (`react-router-dom`), Recharts (Gráficos), Framer Motion / Motion.
- **Backend:** Node.js, Express 4, tsx, esbuild (bundle do servidor).
- **Banco de Dados & Autenticação:** Firebase Suite (Firebase Auth, Cloud Firestore com offline persistence/IndexedDB, Firebase Storage).
- **Idiomas & Utilitários:** TypeScript 5.8, Date-fns (datas), jsPDF & jsPDF-AutoTable (PDFs), XLSX/SheetJS (importação/exportação).

---

## 🗂️ Estrutura Geral de Pastas

```text
├── .env.example                # Exemplo de variáveis de ambiente do projeto
├── .gitignore                  # Arquivos ignorados pelo controle de versão
├── api/                        # Diretórios de API (opcional)
├── app/                        # Estrutura legada ou mobile (se aplicável)
├── docs/                       # Pasta de Documentação e Auditorias (Esta Pasta)
│   ├── README.md               # Este arquivo (Índice Principal)
│   ├── system-overview.md      # Visão geral da arquitetura e fluxos
│   ├── feature-inventory.md    # Inventário completo de funcionalidades
│   ├── routes-and-navigation.md # Mapa de rotas públicas e privadas
│   ├── data-model.md           # Modelo de dados, types, interfaces e coleções
│   ├── components-map.md       # Mapa de componentes, páginas e hooks
│   ├── auth-and-roles.md       # Regras de Autenticação, Controle de Acesso (RBAC) e Permissões
│   ├── storage-and-integrations.md # Integrações de terceiros e armazenamento
│   ├── security-baseline.md    # Linha de base de segurança
│   ├── accessibility-baseline.md # Acessibilidade e responsividade
│   ├── content-and-media.md    # Conteúdo editorial e mídias externas
│   ├── known-limitations.md    # Limitações conhecidas e pendências técnicas
│   ├── change-log.md           # Histórico de alterações técnicas do sistema
│   └── security-audit-readonly.md # Relatório de Auditoria de Segurança
├── firebase-applet-config.json # Configurações da aplicação cliente com o Firebase
├── firebase-blueprint.json     # Blueprint do banco de dados Firestore
├── firebase.json               # Configurações do Firebase CLI
├── firestore.rules             # Regras de Segurança do Cloud Firestore
├── index.html                  # Ponto de entrada do SPA
├── package.json                # Gerenciador de dependências e scripts do Node.js
├── server.ts                   # Ponto de entrada do servidor full-stack (Express + Vite)
├── src/                        # Código fonte da aplicação
│   ├── App.tsx                 # Componente raiz da aplicação React (Roteamento e SW)
│   ├── main.tsx                # Ponto de inicialização do React
│   ├── index.css               # Folha de estilo global com Tailwind CSS 4
│   ├── firebase.ts             # Configuração e inicialização do cliente Firebase
│   ├── components/             # Componentes React compartilhados (Modais, Layout, etc)
│   ├── contexts/               # Contextos de Estado Global (Autenticação, Dados, Tema)
│   ├── hooks/                  # Custom Hooks do React (keep-awake, etc)
│   ├── pages/                  # Componentes de Página (Admin, Dashboard, Membros, etc)
│   ├── types/                  # Tipagem TypeScript
│   └── utils/                  # Funções utilitárias e scripts auxiliares
└── vite.config.ts              # Configuração do Vite Bundler
```

---

## 🏃 Como Rodar o Projeto

### Pré-requisitos
- Node.js (Versão 22.x sugerida)
- NPM ou Bun

### Passos para Desenvolvimento
1. **Instalar Dependências:**
   ```bash
   npm install
   ```
2. **Executar em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   *Nota: O servidor Express iniciará na porta `3000` (porta obrigatória para este ambiente) servindo o middleware do Vite.*

3. **Gerar Build de Produção:**
   ```bash
   npm run build
   ```
   *Isto gera os arquivos estáticos do frontend em `/dist` e compila o `server.ts` em `/dist/server.js`.*

4. **Executar em Produção:**
   ```bash
   npm run start
   ```

5. **Typecheck & Linter:**
   ```bash
   npm run lint
   ```

---

## 📚 Links para os Documentos de /docs

Para navegar na documentação detalhada, clique nos links abaixo:

1. [Visão Geral do Sistema (system-overview.md)](system-overview.md) - Fluxo de dados e arquitetura.
2. [Inventário de Funcionalidades (feature-inventory.md)](feature-inventory.md) - Detalhamento das features, estado e prioridade.
3. [Rotas e Navegação (routes-and-navigation.md)](routes-and-navigation.md) - Mapa de navegação, roteamento e proteção de páginas.
4. [Modelo de Dados (data-model.md)](data-model.md) - Estruturas de dados, types, coleções do Firestore.
5. [Mapa de Componentes (components-map.md)](components-map.md) - Detalhamento de páginas, modais, componentes e hooks.
6. [Autenticação e Papéis (auth-and-roles.md)](auth-and-roles.md) - Regras de controle de acesso (RBAC) e autenticação.
7. [Storage e Integrações (storage-and-integrations.md)](storage-and-integrations.md) - Persistência offline, Firebase Storage e outras integrações.
8. [Baseline de Segurança (security-baseline.md)](security-baseline.md) - Padrões de segurança encontrados.
9. [Baseline de Acessibilidade (accessibility-baseline.md)](accessibility-baseline.md) - Análise de acessibilidade e WCAG.
10. [Conteúdo e Mídia (content-and-media.md)](content-and-media.md) - Uso de mídia, templates e recursos.
11. [Limitações e Pendências (known-limitations.md)](known-limitations.md) - Débitos técnicos, mockups e pendências antes do lançamento.
12. [Histórico de Alterações (change-log.md)](change-log.md) - Registro de alterações técnicas preservadas do sistema.
13. [Auditoria de Segurança (security-audit-readonly.md)](security-audit-readonly.md) - Relatório completo de vulnerabilidades e melhorias recomendadas.
