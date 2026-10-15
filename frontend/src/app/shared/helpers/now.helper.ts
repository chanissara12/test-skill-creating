import { DestroyRef, Signal, signal } from '@angular/core';

// The current time in epoch milliseconds, refreshed every second until the owner (a component) is destroyed.
// Read it inside computed() so whatever is derived from it keeps moving, like an elapsed-time counter.
export function nowEverySecond(owner: DestroyRef): Signal<number> {
    const now = signal(Date.now());
    const tick = setInterval(() => now.set(Date.now()), 1000);
    owner.onDestroy(() => clearInterval(tick));
    return now.asReadonly();
}
