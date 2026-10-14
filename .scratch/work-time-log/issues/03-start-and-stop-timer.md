# 03: Start and stop a timer

**What to build:** The core loop of the product. The user types what they are working on, presses Start, sees the elapsed time counting up, and presses Stop to save a Time Entry. The Running Timer survives a page refresh or reopening the tab. Delivered across the layers: the Start, Stop and get-running API behaviour, the data access, and the top section of the single page (description input, Start/Stop button, elapsed time) styled per DESIGN.md.

Rules to honour (see the spec): the title is trimmed, required, and at most 200 characters; only one Running Timer exists at a time (backend refuses a second start with a clear message, and the Start button is disabled while one runs); the server clock sets start and stop times; elapsed time is derived from the start instant and the clock, not by counting ticks; Enter in the input starts the timer; the input locks and shows the running title while the timer runs; failures show a clear message.

**Blocked by:** 02 (Database script and connection).

**Status:** ready-for-agent

- [ ] Starting with a valid title creates a Running Timer and the page shows elapsed time updating every second
- [ ] Stopping saves the Time Entry; the page returns to its idle state
- [ ] Reloading the page while a timer runs shows the same Running Timer with the correct elapsed time
- [ ] An empty or over-length title is rejected by the API and the Start button is disabled for an empty title
- [ ] A second start while one is running is refused by the API with a meaningful message; stopping with nothing running is refused too
- [ ] API tests (xUnit, against the real test database, Arrange / Act / Assert) cover start, stop, get-running, validation, and the refusal cases; they exercise the public API only
- [ ] The validation exception pattern from the backend instructions is created here and reused for business-rule failures; no internals leak in responses
- [ ] Keyboard focus is visible on the input and button; the Start/Stop button follows DESIGN.md (single filled aubergine pill)
