const pad = (value: number): string => String(value).padStart(2, '0');

// Formats a length of time as HH:mm:ss. Hours keep counting past 24; negative input (clock skew) shows zero.
export function formatElapsed(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Formats a length of time as HH:mm (no seconds), for totals. Hours may exceed 99.
export function formatHoursMinutes(milliseconds: number): string {
    return formatElapsed(milliseconds).slice(0, -3);
}
