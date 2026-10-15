# 06: Browse other weeks

**What to build:** The user can move between Weeks with Previous, Next and This Week controls, and always sees the date range of the Week being shown (YYYY-MM-DD). The timetable and its totals reload for the chosen Week. The controls are secondary pill buttons per DESIGN.md and work by keyboard with visible focus.

**Blocked by:** 04 (See this week on the timetable).

**Status:** done

- [ ] Previous and Next move exactly one Week (Sunday to Saturday) and show that Week's entries and totals
- [ ] This Week returns to the current Week
- [ ] The visible date range always matches the Week shown
- [ ] Week boundaries are computed in the user's local time and converted to a UTC range for the API
- [ ] Jest tests cover the week-boundary and range-conversion functions, including a Week that contains a midnight-crossing entry at its edge
