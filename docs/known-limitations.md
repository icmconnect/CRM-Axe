# Limitações Conhecidas e Pendências (Known Limitations)

Este documento elenca as limitações técnicas, pendências, débitos técnicos, integrações não automatizadas e riscos identificados na plataforma **Ase Connect**.

---

## 🛠️ Lista de Limitações, Débitos e Pendências Técnicas

### L-01: Faturamento e Cobrança Manual de Planos
- **Descrição:** O sistema possui um seletor de planos (Upgrade/Downgrade) e um seletor de status de pagamento (Pago/Pendente) na tela de Super Admin (`Admin.tsx`), mas **não está integrado a nenhum gateway de pagamento automatizado** (como Stripe, Mercado Pago ou Asaas). A cobrança e a conciliação financeira do SaaS são feitas de forma inteiramente manual pelo e-mail master.
- **Impacto:** Alto (Exige esforço administrativo constante do Super Admin).
- **Urgência:** Média.
- **Esforço Estimado:** Alto (Integração de Webhooks, chamadas de API e criação de checkout).
- **Responsável Sugerido:** Engenheiro Full-Stack.
- **Bloqueia Lançamento:** Não. O SaaS pode iniciar operando com faturamento manual (Pix/Link manual).
- **Recomendação:** Implementar integração com Stripe ou Mercado Pago no backend para automatizar a mudança de status de pagamento e liberação/bloqueio automático de contas através de Webhooks.

---

### L-02: Rota de Depuração `/admin/debug-tenant` Aberta Visivelmente
- **Descrição:** A rota de debug do tenant não possui validação de papel mínimo e pode ser acessada por qualquer usuário autenticado que digite o caminho direto na URL.
- **Impacto:** Médio (Exposição de telas internas de desenvolvimento).
- **Urgência:** Alta.
- **Esforço Estimado:** Baixíssimo (Menos de 5 minutos).
- **Responsável Sugerido:** Desenvolvedor Frontend.
- **Bloqueia Lançamento:** **A validar** (Depende do critério de segurança do cliente).
- **Recomendação:** Envolver a rota `<Route path="/admin/debug-tenant" element={<AdminDebug />} />` com a tag `<ProtectedRoute nivelMinimo={Role.MASTER}>` em `App.tsx`.

---

### L-03: Ausência de Validação de Extensão de Arquivo (MIME Type) no Storage
- **Descrição:** O upload de comprovantes no módulo financeiro é enviado para o Firebase Storage sem que haja validação rigorosa sobre o formato do arquivo recebido (MIME type).
- **Impacto:** Médio (Risco de injeção de arquivos maliciosos).
- **Urgência:** Média.
- **Esforço Estimado:** Baixo (Configuração rápida nas regras do Storage).
- **Responsável Sugerido:** Administrador do Firebase / Dev.
- **Bloqueia Lançamento:** Não.
- **Recomendação:** Configurar as regras de segurança do Firebase Storage para aceitar apenas formatos de imagem e PDF (`image/*` e `application/pdf`) e restringir o tamanho máximo do arquivo para 5MB.

---

### L-04: Ausência de Rate Limiting no Servidor Express
- **Descrição:** Não há limitador de taxa de requisições por IP nas rotas servidas pelo Express.ts (`server.ts`).
- **Impacto:** Médio (Vulnerabilidade a ataques de negação de serviço e força bruta).
- **Urgência:** Média.
- **Esforço Estimado:** Baixo.
- **Responsável Sugerido:** Desenvolvedor Backend / DevOps.
- **Bloqueia Lançamento:** Não.
- **Recomendação:** Integrar a biblioteca `express-rate-limit` no middleware global do Express.

---

### L-05: Falta de Relatórios de Auditoria Visíveis para Sacerdotes
- **Descrição:** Os logs de auditoria de alterações críticas de registros (coleção `audit_logs`) são gravados com sucesso no banco de dados, mas não existe nenhuma interface visual para que os Sacerdotes (Zeladores) consigam auditá-los diretamente pela aplicação.
- **Impacto:** Baixo (Limita a transparência interna).
- **Urgência:** Baixa.
- **Esforço Estimado:** Médio (Criação de nova tela ou aba de auditoria).
- **Responsável Sugerido:** Desenvolvedor Frontend.
- **Bloqueia Lançamento:** Não.
- **Recomendação:** Criar uma aba "Logs de Auditoria" dentro do menu Relatórios ou Configurações, visível apenas para `Role.ADMIN_CASA`.

---

## 📋 Resumo das Pendências Operacionais

| ID | Descrição | Urgência | Esforço | Responsável | Bloqueia Lançamento? |
|---|---|:---:|:---:|---|:---:|
| **L-01** | Integração de Gateway de Cobrança Automatizado | Média | Alto | Full-Stack Dev | Não |
| **L-02** | Proteção da rota `/admin/debug-tenant` | Alta | Baixo | Frontend Dev | **A validar** |
| **L-03** | Regras de validação MIME no Storage | Média | Baixo | Firebase Admin | Não |
| **L-04** | Middleware de Rate Limiting no Express | Média | Baixo | DevOps / Dev | Não |
| **L-05** | Painel visual para logs de auditoria | Baixa | Médio | Frontend Dev | No |
