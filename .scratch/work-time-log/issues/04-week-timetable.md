# 04: See this week on the timetable

**What to build:** The user opens the app and sees the current Week (Sunday to Saturday) as day lanes: seven rows, a horizontal scrollable 24-hour axis, and each saved Time Entry drawn as a block at the time it was actually done (layout variant C from the prototype). The timetable opens scrolled near the current time. Each day shows its total and the Week shows its total. An entry crossing local midnight appears in both days, cut at the boundary, and each day's total counts only its own part. Very short entries keep a minimum width so they stay visible and clickable, and the full title and times are available on hover.

Delivered across the layers: a list behaviour in the API that takes a UTC range and returns every Time Entry overlapping it (including ones starting before the range and any still running), and the frontend timetable. The timeline maths (clip an entry to a local day, per-day and per-week totals, Sunday week boundaries, UTC to local day, block position and width) lives in pure, framework-free functions separate from components. Times are stored in UTC and shown in the browser's time zone; dates are YYYY-MM-DD, times HH:mm.

**Blocked by:** 03 (Start and stop a timer).

**Status:** ready-for-agent

- [ ] Entries saved in ticket 03 appear as blocks in the correct day lane at the correct time and length
- [ ] A midnight-crossing entry shows in both days and daily totals count only the portion within each day
- [ ] Day totals and the Week total are shown and correct
- [ ] The week starts on Sunday and the timetable opens scrolled near the current time
- [ ] Short entries remain visible and clickable; hovering shows full title and times
- [ ] API tests cover the list behaviour, including an entry crossing the range edge and a still-running entry
- [ ] Jest tests cover every timeline function listed above through its public interface, including midnight crossing and a running entry
- [ ] The layout follows prototype variant C and DESIGN.md; desktop only
