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

        expect(page().querySelectorAll('button[title]')).toHaveLength(1);
        // The hover text carries the whole entry's title and times.
        expect(page().querySelector('button[title]')?.getAttribute('title')).toBe('Write spec 09:00–10:30');
        // 1 h 30 min, shown for that day and for the week.
        expect(page().textContent?.match(/01:30/g)).toHaveLength(2);
    });

    it('loads the week again when told to reload', async () => {
        const first = nextListRequest();
        first.flush([]);
        await settle();
        expect(page().querySelectorAll('button[title]')).toHaveLength(0);

        fixture.componentInstance.reload();
        const second = nextListRequest();
        second.flush([wednesdayEntry(requestedFrom(second), 2, 'Saved after a stop', 30)]);
        await settle();

        expect(page().querySelectorAll('button[title]')).toHaveLength(1);
    });

    it('keeps showing the last loaded week, with a message, when reloading fails', async () => {
        const first = nextListRequest();
        first.flush([wednesdayEntry(requestedFrom(first), 1, 'Write spec', 90)]);
        await settle();

        fixture.componentInstance.reload();
        nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
        await settle();

        expect(page().querySelector('[role=alert]')?.textContent).toContain('The database is down.');
        expect(page().querySelectorAll('button[title]')).toHaveLength(1);
        expect(page().textContent?.match(/01:30/g)).toHaveLength(2);
    });

    describe('browsing weeks', () => {
        const buttonLabelled = (label: string) =>
            Array.from(page().querySelectorAll('button')).find((button) => button.textContent?.trim() === label) as HTMLButtonElement;
        const entryBlocks = () => page().querySelectorAll('button[title]');
        const shownRange = () => page().querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim();
        const ymd = (date: Date) =>
            [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
        const daysFrom = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

        it('moves one week back and forward, asking the API for that week and showing its entries and date range', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();

            buttonLabelled('สัปดาห์ก่อน').click();
            const previous = nextListRequest();
            const previousFrom = requestedFrom(previous);
            expect(previousFrom).toEqual(daysFrom(currentFrom, -7));
            expect(new Date(previous.request.params.get('toUtc') as string)).toEqual(currentFrom);
            previous.flush([wednesdayEntry(previousFrom, 1, 'Last week', 60)]);
            await settle();

            expect(shownRange()).toBe(`${ymd(previousFrom)} – ${ymd(daysFrom(previousFrom, 6))}`);
            expect(entryBlocks()).toHaveLength(1);

            buttonLabelled('สัปดาห์ถัดไป').click();
            const forward = nextListRequest();
            expect(requestedFrom(forward)).toEqual(currentFrom);
            forward.flush([]);
            await settle();

            expect(shownRange()).toBe(`${ymd(currentFrom)} – ${ymd(daysFrom(currentFrom, 6))}`);
            expect(entryBlocks()).toHaveLength(0);
        });

        it('returns to the current week with This Week', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();

            buttonLabelled('สัปดาห์ถัดไป').click();
            const next = nextListRequest();
            expect(requestedFrom(next)).toEqual(daysFrom(currentFrom, 7));
            next.flush([]);
            await settle();

            buttonLabelled('สัปดาห์นี้').click();
            const back = nextListRequest();
            expect(requestedFrom(back)).toEqual(currentFrom);
            back.flush([wednesdayEntry(currentFrom, 2, 'This week', 30)]);
            await settle();

            expect(shownRange()).toBe(`${ymd(currentFrom)} – ${ymd(daysFrom(currentFrom, 6))}`);
            expect(entryBlocks()).toHaveLength(1);
        });

        it('keeps the date range of the week that is on screen when loading another week fails', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([wednesdayEntry(currentFrom, 1, 'Write spec', 90)]);
            await settle();

            buttonLabelled('สัปดาห์ถัดไป').click();
            nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
            await settle();

            expect(shownRange()).toBe(`${ymd(currentFrom)} – ${ymd(daysFrom(currentFrom, 6))}`);
            expect(entryBlocks()).toHaveLength(1);
            expect(page().querySelector('[role=alert]')?.textContent).toContain('The database is down.');
        });

        it('reloads the week that is on screen, not a week whose load failed', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();
            buttonLabelled('สัปดาห์ถัดไป').click();
            nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
            await settle();

            fixture.componentInstance.reload();

            const reloaded = nextListRequest();
            expect(requestedFrom(reloaded)).toEqual(currentFrom);
            reloaded.flush([wednesdayEntry(currentFrom, 3, 'Saved after a stop', 30)]);
            await settle();
            expect(entryBlocks()).toHaveLength(1);
        });
    });

    it('opens scrolled so the current time is in view, a little way in from the left edge', async () => {
        nextListRequest().flush([]);
        await settle();

        const now = new Date();
        // 56 px per hour, with 300 px of the past kept in view; never scrolled past the start of the day.
        const expected = Math.max(0, (now.getHours() + now.getMinutes() / 60) * 56 - 300);
        const scroller = page().querySelector('div.overflow-auto') as HTMLElement;

        // Within two pixels (about two minutes), in case the minute changed while the test ran.
        expect(Math.abs(scroller.scrollLeft - expected)).toBeLessThan(2);
    });
});
