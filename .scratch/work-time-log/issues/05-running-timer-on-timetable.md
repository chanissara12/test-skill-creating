# 05: Running Timer on the timetable

**What to build:** While a timer runs, the user sees it on today's lane as a dashed-outline block that grows up to the current time, updating every second together with the elapsed counter. Today's lane is highlighted and a marker shows the current time, so the user can orient themselves at a glance. When the timer stops, the block becomes a normal finished block without a reload.

**Blocked by:** 04 (See this week on the timetable).

**Status:** done

- [x] A running timer appears as a dashed block that lengthens each second on today's lane
- [x] A midnight-crossing running timer is cut at the day boundary like a finished entry
- [x] The current-time marker and today's highlight are visible on today's lane
- [x] Stopping converts the block to a finished one and updates the daily and Week totals
- [x] Totals include the elapsed part of the Running Timer and update live
- [x] Any new timeline calculation added here is covered by Jest tests through the pure functions

## Confirmed before starting (2026-10-15)

- **Design gate:** the user confirmed `DESIGN.md` is the only design system to follow (layout: prototype variant C).
- **Test seams:** (1) the pure timeline functions (Jest): today's row by `now` (including after midnight), position of the current-time marker, totals growing with `now`, a running timer crossing midnight; (2) the "now ticks every second" helper (Jest, fake timers): advances each second and stops when its owner is destroyed. No backend seam (the API does not change). Look and feel (dashed outline, marker, highlight) is not unit tested; it is checked in the browser.
- **New names:** helper `nowEverySecond(destroyRef)` in the shared helpers (returns a signal of epoch milliseconds; the timer panel switches to it too); `isToday` and `nowLeftPx` on the existing `DayRow` (no new type; `nowLeftPx` only exists on today's row).
- **Defaults:** running block = dashed primary outline on a white fill; finished blocks unchanged; current-time marker = black vertical line on today's row only; today's label cell = lavender background with primary text; everything reads the same `now`. Out of scope: leaving the page open across Saturday midnight keeps showing the old week (ticket 06 handles week changes).
- **Changed after review:** `isToday` was dropped. It always equalled `nowLeftPx !== undefined`, so two fields held one fact. The template names it with `@let isToday`.
