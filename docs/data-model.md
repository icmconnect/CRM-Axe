# Modelo de Dados (Data Model)

Este documento descreve detalhadamente o modelo de dados utilizado pelo **Ase Connect (Portal dos Sacerdotes)**, cobrindo tipos de dados do TypeScript, coleções do Cloud Firestore e armazenamento de arquivos.

---

## 🗄️ Coleções e Entidades do Cloud Firestore

Abaixo estão mapeadas as principais entidades armazenadas no banco de dados Cloud Firestore:

### 1. Entidade: Casas de Axé (Terreiros)
- **Coleção Firestore:** `/casas_axe`
- **Arquivo de Origem:** `src/contexts/AuthContext.tsx` / `src/types/roles.ts`
- **Identificador Primário:** `id` (UID gerado pelo Firestore ou informado no cadastro)
- **Persistência:** Cloud Firestore (Dura) + Cache Local (IndexedDB)
- **Status:** Usado (Ativo)

#### Tabela de Campos:
| Campo | Tipo | Obrigatório | LGPD / Pessoal? | Descrição |
|---|---|---|---|---|
| `id` | `string` | Sim | Não | ID único da casa espiritual. |
| `nome` | `string` | Sim | Não | Nome do Terreiro (ex: Templo de Umbanda Caboclo Pena Branca). |
| `admin_email` | `string` | Sim | Sim | E-mail do administrador principal da casa. |
| `admin_nome` | `string` | Sim | Sim | Nome completo do responsável administrador. |
| `whatsapp` | `string` | Sim | Sim | Telefone de contato rápido com DDD. |
| `created_at` | `Timestamp` | Sim | Não | Data e hora de criação no banco. |
| `status` | `'trial' \| 'ativo' \| 'suspenso'`| Sim | Não | Status de faturamento / operação da conta. |
| `trial_ate` | `string` | Não | Não | Data limite da avaliação gratuita (Formato ISO YYYY-MM-DD). |
| `plano` | `'ESSENCIAL' \| 'COMUNIDADE' \| 'FEDERAÇÃO'`| Não | Não | Plano escolhido pelo usuário ou configurado pelo Admin. |
| `valor_plano` | `number` | Não | Não | Valor mensal cobrado da casa espiritual. |
| `status_pagamento`| `'pago' \| 'pendente' \| 'isento'`| Não | Não | Situação financeira do terreiro em relação ao sistema. |

- **Onde é lido:** `AuthContext.tsx`, `Admin.tsx`, `Dashboard.tsx`, `Layout.tsx`, `TrialBanner.tsx`.
- **Onde é escrito:** `CadastroCasa.tsx` (criação), `Admin.tsx` (alterações de plano, valor e pagamento).
- **Leitura:** Qualquer usuário autenticado (ou Admin/Master).
- **Escrita:** Super Admin (Master) e o próprio e-mail administrador cadastrado.

---

### 2. Entidade: Usuários do Sistema
- **Coleção Firestore:** `/users`
- **Arquivo de Origem:** `src/types/roles.ts` / `src/contexts/AuthContext.tsx`
- **Identificador Primário:** `uid` (UID do Firebase Auth)
- **Persistência:** Cloud Firestore (Dura)
- **Status:** Usado (Ativo)

#### Tabela de Campos:
| Campo | Tipo | Obrigatório | LGPD / Pessoal? | Descrição |
|---|---|---|---|---|
| `uid` | `string` | Sim | Não | ID exclusivo do usuário no Firebase Authentication. |
| `nome` | `string` | Sim | Sim | Nome de exibição do usuário do sistema. |
| `email` | `string` | Sim | Sim | E-mail corporativo ou pessoal utilizado para login. |
| `foto` | `string` | Não | Sim | URL da imagem do perfil (geralmente provinda da conta Google). |
| `ultimo_login` | `Timestamp` | Sim | Não | Registro temporal do último acesso realizado. |
| `role` | `enum Role` | Sim | Não | Papel de acesso (MASTER, ADMIN_CASA, EDITOR, TESTADOR, BLOQUEADO). |
| `id_casa` | `string` | Sim (Nulo p/ Master) | Não | ID do terreiro (coleção `casas_axe`) ao qual o usuário pertence. |
| `ambiente` | `'producao' \| 'teste'` | Sim | Não | Define se o usuário opera dados simulados ou reais. |
| `bloqueado` | `boolean` | Não | Não | Se verdadeiro, o usuário é desconectado instantaneamente. |

