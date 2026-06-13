# OpenSpec Agent Workflow

Rules for AI agents working in this codebase.

## Session Start

1. Read root `CLAUDE.md` or `AGENTS.md` for project context
2. Read `openspec/project.md` for technical spec
3. Check `openspec/changes/` for active proposals

## Codebase Exploration

- Use CodeGraph tools (`codegraph_*`) when available for symbol lookup
- Navigate `openspec/changes/[id]/` for feature proposals
- Each proposal has: `proposal.md`, `tasks.md`, `specs/*.md`

## Change vs Direct Edit

**Requires proposal (`openspec/changes/`):**
- New features or user flows
- Database schema changes
- API endpoint additions
- Changes affecting `paid` filtering logic

**Direct edit OK:**
- Bug fixes with clear scope
- Typo/copy fixes
- Test additions for existing code
- Refactors that don't change behavior

## Task Granularity

| Tier | Description | Task Detail |
|------|-------------|-------------|
| LOW  | Single file, obvious change | One-liner task |
| MID  | Multi-file, clear scope | 3-5 step tasks |
| HIGH | Cross-cutting, risky | Detailed steps with checkpoints |

## Skill Triggers

| Trigger | Action |
|---------|--------|
| DB schema change | Update `openspec/project.md`, add migration |
| Swiss pairing logic | Require test coverage |
| Payment flow change | Require proposal |
| Security-sensitive | Flag for review |

## Hard Rules

- NEVER skip `paid = TRUE` filter in pairing/standings
- NEVER modify schema without OpenSpec update
- NEVER store secrets in code
- NEVER push to remote without explicit approval
- Registration ID: `CATUR{YEAR}-{SEQ}`
- Tournament code: `^[a-z0-9_]+$`

## Handoff

When ending a session, summarize:
1. What was completed
2. What remains (reference task IDs)
3. Any blockers or decisions needed
