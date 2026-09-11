# Auditoria de Segurança Somente Leitura (Security Audit - Read-Only)

Este documento apresenta o relatório da Auditoria de Segurança Somente Leitura executada na plataforma **Ase Connect (Portal dos Sacerdotes)**. Nenhuma vulnerabilidade foi corrigida e nenhuma linha de código funcional foi alterada durante este processo.

---

## 📊 Tabela Geral de Achados de Auditoria

| ID | Área | Achado de Segurança | Evidência (Arquivo/Local) | Severidade | Impacto Possível | Recomendação | Necessita Backend? | Necessita Config Ext? | Bloqueia Lançamento? | Responsável Sugerido |
|---|---|---|---|:---:|---|---|:---:|:---:|:---:|---|
| **A-01** | Roteamento | Rota `/admin/debug-tenant` totalmente aberta a usuários logados. | `src/App.tsx` (Linha 183) | ⚠️ **Alto** | Exposição de painel de desenvolvimento com dados estruturais. | Envolver a rota com `<ProtectedRoute nivelMinimo={Role.MASTER}>`. | Não | Não | **A validar** | Desenvolvedor Frontend |
| **A-02** | Privilégios | Validação de Super Admin baseada em e-mail hardcoded na regra. | `firestore.rules` (Linhas 16-17) | ℹ️ **Informativo** | Se o e-mail cadastrado for alterado, o usuário perde o acesso Master. | O uso do e-mail é robusto para proteção primária, mas recomenda-se migrar para Custom Claims futuramente. | Não | Não | Não | Arquiteto / Dev |
| **A-03** | Privacidade | Persistência IndexedDB armazena dados de membros localmente. | `src/firebase.ts` (Linhas 20-29) | ℹ️ **Médio** | Acesso físico a dados de RG e CPF em computadores públicos. | Adicionar aviso visível recomendando que usuários façam Logout ao saírem. | Não | Não | Não | UX / LGPD |
| **A-04** | Arquivos | Upload de Comprovante sem validação de tipo de arquivo. | `src/pages/Financeiro.tsx` | ⚠️ **Médio** | Envio de scripts maliciosos ou arquivos excessivamente pesados. | Configurar regras no Firebase Storage para filtrar apenas imagens e PDFs < 5MB. | Não | Não | Não | Firebase Admin |
| **A-05** | Rate Limit | Ausência de limitador de requisições por IP no Express. | `server.ts` | ℹ️ **Médio** | Vulnerabilidade a ataques de negação de serviço (DoS). | Instalar e configurar o middleware `express-rate-limit`. | Sim | Base de Código | Não | DevOps / Dev |
| **A-06** | Cobranças | Gerenciamento manual de planos sem confirmação automática. | `src/pages/Admin.tsx` | ℹ️ **Médio** | Possibilidade de erro operacional humano ou atrasos de faturamento. | Integrar gateway de pagamento (Stripe / Mercado Pago) via webhooks. | Sim | Sim (Gateway API) | Não | Full-Stack Dev |
| **A-07** | LGPD | Ausência de Política de Privacidade e Termos de Uso visíveis. | `src/pages/CadastroCasa.tsx` | ⚠️ **Médio** | Desconformidade legal com a Lei Geral de Proteção de Dados. | Adicionar checkbox obrigatório com link para os Termos na tela de Cadastro. | Não | Não | **A validar** | Jurídico / DPO |
| **A-08** | Erros | Logs detalhados de exceção expostos no console do cliente. | Vários arquivos | ℹ️ **Baixo** | Invasor pode mapear a estrutura interna de dados através de falhas. | Desativar `console.error` em ambiente de produção utilizando variáveis. | Não | Não | Não | Frontend Dev |
| **A-09** | HTML | Links externos sem o atributo `rel="noopener noreferrer"`. | Vários componentes | ℹ️ **Baixo** | Vulnerabilidade de sequestro de aba do navegador (Tabnabbing). | Inserir `rel="noopener noreferrer"` em todas as tags `<a>` com `target="_blank"`. | Não | Não | Não | Frontend Dev |
| **A-10** | Acessibilidade | Botões de ação rápida sem etiquetas de acessibilidade. | `Membros.tsx`, `Financeiro.tsx` | ℹ️ **Baixo** | Usuários dependentes de leitores de tela não compreendem botões. | Adicionar o atributo `aria-label` descritivo aos botões com ícones. | Não | Não | No | Frontend Dev |

