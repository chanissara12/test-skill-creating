import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerPanelComponent } from './timer-panel.component';

describe('TimerPanelComponent', () => {
    const runningEntry = { id: 1, title: 'Work', startedAtUtc: new Date().toISOString(), stoppedAtUtc: null };

    let http: HttpTestingController;
    let fixture: ComponentFixture<TimerPanelComponent>;

    const page = () => fixture.nativeElement as HTMLElement;
    const settle = async () => {
        await fixture.whenStable();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimerPanelComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(TimerPanelComponent);
        fixture.detectChanges();
    });

    it('shows a timer that is already running on the server after a reload', async () => {
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(runningEntry);
        await settle();

        expect(page().querySelector('button')?.textContent).toContain('หยุด');
        expect((page().querySelector('input') as HTMLInputElement).value).toBe('Work');
    });

    it('shows the idle state again when stopping is refused because the timer is already gone', async () => {
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(runningEntry);
        await settle();

        (page().querySelector('button') as HTMLButtonElement).click();
        http.expectOne((req) => req.url.endsWith('/timer/stop')).flush(
            { message: 'No timer is running.' },
            { status: 409, statusText: 'Conflict' },
        );
        // The panel must ask the server what is really running instead of staying stuck on "stop".
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(null);
        await settle();

        expect(page().querySelector('[role=alert]')?.textContent).toContain('No timer is running.');
        expect(page().querySelector('button')?.textContent).toContain('เริ่ม');
        expect((page().querySelector('input') as HTMLInputElement).disabled).toBe(false);
    });

    it('tells its parent that the entries changed after a successful start and a successful stop', async () => {
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(null);
        await settle();
        let changes = 0;
        fixture.componentInstance.entriesChanged.subscribe(() => changes++);

        const box = page().querySelector('input') as HTMLInputElement;
        box.value = 'Work';
        box.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        (page().querySelector('button') as HTMLButtonElement).click();
        http.expectOne((req) => req.url.endsWith('/timer/start')).flush(runningEntry);
        await settle();
        expect(changes).toBe(1);

        (page().querySelector('button') as HTMLButtonElement).click();
        http.expectOne((req) => req.url.endsWith('/timer/stop')).flush({ ...runningEntry, stoppedAtUtc: new Date().toISOString() });
        await settle();
        expect(changes).toBe(2);
    });
});
