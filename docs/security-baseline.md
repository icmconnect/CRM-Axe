# Baseline de Segurança (Security Baseline)

Este documento analisa as premissas, controles e o alinhamento de segurança técnica encontrados na estrutura de código e arquitetura da plataforma **Ase Connect**.

---

## 🔒 Avaliação e Controle de Riscos Encontrados

Abaixo estão elencados os achados de segurança classificados por gravidade:

### 1. Rota `/admin/debug-tenant` sem Proteção de Acesso
- **Severidade:** ⚠️ **Alto**
- **Descrição:** O arquivo `/src/App.tsx` registra a rota `/admin/debug-tenant` de forma direta sem estar envolta pelo componente `<ProtectedRoute>`. Embora as regras de segurança do Firestore protejam contra escrita indevida de dados caso o usuário tente interagir, a página visual de depuração de tenant é acessível para qualquer usuário logado.
- **Mitigação Recomendada:** Envolver a rota em um `ProtectedRoute` exigindo papel `Role.MASTER` ou `Role.ADMIN_CASA` para evitar vazamentos de estrutura de design ou caminhos de dados.

### 2. Isolação Multi-tenant em Regras do Firestore
- **Severidade:** ✅ **Baixo** (Controle Ativo e Seguro)
- **Descrição:** As regras descritas em `firestore.rules` são robustas e validam adequadamente a isolação de locatários (terreiros) consultando a relação `userCasaId() == resource.data.id_casa`. Isso impede que o administrador de uma Casa de Axé acabe listando membros ou relatórios financeiros de outra Casa de Axé por meio de requisições maliciosas.
- **Mitigação Recomendada:** Manter auditorias periódicas nas regras a cada nova coleção introduzida no banco.

### 3. Falta de CSP (Content Security Policy) e Headers de Produção
- **Severidade:** ℹ️ **Médio**
- **Descrição:** Não foi localizado no servidor Express.ts (`server.ts`) ou nos cabeçalhos HTML do front-end a definição de políticas CSP rígidas, HSTS, X-Content-Type-Options ou Referrer-Policy.
- **Mitigação Recomendada:** Configurar o middleware `helmet` no Express.ts em produção para forçar cabeçalhos de segurança essenciais no navegador cliente.

### 4. Armazenamento de Dados de Identificação Pessoal (LGPD) no Cliente
- **Severidade:** ℹ️ **Médio**
- **Descrição:** A ativação do cache offline IndexedDB salva dados pessoais de membros (nome, e-mail, telefone, cargo, RG, CPF) diretamente na memória local do navegador.
- **Mitigação Recomendada:** Exibir aviso explicativo na tela de login informando sobre o armazenamento local e recomendando não utilizar dispositivos públicos compartilhados sem deslogar antes.

### 5. Upload de Comprovantes no Storage sem Validação Rigorosa de MIME Type
- **Severidade:** ⚠️ **Médio**
- **Descrição:** O upload de comprovantes no financeiro aceita arquivos enviados pelo cliente sem validação rígida do tipo de arquivo real (MIME type ou extensão real) no lado do banco/regras de storage do Firebase. Um invasor poderia, em tese, realizar upload de scripts maliciosos ou executáveis falsos.
- **Mitigação Recomendada:** Configurar regras de segurança no Firebase Storage que filtrem extensões permitidas e verifiquem o tamanho máximo do payload (ex: menor que 5MB e apenas do tipo `image/*` ou `application/pdf`).

### 6. Rate Limiting Inexistente no Servidor Express
- **Severidade:** ℹ️ **Médio**
- **Descrição:** O servidor `server.ts` não possui limitador de requisições ativas por IP (rate limiting).
- **Mitigação Recomendada:** Integrar a biblioteca `express-rate-limit` nas rotas do servidor para evitar ataques de força bruta ou Denial of Service (DoS).

---

## 🏷️ Matriz Resumo de Achados de Segurança

| ID | Achado de Segurança | Área Afetada | Severidade | Necessita Backend? | Bloqueia Lançamento? |
|---|---|---|---|---|---|
| **S-01** | Rota `/admin/debug-tenant` sem proteção física | Roteamento React | ⚠️ **Alto** | Não | **A validar** |
| **S-02** | Ausência de Headers de Segurança (CSP/HSTS) | Servidor Express | ℹ️ **Médio** | Sim | Não |
| **S-03** | Dados pessoais cacheados no IndexedDB | LGPD / Navegador | ℹ️ **Médio** | Não | Não |
| **S-04** | Regras de validação de MIME Type de arquivos | Firebase Storage | ⚠️ **Médio** | Não (Regras) | Não |
| **S-05** | Ausência de Rate Limiting no servidor web | Express API | ℹ️ **Médio** | Sim | Não |
| **S-06** | Isolação de Multi-tenant (Regras Firestore) | Cloud Firestore | ✅ **Baixo** | Não | Não |
