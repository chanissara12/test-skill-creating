import { HttpErrorResponse } from '@angular/common/http';

import { errorMessageOf } from './http-error.helper';

describe('errorMessageOf', () => {
    it('uses the message sent by the API', () => {
        const error = new HttpErrorResponse({ status: 409, error: { message: 'A timer is already running.' } });

        expect(errorMessageOf(error)).toBe('A timer is already running.');
    });

    it('explains that the server cannot be reached when there is no response', () => {
        const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

        expect(errorMessageOf(error)).toBe('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า backend ทำงานอยู่หรือไม่');
    });

    it('falls back to a generic message when the API sent no message', () => {
        const error = new HttpErrorResponse({ status: 500, error: 'boom' });

        expect(errorMessageOf(error)).toBe('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    });
});
