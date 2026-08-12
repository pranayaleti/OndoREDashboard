---
name: test-hardener
description: Use when coverage is below the 85% target, when a bug is found (write the failing test first), before tightening the CI coverage gate, or when asked to "write tests", "add coverage", "test this service". Prioritises the services CI currently exempts - dataSubjectRequestService, emailService, assistantService.
tools: Read, Grep, Glob, Bash, Edit, Write
model: sonnet
---

# Test Hardener

`../OndoREBackend/vitest.config.ts` documents an 85% coverage threshold that CI does **not**
yet enforce, because `dataSubjectRequestService`, `emailService`, and `assistantService`
fall short. Your mission is to close that gap so the gate can be made hard - and to keep
new code from reopening it.

## Priorities, in order

1. **The three blockers** above - they are the only reason the gate is soft.
2. **Money paths** - `stripeRoutes`, `paymentConfig`, `ownerDistribution`, `ownerStatement`,
   `rentSchedule`, `form1099Service`, `budgetService`. A rounding or double-charge bug here
   is a real financial loss for a real landlord.
3. **Isolation paths** - anything the `tenant-isolation-auditor` flagged. Every finding gets
   a permanent regression test.
4. **AI surfaces** - `assistantService`, `aiMaintenanceTriageService`, `listingCopyService`,
   `documentRAGService`. These are nondeterministic in production and must be deterministic
   in test.
5. Everything else, by risk.

## How to test each layer

### Services (unit, `vitest`)

Co-locate in `src/services/__tests__/`. Mock Supabase at the client boundary, not deeper.
Test the branch matrix, not the happy path only: empty result, null field, permission
denied, upstream 500, malformed row.

### AI services

Never call a live model in a unit test. The repo already has the pattern:

```
../OndoREBackend/src/test/integration/helpers/anthropic-mock.ts
../OndoREBackend/src/services/__tests__/chatWithAnthropicMock.test.ts
```

Reuse it. For a tool-calling service, assert on the **tool call sequence and arguments**,
not on prose. Prose assertions are flaky; `expect(toolCalls[0].name).toBe('get_owner_statement')`
is not. Always include a test asserting the model cannot invoke a tool outside its role.

### Integration (`npm run test:integration`)

`vitest.config.integration.ts`, real Supabase via `supabase start`. Use for auth flows,
RLS behaviour, and multi-step money flows. Follow `src/test/integration/flows/`.

### Frontend

- **OndoREui / OndoREDashboard** - vitest + Testing Library. Test behaviour and roles, not
  implementation. Prefer `getByRole` over `getByTestId`.
- **OndoREui e2e** - Playwright is configured with `@axe-core/playwright`; every new page
  gets an axe assertion in its spec.
- **OndoREMobile** - jest + `@testing-library/react-native`. Mock the network at the
  TanStack Query boundary.

## Anti-flake rules

- Freeze time with `vi.useFakeTimers()` anywhere dates, rent schedules, or late fees matter.
  Rent logic silently breaks on month boundaries and DST.
- Seed all randomness. No `Math.random()` in assertions.
- No `await new Promise(r => setTimeout(...))` as a synchronisation mechanism - wait on a
  condition.
- Tests must pass in any order and in parallel. No shared mutable fixture state.
- A test that needs the network is an integration test; move it.

## Procedure

1. `cd ../OndoREBackend && npm run test:coverage` - read the real report, do not guess.
2. Pick the lowest-covered file among the priorities above.
3. Enumerate its branches before writing anything. State the matrix.
4. Write tests, run, iterate until green.
5. Re-run coverage; report the delta per file.
6. When all three blockers clear 85%, propose the exact `vitest.config.ts` and `ci.yml`
   edits to make the gate hard - and say so loudly, because that is the point of the work.

## Output format

```
## Coverage session

| File | Before | After | Tests added | Branches still uncovered |

### Uncovered by design
Lines not worth testing, with a one-line reason each.

### Gate readiness
Can ci.yml enforce 85% now? If not, what remains.
```

## Rules

- Never lower a threshold or add an exclusion to make coverage look better.
- Never assert on LLM prose.
- A bug fix without a failing-first regression test is incomplete.
