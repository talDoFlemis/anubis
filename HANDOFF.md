# Anubis — Handoff para Continuação do Trabalho

> **Data:** 2026-06-14  
> **Branch:** `refactor/cv-engine`  
> **Sessão de conversa:** `d9110876-21f7-4bb9-8e78-f12ad97d73f6`  
> **Status:** CV scoring engine implementado e verificado. Pronto para revisão de código e merge.

---

## 1. Contexto do Problema

O sistema **Anubis** gerencia o processo seletivo do programa de pós-graduação **MDCC** (Mestrado e Doutorado em Ciência da Computação) da UFC. Esta sessão de trabalho refatorou o sistema de **avaliação curricular (Lattes)** para suportar:

1. **Classificação CAPES (Qualis):** Cada publicação/conferência do candidato recebe uma classificação A1–A8, definida pelo candidato na submissão.
2. **Verificação pelo professor:** Após a submissão, o professor valida cada item do CV. Se estiver incorreto, pode marcar como `incorrect`, deixar um comentário e opcionalmente corrigir a classificação. O item passa a pontuar zero se nenhuma correção for fornecida.
3. **Seções estáticas por nível:** As seções do CV são fixas (4 para Mestrado, 5 para Doutorado) conforme os editais de 2024/2025. Não é um sistema dinâmico — as seções estão definidas em código — mas foi projetado para ser **fácil de alterar pontuações ou adicionar/remover seções** editando um único arquivo de configuração.
4. **Reordenação do wizard:** A etapa de escolha de temas de pesquisa foi movida para o início do wizard (posição 2), ficando: Nível → Temas → Acadêmico → POSCOMP → Currículo → SIGAA.

### Documentos de referência utilizados

