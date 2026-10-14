# 01: Project skeleton

**What to build:** An empty but working foundation for both apps, so every later ticket starts from green builds. The .NET backend is a solution with the Domain / Server / Service / Service.Test layering described in the backend instructions (dependency direction Server → Service → Domain), named with the `TestSkillCreating` prefix. The Angular frontend uses feature modules, Tailwind utilities only, and Jest; the DESIGN.md colour, radius and font tokens are declared once as Tailwind theme tokens so later work consumes them as utilities (no raw variables). As a tracer bullet, the page calls a trivial health endpoint on the backend and shows the result, proving both apps talk to each other locally.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The backend builds, its (empty) test project runs green, and the format check from the backend instructions passes
- [ ] The frontend builds and its test runner runs green; a Tailwind utility using a DESIGN.md token (for example the primary colour) renders correctly
- [ ] The page displays the backend's health response when both apps run locally (CORS allows the local frontend origin only)
- [ ] Layer dependency direction is respected (Domain depends on nothing project-specific)
- [ ] Config templates contain placeholder values only; no secrets are committed and `.env`-style files are ignored
- [ ] The commands listed in the frontend and backend instruction files all work as written
