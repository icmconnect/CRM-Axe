# Backup Pré-Migração do Firestore

> ⚠️ **ATENÇÃO MÁXIMA:** Faça uma exportação completa do Firestore **ANTES** de executar qualquer script de migração. Embora a migração de ACL seja projetada com travas de segurança e modo idempotente, a prevenção de perda de dados é uma etapa obrigatória de qualquer equipe profissional de TI.

---

## Como Exportar o Firestore Manualmente pelo Console do Firebase

Siga o passo a passo oficial recomendado pelo Google Cloud e Firebase para realizar o backup manual das suas coleções:

### 👣 Passo a Passo:

1. **Acesse o Console do Firebase:**
   - Faça login com a conta administradora em [Firebase Console](https://console.firebase.google.com/).

2. **Selecione o Projeto Correto:**
   - Entre no projeto associado do seu ERP.

3. **Navegue até o Firestore Database:**
   - No menu lateral esquerdo, clique em **Firestore Database** na seção "Build" ou "Construir".

4. **Vá para a Guia Import/Export:**
   - No painel superior central do Firestore, clique na aba **Import/Export* (ou "Importar/Exportar").

5. **Inicie a Exportação:**
   - Clique no botão azul **Export** (ou "Exportar").

6. **Defina os Parâmetros da Cópia de Segurança:**
   - **Destino (Google Cloud Storage):** Selecione o bucket do GCS do seu projeto ou crie um novo (geralmente sob a nomenclatura `gs://<seu-projeto-id>.appspot.com/backups/`).
   - **Seleção de Coleções:** Recomendamos selecionar **Todas as coleções** para garantir um backup completo do seu ecossistema.

7. **Confirme a Operação:**
   - Clique em **Export** para dar início à compactação e transferência dos dados. Esse processo roda em background no Cloud Infrastructure do Google e normalmente leva de alguns segundos a poucos minutos para conjuntos pequenos/médios de dados.

---

## 🔒 Boas Práticas Adicionais:

- **Não Realize Operações no ERP durante o Backup:** Evite criar ou alterar registros (como lançar financeiro ou membros) no momento exato do export para evitar inconsistências nos índices.
- **Valide o Tamanho do Backup:** Verifique no Google Cloud Storage se a pasta do backup recém-criado possui arquivos de metadados válidos.
- **Ambiente de Testes:** Se possível, restaure o backup em um segundo banco ou ambiente isolado de Homologação/QA para verificar a integridade da cópia antes de qualquer alteração crítica.