---

## 🔎 Verificações Detalhadas de Baseline

### 1. Vazamento de Segredos (Secrets)
- **Status:** **Seguro**.
- **Análise:** Não foram encontrados tokens, segredos de webhook, senhas de banco ou chaves privadas expostos nos repositórios públicos. O arquivo `/firebase-applet-config.json` contém apenas chaves de cliente público (API Key, Project ID, App ID) que são de exposição segura e necessária pelo Firebase Client SDK.

### 2. Armazenamento Local (Storage)
- **Status:** **Parcialmente Seguro**.
- **Análise:** O `localStorage` é utilizado apenas para persistência do Tema (Claro/Escuro). O `IndexedDB` é utilizado legitimamente para persistência offline do Firestore. Contudo, dados de membros (Nome, Telefone, RG, CPF) ficam cacheados no dispositivo. Não há risco de alteração de privilégios via Storage local, pois as permissões de acesso dependem da validação das regras no servidor do Firebase.

### 3. Autenticação (Auth)
- **Status:** **Seguro**.
- **Análise:** A autenticação é delegada inteiramente ao Firebase Auth, com controle rígido de expiração e monitoramento reativo. Não há fluxos de autenticação mockada para fins de desenvolvimento.

### 4. Autorização e Papéis (Access Control)
- **Status:** **Seguro**.
- **Análise:** O papel de Super Admin (Master) é associado de maneira rígida ao e-mail cadastrado ou à propriedade de cargo contida no documento do usuário no banco de dados. Uma rotina reativa em `App.tsx` desloga imediatamente qualquer usuário marcado como `bloqueado` no Firestore.

### 5. Dados de Outros Usuários (Tenant Isolation)
- **Status:** **Seguro**.
- **Análise:** As regras de segurança em `firestore.rules` impedem de forma absoluta que dados de membros ou financeiros de uma Casa de Axé sejam lidos ou alterados por operadores de outra casa. A validação do isolamento ocorre no servidor do Firebase.

### 6. Banco de Dados (Firestore Rules)
- **Status:** **Seguro**.
- **Análise:** Regras escritas de forma minuciosa, limitando inclusive a criação e deleção nas coleções sensíveis (como `audit_logs`, `security_logs` e faturamentos).

### 7. Pagamentos (Subscriptions)
- **Status:** **Manual**.
- **Análise:** Não foram encontradas vulnerabilidades que permitam liberação fraudulenta de conta através do frontend, visto que o status da conta depende de alteração manual feita no documento de cadastro do terreiro, acessível apenas para usuários autenticados como `MASTER`. Não são coletados ou mantidos dados financeiros/cartões de crédito na base.

### 8. Sanitização de Entradas (Inputs) e XSS
- **Status:** **Seguro**.
- **Análise:** O React realiza escape nativo automático de strings para evitar injeções de HTML/XSS. Não foram identificados usos perigosos do método `dangerouslySetInnerHTML`.

---

## 🏆 Top 5 Riscos de Alta Prioridade

