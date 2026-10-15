import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Signal, afterNextRender, computed, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { formatHoursMinutes } from '../../../shared/helpers/duration.helper';
import { nowEverySecond } from '../../../shared/helpers/now.helper';
import {
    TimetableBlock,
    WeekTimetable,
    addDays,
    buildWeekTimetable,
    endOfWeek,
    startOfWeek,
} from '../../../shared/helpers/timeline.helper';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { TimeEntriesService } from '../services/time-entries.service';

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const weekday = new Intl.DateTimeFormat('th-TH', { weekday: 'short' });

// On opening, the current time is scrolled to this far from the left edge, so a little of the past stays in view.
const SCROLL_LEAD_PX = 300;

@Component({
    selector: 'app-timetable',
    templateUrl: './timetable.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TimetableComponent {
    readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
    readonly formatTotal = formatHoursMinutes;
    readonly weekFirstDay: Signal<Date>;
    readonly weekLastDay: Signal<Date>;
    readonly errorMessage = signal<string | undefined>(undefined);
    readonly week: Signal<WeekTimetable>;

    // The first day of the week to load. The week on screen (weekFirstDay) only changes once that week has loaded.
    private readonly weekRequests = new BehaviorSubject(startOfWeek(new Date()));
    private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

    constructor(timeEntriesService: TimeEntriesService, destroyRef: DestroyRef) {
        // A new request replaces one that is still in flight (switchMap), so a slow answer never overwrites a newer one.
        // When a request fails, the message is shown and the last loaded week stays on screen (EMPTY adds no new value).
        const loaded = toSignal(
            this.weekRequests.pipe(
                switchMap((weekStart) =>
                    timeEntriesService.list(weekStart, endOfWeek(weekStart)).pipe(
                        map((entries) => ({ weekStart, entries })),
                        tap(() => this.errorMessage.set(undefined)),
                        catchError((error: Error) => {
                            this.errorMessage.set(error.message);
                            return EMPTY;
                        }),
                    ),
                ),
            ),
            { initialValue: { weekStart: this.weekRequests.value, entries: [] as TimeEntry[] } },
        );
        this.weekFirstDay = computed(() => loaded().weekStart);
        this.weekLastDay = computed(() => addDays(this.weekFirstDay(), 6));
        // "Now" moves every second, so running blocks, totals and the current-time marker all move with it.
        const nowMs = nowEverySecond(destroyRef);
        this.week = computed(() => buildWeekTimetable(loaded().entries, this.weekFirstDay(), new Date(nowMs())));

        // Open near the current time of day instead of at midnight.
        afterNextRender(() => {
            const currentTimeLeftPx = this.week().days.find((row) => row.nowLeftPx !== undefined)?.nowLeftPx ?? 0;
            this.scroller().nativeElement.scrollLeft = Math.max(0, currentTimeLeftPx - SCROLL_LEAD_PX);
        });
    }

    // Loads the week again (called after the timer panel saved a Start or Stop).
    reload(): void {
        this.weekRequests.next(this.weekFirstDay());
    }

    // Moves from the week on screen, so a failed load never leaves the buttons stepping from a week that is not shown.
    showWeekOffset(weeks: number): void {
        this.weekRequests.next(addDays(this.weekFirstDay(), weeks * 7));
    }

    showThisWeek(): void {
        this.weekRequests.next(startOfWeek(new Date()));
    }

    weekdayLabel(day: Date): string {
        return weekday.format(day);
    }

    // Full title and times of the whole entry (not just the part on this day).
    blockTitle(block: TimetableBlock): string {
        const { title, startedAtUtc, stoppedAtUtc } = block.entry;
        const stop = stoppedAtUtc ? clock.format(new Date(stoppedAtUtc)) : 'กำลังเดิน';
        return `${title} ${clock.format(new Date(startedAtUtc))}–${stop}`;
    }
}
