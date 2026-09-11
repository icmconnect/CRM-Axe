# Armazenamento e Integrações (Storage and Integrations)

Este documento mapeia todos os sistemas de armazenamento locais, em nuvem e as integrações com APIs de terceiros utilizadas na plataforma **Ase Connect**.

---

## 💾 Sistemas de Armazenamento Internos e Locais

O sistema combina persistência de dados local de alta velocidade com sincronização resiliente em nuvem.

### 1. LocalStorage do Navegador
- **Finalidade:** Armazenar preferências de design e estado de tema visual da interface.
- **Tipo:** Ativo (Cliente)
- **Dados Salvos:** Chave `theme` (`'light' | 'dark'`).
- **Riscos:** Baixíssimo. Não armazena dados de segurança, tokens, senhas ou informações pessoais.

### 2. IndexedDB (Persistência Offline do Firestore)
- **Finalidade:** Ativar cache local de documentos do Firestore utilizando o SDK cliente. Permite que o ERP funcione offline e evite re-downloads custosos de dados recorrentes.
- **Tipo:** Ativo (Cliente)
- **Configuração de Origem:** `src/firebase.ts` (Função `enableIndexedDbPersistence`).
- **Dados Salvos:** Coleções locais sincronizadas de membros, financeiro e eventos da respectiva Casa de Axé.
- **Riscos:** Baixo. Dados pessoais ficam armazenados no banco de dados local do navegador do usuário. Se o dispositivo for compartilhado e não houver senha no sistema operacional, os dados podem estar acessíveis fisicamente.

---

## ☁️ Serviços e Integrações na Nuvem (Cloud Services)

### 1. Firebase Authentication
- **Finalidade:** Fornecer fluxo seguro de login, registro, recuperação de conta e logout de sacerdotes e operadores.
- **Tipo:** Ativo
- **Arquivos Relacionados:** `src/firebase.ts`, `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx`.
- **Credenciais Necessárias:** Chaves públicas configuradas no arquivo `/firebase-applet-config.json`.
- **Riscos:** Baixo (Segurança gerenciada pela infraestrutura do Google).

### 2. Cloud Firestore
- **Finalidade:** Banco de dados relacional NoSQL para persistência rígida e sincronização em tempo real (reatividade) dos dados operacionais dos terreiros.
- **Tipo:** Ativo
- **Arquivos Relacionados:** `src/firebase.ts`, `src/contexts/DataContext.tsx`, `firestore.rules`.
- **Mecanismo de Segurança:** `firestore.rules` (Garante que um terreiro jamais leia ou escreva dados de outro).

### 3. Firebase Storage
- **Finalidade:** Hospedagem física de imagens e arquivos PDF de comprovantes fiscais e recibos de lançamentos de despesas.
- **Tipo:** Ativo
- **Arquivos Relacionados:** `src/firebase.ts`, `src/pages/Financeiro.tsx`.
- **Segurança:** O acesso direto e upload são limitados a usuários autenticados da plataforma.

---

## 🔌 APIs e Bibliotecas de Terceiros

### 1. XLSX / SheetJS (Processamento de Planilhas)
- **Finalidade:** Biblioteca utilizada localmente no cliente para ler e analisar planilhas Excel/CSV enviadas por usuários, e para gerar e baixar arquivos de relatórios consolidados e modelos de dados.
- **Tipo:** Ativo (Biblioteca Local)
- **Arquivos Relacionados:** `src/pages/Membros.tsx`, `src/pages/Relatorios.tsx`.
- **Dados Enviados/Recebidos:** Conteúdo binário de planilhas locais. Não há chamadas HTTP externas.

### 2. jsPDF & jsPDF-AutoTable (Geração de PDFs)
- **Finalidade:** Compilação e exportação offline de dados gerenciais em arquivos PDF altamente estruturados com tabelas e balanços.
- **Tipo:** Ativo (Biblioteca Local)
- **Arquivos Relacionados:** `src/pages/Relatorios.tsx`.
- **Dados Enviados/Recebidos:** Estritamente processados no navegador cliente. Nenhum dado é enviado para servidores externos para gerar o arquivo.

---

## 🛠️ Checklist de Configuração Manual do Firebase (Para Produção)

Para implantar ou migrar a plataforma para um novo projeto de produção do Firebase, siga as etapas abaixo:

1. **Criar Projeto:** No console do Firebase, crie um novo projeto.
2. **Configurar Auth:** Ative o método de login **E-mail/Senha** e **Google** na aba "Authentication".
3. **Provisionar Firestore:** Inicie a instância do Cloud Firestore e configure a região correta.
4. **Provisionar Storage:** Inicie a instância do Cloud Storage e selecione os limites geográficos adequados.
5. **Configurar Regras:** Copie o conteúdo de `firestore.rules` e cole no painel de Regras do Firestore no console.
6. **Gerar Credenciais:** Crie um aplicativo web no console, obtenha as chaves públicas e salve-as no arquivo `/firebase-applet-config.json` no seguinte formato:
   ```json
   {
     "apiKey": "SUA_API_KEY",
     "authDomain": "SEU_PROJETO.firebaseapp.com",
     "projectId": "SEU_PROJETO",
     "storageBucket": "SEU_PROJETO.appspot.com",
     "messagingSenderId": "SEU_SENDER_ID",
     "appId": "SUA_APP_ID"
   }
   ```
7. **Deploy de Produção:** Compile o aplicativo com `npm run build` e faça o deploy no servidor ou Cloud Run.
