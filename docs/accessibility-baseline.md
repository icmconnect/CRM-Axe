# Baseline de Acessibilidade (Accessibility Baseline)

Este documento avalia a aderência do aplicativo **Ase Connect** às diretrizes e melhores práticas de acessibilidade na web (WCAG 2.1 - Web Content Accessibility Guidelines).

---

## ♿ Avaliação de Acessibilidade Técnica e Funcional

Abaixo estão descritos os critérios analisados e o status atual de implementação:

| Critério de Acessibilidade | Descrição | Status de Implementação | Observações / Melhorias Necessárias |
|---|---|---|---|
| **Semântica HTML** | Uso correto de tags como `<header>`, `<main>`, `<section>`, `<nav>` e `<aside>` para que leitores de tela entendam a estrutura. | **Implementado** | O layout padrão utiliza marcações semânticas corretas e divisões limpas. |
| **Navegação por Teclado** | Possibilidade de navegar por todos os links, botões e inputs usando apenas a tecla `TAB`. | **Parcial** | A maioria dos inputs e botões nativos aceita foco, mas alguns botões customizados (como seletores de data e alternadores de status) necessitam de atributos explicitados. |
| **Foco Visível** | Exibição de um contorno visível (outline) quando um elemento recebe o foco do teclado. | **Parcial** | O Tailwind redefine outlines nativos em alguns formulários. Recomenda-se adicionar `focus:ring-2 focus:ring-amber-500` de forma padronizada. |
| **Modais Acessíveis** | Bloqueio de foco (focus trap) dentro do modal ativo, fechamento pelo botão "X" e suporte a fechar pelo teclado usando a tecla `Escape`. | **Implementado** | O componente genérico `/src/components/Modal.tsx` gerencia adequadamente o fechamento ao clicar fora, botão de saída e suporta o fechamento pela tecla `Escape`. |
| **Aria-labels em Ícones** | Presença de rótulos de áudio descritivos em botões que exibem apenas ícones gráficos (ex: botões de edição, exclusão ou de baixar relatórios). | **Ausente** | Os botões de ação rápida nas tabelas de Membros e Financeiro utilizam ícones do Lucide React sem atributos `aria-label` descriptivos, o que dificulta a leitura por softwares de acessibilidade. |
| **Contraste de Cores** | Contraste de cor suficiente entre o texto e o fundo (proporção mínima de 4.5:1 para texto normal, de acordo com as regras WCAG AA). | **Implementado** | O sistema utiliza tons contrastantes de amarelo/âmbar de alta densidade no tema claro, e um contraste bem desenhado no tema escuro (Dark Mode). |
| **Responsividade Mobile** | Design fluido e adaptável a diferentes resoluções e zoom de tela de até 200% sem perda de conteúdo. | **Implementado** | A Sidebar colapsa em dispositivos móveis se transformando em menu lateral retrátil, e as tabelas utilizam overflows horizontais controlados para visualização segura. |
| **Área de Toque Mínima** | Alvos de toque (botões e links) com tamanho igual ou superior a 44x44 pixels em dispositivos móveis. | **Implementado** | Os botões móveis de navegação rápida e de salvamento de registros respeitam o espaçamento padrão e padding mínimo do Tailwind. |
| **Mensagens de Erro** | Notificações de erro legíveis, claras e acessíveis ao submeter formulários incorretos. | **Implementado** | Os formulários de cadastro e financeiro indicam erros estruturados na tela usando cores de destaque (vermelho) e ícones de alerta para clareza visual. |

---

## 🛠️ Recomendações Prioritárias para Melhoria de Acessibilidade

1. **Adicionar `aria-label` em botões de ação rápida:**
   - *Exemplo:* Nos botões de edição de membro, trocar `<button onClick={...}><Edit size={16} /></button>` por `<button onClick={...} aria-label="Editar Membro"><Edit size={16} /></button>`.
2. **Revisar Foco em Tabelas:**
   - Adicionar classes do Tailwind focadas em foco (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`) em todas as linhas e colunas de ações rápidas.
3. **Adicionar descrições textuais alternativas em imagens:**
   - Garantir que todos os componentes que utilizam tags `<img>` (como comprovantes e foto do perfil) possuam o atributo `alt` preenchido dinamicamente.
