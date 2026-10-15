# 07: Entry details and delete

**What to build:** Clicking a block opens a details view showing the full title, start, stop (or "running") and duration. For a finished Time Entry the user can delete it, but only after a confirmation step. The Running Timer cannot be deleted until it is stopped. After a delete, the timetable and totals update. Delivered across the layers: the delete behaviour in the API (refusing to delete the Running Timer with a clear message) and the details/confirm interaction in the UI, with the delete action styled with the design system's error colour only.

**Blocked by:** 04 (See this week on the timetable).

**Status:** done

- [ ] Clicking any block (including very short ones) opens its details
- [ ] Delete requires an explicit confirmation; cancelling leaves the entry untouched
- [ ] Deleting a finished entry removes it from the timetable and updates daily and Week totals
- [ ] Deleting the Running Timer is unavailable in the UI and refused by the API with a meaningful message
- [ ] API tests cover deleting a finished entry, refusing the Running Timer, and deleting a non-existent entry
- [ ] The details view is keyboard-operable and closes with the keyboard
