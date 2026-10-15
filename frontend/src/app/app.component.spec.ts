import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { TimerModule } from './modules/timer/timer.module';
import { TimetableModule } from './modules/timetable/timetable.module';

describe('AppComponent', () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<AppComponent>;

    const page = () => fixture.nativeElement as HTMLElement;
    const settle = async () => {
        await fixture.whenStable();
        fixture.detectChanges();
    };
    const listRequests = () => http.match((req) => req.url.endsWith('/time-entries'));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot([]), TimerModule, TimetableModule],
            declarations: [AppComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('reloads the timetable after the timer panel saved a start', async () => {
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(null);
        listRequests().forEach((request) => request.flush([]));
        await settle();

        const box = page().querySelector('app-timer-panel input') as HTMLInputElement;
        box.value = 'Work';
        box.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        (page().querySelector('app-timer-panel button') as HTMLButtonElement).click();
        http.expectOne((req) => req.url.endsWith('/timer/start')).flush({
            id: 1,
            title: 'Work',
            startedAtUtc: new Date().toISOString(),
            stoppedAtUtc: null,
        });
        await settle();

        expect(listRequests()).toHaveLength(1);
    });

    it('makes the timer panel unreachable while the details of an entry are open', async () => {
        http.expectOne((req) => req.url.endsWith('/timer/running')).flush(null);
        const start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 10);
        listRequests().forEach((request) =>
            request.flush([{ id: 1, title: 'Work', startedAtUtc: start.toISOString(), stoppedAtUtc: new Date(start.getTime() + 600_000).toISOString() }]),
        );
        await settle();
        const panel = page().querySelector('app-timer-panel') as HTMLElement;
        expect(panel.hasAttribute('inert')).toBe(false);

        (page().querySelector('app-timetable button[title]') as HTMLButtonElement).click();
        await settle();

        expect(panel.hasAttribute('inert')).toBe(true);
    });
});