1. **Acesso Livre à Rota de Depuração (`A-01`):** A rota `/admin/debug-tenant` está visivelmente exposta a qualquer usuário logado.
2. **Exposição de Dados de Identificação Pessoal (LGPD) em Computadores Compartilhados (`A-03`):** Caching de dados sensíveis locais de fiéis via IndexedDB sem aviso prévio.
3. **Upload irrestrito de Arquivos no Financeiro (`A-04`):** Falta de validação MIME nas regras do Storage facilitando injeções.
4. **Ausência de Termos de Consentimento de Uso de Dados no Cadastro (`A-07`):** Falta de checkbox exigido pela LGPD para processamento de RG/CPF de membros.
5. **Ataques de Força Bruta por falta de Rate Limit (`A-05`):** Servidor Express sem limitador de tráfego de requisições maliciosas.

---

## 📋 Top 10 Ações Recomendadas Antes de Ir Para Produção

1. **[Segurança]** Proteger a rota `/admin/debug-tenant` com `<ProtectedRoute>` em `App.tsx`. *(Responsável: Desenvolvedor)*
2. **[LGPD]** Inserir checkbox de aceitação de Termos de Uso e Política de Privacidade no formulário de Cadastro. *(Responsável: Desenvolvedor / Jurídico)*
3. **[Segurança]** Configurar as regras de segurança do Cloud Storage para restringir o upload para apenas extensões de imagem/PDF. *(Responsável: Administrador do Firebase)*
4. **[Segurança]** Instalar e aplicar o pacote `express-rate-limit` no servidor Express. *(Responsável: DevOps / Desenvolvedor)*
5. **[Segurança]** Instalar e configurar o middleware `helmet` no Express para forçar cabeçalhos CSP/HSTS. *(Responsável: DevOps / Desenvolvedor)*
6. **[LGPD]** Inserir aviso legível na tela de login recomendando fazer Logout em dispositivos públicos. *(Responsável: UX Designer / Dev)*
7. **[Acessibilidade]** Adicionar o atributo `aria-label` descritivo aos botões que possuem apenas ícones gráficos. *(Responsável: Desenvolvedor)*
8. **[UX/Qualidade]** Implementar confirmação visual adicional antes de efetivar exclusão de membros ou exclusão de lançamentos financeiros. *(Responsável: Desenvolvedor)*
9. **[Logs]** Mascarar ou desativar saídas do `console.error` em compilações de produção. *(Responsável: Desenvolvedor)*
10. **[Segurança]** Atualizar o atributo `target="_blank"` em todos os links externos adicionando `rel="noopener noreferrer"`. *(Responsável: Desenvolvedor)*

---

## ⏳ Itens Que Podem Esperar (Fases Futuras)

- **Integração de Faturamento Automático:** Automatização completa de cobrança via Stripe ou Mercado Pago (pode operar manualmente de início).
- **Interface Visual de Logs de Auditoria:** Tela para dirigentes acompanharem os logs do terreiro diretamente no painel.

---

## 🚀 Checklist de Lançamento em Produção

- [ ] Autenticação Firebase Auth ativada e validada.
- [ ] Regras do Firestore (`firestore.rules`) aplicadas e testadas.
- [ ] Regras do Storage limitando extensões e tamanho do arquivo aplicadas.
- [ ] HTTPS ativado em toda a infraestrutura e rotas.
- [ ] Rota `/admin/debug-tenant` protegida no roteador.
- [ ] Checkbox de Termos de Privacidade inserido e obrigatório.
- [ ] Cabeçalhos de segurança (CSP, HSTS) injetados pelo servidor.
- [ ] Backup automático do Firestore ativado no console do Google Cloud.

---

## 🛑 Limitações desta Auditoria

Esta auditoria de segurança foi conduzida estritamente de forma **estática e analítica (somente leitura)**. Não foram efetuados testes de invasão ativos (Penetration Tests), varreduras de rede automatizadas ou injeções de SQL reais. Algumas validações dependem de configurações que ocorrem apenas no Console Administrativo do Firebase ou na infraestrutura final de hospedagem (DNS, SSL, Provedor), as quais permanecem classificadas com o status **"A validar"** devido à falta de acesso direto às credenciais de produção dessas plataformas de infraestrutura externas.
