import { TimeEntry } from '../models/time-entry.model';
import { buildWeekTimetable, endOfWeek, startOfWeek } from './timeline.helper';

// October 2026: Sunday 11 ... Saturday 17. Dates are built in local time so the tests do not depend on the machine's time zone.
const local = (day: number, hour = 0, minute = 0) => new Date(2026, 9, day, hour, minute);

const entry = (id: number, title: string, from: Date, to: Date | null): TimeEntry => ({
    id,
    title,
    startedAtUtc: from.toISOString(),
    stoppedAtUtc: to ? to.toISOString() : null,
});

describe('startOfWeek', () => {
    it('returns the Sunday at 00:00 of the week that contains the date', () => {
        expect(startOfWeek(local(14, 14, 30))).toEqual(local(11));
    });

    it('keeps a Sunday as the start of its own week and sends Saturday night back to that Sunday', () => {
        expect(startOfWeek(local(11, 9))).toEqual(local(11));
        expect(startOfWeek(local(17, 23, 59))).toEqual(local(11));
    });
});

describe('endOfWeek', () => {
    it('is the next Sunday at 00:00, so a week runs Sunday to Saturday', () => {
        expect(endOfWeek(local(11))).toEqual(local(18));
    });
});

describe('buildWeekTimetable', () => {
    const weekStart = local(11);
    const now = local(14, 12);

    it('gives seven day rows from Sunday to Saturday, empty when there are no entries', () => {
        const week = buildWeekTimetable([], weekStart, now);

        expect(week.days.map((row) => row.day)).toEqual([11, 12, 13, 14, 15, 16, 17].map((day) => local(day)));
        expect(week.days.every((row) => row.blocks.length === 0 && row.totalMs === 0)).toBe(true);
        expect(week.totalMs).toBe(0);
    });

    it('places an entry at its time of day, 56 px per hour from midnight, and counts it in the day and week totals', () => {
        const week = buildWeekTimetable([entry(1, 'Write spec', local(12, 9), local(12, 10, 30))], weekStart, now);

        const monday = week.days[1];
        expect(monday.blocks).toHaveLength(1);
        expect(monday.blocks[0]).toMatchObject({ leftPx: 504, widthPx: 84 });
        expect(monday.blocks[0].entry.title).toBe('Write spec');
        expect(monday.totalMs).toBe(5_400_000);
        expect(week.totalMs).toBe(5_400_000);
    });

    it('cuts an entry that crosses midnight at the day boundary, so each day counts only its own part', () => {
        const week = buildWeekTimetable([entry(1, 'Deploy', local(13, 23), local(14, 1))], weekStart, now);

        const [tuesday, wednesday] = [week.days[2], week.days[3]];
        expect(tuesday.blocks).toHaveLength(1);
        expect(tuesday.blocks[0]).toMatchObject({ leftPx: 1288, widthPx: 56 });
        expect(tuesday.totalMs).toBe(3_600_000);
        expect(wednesday.blocks).toHaveLength(1);
        expect(wednesday.blocks[0]).toMatchObject({ leftPx: 0, widthPx: 56 });
        expect(wednesday.totalMs).toBe(3_600_000);
        expect(week.totalMs).toBe(7_200_000);
    });

    it('draws a running timer up to "now" and counts that time', () => {
        const week = buildWeekTimetable([entry(1, 'Working', local(14, 9), null)], weekStart, local(14, 12));

        const wednesday = week.days[3];
        expect(wednesday.blocks[0]).toMatchObject({ leftPx: 504, widthPx: 168 });
        expect(wednesday.totalMs).toBe(10_800_000);
        expect(week.totalMs).toBe(10_800_000);
    });

    it('shows only the part of an entry that started before the week, and ignores entries outside it', () => {
        const week = buildWeekTimetable(
            [
                entry(1, 'Started last Saturday', local(10, 22), local(11, 1)),
                entry(2, 'Next week', local(19, 9), local(19, 10)),
            ],
            weekStart,
            now,
        );

        expect(week.days[0].blocks).toHaveLength(1);
        expect(week.days[0].blocks[0]).toMatchObject({ leftPx: 0, widthPx: 56 });
        expect(week.days.flatMap((row) => row.blocks)).toHaveLength(1);
        expect(week.totalMs).toBe(3_600_000);
    });

    it('keeps a very short entry at least 18 px wide so it stays visible, without changing its time total', () => {
        const week = buildWeekTimetable([entry(1, 'Quick reply', local(12, 10), local(12, 10, 2))], weekStart, now);

        const monday = week.days[1];
        expect(monday.blocks[0].widthPx).toBe(18);
        expect(monday.blocks[0].leftPx).toBe(560);
        expect(monday.totalMs).toBe(120_000);
    });

    it('still shows an entry that was started and stopped at the same instant', () => {
        const week = buildWeekTimetable([entry(1, 'Instant', local(12, 10), local(12, 10))], weekStart, now);

        const monday = week.days[1];
        expect(monday.blocks).toHaveLength(1);
        expect(monday.blocks[0]).toMatchObject({ leftPx: 560, widthPx: 18 });
        expect(monday.totalMs).toBe(0);
    });

    it('does not draw a ghost block on the next day for an entry that ends exactly at midnight', () => {
        const week = buildWeekTimetable([entry(1, 'Late shift', local(13, 22), local(14))], weekStart, now);

        expect(week.days[2].blocks).toHaveLength(1);
        expect(week.days[3].blocks).toHaveLength(0);
        expect(week.days[3].totalMs).toBe(0);
    });

    it('moves a minimum-width block left when it would stick out past the end of the day', () => {
        const week = buildWeekTimetable([entry(1, 'Just before midnight', local(12, 23, 59), local(12, 23, 59))], weekStart, now);

        // The 24-hour axis is 1344 px wide, so an 18 px block must start at 1326 px at the latest.
        expect(week.days[1].blocks[0]).toMatchObject({ leftPx: 1326, widthPx: 18 });
    });

    describe('lines (blocks that would sit on top of each other)', () => {
        const at = (day: number, hour: number, minute: number, second = 0) => new Date(2026, 9, day, hour, minute, second);
        const topsByTitle = (week: ReturnType<typeof buildWeekTimetable>, dayIndex: number) =>
            Object.fromEntries(week.days[dayIndex].blocks.map((block) => [block.entry.title, block.topPx]));

        it('puts entries from the same minute on separate lines instead of drawing them on top of each other', () => {
            const week = buildWeekTimetable(
                [
                    entry(1, 'First', at(12, 10, 0, 10), at(12, 10, 0, 20)),
                    entry(2, 'Second', at(12, 10, 0, 30), at(12, 10, 0, 40)),
                    entry(3, 'Third', at(12, 10, 0, 50), at(12, 10, 0, 55)),
                ],
                weekStart,
                now,
            );

            expect(topsByTitle(week, 1)).toEqual({ First: 8, Second: 64, Third: 120 });
            expect(week.days[1].blocks.every((block) => block.heightPx === 48)).toBe(true);
            // Three lines of 56 px plus 8 px of padding.
            expect(week.days[1].heightPx).toBe(176);
        });

        it('keeps entries on one line when they do not overlap, even when one starts exactly where the other ends', () => {
            const week = buildWeekTimetable(
                [entry(1, 'Morning', local(12, 9), local(12, 10)), entry(2, 'Next', local(12, 10), local(12, 11))],
                weekStart,
                now,
            );

            expect(topsByTitle(week, 1)).toEqual({ Morning: 8, Next: 8 });
            expect(week.days[1].heightPx).toBe(64);
        });

        it('reuses a line as soon as it is free', () => {
            const week = buildWeekTimetable(
                [
                    entry(1, 'A', local(12, 10), local(12, 12)),
                    entry(2, 'B', local(12, 10, 30), local(12, 11)),
                    entry(3, 'C', local(12, 11, 30), local(12, 11, 45)),
                    entry(4, 'D', local(12, 12, 30), local(12, 13)),
                ],
                weekStart,
                now,
            );

            // A holds line 1 until 12:00, B and C take line 2 one after the other, D goes back to line 1.
            expect(topsByTitle(week, 1)).toEqual({ A: 8, B: 64, C: 64, D: 8 });
            expect(week.days[1].heightPx).toBe(120);
        });

        it('gives an empty day a single line of height', () => {
            expect(buildWeekTimetable([], weekStart, now).days[0].heightPx).toBe(64);
        });
    });
});