- **Onde é lido:** `AuthContext.tsx`, `App.tsx`, `Admin.tsx`, `Layout.tsx`.
- **Onde é escrito:** `AuthContext.tsx` (sincronização no login), `Admin.tsx` (gerenciamento).
- **Leitura:** Usuários autenticados.
- **Escrita:** O próprio usuário (apenas sincronização e login) ou Super Admin (Master).

---

### 3. Entidade: Membros do Terreiro
- **Coleção Firestore:** `/membros`
- **Arquivo de Origem:** `src/types.ts`
- **Identificador Primário:** `id` (UID gerado pelo Firestore)
- **Persistência:** Cloud Firestore (Offline-First via IndexedDB)
- **Status:** Usado (Ativo)

#### Tabela de Campos:
| Campo | Tipo | Obrigatório | LGPD / Pessoal? | Dado Sensível? | Descrição |
|---|---|---|---|---|---|
| `id` | `string` | Sim | Não | Não | ID único do membro. |
| `id_casa` | `string` | Sim | Não | Não | ID da Casa de Axé proprietária deste registro (Multi-tenant). |
| `nome` | `string` | Sim | Sim | Não | Nome de registro do irmão/membro de terreiro. |
| `nascimento` | `string` | Sim | Sim | Não | Data de nascimento (Formato YYYY-MM-DD). |
| `whatsapp` | `string` | Sim | Sim | Não | Telefone celular do membro com DDD. |
| `email` | `string` | Sim | Sim | Não | E-mail para contato e recebimento de notas. |
| `profissao` | `string` | Sim | Sim | Não | Atividade laboral ou profissão. |
| `escolaridade` | `string` | Não | Sim | Não | Nível de instrução acadêmica. |
| `endereco_rua` | `string` | Não | Sim | Não | Nome do logradouro de residência. |
| `endereco_numero`| `string` | Não | Sim | Não | Número da residência. |
| `bairro` | `string` | Não | Sim | Não | Bairro de residência. |
| `cidade` | `string` | Não | Sim | Não | Cidade de residência. |
| `estado` | `string` | Não | Sim | Não | Unidade Federativa. |
| `rg` | `string` | Não | Sim | Sim | Documento de Identidade. |
| `cpf` | `string` | Não | Sim | Sim | Cadastro de Pessoa Física. |
| `contribuicao_sugerida`| `number` | Sim | Não | Não | Valor sugerido da mensalidade voluntária do irmão. |
| `status` | `'Ativo' \| 'Inativo'`| Sim | Não | Não | Indica se o membro está em frequência ativa. |
| `isDependent` | `boolean` | Não | Não | Não | Se verdadeiro, este membro é um dependente/menor. |
| `parentEmail` | `string` | Não | Sim | Não | E-mail do responsável financeiro (se dependente). |

- **Onde é lido:** `Membros.tsx`, `DataContext.tsx`, `Financeiro.tsx`, `Relatorios.tsx`, `Dashboard.tsx`.
- **Onde é escrito:** `Membros.tsx`, `DataContext.tsx` (cadastro, importação Excel/CSV, edição, exclusão).
- **Leitura/Escrita:** Sacerdotes (ADMIN_CASA) e Editores do terreiro proprietário. Protegido por regras baseadas em `userCasaId() == resource.data.id_casa`.

---

