import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';

const REQUEST_TIMEOUT_MS = 15_000;

// A request that gets no answer fails like any other API error (an HttpErrorResponse with a message),
// so every caller shows it the same way and the UI is usable again instead of waiting forever.
export const timeoutInterceptor: HttpInterceptorFn = (request, next) =>
    next(request).pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError((error: unknown) =>
            throwError(() =>
                error instanceof TimeoutError
                    ? new HttpErrorResponse({
                          status: 408,
                          statusText: 'Request Timeout',
                          url: request.url,
                          error: { message: 'เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง' },
                      })
                    : error,
            ),
        ),
    );
