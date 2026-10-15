import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, map } from 'rxjs';

import { formatElapsed } from '../../../shared/helpers/duration.helper';
import { TimeEntry } from '../../../shared/models/time-entry.model';
import { TimerService } from '../services/timer.service';

@Component({
    selector: 'app-timer-panel',
    templateUrl: './timer-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class TimerPanelComponent implements OnInit {
    readonly maxTitleLength = 200;

    // Emitted after a Start or Stop was saved, so the timetable can reload.
    readonly entriesChanged = output<void>();

    readonly draftTitle = signal('');
    readonly running = signal<TimeEntry | undefined>(undefined);
    readonly busy = signal(false);
    readonly errorMessage = signal<string | undefined>(undefined);
    private readonly now = signal(Date.now());

    // While running the box shows (and locks to) the running title; otherwise it is the user's draft.
    readonly inputValue = computed(() => this.running()?.title ?? this.draftTitle());
    // Derived from the start instant and the clock, not by counting ticks, so it survives throttled tabs and sleep.
    readonly elapsed = computed(() => {
        const startedAtUtc = this.running()?.startedAtUtc;
        return formatElapsed(startedAtUtc ? this.now() - Date.parse(startedAtUtc) : 0);
    });
    readonly buttonDisabled = computed(() => this.busy() || (!this.running() && this.draftTitle().trim().length === 0));

    constructor(
        private readonly timerService: TimerService,
        private readonly destroyRef: DestroyRef,
    ) {
        const tick = setInterval(() => this.now.set(Date.now()), 1000);
        this.destroyRef.onDestroy(() => clearInterval(tick));
    }

    ngOnInit(): void {
        // A timer started earlier (before a refresh or a closed tab) is still running on the server.
        this.refreshRunning(true);
    }

    // Asks the server what is really running. After a failed action the panel may be out of date
    // (e.g. another tab already stopped the timer), so the error is shown and the state is re-read.
    private refreshRunning(reportErrors: boolean): void {
        this.timerService
            .getRunning()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (entry) => this.running.set(entry),
                error: (error: Error) => {
                    if (reportErrors) {
                        this.errorMessage.set(error.message);
                    }
                },
            });
    }

    toggle(): void {
        if (this.buttonDisabled()) {
            return;
        }

        this.errorMessage.set(undefined);
        this.busy.set(true);

        // Both actions end with the panel's new running state: the started entry, or nothing once stopped.
        const action$: Observable<TimeEntry | undefined> = this.running()
            ? this.timerService.stop().pipe(map(() => undefined))
            : this.timerService.start(this.draftTitle());

        action$.pipe(finalize(() => this.busy.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (running) => {
                this.running.set(running);
                this.draftTitle.set('');
                this.now.set(Date.now());
                this.entriesChanged.emit();
            },
            error: (error: Error) => {
                this.errorMessage.set(error.message);
                this.refreshRunning(false);
            },
        });
    }
}
