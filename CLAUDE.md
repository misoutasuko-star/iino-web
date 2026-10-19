# iino web — notes for Claude

Web client for the iino iPhone app. Both talk to the same Supabase tables, so the web app must stay compatible with the phone's sync (spec: `docs/iino-spec.md`, §5.4).

## Rules that must not break
- New ids come from `crypto.randomUUID()`.
- Never hard-delete: set `deleted_at` (children with their parent). Always read `deleted_at is null`.
- Never send `updated_at` (server trigger sets it; the phone pulls by it).
- Enum strings exactly as in `src/lib/types.ts` ("Medium", "Rest Day", "Didn't Care", …).
- Weekdays 1 = Sunday … 7 = Saturday. Due/exam dates at local midnight; log `date` = now.
- One log per task/habit per local day (`src/lib/actions.ts`).
- Streaks, beans, priority and planner in `src/lib/` are ports of the Swift code and must give the same answers. Change them only together with the iPhone app, and keep `src/lib/logic.test.ts` passing.
- Ask before changing the database schema.

## Layout
- `src/lib/` pure logic + tests (no React).
- `src/data/` Supabase/local backends, auth, the store (optimistic writes).
- `src/components/`, `src/pages/` UI. Colors are CSS variables in `src/index.css`.

## Commands
`npm test`, `npm run typecheck`, `npm run build`.
