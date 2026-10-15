# 08: Polish and conformance

**What to build:** A final pass so the finished app is consistent and robust. Check the whole page against DESIGN.md (single aubergine primary, pill buttons, no extra accent colours, error colour only for destructive actions, Inter font, Tailwind tokens as utilities only), keyboard navigation and visible focus on every interactive element, hover / focus / active / disabled states with the right cursors, loading states per the frontend instructions (skeleton for fetched data, spinner on triggered actions), and clear user-facing messages when the server is unreachable or a request fails. Confirm everything in the Definition of Done.

**Blocked by:** 05, 06, 07.

**Status:** ready-for-agent

- [ ] No hand-written CSS rules or inline styles, except the computed block and marker positions on the timetable (each documented with a `Note:` comment); DESIGN.md tokens are consumed as Tailwind utilities only
- [ ] Every interactive element has hover, focus, active and disabled states and keyboard access
- [ ] Contrast meets WCAG 2.1 AA on all text and controls
- [ ] A running block is told apart from finished blocks by more than its dashed outline (a shape-only cue): for example screen-reader text or an `aria-label` that says it is running
- [ ] The timetable shows a skeleton while loading; Start / Stop / Delete show a spinner while in flight
- [ ] An unreachable server or failed request produces a clear message and leaves the UI usable
- [ ] Root Definition of Done holds: build, tests and format checks pass, no unrelated changes, no unnecessary files
