# 🔄 HANDOFF — Ajuste Granular de Validação + Unificação de Cursos/Instituições

> **Branch:** `refactor/candidate-evaluation`
> **Data:** 2026-07-10
> **Status:** WIP — Frontend parcialmente pronto, Backend pendente

---

## ✅ O que foi feito

### Fase 1 — Schema do Banco (Drizzle ORM)

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `src/database/schema/universities.ts` | ✅ Feito | `mecScore: integer('mec_score')` adicionado à tabela `courses` |
| `src/database/schema/enrollments.ts` | ✅ Feito | Campos texto `undergradUniversity`/`undergradCourse` removidos; FKs `undergradUniversityId`/`undergradCourseId` adicionados; `mecFactor`, `iraAdjusted` adicionados |
| `src/database/schema/cv-items.ts` | ✅ Feito | `isVerified`/`correctedClassification`/`verificationComment` removidos; `verificationStatus`/`adjustedScore`/`verificationJustification`/`verifiedBy`/`verifiedAt` adicionados |
| `src/cv-scoring/constants/mec-score-config.ts` | ✅ Feito | Constante `MEC_SCORE_FACTORS`, `DEFAULT_MEC_FACTOR` e `getMecFactor()` |
| `drizzle/0018_youthful_arclight.sql` | ✅ Gerado | Migration gerada via `drizzle-kit generate` (com script Python para TTY) |

> [!WARNING]
> **Migration não foi aplicada.** O `drizzle-kit migrate` falha — possivelmente devido a migrations SQL orphans no diretório `drizzle/` que não estão registradas no journal (ex: `0010_add_search_vectors.sql`, `0017_interview_evaluations.sql`, `0018_project_evaluations.sql`, `0019_final_classifications.sql`). Essas precisam ser reconciliadas ou removidas antes de migrar. Ver seção "Problemas Conhecidos" abaixo.

### Fase 3 — Frontend (React/Vite)

#### 3.1 API Client (`frontend/src/lib/api/`)

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `cv-items.ts` | ✅ Feito | Tipos atualizados: `verificationStatus`, `adjustedScore`, `verificationJustification`, `verifiedBy`, `verifiedAt`. Método `verify()` recebe novo payload |
| `enrollments.ts` | ✅ Feito | Campos `undergradUniversityId`, `undergradCourseId`, `mecScore`, `mecFactor`, `iraAdjusted` adicionados ao tipo `Enrollment` e normalizer. `mecFactor` adicionado ao `UpdateEnrollmentPayload` |
| `universities.ts` | ✅ Feito | `mecScore` adicionado ao tipo `Course`; `findCourseById()` e `updateMecScore()` adicionados |
| `validation.ts` | ✅ Feito | `updateScore()` atualizado com payload granular (`status`, `adjustedScore`, `justification`) |
| `index.ts` | ✅ Feito | Exports atualizados |

#### 3.2 Hooks

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `use-cv-scoring.ts` | ✅ Feito | `useVerifyCvItem` mutation com novo payload |
| `use-validation.ts` | ✅ Feito | `useUpdateValidationScore` com invalidações de query corretas |

#### 3.3 Tela de Validação — `ValidationForm.tsx`

**✅ Feito.** Refatorado para fluxo granular:
- 3 botões por item: **Aceitar Nota** / **Ajustar Nota** / **Rejeitar Item**
- Input numérico para nota ajustada (aparece apenas em "Ajustar Nota")
- Textarea de justificativa obrigatória em "Ajustar" e "Rejeitar"
- Badges visuais de status: Aceito (verde), Ajustado (amarelo), Rejeitado (vermelho)
- Botões "Salvar Avaliação" e "Cancelar" com toggle dinâmico

#### 3.4 Tela de Revisão — `candidate-enrollment-review.tsx`

