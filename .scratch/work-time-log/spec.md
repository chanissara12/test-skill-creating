Status: ready-for-agent

# Work Time Log

## Problem Statement

I do many small pieces of work during the day and have no easy record of what I did and for how long. I want to type what I'm working on, press start, press stop when I'm done, and later see my week at a glance: which work happened when, and how long each day added up to.

## Solution

A single-page web app for one person. At the top, the user types what they are working on and presses Start; a Running Timer begins and keeps counting, even across page reloads. Pressing Stop saves it as a Time Entry. Below, a timetable for the current Week (Sunday to Saturday) shows one row per day with a horizontal 24-hour axis; each Time Entry appears as a block placed at the time it was actually done, and the Running Timer appears as a growing dashed block. Each day shows its total, the Week shows its total, and any Time Entry can be opened and deleted after confirmation. The look follows the project's DESIGN.md; the chosen layout is variant C of the throwaway prototype (day lanes, horizontal axis).

## User Stories

1. As a user, I want to type a short description of my work and press Start, so that the time I spend on it begins being tracked.
2. As a user, I want Start to be unavailable while the description is empty, so that I never record work with no name.
3. As a user, I want the description limited to 200 characters, so that entries stay short and readable on the timetable.
4. As a user, I want to press Enter in the description field to start the timer, so that I can begin without reaching for the mouse.
5. As a user, I want to see the elapsed time counting up every second while the timer runs, so that I know how long I have been working.
6. As a user, I want the description field to lock and show the running work's name while the timer runs, so that I can see what I am timing.
7. As a user, I want the Start button to become Stop while the timer runs, so that there is one obvious action at any moment.
8. As a user, I want to press Stop to save the work as a Time Entry, so that it appears in my history.
9. As a user, I want only one Running Timer at a time, so that my time is never double-counted.
10. As a user, I want an attempt to start a second timer to be refused with a clear message, so that I understand why nothing started.
11. As a user, I want the timer to keep running if I refresh the page or close and reopen the tab, so that I never lose time by accident.
12. As a user, I want the elapsed time to be based on the clock rather than on counting ticks, so that it stays correct when the tab is throttled or the computer sleeps.
13. As a user, I want to see this Week as one row per day, Sunday to Saturday, so that I can compare my days.
14. As a user, I want each row to have a horizontal 24-hour axis that I can scroll, so that work done at any hour is visible.
15. As a user, I want the timetable to open scrolled to the current time, so that what I am doing now is in view.
16. As a user, I want each Time Entry drawn as a block spanning its start to stop time, so that I can see when and for how long I worked.
17. As a user, I want the Running Timer drawn as a dashed block growing up to the current time, so that I can tell it apart from finished work.
18. As a user, I want the current time marked on today's row, so that I can orient myself.
19. As a user, I want today's row highlighted, so that I can find it quickly.
20. As a user, I want very short Time Entries to still be visible and clickable, so that they do not disappear on the timetable.
21. As a user, I want to hover over or open a block to see the full title, start, stop, and duration, so that I can read entries too small to label.
22. As a user, I want a Time Entry that crosses midnight to appear in both days, cut at the day boundary, so that each day's picture is complete.
23. As a user, I want each day's total to count only the part of an entry that falls on that day, so that daily totals are honest.
24. As a user, I want to see each day's total at the start of its row, so that I can compare days without adding blocks in my head.
25. As a user, I want to see the Week's total, so that I know how much I worked this week.
26. As a user, I want Previous, Next, and This Week controls, so that I can browse my history week by week.
27. As a user, I want to see the date range of the Week being shown, so that I know where I am.
28. As a user, I want to open a Time Entry and delete it, so that I can remove a mistake.
29. As a user, I want a confirmation step before a delete, so that I do not lose an entry by a stray click.
30. As a user, I want the Running Timer to be undeletable until it is stopped, so that I do not destroy work in progress by accident.
31. As a user, I want times stored in UTC and shown in my browser's time zone, so that the app stays correct if the server or my time zone changes.
32. As a user, I want days to be grouped by my local calendar day, so that "Monday" means my Monday.
33. As a user, I want dates shown as YYYY-MM-DD and times as HH:mm, so that formats are consistent across the app.
34. As a user, I want the app to follow the project's design system, so that it looks consistent with the rest of the product.
35. As a user, I want the Start/Stop button and week controls to be usable by keyboard with visible focus, so that I can operate the app without a mouse.
36. As a user, I want a clear message when something fails (for example the server is unreachable), so that I know my action did not go through.

## Implementation Decisions

**Domain language** (see CONTEXT.md): Time Entry, Running Timer (a Time Entry with no stop time), Week (Sunday to Saturday). There is no separate timer table; a Running Timer is simply a Time Entry whose stop time is empty.

**Shape of the system**
- A single-page Angular frontend (feature modules, Tailwind utilities only, per the frontend instructions) talking to a .NET Core Web API backend (Domain / Server / Service layering, per the backend instructions), backed by PostgreSQL via Entity Framework Core.
- Single user, no authentication, no user identifier anywhere in the data model.
- Runs locally only; not deployed.

