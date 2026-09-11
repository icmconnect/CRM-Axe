# Conteúdo e Mídia (Content and Media)

Este documento audita o uso de ativos de mídia, imagens, logotipos, fontes tipográficas, mídias externas e modelos de conteúdo utilizados no ecossistema do **Ase Connect**.

---

## 🖼️ Auditoria de Ativos de Mídia e Logotipos

O aplicativo utiliza uma estética limpa baseada em ícones vetoriais dinâmicos e poucos arquivos de imagem pesados para otimizar a velocidade do PWA:

1. **Logotipo Oficial da Plataforma (`Logo.tsx`):**
   - **Descrição:** Elemento vetorial SVG composto por tipografia e um círculo dourado estilizado que simboliza a conexão e o Axé.
   - **Tipo de Ativo:** Código SVG puro embutido (Inline JSX). Evita requisições HTTP adicionais e permite redimensionamento sem perda de nitidez.
   - **Origem:** Produção própria.
   - **Ação Recomendada:** Manter.

2. **Ícones da Interface (Lucide React):**
   - **Descrição:** Conjunto completo de ícones de interface para menus, botões financeiros e controle de status.
   - **Tipo de Ativo:** Biblioteca SVG externa (`lucide-react`).
   - **Ação Recomendada:** Manter.

3. **Arquivos de Mídia de Usuários (Comprovantes):**
   - **Descrição:** Imagens em formato PNG/JPEG ou documentos PDF carregados por dirigentes para comprovação de transações contábeis.
   - **Tipo de Ativo:** Arquivos dinâmicos do usuário.
   - **Origem / Hospedagem:** Armazenados no Firebase Storage do projeto.
   - **Ação Recomendada:** Adicionar regras de compactação de imagem antes de realizar o upload para poupar banda no Firebase.

---

## 📑 Modelos de Conteúdo e Arquivos de Modelo

A plataforma disponibiliza arquivos para facilitar o preenchimento de dados:

### 1. Modelo de Importação de Membros
- **Descrição:** Planilha em formato Excel (`.xlsx`) pré-formatada contendo as colunas corretas exigidas pelo motor de importação do terreiro (Nome, Nascimento, WhatsApp, Email, Profissão, Escolaridade, CPF, RG, etc).
- **Tipo de Uso:** Download direto gerado via código (SheetJS) no navegador.
- **Origem:** Gerado programmaticamente em `src/pages/Membros.tsx`.
- **Ação Recomendada:** Manter atualizado de acordo com possíveis novos campos introduzidos no tipo `Membro`.

### 2. Modelo de Documento PDF (Relatórios)
- **Descrição:** Documentos em PDF gerados pelo jsPDF-AutoTable contendo o balanço de caixa consolidado, balancetes de eventos e listagem de membros ativos.
- **Tipo de Uso:** Exportação gerada no navegador.
- **Origem:** Gerado programmaticamente em `src/pages/Relatorios.tsx`.
- **Ação Recomendada:** Adicionar cabeçalho e rodapé personalizados com o nome da Casa de Axé correspondente.

---

## 🗛 Tipografia e Fontes

- **Fontes Utilizadas:** O aplicativo herda a tipografia semântica do Tailwind CSS 4, priorizando fontes do sistema para carregamento instantâneo no celular, sem necessidade de baixar arquivos de fontes externas (como Google Fonts) em conexões lentas.
- **CSS Tipográfico:** Tamanhos de fonte escalonados matematicamente para legibilidade e organização hierárquica.
