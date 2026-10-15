import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Injector,
    Signal,
    afterNextRender,
    computed,
    signal,
    viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { formatElapsed, formatHoursMinutes } from '../../../shared/helpers/duration.helper';
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
    host: { '(document:keydown.escape)': 'closeOnEscape()' },
})
export class TimetableComponent {
    readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
    readonly formatTotal = formatHoursMinutes;
    readonly formatElapsed = formatElapsed;
    readonly weekFirstDay: Signal<Date>;
    readonly weekLastDay: Signal<Date>;
    readonly errorMessage = signal<string | undefined>(undefined);
    // True until the week being opened has loaded (or failed): the page shows a skeleton instead of the day rows.
    // A reload of the week already on screen (after a Start or Stop) does not set it, so the table does not flash.
    readonly loading = signal(true);
    readonly skeletonRows = Array.from({ length: 7 }, (_, index) => index);
    readonly week: Signal<WeekTimetable>;
    // The entry whose details are open, looked up by id so it follows reloads (e.g. a timer stopped meanwhile).
    readonly selectedEntry: Signal<TimeEntry | undefined>;
    readonly selectedDurationMs: Signal<number>;
    // The app uses this to put the rest of the page out of reach while the details are open.
    readonly detailsOpen: Signal<boolean>;
    readonly confirmingDelete = signal(false);
    readonly deleting = signal(false);
    readonly deleteError = signal<string | undefined>(undefined);

    // The week being opened. It is what the buttons step from and what a reload loads; it goes back to the week on screen
    // when that week fails to load.
    private readonly requestedWeekFirstDay = signal(startOfWeek(new Date()));
    private readonly weekRequests = new BehaviorSubject(this.requestedWeekFirstDay());
    private readonly selectedId = signal<number | undefined>(undefined);
    private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
    private readonly details = viewChild<ElementRef<HTMLElement>>('details');
    // The block that opened the details, so the keyboard focus can go back to it.
    private opener: HTMLElement | undefined;

    constructor(
        private readonly timeEntriesService: TimeEntriesService,
        private readonly destroyRef: DestroyRef,
        private readonly injector: Injector,
    ) {
        // A new request replaces one that is still in flight (switchMap), so a slow answer never overwrites a newer one.
        // When a request fails, the message is shown and the last loaded week stays on screen (EMPTY adds no new value).
        const loaded = toSignal(
            this.weekRequests.pipe(
                switchMap((weekStart) =>
                    timeEntriesService.list(weekStart, endOfWeek(weekStart)).pipe(
                        map((entries) => ({ weekStart, entries })),
                        tap(() => {
                            this.errorMessage.set(undefined);
                            this.loading.set(false);
                        }),
                        catchError((error: Error) => {
                            this.errorMessage.set(error.message);
                            this.loading.set(false);
                            this.requestedWeekFirstDay.set(loaded().weekStart);
                            return EMPTY;
                        }),
                    ),
                ),
            ),
            { initialValue: { weekStart: this.weekRequests.value, entries: [] as TimeEntry[] } },
        );
        // While another week loads, the header already shows that week (its rows are a skeleton, not the old week's).
        this.weekFirstDay = computed(() => (this.loading() ? this.requestedWeekFirstDay() : loaded().weekStart));
        this.weekLastDay = computed(() => addDays(this.weekFirstDay(), 6));
        // "Now" moves every second, so running blocks, totals and the current-time marker all move with it.
        const nowMs = nowEverySecond(destroyRef);
        this.week = computed(() => buildWeekTimetable(loaded().entries, loaded().weekStart, new Date(nowMs())));
        this.selectedEntry = computed(() => loaded().entries.find((entry) => entry.id === this.selectedId()));
        this.detailsOpen = computed(() => this.selectedEntry() !== undefined);
        this.selectedDurationMs = computed(() => {
            const entry = this.selectedEntry();
            return entry ? (entry.stoppedAtUtc ? Date.parse(entry.stoppedAtUtc) : nowMs()) - Date.parse(entry.startedAtUtc) : 0;
        });

        // Open near the current time of day instead of at midnight.
        afterNextRender(() => {
            const currentTimeLeftPx = this.week().days.find((row) => row.nowLeftPx !== undefined)?.nowLeftPx ?? 0;
            this.scroller().nativeElement.scrollLeft = Math.max(0, currentTimeLeftPx - SCROLL_LEAD_PX);
        });
    }

    // Loads the week again (called after the timer panel saved a Start or Stop).
    reload(): void {
        this.weekRequests.next(this.requestedWeekFirstDay());
    }

    showWeekOffset(weeks: number): void {
        this.openWeek(addDays(this.requestedWeekFirstDay(), weeks * 7));
    }

    showThisWeek(): void {
        this.openWeek(startOfWeek(new Date()));
    }

    private openWeek(weekFirstDay: Date): void {
        this.loading.set(true);
        this.requestedWeekFirstDay.set(weekFirstDay);
        this.weekRequests.next(weekFirstDay);
    }

    openDetails(entry: TimeEntry, event: Event): void {
        this.opener = event.currentTarget as HTMLElement;
        this.confirmingDelete.set(false);
        this.deleteError.set(undefined);
        this.selectedId.set(entry.id);
        afterNextRender(() => this.details()?.nativeElement.focus(), { injector: this.injector });
    }

    // Escape closes the details, but not while the delete is being sent.
    closeOnEscape(): void {
        if (this.detailsOpen() && !this.deleting()) {
            this.closeDetails();
        }
    }

    // The button that was focused disappears in the swap, so the focus is put back on the details to keep the keyboard inside.
    setConfirmingDelete(confirming: boolean): void {
        this.confirmingDelete.set(confirming);
        afterNextRender(() => this.details()?.nativeElement.focus(), { injector: this.injector });
    }

    closeDetails(focusTarget: HTMLElement | undefined = this.opener): void {
        this.selectedId.set(undefined);
        afterNextRender(() => focusTarget?.focus(), { injector: this.injector });
    }

    // The week loads again after a delete, refused or not: it updates the block and totals, and drops an entry that is already gone.
    // The deleted block disappears, so the focus goes to the timetable instead of back to it.
    confirmDelete(entry: TimeEntry): void {
        this.deleting.set(true);
        this.timeEntriesService
            .delete(entry.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.deleting.set(false);
                    this.closeDetails(this.scroller().nativeElement);
                    this.reload();
                },
                error: (error: Error) => {
                    this.deleting.set(false);
                    this.deleteError.set(error.message);
                    this.reload();
                },
            });
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
