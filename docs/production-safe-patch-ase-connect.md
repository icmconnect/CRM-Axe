# Patch Seguro de Produção — Ase Connect (Portal dos Sacerdotes)

Este documento registra o patch mínimo, reversível e retrocompatível aplicado em ambiente de teste local em **3 de setembro de 2026**, visando elevar o nível de segurança e acessibilidade sem afetar a produção na Hostinger, o Firebase Auth, o Cloud Firestore ou as regras de segurança existentes.

---

## 🔒 1. Modificações Aplicadas

1. **Proteção Visual de Rota (`/admin/debug-tenant`):**
   - **Arquivo Afetado:** `/src/App.tsx`
   - **Descrição:** A rota de depuração foi envolvida pelo componente `<ProtectedRoute nivelMinimo={Role.MASTER}>` já existente no projeto. 
   - **Comportamento:** Usuários não autenticados ou sem privilégio `MASTER` são adequadamente barrados ou redirecionados conforme os padrões do sistema de segurança, eliminando a exposição visual indevida identificada no achado de segurança `A-01`.

2. **Segurança em Links Externos (`target="_blank"`):**
   - **Arquivos Afetados:** `/src/pages/Membros.tsx`, `/src/pages/LandingPage.tsx`, `/src/components/TrialBanner.tsx`, `/src/pages/ContaSuspensa.tsx`
   - **Descrição:** Adicionado o atributo `rel="noopener noreferrer"` em todos os elementos `<a>` que utilizam `target="_blank"`.
   - **Comportamento:** Previne vulnerabilidades de sequestro de aba do navegador (*Tabnabbing*), cumprindo a recomendação da auditoria.

3. **Acessibilidade em Botões Somente Ícone (`aria-label`):**
   - **Arquivos Afetados:** `/src/pages/Membros.tsx`, `/src/pages/Financeiro.tsx`
   - **Descrição:** Inseridos atributos `aria-label` descritivos em português nos botões de ação rápida baseados exclusivamente em ícones (ex: `aria-label="Editar Membro"`, `aria-label="Excluir Membro"`, `aria-label="Editar Lançamento"`).
   - **Comportamento:** Melhora significativamente a experiência para usuários dependentes de leitores de tela sem alterar a interface visual ou o layout.

4. **Aviso de Dispositivos Compartilhados na Tela de Login:**
   - **Arquivo Afetado:** `/src/pages/Login.tsx`
   - **Descrição:** Adicionado um card discreto contendo o texto:  
     > *“Em computadores compartilhados, encerre sua sessão ao terminar e evite manter dados da plataforma disponíveis offline.”*
   - **Comportamento:** Orienta os sacerdotes e operadores sobre boas práticas de LGPD e segurança física ao acessar a plataforma em computadores públicos ou de terreiros compartilhados.

---

## 🛡️ 2. Garantias de Isolamento de Produção

- **Nenhum arquivo de configuração do Firebase foi alterado.**
- **Nenhuma regra do Firestore (`firestore.rules`) ou do Storage (`storage.rules`) foi modificada.**
- **Nenhuma coleção, payload, estrutura de tenant ou regra de login/autenticação foi alterada.**
- **Nenhuma dependência nova foi instalada.**
- **Nenhum deploy automático foi realizado para a Hostinger.**
