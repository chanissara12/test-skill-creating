import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetableComponent } from './timetable.component';
import { TimetableModule } from '../timetable.module';

describe('TimetableComponent', () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<TimetableComponent>;

    const page = () => fixture.nativeElement as HTMLElement;
    const settle = async () => {
        await fixture.whenStable();
        fixture.detectChanges();
    };
    const nextListRequest = (): TestRequest => http.expectOne((req) => req.url.endsWith('/time-entries'));
    const requestedFrom = (request: TestRequest) => new Date(request.request.params.get('fromUtc') as string);

    // An entry on the Wednesday (day 3) of the week that starts at `from`, from 09:00 for the given number of minutes.
    const wednesdayEntry = (from: Date, id: number, title: string, minutes: number) => {
        const start = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 3, 9);
        return { id, title, startedAtUtc: start.toISOString(), stoppedAtUtc: new Date(start.getTime() + minutes * 60_000).toISOString() };
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimetableModule],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(TimetableComponent);
        fixture.detectChanges();
        // The first request is made once the component has rendered.
        await fixture.whenStable();
    });

    it('asks the API for this week, Sunday to the next Sunday, and shows the entries with their totals', async () => {
        const request = nextListRequest();

        const from = requestedFrom(request);
        const to = new Date(request.request.params.get('toUtc') as string);
        expect([from.getDay(), from.getHours(), from.getMinutes()]).toEqual([0, 0, 0]);
        expect([to.getDay(), to.getHours(), to.getMinutes()]).toEqual([0, 0, 0]);
        expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(7);

        request.flush([wednesdayEntry(from, 1, 'Write spec', 90)]);
        await settle();

        expect(page().querySelectorAll('button')).toHaveLength(1);
        // The hover text carries the whole entry's title and times.
        expect(page().querySelector('button')?.getAttribute('title')).toBe('Write spec 09:00–10:30');
        // 1 h 30 min, shown for that day and for the week.
        expect(page().textContent?.match(/01:30/g)).toHaveLength(2);
    });

    it('loads the week again when told to reload', async () => {
        const first = nextListRequest();
        first.flush([]);
        await settle();
        expect(page().querySelectorAll('button')).toHaveLength(0);

        fixture.componentInstance.reload();
        const second = nextListRequest();
        second.flush([wednesdayEntry(requestedFrom(second), 2, 'Saved after a stop', 30)]);
        await settle();

        expect(page().querySelectorAll('button')).toHaveLength(1);
    });

    it('keeps showing the last loaded week, with a message, when reloading fails', async () => {
        const first = nextListRequest();
        first.flush([wednesdayEntry(requestedFrom(first), 1, 'Write spec', 90)]);
        await settle();

        fixture.componentInstance.reload();
        nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
        await settle();

        expect(page().querySelector('[role=alert]')?.textContent).toContain('The database is down.');
        expect(page().querySelectorAll('button')).toHaveLength(1);
        expect(page().textContent?.match(/01:30/g)).toHaveLength(2);
    });
});