**✅ Feito (parcialmente).** Mudanças aplicadas:
- **Card Dados Acadêmicos expandido** com: IRA declarado, Nota MEC do Curso (badge), Fator MEC (editável pelo staff via select dropdown + input custom), IRA Ajustado (calculado automático), fórmula exibida
- Botão "Ajustar Fator" visível apenas para roles != candidate
- Inline edit do Fator MEC com select (1.0/0.8/0.6/0.4/0.2) + opção custom + validação + save via `updateEnrollment` mutation
- **Verificação inline de CV items** refatorada: botões Aceitar/Ajustar/Rejeitar com input de nota e justificativa no drawer de itens

#### 3.5 Tela de Inscrição — `step-academic-info.tsx`

**✅ Feito.** Substituição dos inputs texto por `SearchableSelect`:
- `undergradUniversity` → `SearchableSelect` com hook `useUniversitySearch`
- `undergradCourse` → `SearchableSelect` com hook `useCourseSearch(universityId)`
- Course desabilitado até universidade ser selecionada
- **Dialog "Cadastrar Nova Instituição"** inline: nome, sigla, cidade, estado → `createUniversityMutation`
- **Dialog "Cadastrar Novo Curso"** inline: nome → `createCourseMutation` (pre-seleciona universidade)
- Payload de submit atualizado para enviar `undergradUniversityId`, `undergradCourseId` e textos como backup
- Validação atualizada para exigir IDs em vez de texto

---

## ❌ O que NÃO foi feito (pendente)

### Fase 2 — Backend (NestJS) — NADA feito

Nenhum arquivo backend de service/controller/DTO/repository foi alterado. Apenas schemas (Drizzle) e a constante `mec-score-config.ts`.

#### 2.1 Módulo `cv-scoring` — Refatorar Verificação

| Arquivo | O que fazer |
|---------|-------------|
| `src/cv-scoring/dto/verify-cv-item.dto.ts` | Substituir `isVerified: 'verified' \| 'incorrect'` por `status: 'accepted' \| 'partial' \| 'rejected'`, adicionar `adjustedScore?: number` e `justification?: string` |
| `src/cv-scoring/domain/cv-item.ts` | Trocar `isVerified` por `verificationStatus`, adicionar `adjustedScore`, `verificationJustification`, `verifiedBy`, `verifiedAt` |
| `src/cv-scoring/cv-item.service.ts` | Refatorar método `verify()` — lógica de aceitar/ajustar/rejeitar, cálculo de `adjustedScore`, validação de justificativa obrigatória |
| `src/cv-scoring/cv-scoring.service.ts` | `calculateItemScore()` usa `isVerified` (L87-98) — trocar para `verificationStatus` e `adjustedScore` |
| `src/cv-scoring/cv-scoring.service.spec.ts` | Atualizar mocks que usam `isVerified: 'pending'` |
| `src/cv-scoring/infrastructure/persistence/cv-item.repository.ts` | Interface: trocar `isVerified` por campos novos |
| `src/cv-scoring/infrastructure/persistence/drizzle/cv-item.drizzle-repository.ts` | Implementação: trocar `isVerified` por campos novos no `update()` |

#### 2.2 Módulo `enrollment` — Suportar FKs

| Arquivo | O que fazer |
|---------|-------------|
| `src/enrollment/domain/enrollment.ts` | Trocar `undergradUniversity: string` por `undergradUniversityId: string \| null`, `undergradCourseId: string \| null`; adicionar `mecFactor`, `iraAdjusted` |
| `src/enrollment/dto/update-enrollment.dto.ts` | Adicionar `undergradUniversityId?: string`, `undergradCourseId?: string`, `mecFactor?: string`; remover (ou manter temporariamente) `undergradUniversity?`, `undergradCourse?` |
| `src/enrollment/dto/enrollment-response.dto.ts` | Adicionar `undergradUniversityId`, `undergradCourseId`, `mecScore`, `mecFactor`, `iraAdjusted` |
| `src/enrollment/enrollment.service.ts` | `update()` L134-135: trocar `undergradUniversity` por FKs; L232: trocar validação de `undergradUniversity` texto por FK; adicionar lógica de cálculo IRA ajustado |
| `src/enrollment/enrollment.service.spec.ts` | Atualizar todos os mocks que usam `undergradUniversity: 'UFRN'` |

