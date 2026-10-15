import { TimeEntry } from '../models/time-entry.model';

// One entry drawn on one day, positioned along that day's 24-hour axis.
export interface TimetableBlock {
    entry: TimeEntry;
    leftPx: number;
    widthPx: number;
    topPx: number;
    heightPx: number;
}

export interface DayRow {
    day: Date;
    totalMs: number;
    // Tall enough for every line of blocks (see buildDayRow).
    heightPx: number;
    blocks: TimetableBlock[];
}

export interface WeekTimetable {
    days: DayRow[];
    totalMs: number;
}

// Calendar-day arithmetic in local time (it keeps working across a clock change, unlike adding 24 hours).
export const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// The Sunday at 00:00 (local time) of the week that contains the date.
export function startOfWeek(date: Date): Date {
    return addDays(date, -date.getDay());
}

// The Sunday at 00:00 that closes the week starting at weekStart (the end is exclusive).
export function endOfWeek(weekStart: Date): Date {
    return addDays(weekStart, 7);
}

const HOUR_MS = 3_600_000;
export const HOUR_WIDTH_PX = 56;
const DAY_WIDTH_PX = 24 * HOUR_WIDTH_PX;
const MIN_BLOCK_WIDTH_PX = 18;
const BLOCK_HEIGHT_PX = 48;
const LINE_PADDING_PX = 8;
const LINE_HEIGHT_PX = BLOCK_HEIGHT_PX + LINE_PADDING_PX;

function buildDayRow(entries: TimeEntry[], day: Date, now: Date): DayRow {
    const dayStart = day.getTime();
    const dayEnd = addDays(day, 1).getTime();
    const placed: Pick<TimetableBlock, 'entry' | 'leftPx' | 'widthPx'>[] = [];
    let totalMs = 0;

    for (const entry of entries) {
        const entryStart = Date.parse(entry.startedAtUtc);
        // A running entry ends "now"; it never ends before it started (the browser clock can be slightly behind the server's).
        const entryEnd = Math.max(entry.stoppedAtUtc ? Date.parse(entry.stoppedAtUtc) : now.getTime(), entryStart);

        // An entry started and stopped at the same instant is still drawn; any other entry must overlap this day.
        const onThisDay =
            entryStart === entryEnd ? entryStart >= dayStart && entryStart < dayEnd : entryStart < dayEnd && entryEnd > dayStart;
        if (!onThisDay) {
            continue;
        }

        // Only the part of the entry that falls on this day is drawn and counted.
        const start = Math.max(entryStart, dayStart);
        const end = Math.min(entryEnd, dayEnd);
        const widthPx = Math.max(((end - start) / HOUR_MS) * HOUR_WIDTH_PX, MIN_BLOCK_WIDTH_PX);

        totalMs += end - start;
        // A minimum-width block near midnight moves left instead of sticking out past the end of the day.
        placed.push({ entry, leftPx: Math.min(((start - dayStart) / HOUR_MS) * HOUR_WIDTH_PX, DAY_WIDTH_PX - widthPx), widthPx });
    }

    // Blocks that would sit on top of each other (the minimum width counts) go on separate lines, like a calendar:
    // each block takes the first line whose last block has already ended.
    const lineEnds: number[] = [];
    const blocks = placed
        .sort((a, b) => a.leftPx - b.leftPx)
        .map((block) => {
            let line = lineEnds.findIndex((end) => end <= block.leftPx);
            if (line === -1) {
                line = lineEnds.length;
            }
            lineEnds[line] = block.leftPx + block.widthPx;
            return { ...block, topPx: LINE_PADDING_PX + line * LINE_HEIGHT_PX, heightPx: BLOCK_HEIGHT_PX };
        });

    return { day, totalMs, heightPx: Math.max(lineEnds.length, 1) * LINE_HEIGHT_PX + LINE_PADDING_PX, blocks };
}

export function buildWeekTimetable(entries: TimeEntry[], weekStart: Date, now: Date): WeekTimetable {
    const days = Array.from({ length: 7 }, (_, index) => buildDayRow(entries, addDays(weekStart, index), now));
    return { days, totalMs: days.reduce((sum, row) => sum + row.totalMs, 0) };
}
