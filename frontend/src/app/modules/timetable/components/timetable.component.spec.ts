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

        const headerTotal = () => page().querySelector('section p')?.textContent?.replace(/\s+/g, ' ').trim();

        it('shows the range of the week that is loading, with no total yet, instead of the previous week', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();
            expect(headerTotal()).toBe('รวมสัปดาห์ 00:00');

            buttonLabelled('สัปดาห์ถัดไป').click();
            fixture.detectChanges();
            const nextFrom = daysFrom(currentFrom, 7);
            expect(shownRange()).toBe(`${ymd(nextFrom)} – ${ymd(daysFrom(nextFrom, 6))}`);
            expect(headerTotal()).toBe('รวมสัปดาห์ –');

            nextListRequest().flush([]);
            await settle();
            expect(headerTotal()).toBe('รวมสัปดาห์ 00:00');
        });

        it('goes a second week ahead when Next is pressed again before the first week has arrived', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();

            buttonLabelled('สัปดาห์ถัดไป').click();
            buttonLabelled('สัปดาห์ถัดไป').click();

            const requests = http.match((req) => req.url.endsWith('/time-entries'));
            expect(requestedFrom(requests[requests.length - 1])).toEqual(daysFrom(currentFrom, 14));
        });

        it('keeps loading the week being opened when the timetable is reloaded meanwhile', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();
            buttonLabelled('สัปดาห์ถัดไป').click();

            fixture.componentInstance.reload();

            const requests = http.match((req) => req.url.endsWith('/time-entries'));
            expect(requestedFrom(requests[requests.length - 1])).toEqual(daysFrom(currentFrom, 7));
        });

        it('steps from the week that is on screen after a week failed to load', async () => {
            const current = nextListRequest();
            const currentFrom = requestedFrom(current);
            current.flush([]);
            await settle();
            buttonLabelled('สัปดาห์ถัดไป').click();
            nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
            await settle();

            buttonLabelled('สัปดาห์ถัดไป').click();

            expect(requestedFrom(nextListRequest())).toEqual(daysFrom(currentFrom, 7));
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

    describe('entry details and delete', () => {
        const dialog = () => page().querySelector('[role=dialog]') as HTMLElement | null;
        const dialogButton = (label: string) =>
            Array.from(dialog()?.querySelectorAll('button') ?? []).find((button) => button.textContent?.trim() === label);
        const click = async (label: string) => {
            (dialogButton(label) as HTMLButtonElement).click();
            await settle();
        };
        const openFirstBlock = async () => {
            (page().querySelector('button[title]') as HTMLButtonElement).click();
            await settle();
        };
        const flushWeek = async (entries: object[]) => {
            nextListRequest().flush(entries);
            await settle();
        };
        const deleteRequests = () => http.match((req) => req.method === 'DELETE');
        // 09:00 on the Wednesday of the current week, for the given number of minutes (running when minutes is undefined).
        const entryOnWednesday = (id: number, title: string, minutes?: number) => {
            const week = new Date();
            const start = new Date(week.getFullYear(), week.getMonth(), week.getDate() - week.getDay() + 3, 9);
            return {
                id,
                title,
                startedAtUtc: start.toISOString(),
                stoppedAtUtc: minutes === undefined ? null : new Date(start.getTime() + minutes * 60_000).toISOString(),
            };
        };

        it('opens the details of a clicked block: full title, start, stop and duration', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);

            await openFirstBlock();

            const text = dialog()?.textContent ?? '';
            expect(text).toContain('Write spec');
            expect(text).toMatch(/\d{4}-\d{2}-\d{2} 09:00:00/);
            expect(text).toMatch(/\d{4}-\d{2}-\d{2} 10:30:00/);
            expect(text).toContain('01:30:00');
        });

        it('shows a running timer as running and offers no way to delete it', async () => {
            await flushWeek([entryOnWednesday(1, 'Working', undefined)]);

            await openFirstBlock();

            expect(dialog()?.textContent).toContain('กำลังเดิน');
            expect(dialogButton('ลบ')).toBeUndefined();
        });

        it('asks for confirmation before deleting, and cancelling leaves the entry untouched', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);
            await openFirstBlock();

            await click('ลบ');
            expect(deleteRequests()).toHaveLength(0);
            expect(dialogButton('ยืนยันลบ')).toBeDefined();

            await click('ยกเลิก');
            expect(deleteRequests()).toHaveLength(0);
            expect(dialogButton('ยืนยันลบ')).toBeUndefined();
            expect(dialog()?.textContent).toContain('Write spec');
            expect(page().querySelectorAll('button[title]')).toHaveLength(1);
        });

        it('deletes a finished entry after confirmation, closes the details and reloads the week with new totals', async () => {
            await flushWeek([entryOnWednesday(7, 'Write spec', 90), entryOnWednesday(8, 'Review', 15)]);
            // 1 h 30 min and 15 min on the same day: 01:45 for the day and for the week (the hour labels only ever end in :00).
            expect(page().textContent?.match(/01:45/g)).toHaveLength(2);
            await openFirstBlock();
            await click('ลบ');

            await click('ยืนยันลบ');
            const [request] = deleteRequests();
            expect(request.request.url.endsWith('/time-entries/7')).toBe(true);
            request.flush(null, { status: 204, statusText: 'No Content' });
            await settle();
            await flushWeek([entryOnWednesday(8, 'Review', 15)]);

            expect(dialog()).toBeNull();
            expect(page().querySelectorAll('button[title]')).toHaveLength(1);
            expect(page().textContent?.match(/00:15/g)).toHaveLength(2);
            expect(page().textContent).not.toContain('01:45');
            expect(page().textContent).not.toContain('01:30');
            // The deleted block is gone, so the focus goes to the timetable instead of falling to the page.
            expect(document.activeElement).toBe(page().querySelector('div.overflow-auto'));
        });

        it('shows the API message and keeps the entry when the delete is refused', async () => {
            await flushWeek([entryOnWednesday(7, 'Write spec', 90)]);
            await openFirstBlock();
            await click('ลบ');
            await click('ยืนยันลบ');

            deleteRequests()[0].flush({ message: 'Refused for a reason.' }, { status: 409, statusText: 'Conflict' });
            await settle();
            await flushWeek([entryOnWednesday(7, 'Write spec', 90)]);

            expect(dialog()?.querySelector('[role=alert]')?.textContent).toContain('Refused for a reason.');
            expect(page().querySelectorAll('button[title]')).toHaveLength(1);
        });

        it('reloads the week when the entry was already deleted (404), so the stale block disappears', async () => {
            await flushWeek([entryOnWednesday(7, 'Write spec', 90)]);
            await openFirstBlock();
            await click('ลบ');
            await click('ยืนยันลบ');

            deleteRequests()[0].flush({ message: 'This entry does not exist.' }, { status: 404, statusText: 'Not Found' });
            await settle();
            await flushWeek([]);

            expect(page().querySelectorAll('button[title]')).toHaveLength(0);
            expect(dialog()).toBeNull();
        });

        it('moves the focus into the details, keeps it there when switching to the confirmation, and closes with Escape', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);

            await openFirstBlock();
            expect(document.activeElement).toBe(dialog());

            await click('ลบ');
            expect(dialog()?.contains(document.activeElement)).toBe(true);
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await settle();

            expect(dialog()).toBeNull();
        });

        it('returns the focus to the block that opened the details when they close', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);
            const block = page().querySelector('button[title]') as HTMLButtonElement;

            await openFirstBlock();
            await click('ปิด');
            expect(document.activeElement).toBe(block);

            await openFirstBlock();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await settle();
            expect(document.activeElement).toBe(block);
        });

        it('shows a spinner on the confirm button while the delete is being sent', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);
            await openFirstBlock();
            await click('ลบ');

            await click('ยืนยันลบ');

            const button = dialogButton('กำลังลบ…') as HTMLButtonElement;
            expect(button.querySelector('.animate-spin')).not.toBeNull();
            expect(button.disabled).toBe(true);
            deleteRequests()[0].flush(null, { status: 204, statusText: 'No Content' });
        });

        it('ignores Escape while the delete is being sent', async () => {
            await flushWeek([entryOnWednesday(1, 'Write spec', 90)]);
            await openFirstBlock();
            await click('ลบ');
            await click('ยืนยันลบ');

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await settle();

            expect(dialog()).not.toBeNull();
            deleteRequests()[0].flush(null, { status: 204, statusText: 'No Content' });
        });
    });

    describe('loading and screen readers', () => {
        const skeleton = () => page().querySelector('[role=status]');
        const blockLabel = () => page().querySelector('button[title]')?.getAttribute('aria-label');
        const runningOnWednesday = (from: Date) => ({ ...wednesdayEntry(from, 1, 'Write spec', 90), stoppedAtUtc: null });

        it('shows a skeleton while a week loads, but not when the same week is only reloaded', async () => {
            expect(skeleton()).not.toBeNull();

            nextListRequest().flush([]);
            await settle();
            expect(skeleton()).toBeNull();

            (Array.from(page().querySelectorAll('button')).find((b) => b.textContent?.trim() === 'สัปดาห์ถัดไป') as HTMLButtonElement).click();
            fixture.detectChanges();
            expect(skeleton()).not.toBeNull();
            nextListRequest().flush([]);
            await settle();
            expect(skeleton()).toBeNull();

            fixture.componentInstance.reload();
            fixture.detectChanges();
            expect(skeleton()).toBeNull();
            nextListRequest().flush([]);
        });

        it('replaces the skeleton with the timetable again when loading fails', async () => {
            nextListRequest().flush({ message: 'The database is down.' }, { status: 500, statusText: 'Server Error' });
            await settle();

            expect(skeleton()).toBeNull();
            expect(page().querySelector('[role=alert]')?.textContent).toContain('The database is down.');
        });

        it('tells a screen reader that a running block is running, not only through its dashed outline', async () => {
            const request = nextListRequest();
            request.flush([runningOnWednesday(requestedFrom(request))]);
            await settle();

            expect(blockLabel()).toContain('กำลังเดิน');
        });

        it('gives a finished block its times without saying it is running', async () => {
            const request = nextListRequest();
            request.flush([wednesdayEntry(requestedFrom(request), 1, 'Write spec', 90)]);
            await settle();

            expect(blockLabel()).toBe('Write spec 09:00–10:30');
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
