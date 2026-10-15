import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { errorMessageOf } from '../helpers/http-error.helper';
import { timeoutInterceptor } from './timeout.interceptor';

describe('timeoutInterceptor', () => {
    let client: HttpClient;
    let http: HttpTestingController;

    beforeEach(() => {
        jest.useFakeTimers();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptors([timeoutInterceptor])), provideHttpClientTesting()],
        });
        client = TestBed.inject(HttpClient);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => jest.useRealTimers());

    it('fails a request that gets no answer within 15 seconds, with a message that is ready to show', () => {
        const errors: HttpErrorResponse[] = [];
        client.get('/slow').subscribe({ error: (error: HttpErrorResponse) => errors.push(error) });

        jest.advanceTimersByTime(14_999);
        expect(errors).toHaveLength(0);
        jest.advanceTimersByTime(1);

        expect(errors).toHaveLength(1);
        expect(errorMessageOf(errors[0])).toBe('เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง');
    });

    it('lets a request that is answered in time through untouched', () => {
        const bodies: unknown[] = [];
        client.get('/fast').subscribe((body) => bodies.push(body));

        jest.advanceTimersByTime(5_000);
        http.expectOne('/fast').flush({ ok: true });
        jest.advanceTimersByTime(60_000);

        expect(bodies).toEqual([{ ok: true }]);
    });

    it('does not hide an error that the server sent', () => {
        const errors: HttpErrorResponse[] = [];
        client.get('/refused').subscribe({ error: (error: HttpErrorResponse) => errors.push(error) });

        http.expectOne('/refused').flush({ message: 'A timer is already running.' }, { status: 409, statusText: 'Conflict' });

        expect(errorMessageOf(errors[0])).toBe('A timer is already running.');
    });
});