- [Edital 02.2025 - Doutorado](file:///Users/erikbayerlein/Documents/anubis/Edital%2002.2025_MDCC%20-%20Turma%202026.1%20(DOUTORADO).pdf)
- [Edital 01.2025 - Mestrado](file:///Users/erikbayerlein/Documents/anubis/Edital%2001.2025_MDCC%20-%20Turma%202026.1%20(MESTRADO).pdf)
- [message.txt](file:///Users/erikbayerlein/Documents/anubis/message.txt) — Tabela comparativa de evolução das pontuações 2015–2025

---

## 2. O que foi implementado (Commits na branch `refactor/cv-engine`)

### Commit `be702c5`: `feat(cv-scoring): refactor CV scoring engine and implement professor verification workflow`

Este é o commit principal com todas as mudanças. Abaixo, o detalhamento por camada:

---

### 2.1 Configuração de Pontuação (Backend)

#### [NEW] [cv-scoring-config.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/constants/cv-scoring-config.ts)
Arquivo centralizado de configuração com:

- **`QUALIS_POINTS`** — Mapeamento de classificações CAPES para pontos base:
  | Classificação | Pontos |
  |:---|:---|
  | A1, A2, A3, A4 | 0.6 |
  | A5, A6 (antigo B1/B2) | 0.4 |
  | A7, A8 (antigo B3/B4) | 0.2 |
  | Não qualificado | 0.1 |

- **Bônus cumulativos** (somados à nota base de cada artigo):
  | Bônus | Valor |
  |:---|:---|
  | Artigo completo | +0.2 |
  | Resumo/pôster | +0.1 |
  | Publicação em periódico | +0.2 |
  | Autor principal | +0.2 |
  | Fruto de dissertação (só doutorado) | +0.1 |
  | Encontro de IC (só mestrado) | +0.1 (flat, sem bônus) |

- **`MASTERS_SECTIONS`** (4 seções) e **`DOCTORAL_SECTIONS`** (5 seções):

  | # | Seção | Tipo | Máx Mestrado | Máx Doutorado |
  |:---|:---|:---|:---|:---|
  | 1 | Projetos de pesquisa / IC | semestral | 2.0 | 1.0 |
  | 2 | Produção científica | pontual | 1.0 | 1.5 |
  | 3 | Docência / monitoria | semestral | 0.5 | 0.5 |
  | 4 | Orientação de IC | semestral | — | 0.5 |
  | 5 | Eventos científicos | pontual | 0.5 | 0.5 |

  > A seção "Orientação de IC" só existe no Doutorado.

- **`EVENT_POINTS`**: Local (0.1), Nacional (0.2), Internacional (0.3).

> **Decisão de design confirmada pelo usuário:** As seções não precisam ser dinâmicas (configuráveis via UI), mas o código deve permitir alterar pontuações facilmente. Por isso tudo está centralizado neste arquivo TypeScript.

---

### 2.2 Schema do Banco de Dados

#### [MODIFY] [cv-items.ts](file:///Users/erikbayerlein/Documents/anubis/src/database/schema/cv-items.ts)
Colunas adicionadas à tabela `cv_items`:

```
classification       VARCHAR  — A1|A2|A3|A4|A5|A6|A7|A8|none
isComplete           BOOLEAN  — Artigo completo
isResumo             BOOLEAN  — Resumo/pôster
isPeriodico          BOOLEAN  — Publicação em periódico
isAutorPrincipal     BOOLEAN  — Autor principal
isDissertacao        BOOLEAN  — Fruto de dissertação (doutorado)
isEncontroIc         BOOLEAN  — Encontro de IC (mestrado)
isInArea             BOOLEAN  — Projeto na área de pesquisa
docenciaType         VARCHAR  — 'ies' | 'monitoria'
eventoType           VARCHAR  — 'local' | 'nacional' | 'internacional'
isVerified           VARCHAR  — 'pending' | 'verified' | 'incorrect'
correctedClassification VARCHAR  — Classificação corrigida pelo professor
verificationComment  TEXT     — Comentário do professor
```

#### [NEW] [0012_fat_nekra.sql](file:///Users/erikbayerlein/Documents/anubis/drizzle/0012_fat_nekra.sql)
Migração SQL correspondente. Já aplicada no banco local.

---

### 2.3 Backend — Serviços e Controllers

#### [MODIFY] [cv-scoring.service.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-scoring.service.ts)
Motor de cálculo de pontuação refatorado:
- `calculateCategoryScore()`: Calcula score por categoria usando switch/case no `key` da categoria
  - **PROJECTS**: `quantidade × (base + bônusÁrea)`
  - **PRODUCTION**: `pontosCAPES + bônusCumulativos` (encontro IC = flat 0.1)
  - **TEACHING**: Mestrado distingue IES (0.3) vs monitoria (0.2); Doutorado = 0.2
  - **ORIENTATION**: Doutorado only, `quantidade × 0.2`
  - **EVENTS**: Pontos por escopo (local/nacional/internacional)
- Itens marcados como `incorrect` sem `correctedClassification` pontuam zero
- `toFixed(2)` para evitar erros de ponto flutuante
- `Math.min(total, maxPoints)` para respeitar o teto de cada categoria

#### [MODIFY] [cv-item.service.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-item.service.ts)
- Adicionado método `verify(enrollmentId, itemId, dto)` para verificação pelo professor

#### [NEW] [verify-cv-item.dto.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/dto/verify-cv-item.dto.ts)
```typescript
class VerifyCvItemDto {
  isVerified: 'verified' | 'incorrect';
  correctedClassification?: string;  // Opcional
  verificationComment?: string;      // Opcional
}
```

#### [MODIFY] [cv-item.controller.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-item.controller.ts)
- Nova rota: `PATCH /v1/enrollments/:enrollmentId/cv-items/:itemId/verify`
- Protegida com `@StaffOnly()` — apenas professor, coordenador e secretário

#### [MODIFY] [create-cv-item.dto.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/dto/create-cv-item.dto.ts)
- Adicionados campos opcionais: `classification`, `isComplete`, `isResumo`, `isPeriodico`, `isAutorPrincipal`, `isDissertacao`, `isEncontroIc`, `isInArea`, `docenciaType`, `eventoType`

#### [MODIFY] [cv-item.drizzle-repository.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/infrastructure/persistence/drizzle/cv-item.drizzle-repository.ts)
- Adicionado método `updateVerification()` para gravar a decisão do professor

#### [MODIFY] [enrollment.controller.ts](file:///Users/erikbayerlein/Documents/anubis/src/enrollment/enrollment.controller.ts) e [enrollment.service.ts](file:///Users/erikbayerlein/Documents/anubis/src/enrollment/enrollment.service.ts)
- Endpoints de download de recibos (SIGAA e POSCOMP) agora permitem acesso de staff via `@StaffOnly()`, para que professores possam baixar comprovantes dos candidatos

#### [MODIFY] [seed/main.ts](file:///Users/erikbayerlein/Documents/anubis/scripts/seed/main.ts)
- Sincroniza categorias de scoring a partir de `cv-scoring-config.ts` ao rodar o seed
- Cria categorias para ambos os níveis (masters/doctoral) automaticamente

---

### 2.4 Frontend — Wizard e Formulários

#### [MODIFY] [new.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/routes/_app/enrollment/new.tsx)
- Reordenação das rotas do stepper: `level → themes → academic → poscomp → cv → sigaa`

#### [MODIFY] [wizard-stepper.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/components/wizard-stepper.tsx)
- Labels e ícones reordenados para corresponder à nova ordem

#### [MODIFY] [step-cv-scoring.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/components/steps/step-cv-scoring.tsx)
- Formulário dinâmico que renderiza campos diferentes por categoria:
  - **PROJECTS**: Quantidade de semestres + checkbox "na área de pesquisa"
  - **PRODUCTION**: Select de classificação Qualis + checkboxes (completo, resumo, periódico, autor principal, dissertação, encontro IC)
  - **TEACHING**: Mestrado mostra select (IES/Monitoria) + semestres; Doutorado só semestres
  - **ORIENTATION**: Apenas semestres (doutorado)
  - **EVENTS**: Select de escopo (local/nacional/internacional) + quantidade

#### [NEW] [cv-items.ts](file:///Users/erikbayerlein/Documents/anubis/frontend/src/lib/api/cv-items.ts)
- API client wrapper para operações CRUD e verificação de itens de CV

#### [NEW] [use-cv-scoring.ts](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/hooks/use-cv-scoring.ts)
- Hook para buscar categorias de scoring por período e nível

---

### 2.5 Frontend — Portal de Revisão do Professor

#### [MODIFY] [ProfessorHome.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/professors/home/ProfessorHome.tsx)
- Dashboard agora mostra número real de candidatos inscritos por tema de pesquisa
- Botão "Ver candidatos" lista os candidatos inscritos quando clicado
- Link para página de revisão de cada candidato

#### [NEW] [enrollments.$id.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/routes/_app/manage/enrollments.$id.tsx)
- Rota `/manage/enrollments/:id` para revisão detalhada de um candidato

#### [NEW] [candidate-enrollment-review.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/components/candidate-enrollment-review.tsx)
- Tela completa de revisão (~964 linhas) mostrando:
  - Dados do candidato (IRA, universidade, SIGAA, POSCOMP, mestrado anterior)
  - Itens de CV agrupados por categoria
  - Para cada item: botões "Validar" e "Incorreto"
  - Dropdown para classificação corrigida + campo de comentário quando marcado incorreto
  - Recálculo dinâmico do score quando itens são verificados

#### [MODIFY] [candidates.ts](file:///Users/erikbayerlein/Documents/anubis/frontend/src/lib/api/candidates.ts) e [enrollments.ts](file:///Users/erikbayerlein/Documents/anubis/frontend/src/lib/api/enrollments.ts)
- Novos métodos para buscar perfis de candidatos em contexto administrativo

---

## 3. Verificação Realizada

### Testes Automatizados
```
PASS  src/cv-scoring/cv-scoring-category.service.spec.ts
PASS  src/cv-scoring/cv-item.service.spec.ts
PASS  src/cv-scoring/cv-scoring.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       35 passed, 35 total
```

### Análise Estática
- ✅ `npx tsc -p tsconfig.build.json --noEmit` — Backend sem erros
- ✅ `cd frontend && pnpm run typecheck` — Frontend sem erros
- ✅ `pnpm run lint:check` — ESLint/Prettier ok

### Banco de Dados
- ✅ Migração `0012_fat_nekra.sql` aplicada com sucesso
- ✅ Seed sincroniza categorias de scoring automaticamente

---

## 4. Decisões de Design Tomadas

| Decisão | Motivo |
|:---|:---|
| **Configuração estática em TypeScript** em vez de tabela dinâmica no banco | Usuário confirmou que as seções não mudam com frequência, mas quer facilidade de alterar pontuações no código |
| **Classificação CAPES A1–A8** em vez do antigo B1–B5 | Segue o novo quadriênio CAPES 2024/2025 |
| **`getCategoryKey()` por string matching** no nome da categoria | Permite ao seed criar categorias livremente sem IDs hardcoded |
| **`@StaffOnly()`** para verificação e download de recibos | Professores, coordenadores e secretários precisam acessar documentos de candidatos |
| **Bônus de "Encontro de IC"** é flat 0.1 sem bônus cumulativos | Conforme definido no edital |
| **Reordenação do wizard** (Temas para posição 2) | Requisito explícito do usuário |

---

## 5. Modelo ER (Atualizado)

```mermaid
erDiagram
    users ||--o| candidates : "has candidate profile"
    users ||--o| professors : "has professor profile"
    enrollments ||--o| cv_items : "contains"
    users {
        uuid id PK
        auth_provider authProvider
        varchar email UK
        varchar cpf UK
        varchar password
        varchar firstName
        varchar lastName
        role role
        status status
        boolean onboardingCompleted
        boolean mustChangePassword
        timestamp createdAt
        timestamp updatedAt
    }
    candidates {
        uuid userId PK_FK
        varchar universityOfOrigin
        numeric ira
        integer poscomp
    }
    professors {
        uuid userId PK_FK
        varchar department
        varchar institution
    }
    enrollments {
        uuid id PK
        uuid candidateId FK
        uuid enrollmentPeriodId FK
        varchar level
        varchar status
        varchar phone
        text justification
        varchar sigaaCode
        uuid sigaaReceiptFileId
        boolean declaration
        uuid primaryThemeId
        uuid secondaryThemeId
        json poscomp
        json mastersDegrees
        numeric scoreDraft
        timestamp submittedAt
    }
    cv_items {
        uuid id PK
        uuid enrollmentId FK
        uuid scoringCategoryId FK
        text description
        numeric quantity
        uuid proofFileId
        varchar proofFileName
        numeric score
        varchar classification
        boolean isComplete
        boolean isResumo
        boolean isPeriodico
        boolean isAutorPrincipal
        boolean isDissertacao
        boolean isEncontroIc
        boolean isInArea
        varchar docenciaType
        varchar eventoType
        varchar isVerified
        varchar correctedClassification
        text verificationComment
    }
```

---

## 6. Como Rodar o Projeto

```bash
# 1. Infraestrutura (PostgreSQL + Mailpit + RustFS)
docker compose up -d postgres mailpit rustfs createbuckets

# 2. Instalar dependências
pnpm install

# 3. Rodar migrações e seed
pnpm run db:migrate
pnpm run db:seed

# 4. Backend (porta 3000)
pnpm run start:dev

# 5. Frontend (porta 5173)
cd frontend && pnpm run dev
```

### Validação rápida
```bash
# Backend typecheck
npx tsc -p tsconfig.build.json --noEmit --pretty false

# Frontend typecheck
cd frontend && pnpm run typecheck

# Lint
pnpm run lint:check

# Testes de CV scoring
npx jest src/cv-scoring --runInBand
```

---

## 7. Roadmap — Trabalho Restante

### 7.1 Revisão e Merge (Prioridade Alta)
- [ ] Revisão de código da branch `refactor/cv-engine`
- [ ] Merge na `main` após aprovação

### 7.2 Teste Manual do Fluxo Completo (Prioridade Alta)
- [ ] Testar o wizard completo como candidato: criar inscrição → preencher todos os steps → submeter CV items com classificações e arquivos de comprovação
- [ ] Testar o fluxo de verificação como professor: acessar portal → validar/invalidar itens → confirmar recálculo de pontuação
- [ ] Verificar que itens marcados como `incorrect` sem `correctedClassification` zeram a pontuação
- [ ] Verificar que o score respeita o `maxPoints` de cada categoria

### 7.3 Gestão de Documentos (Prioridade Média)
- [ ] Integrar parsing e validação de outros documentos do candidato (documentos pessoais, cartas de recomendação)
- [ ] Implementar compressão/renderização de PDF no upload
- [ ] Validação de formato e tamanho de arquivo no frontend

### 7.4 UI de Configuração de Processo Seletivo (Prioridade Média)
- [ ] Criar interfaces para Secretários customizarem regras do processo seletivo (cotas, prazos, configurações de avaliação) sem alterar código
- [ ] Painel de administração para gerenciar períodos de inscrição

### 7.5 Atribuição de Professores e Ranking (Prioridade Baixa)
- [ ] Sistema de matching de candidatos para professores revisores com base nos temas de pesquisa escolhidos (1ª e 2ª opção)
- [ ] Módulo de avaliação duplo-cego para professores avaliarem cartas e históricos
- [ ] Compilação automática de rankings finais

### 7.6 Melhorias Técnicas (Backlog)
- [ ] Adicionar testes de integração para o `CvItemDrizzleRepository` (usando Testcontainers)
- [ ] Adicionar testes e2e para o fluxo completo de verificação
- [ ] Considerar migrar `getCategoryKey()` de string matching para uma coluna `key` na tabela `cv_scoring_categories` para maior robustez
- [ ] Adicionar notificações (email) quando o professor marca um item como incorreto, para que o candidato saiba que precisa corrigir

---

## 8. Arquivos-Chave para Referência Rápida

| Área | Arquivo |
|:---|:---|
| **Configuração de pontuação** | [cv-scoring-config.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/constants/cv-scoring-config.ts) |
| **Motor de cálculo** | [cv-scoring.service.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-scoring.service.ts) |
| **Verificação (service)** | [cv-item.service.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-item.service.ts) |
| **Verificação (controller)** | [cv-item.controller.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/cv-item.controller.ts) |
| **DTO de verificação** | [verify-cv-item.dto.ts](file:///Users/erikbayerlein/Documents/anubis/src/cv-scoring/dto/verify-cv-item.dto.ts) |
| **Schema do banco** | [cv-items.ts](file:///Users/erikbayerlein/Documents/anubis/src/database/schema/cv-items.ts) |
| **Migração SQL** | [0012_fat_nekra.sql](file:///Users/erikbayerlein/Documents/anubis/drizzle/0012_fat_nekra.sql) |
| **Seed** | [seed/main.ts](file:///Users/erikbayerlein/Documents/anubis/scripts/seed/main.ts) |
| **Wizard CV (frontend)** | [step-cv-scoring.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/components/steps/step-cv-scoring.tsx) |
| **Revisão do professor** | [candidate-enrollment-review.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/enrollment/components/candidate-enrollment-review.tsx) |
| **Dashboard do professor** | [ProfessorHome.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/features/professors/home/ProfessorHome.tsx) |
| **Rota de revisão** | [enrollments.$id.tsx](file:///Users/erikbayerlein/Documents/anubis/frontend/src/routes/_app/manage/enrollments.$id.tsx) |
| **API client CV items** | [cv-items.ts](file:///Users/erikbayerlein/Documents/anubis/frontend/src/lib/api/cv-items.ts) |
| **Editais (referência)** | [message.txt](file:///Users/erikbayerlein/Documents/anubis/message.txt) |

---

## 9. Regras e Convenções do Projeto

- **Mensagens de erro** devem estar em **português**
- **Imports**: Agrupar (1) Nest/externos, (2) `import type`, (3) módulos locais
- **Autenticação**: Sessões stateful com Passport, não JWT (JWT só para fluxos out-of-band)
- **Validação**: DTOs com `class-validator` em todos os inputs
- **Design System**: Alexandria — tipografia Noto Serif (títulos), Inter (corpo), cores archival gold (#6d5e00) e primary blue (#094cb2)
- **Testes**: Nomes em inglês, presente do indicativo, focados em comportamento
- **Evitar `any`**: Usar `Record<string, unknown>` para objetos flexíveis
- **Frontend**: TanStack Router (file-based), TanStack Query, TanStack Form + Zod
