// What the API returns for one piece of work. A Running Timer is an entry with no stoppedAtUtc.
export interface TimeEntry {
    id: number;
    title: string;
    startedAtUtc: string;
    stoppedAtUtc: string | null;
}
