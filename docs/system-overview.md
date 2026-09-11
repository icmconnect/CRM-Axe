# Visão Geral do Sistema (System Overview)

Este documento descreve a arquitetura do sistema, o fluxo de dados, a stack tecnológica e as premissas operacionais da plataforma **Ase Connect (Portal dos Sacerdotes)**.

---

## 🎯 Objetivo e Público-Alvo

O **Ase Connect** é um sistema integrado de gestão (ERP) focado em profissionalizar a administração de Casas de Axé (Terreiros de Umbanda, Candomblé e outras vertentes espiritualistas). Ele simplifica a gestão de membros (frequência, cargos, dependentes), o fluxo financeiro (mensalidades, doações, saídas de rituais), o planejamento de eventos (metas financeiras e lista de mantimentos), e gera relatórios gerenciais estruturados em PDF e Planilhas.

### Público-Alvo:
1. **Zelador / Sacerdote (Pai/Mãe de Santo):** Usuários de alta gerência que acompanham os relatórios consolidados, realizam auditoria e gerenciam a casa espiritual.
2. **Administradores Financeiros e Editores:** Responsáveis por lançar entradas, saídas, controlar o fluxo de caixa, cadastrar e atualizar dados de membros e eventos.
3. **Super Admin / Master:** Desenvolvedor ou consultor técnico (e-mail principal: `gustavomacedo.consultor@gmail.com`) responsável por credenciar novos terreiros, realizar upgrades/downgrades de planos de assinatura, alterar status de pagamentos e representar/ver dados específicos de qualquer casa cadastrada no sistema (Modo Master).

---

## 🗺️ Diagrama de Arquitetura Textual

```text
       [ Usuário / Sacerdote / Administrador ]
                         │
                         ▼ (Acessa via PWA / Web Browser)
       ┌─────────────────────────────────────────────────┐
       │             Frontend (React 19 + Vite)          │
       └────┬─────────────────┬─────────────────┬────────┘
            │                 │                 │
            ▼ (Autenticação)  ▼ (Persistência)  ▼ (Upload)
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │Firebase Auth │  │  Firestore   │  │  Firebase    │
     │   Service    │  │ (IndexedDB)  │  │   Storage    │
     └──────────────┘  └──────┬───────┘  └──────────────┘
                              │
                              ▼ (Auditoria)
                       ┌──────────────┐
                       │  Audit &     │
                       │Security Logs │
                       └──────────────┘
                              ▲
                              │ (Monitoramento)
       ┌──────────────────────┴──────────────────────────┐
       │          Servidor Node.js + Express.ts          │
       │     (Hospedado no Google Cloud Run)             │
       └─────────────────────────────────────────────────┘
```

---

## ⚙️ Módulos e Componentes do Sistema

| Módulo / Recurso | Descrição | Status de Validação |
|---|---|---|
| **Autenticação (Auth)** | Autenticação cliente baseada no Firebase Authentication. Suporta persistência de sessão local. | **Confirmado no código** |
| **PWA (Progressive Web App)** | Oferece instalação nativa em celulares/desktops, possui Service Worker (`sw.js`) ativo para cache e suporte a funcionamento offline. | **Confirmado no código** |
| **Banco de Dados (DB)** | Uso de Cloud Firestore com cache local ativado via `IndexedDB` para garantir que o ERP continue funcional mesmo sem conexão de internet (offline-first). | **Confirmado no código** |
| **Gestão de Membros** | Listagem, filtros por status (Ativo/Inativo), cadastro de dependentes, importação rápida via Excel/CSV e download de modelo de preenchimento. | **Confirmado no código** |
| **Gestão Financeira** | Lançamentos de entradas (mensalidades, doações), saídas (aluguel, compras) e fluxo de caixa detalhado com upload de comprovantes no Firebase Storage. | **Confirmado no código** |
| **Gestão de Eventos** | Criação de festividades/trabalhos com metas de arrecadação financeira e controle de doações de insumos/ingredientes necessários. | **Confirmado no código** |
| **Relatórios e PDF** | Geração e exportação em tempo real de relatórios consolidados em formato PDF (usando `jsPDF-AutoTable`) e Excel (usando `xlsx`). | **Confirmado no código** |
| **Super Administração** | Painel exclusivo para o e-mail master gerenciar terreiros (Casas de Axé), upgrade/downgrade de planos (Essencial, Comunidade, Federação), controle de pagamentos do plano e representação de terreiro (Modo Master). | **Confirmado no código** |
| **Logs de Auditoria** | Criação de logs automáticos ao cadastrar ou alterar dados importantes, salvos na coleção `audit_logs` e `security_logs`. | **Confirmado no código** |

---

## 🌐 Ambientes e Infraestrutura

- **Hospedagem:** Google Cloud Run (Containerizado via Docker).
  - *Staging/Preview:* `https://ais-pre-3afufgvu3o3ljyd2meanuh-212588819787.us-east1.run.app` (Ambiente compartilhado)
  - *Development:* `https://ais-dev-3afufgvu3o3ljyd2meanuh-212588819787.us-east1.run.app` (Ambiente de desenvolvimento)
  - *Produção:* **A validar** (Definido externamente no Hostinger / domínio próprio).
- **Gerenciamento de Segredos / API:** Armazenados de forma privada no servidor Express.ts e carregados por variáveis de ambiente (`.env`). **Confirmado no código**
- **Sincronização de Dados:** Ocorre em tempo real (reativo) através de listeners ativos do Firestore (`onSnapshot`). **Confirmado no código**
