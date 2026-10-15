import { DestroyRef } from '@angular/core';

import { nowEverySecond } from './now.helper';

describe('nowEverySecond', () => {
    // A stand-in for the owner (a component): destroy() runs the callbacks it was given, like Angular does on destruction.
    let destroy: () => void = () => undefined;
    const owner = {
        onDestroy: (callback: () => void) => {
            destroy = callback;
            return () => undefined;
        },
    } as DestroyRef;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 9, 14, 12, 0, 0));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts at the current time and moves on every second', () => {
        const now = nowEverySecond(owner);
        const start = now();
        expect(start).toBe(new Date(2026, 9, 14, 12, 0, 0).getTime());

        jest.advanceTimersByTime(1000);
        expect(now()).toBe(start + 1000);

        jest.advanceTimersByTime(2000);
        expect(now()).toBe(start + 3000);
    });

    it('stops ticking once its owner is destroyed, so no timer is left running', () => {
        const now = nowEverySecond(owner);
        jest.advanceTimersByTime(1000);
        const last = now();

        destroy();
        jest.advanceTimersByTime(5000);

        expect(now()).toBe(last);
        expect(jest.getTimerCount()).toBe(0);
    });
});
