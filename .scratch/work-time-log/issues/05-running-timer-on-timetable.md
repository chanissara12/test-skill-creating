# 05: Running Timer on the timetable

**What to build:** While a timer runs, the user sees it on today's lane as a dashed-outline block that grows up to the current time, updating every second together with the elapsed counter. Today's lane is highlighted and a marker shows the current time, so the user can orient themselves at a glance. When the timer stops, the block becomes a normal finished block without a reload.

**Blocked by:** 04 (See this week on the timetable).

**Status:** ready-for-agent

- [ ] A running timer appears as a dashed block that lengthens each second on today's lane
- [ ] A midnight-crossing running timer is cut at the day boundary like a finished entry
- [ ] The current-time marker and today's highlight are visible on today's lane
- [ ] Stopping converts the block to a finished one and updates the daily and Week totals
- [ ] Totals include the elapsed part of the Running Timer and update live
- [ ] Any new timeline calculation added here is covered by Jest tests through the pure functions
