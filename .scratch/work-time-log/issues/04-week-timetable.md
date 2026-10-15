# 04: See this week on the timetable

**What to build:** The user opens the app and sees the current Week (Sunday to Saturday) as day lanes: seven rows, a horizontal scrollable 24-hour axis, and each saved Time Entry drawn as a block at the time it was actually done (layout variant C from the prototype). The timetable opens scrolled near the current time. Each day shows its total and the Week shows its total. An entry crossing local midnight appears in both days, cut at the boundary, and each day's total counts only its own part. Very short entries keep a minimum width so they stay visible and clickable, and the full title and times are available on hover.

Delivered across the layers: a list behaviour in the API that takes a UTC range and returns every Time Entry overlapping it (including ones starting before the range and any still running), and the frontend timetable. The timeline maths (clip an entry to a local day, per-day and per-week totals, Sunday week boundaries, UTC to local day, block position and width) lives in pure, framework-free functions separate from components. Times are stored in UTC and shown in the browser's time zone; dates are YYYY-MM-DD, times HH:mm.

**Blocked by:** 03 (Start and stop a timer).

**Status:** done

- [x] Entries saved in ticket 03 appear as blocks in the correct day lane at the correct time and length
- [x] A midnight-crossing entry shows in both days and daily totals count only the portion within each day
- [x] Day totals and the Week total are shown and correct
- [x] The week starts on Sunday and the timetable opens scrolled near the current time
- [x] Short entries remain visible and clickable; hovering shows full title and times
- [x] API tests cover the list behaviour, including an entry crossing the range edge and a still-running entry
- [x] Jest tests cover every timeline function listed above through its public interface, including midnight crossing and a running entry
- [x] The layout follows prototype variant C and DESIGN.md; desktop only

## Confirmed before starting (2026-10-15)

- **Design gate:** the user confirmed `DESIGN.md` is the only design system to follow (layout: prototype variant C).
- **Test seams:** (1) the HTTP list API, tested with xUnit against the test database; (2) the pure timeline functions in the frontend (`startOfWeek`, `endOfWeek`, `buildWeekTimetable`), tested with Jest. No component-rendering tests beyond one behaviour test.
- **New type names:** backend `ITimeEntryService`, `TimeEntryService`, `TimeEntriesController` (reuses `TimeEntryViewModel`); frontend `TimetableModule`, `TimetableComponent`, `TimeEntriesService`, `WeekTimetable`, `DayRow`, `TimetableBlock`. The `TimeEntry` model moves to the shared models folder.
- **Defaults:** a running entry is drawn as a normal block up to now (live dashed block is ticket 05); the timetable reloads after Start/Stop; totals show `HH:mm`; 56 px per hour; minimum block width 18 px; `formatElapsed` is reused.