### 4. Entidade: Lançamento Financeiro
- **Coleção Firestore:** `/financeiro`
- **Arquivo de Origem:** `src/types.ts`
- **Identificador Primário:** `id` (UID gerado pelo Firestore)
- **Persistência:** Cloud Firestore (Offline-First via IndexedDB)
- **Status:** Usado (Ativo)

#### Tabela de Campos:
| Campo | Tipo | Obrigatório | LGPD / Pessoal? | Descrição |
|---|---|---|---|---|
| `id` | `string` | Sim | Não | ID único do lançamento de caixa. |
| `id_casa` | `string` | Sim | Não | ID do terreiro de origem (Multi-tenant). |
| `tipo` | `'Entrada' \| 'Saída' \| 'Serviço'`| Sim | Não | Tipo de movimentação de caixa. |
| `categoria` | `string` | Sim | Não | Categoria de despesa/receita (ex: Mensalidade, Compra de velas). |
| `valor` | `number` | Sim | Não | Valor monetário em reais (R$). |
| `data` | `string` | Sim | Não | Data da transação (ISO YYYY-MM-DD). |
| `id_membro` | `string` | Não | Não | ID do membro vinculado (se for mensalidade ou doação direta). |
| `doador_nome` | `string` | Não | Sim | Nome de pessoa externa ou membro que doou o valor. |
| `id_evento` | `string` | Não | Não | ID do evento associado (se for arrecadação para festa). |
| `id_banco` | `string` | Não | Não | ID da conta bancária / caixa físico associado. |
| `descricao` | `string` | Sim | Não | Detalhamento descritivo da movimentação. |
| `comprovanteUrl`| `string` | Não | Não | Link direto para imagem do comprovante anexado no Storage. |
| `modificado_por_email`| `string` | Não | Sim | Registra o e-mail do operador que lançou ou editou a transação. |

- **Onde é lido:** `Financeiro.tsx`, `DataContext.tsx`, `Relatorios.tsx`, `Dashboard.tsx`.
- **Onde é escrito:** `Financeiro.tsx`, `DataContext.tsx`.
- **Leitura/Escrita:** Sacerdotes (ADMIN_CASA) e Editores autorizados da respectiva casa espiritual.

---

### 5. Outras Entidades Menores

#### Entidade: Eventos (`/eventos`)
- **Campos:** `id` (string), `id_casa` (string), `nome` (string), `data` (string - YYYY-MM-DD), `meta_financeira` (number), `status` ('Aberto' | 'Concluído').
- **Finalidade:** Planejar e consolidar custos e metas de festas e rituais do terreiro.

#### Entidade: Itens de Necessidade (`/itens_necessidade`)
- **Campos:** `id` (string), `id_evento` (string), `nome` (string), `quantidade` (number), `unidade` (string, ex: Kg, Garrafas), `id_membro_doador` (string - opcional), `concluido` (boolean).
- **Finalidade:** Lista de mantimentos necessários para rituais que membros podem voluntariar-se a levar.

#### Entidade: Logs de Auditoria (`/audit_logs`)
- **Campos:** `id` (string), `id_casa` (string), `data` (Timestamp), `usuario_email` (string), `acao` (string), `resumo` (string).
- **Finalidade:** Rastreamento de alterações cruciais (Exclusão de membros, alterações financeiras) para conformidade de auditoria gerencial.

---

## 🔒 Princípios de Privacidade (LGPD)

- **Dados de Identificação Pessoal:** Campos como `nome`, `email`, `whatsapp`, `rg`, e `cpf` estão protegidos por regras rígidas de segurança cliente e banco de dados.
- **Minimização de Dados:** Dados governamentais (`rg` e `cpf`) são opcionais e devem ser utilizados apenas se houver necessidade real de emissão de recibos ou declarações.
- **Secrets e API Keys:** Nenhuma chave secreta ou credencial real do Firebase é salva nos arquivos de código ou documentação. O arquivo `/firebase-applet-config.json` contém apenas chaves públicas do cliente Firebase, projetadas para exposição.
