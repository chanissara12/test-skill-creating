import { formatElapsed } from './duration.helper';

describe('formatElapsed', () => {
    it('shows zero as 00:00:00', () => {
        expect(formatElapsed(0)).toBe('00:00:00');
    });

    it('formats seconds, minutes and hours with two digits each', () => {
        expect(formatElapsed(5_000)).toBe('00:00:05');
        expect(formatElapsed(65_000)).toBe('00:01:05');
        expect(formatElapsed(3_723_000)).toBe('01:02:03');
    });

    it('drops fractions of a second instead of rounding up', () => {
        expect(formatElapsed(1_999)).toBe('00:00:01');
    });

    it('keeps counting hours past a day', () => {
        expect(formatElapsed(26 * 3_600_000)).toBe('26:00:00');
    });

    it('never shows a negative time (clock skew)', () => {
        expect(formatElapsed(-5_000)).toBe('00:00:00');
    });
});