**Database (database-first)**
- The user creates the PostgreSQL database. The agent only writes a SQL script for the user to review and run; the agent never executes it, and application code is written against the existing schema.
- One table for Time Entries: an identifier, a required title (maximum 200 characters), a start instant, and a nullable stop instant. Instants are stored as timestamptz in UTC. Names follow PostgreSQL snake_case convention.
- No database-level rule enforcing a single Running Timer (explicitly decided against, see Further Notes). No other constraints beyond required title length, not-null start, and a stop that is not before the start.

**Backend API contract (behavior, not paths)**
- Start: takes a title; trims it; rejects empty or over-length titles; rejects with a conflict response if a Running Timer already exists; otherwise creates a Time Entry whose start is the server's current UTC time and returns it.
- Stop: finds the Running Timer and sets its stop to the server's current UTC time; rejects if none is running.
- Get running: returns the Running Timer if one exists, otherwise nothing. The frontend calls this on load so the timer survives reloads.
- List: takes a UTC start and end and returns every Time Entry overlapping that range (including entries that began before the range or are still running), ordered by start. The frontend derives the range from the local-time Week boundaries.
- Delete: removes a Time Entry; rejects deleting the Running Timer with a conflict response.
- The server clock is authoritative for start and stop; the client never sends timestamps for these actions.
- Business-rule failures use the project's validation exception pattern (created the first time it is needed, per backend instructions) and surface as meaningful, non-leaky messages; no stack traces or internals in responses.

**Frontend behavior**
- One page, no routing. Top section: description input, Start/Stop button, elapsed time. Below: the Week timetable.
- Elapsed time and the Running Timer's block length are computed from the start instant and the current clock, refreshed every second.
- Timetable is the day-lanes layout from the prototype: seven rows (Sunday first), a horizontal 24-hour axis, scrollable, opening scrolled near the current time; the Week is changed by Previous / Next / This Week; header shows the week's date range and total.
- Block geometry: position and width proportional to time within the day, with a minimum width so short entries stay visible and clickable. Entries crossing local midnight are clipped to each day they touch.
- Finished entries and the Running Timer are visually distinct (dashed outline for running), per the design system tokens in DESIGN.md (single aubergine primary, pill buttons, no extra accent colors; error color only for destructive actions).
- Clicking a block opens a details view with title, start, stop (or "running"), and duration, plus a Delete action that requires confirmation; Delete is unavailable for the Running Timer.
- Display formats: dates YYYY-MM-DD, times HH:mm, durations as hours and minutes (seconds only on the live timer).
- Desktop only for v1; no mobile-specific layout.
- Timeline math (clipping an entry to a local day, per-day and per-week totals, week boundaries starting Sunday, block position and width) lives in pure, framework-free functions separate from components, so it can be tested directly.

**Prototype origin:** the layout, interactions, and clipping behavior were validated in a throwaway HTML prototype (variant C), kept at `.scratch/work-time-log-plan/prototype/` as a reference; it is not production code and should be rewritten properly in Angular.

## Testing Decisions

- A good test exercises external behavior only (what an API caller or a function consumer can observe), never internal structure, private methods, or rendering details.
- **Seam 1: the backend HTTP API.** Highest seam on the backend. Tests drive start, stop, get-running, list, and delete through the API against a real PostgreSQL test database, covering: starting and stopping; refusing a second Running Timer; empty and over-length titles; stopping with nothing running; deleting the Running Timer being refused; deleting a finished entry; list returning entries that overlap a range, including ones crossing the range edge and a still-running one. Use xUnit (Moq only where a collaborator truly must be faked), Arrange / Act / Assert, clear names, success and failure cases.
- **Seam 2: the frontend timeline functions.** Highest seam on the frontend that holds real logic. Jest tests cover: clipping an entry to a local day, including one crossing midnight and a still-running one; per-day and per-week totals counting only the clipped portion; Week boundaries starting on Sunday; mapping UTC instants to local days; block position and minimum width.
- Not tested: Angular framework behavior, third-party libraries, HTML/CSS rendering, button states, and the live ticking display.
- Prior art: none yet (new project); the test frameworks and rules are fixed by the backend and frontend instruction files, including the rule never to edit a test just to make it pass.

## Out of Scope

- Authentication, multiple users, per-user data.
- Deployment or hosting.
- Mobile or small-screen layout.
- Editing a Time Entry's title or times, search, export.
- Projects, tags, categories, or notes on entries.
- Guards against a forgotten Running Timer (no auto-stop, no warning, no back-dated stop time); the user can delete an overly long entry after stopping it.
- Day-only or other views besides the Week timetable.
- A database constraint enforcing a single Running Timer.

## Further Notes

- The rule "one Running Timer at a time" is enforced by the backend check and by the disabled Start button only. Two near-simultaneous start requests (for example from two tabs) could in principle both succeed. This is a conscious trade-off for a single-user local app, chosen over adding a database constraint.
- Database-first rule: the agent writes SQL for review and never runs it; the user creates and owns the database.
- Because the product has no code yet, the proposed project layout in the frontend and backend instruction files is a proposal; the first implementation ticket should create the solution structure.
- Glossary lives in CONTEXT.md; design tokens live in DESIGN.md.