#### 2.3 Módulo `university` — Endpoint de Nota MEC

| Arquivo | O que fazer |
|---------|-------------|
| `src/university/university.service.ts` | Adicionar `updateCourseMecScore(courseId, mecScore)` |
| `src/university/university.controller.ts` | Novo endpoint `PATCH /courses/:id/mec-score` (StaffOnly guard) |
| DTOs | Criar `UpdateMecScoreDto`, ajustar response DTOs para incluir `mecScore` |

#### 2.4 Módulo `validation` — Expor dados MEC

| Arquivo | O que fazer |
|---------|-------------|
| `src/validation/validation.service.ts` | L77: trocar `cvItems.isVerified` por `cvItems.verificationStatus`; incluir `mecScore`, `mecFactor`, `iraAdjusted` no dashboard de candidatos |

### Fase 4 — Seed e Migration

| Item | O que fazer |
|------|-------------|
| `scripts/seed/main.ts` | L569: trocar `undergradUniversity: 'UFC'` por FKs (`undergradUniversityId`, `undergradCourseId`); criar seed de universidades e cursos com `mecScore` |
| Migration aplicação | Resolver conflito das migrations orphans (ver "Problemas Conhecidos"), depois rodar `pnpm run db:migrate` |
| Testes | Rodar `pnpm test` e `pnpm run test:integration` após refator; ajustar specs quebrados |

### Frontend pendente

| Item | O que fazer |
|------|-------------|
| Tela de Gestão de Cursos/Instituições (Staff) | Criar nova página acessível via menu do staff para listar/criar/editar instituições e cursos, com atribuição de nota MEC |
| Typecheck | Rodar `npx tsc -p frontend/tsconfig.json --noEmit` — os novos imports (`Dialog`, `SearchableSelect`, hooks) podem ter problemas de tipagem se as interfaces do `SearchableSelect` não aceitam todas as props que estamos passando (ex: `disabled`, `error`, `allowCustom`, `onCustomSelect`) |

---

## ⚠️ Problemas Conhecidos

### 1. Migrations orphans no diretório `drizzle/`

Existem arquivos SQL que **não estão registrados** em `drizzle/meta/_journal.json`:

| Arquivo | Status |
|---------|--------|
| `0010_add_search_vectors.sql` | ❌ Orphan — journal tem `0010_concerned_the_liberteens` |
| `0017_interview_evaluations.sql` | ❌ Orphan — journal tem `0017_wise_miracleman` |
| `0018_project_evaluations.sql` | ❌ Orphan — journal tem `0018_youthful_arclight` |
| `0019_final_classifications.sql` | ❌ Orphan — journal NÃO tem idx 19 |

**Ação necessária:** Verificar se estas são migrations de outra branch/PR. Se sim, deletá-las ou integrá-las no journal antes de rodar `db:migrate`. O `0018_youthful_arclight.sql` (nossa migration) já inclui as tabelas `classifications`, `interview_evaluations`, `project_evaluations` porque elas estavam nos schemas mas nunca foram migradas.

### 2. `db:migrate` falha

Rodamos `pnpm run db:migrate` em um banco limpo (DROP SCHEMA + CREATE SCHEMA) e ainda assim falhou com exit code 1 sem output de erro visível. **Possível causa:** conflito entre migrations orphans e journal entries, ou as migrations 0010/0017 duplicadas causam erro de parsing no drizzle-kit.

### 3. Backend compila com erros

