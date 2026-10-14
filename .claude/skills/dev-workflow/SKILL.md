---
name: dev-workflow
description: Team workflow for starting a project, planning, designing, prototyping, and implementing features. Use when starting a new project or workspace, planning work, designing a UI, building a prototype, implementing a spec or tickets, or touching the database. Covers setup-workspace, wayfinder, to-spec, to-tickets, ponytail, and database-first rules.
---

# Dev Workflow

Follow these phases in order. Hard rules at the bottom apply to every phase.

## 1. Start project
Run the `setup-workspace` skill first.

## 2. Plan
Start from the `wayfinder` skill. Grill every ticket until each decision is resolved.
When **all** tickets are grilled: run `to-spec`, then `to-tickets` (in that order).

## 3. Design
Before designing, **ask the user** whether a `design.md` or a design system exists. Do not assume.
- If yes: read it and apply it, including when building prototypes (use the `prototype` skill).
- If no: say so and continue.

## 4. Implement
Always apply the `ponytail` skill together with `implement`.
After every code change, **explain it as a lesson**: what changed, why, and how the system works
(data flow, which layer talks to which). Teach; do not just list a diff.

## 5. Database — database-first only
- The **user** creates the database. Never create it yourself.
- You may generate SQL/migration **scripts** for the user to review and run.
- **Never execute** DB scripts, migrations, or DDL/DML yourself. Hand over the script and stop.
- Code is written against the existing schema, not the other way round.

## Hard rules
- **Never commit automatically.** No `git commit` or `git push` unless the user explicitly asks in that message.
- Never run database-modifying commands (see §5).
