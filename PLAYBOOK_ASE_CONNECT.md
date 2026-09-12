# PLAYBOOK ASE CONNECT

## Visão Geral do Sistema
O Portal dos Sacerdotes (SaaS) é um sistema completo (ERP) voltado para a gestão de Casas de Axé, com as seguintes funcionalidades principais:
- **Dashboard**: Painel central com métricas, gráficos e visão geral da saúde do terreiro/casa.
- **Membros**: Cadastro completo de filhos de santo, gestão de mensalidades, histórico no axé e anotações.
- **Financeiro**: Gestão de fluxo de caixa (entradas/saídas), pagamentos de membros, doações e relatórios de saldo.
- **Eventos**: Calendário de obrigações, festas e giras, com controle de presença e tarefas.
- **Relatórios**: Emissão de balanços financeiros, frequência de membros e histórico de evolução espiritual, com exportação para PDF/Excel.
- **Admin**: Gerenciamento das permissões (Mãe/Pai de Santo, Tesoureiro, etc), configurações da casa e dados do plano SaaS ativo.

## Identidade Visual (Premium)
A interface foi projetada para transmitir autoridade, elegância e espiritualidade, com a seguinte paleta de cores e regras:
- **Cores Utilizadas**:
  - **Dourado**: `#C59B4B` (Destaques, botões primários, ícones ativos)
  - **Verde Oliva**: (Elementos secundários e de sucesso)
  - **Cinza Carvão**: `#1A1A1A` (Textos principais e fundos escuros para contrastes premium)
  - **Cinza Gelo**: `bg-slate-50` (Fundo principal para leitura confortável)
- **Regras de UI**:
  - Sem uso de ícones de "IA" (ex: robôs ou brilhos artificiais).
  - Cards e painéis devem ter **bordas sutis** e cantos arredondados, sem sombras pesadas, priorizando a limpeza.
  - Tipografia deve ser elegante e perfeitamente legível (contrastes adequados).

## Arquivos de Logo
Os seguintes logos padronizados estão disponíveis (e devem ser mantidos/substituídos mantendo o mesmo padrão):
- **`logo-dash`**: Usado no cabeçalho do Dashboard principal e sistema interno.
- **`logo-lp`**: Utilizado na Landing Page principal para visitantes não logados.
- **`logo-nova`**: Logo alternativo (opcional/reservado para campanhas).
- **`logo-rodape.png`**: Versão em cor sólida ou vazada para o rodapé da plataforma e e-mails transacionais.
- **`logo-menu`**: Ícone/logo reduzido para a navegação mobile ou sidebars fechadas.
- **`favicon.svg`**: Símbolo quadrado, utilizado na aba do navegador e no ícone do PWA (manifest.json).

## Integração Stripe
- **Price IDs (Planos)**:
  - Essencial: `price_1UEag7BejuJh61udGrM5w6oo`
  - Comunidade: `price_1UEahkBejuJh61udF758QtDQ`
  - Federação: `price_1UEaiWBejuJh61uduZGizvCM`
  - Anual: `price_1UEajLBejuJh61udOqNGOrVQ`
- **Formato do `.env`**:
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- **Configuração do Webhook**: No dashboard do Stripe, configure o webhook apontando para a URL de produção com o endpoint `/api/stripe/webhook`, assinando os eventos `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`. Insira o Webhook Secret no seu `.env`.

## Regra de Negócio
- **Trial de 7 dias**: Novos usuários ganham 7 dias de avaliação gratuita automaticamente ao se registrarem.
- Após o período, um **middleware de bloqueio de acesso** verifica o status da assinatura (`subscriptionStatus`).
- Se a assinatura estiver inativa ou o trial tiver expirado, o usuário sofre **redirecionamento obrigatório** para a tela de planos, não podendo acessar o Dashboard ou Cadastros até a regularização via Stripe.

## Deploy
- **Ambiente**: Hostinger.
- **Instruções Básicas**:
  1. No painel da Hostinger, certifique-se de configurar o ambiente para **Node.js**.
  2. Instale as dependências com `npm install`.
  3. Realize a build do frontend com `npm run build` (o comando executa o Vite).
  4. Inicie o servidor Express com `npm run start` (certifique-se de que a Hostinger aponte o script de start correto ou utilize um gerenciador de processos como PM2, apontando para `server.ts` se estiver usando Node.js/tsx, ou adapte o build do backend se necessário).
  5. Configure todas as variáveis de ambiente necessárias (Stripe, Firebase) no painel de ambiente do servidor.