O schema Drizzle removeu `isVerified`, `correctedClassification`, `verificationComment` da tabela `cv_items` e `undergradUniversity`/`undergradCourse` de `enrollments`, mas o código TypeScript do backend (services, DTOs, repositories, specs) ainda referencia esses campos. O `npx tsc` vai falhar até que a Fase 2 seja completada.

### 4. `drop_db.js` no workspace root

Arquivo temporário `drop_db.js` na raiz do projeto — deve ser removido antes do commit final. Está listado como `?? drop_db.js` no git status.

---

## 📋 Próximos Passos (ordem sugerida)

### Passo 1 — Resolver migrations e banco
1. Deletar ou reconciliar as migrations orphans (`0010_add_search_vectors.sql`, `0017_interview_evaluations.sql`, `0018_project_evaluations.sql`, `0019_final_classifications.sql`)
2. Rodar `docker compose up -d postgres` (postgres precisa estar rodando)
3. Executar `node drop_db.js` para limpar o banco
4. Rodar `pnpm run db:migrate`
5. Deletar `drop_db.js`

### Passo 2 — Backend: Refatorar cv-scoring (Fase 2.1 + 2.2)
1. Atualizar `domain/cv-item.ts` → `verificationStatus`, `adjustedScore`, etc.
2. Atualizar `dto/verify-cv-item.dto.ts` → novo DTO com `status`, `adjustedScore`, `justification`
3. Atualizar `infrastructure/persistence/cv-item.repository.ts` interface e implementação drizzle
4. Refatorar `cv-item.service.ts` → método `verify()` com lógica granular
5. Refatorar `cv-scoring.service.ts` → `calculateItemScore()` usando `verificationStatus` + `adjustedScore`
6. Atualizar `validation.service.ts` → query SQL que usa `isVerified`

### Passo 3 — Backend: Refatorar enrollment (Fase 2.3)
1. Atualizar `domain/enrollment.ts` → FKs + `mecFactor` + `iraAdjusted`
2. Atualizar DTOs (`update-enrollment.dto.ts`, `enrollment-response.dto.ts`)
3. Refatorar `enrollment.service.ts` → aceitar FKs, calcular IRA ajustado
4. Adicionar endpoint `PATCH /courses/:id/mec-score` no university controller

### Passo 4 — Backend: Seed
1. Atualizar `scripts/seed/main.ts` → criar universidades/cursos com `mecScore`, usar FKs nos enrollments

### Passo 5 — Validação
1. `npx tsc -p tsconfig.build.json --noEmit` — deve compilar sem erros
2. `pnpm run lint:check`
3. `pnpm test` — corrigir specs quebrados
4. Testar fluxo completo no navegador (inscrição → validação)

### Passo 6 — Frontend: Tela de Gestão (Fase 3.3 do plano)
1. Criar página Staff para listar/editar instituições e cursos
2. Atribuição de nota MEC inline

---

## 📁 Arquivos modificados (resumo git)

```
 M drizzle/meta/_journal.json
 M frontend/src/features/enrollment/components/candidate-enrollment-review.tsx
 M frontend/src/features/enrollment/components/steps/step-academic-info.tsx
 M frontend/src/features/enrollment/hooks/use-cv-scoring.ts
 M frontend/src/features/validation/components/ValidationForm.tsx
 M frontend/src/features/validation/hooks/use-validation.ts
 M frontend/src/lib/api/cv-items.ts
 M frontend/src/lib/api/enrollments.ts
 M frontend/src/lib/api/index.ts
 M frontend/src/lib/api/universities.ts
 M frontend/src/lib/api/validation.ts
 M src/database/schema/cv-items.ts
 M src/database/schema/enrollments.ts
 M src/database/schema/universities.ts
?? drizzle/0018_youthful_arclight.sql          (migration nova)
?? drizzle/meta/0018_snapshot.json              (snapshot da migration)
?? src/cv-scoring/constants/mec-score-config.ts (constante nova)
?? drop_db.js                                   (temporário, remover)
```
