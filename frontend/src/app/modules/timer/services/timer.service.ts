import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { errorMessageOf } from '../../../shared/helpers/http-error.helper';
import { TimeEntry } from '../models/time-entry.model';

@Injectable({ providedIn: 'root' })
export class TimerService {
    constructor(private readonly http: HttpClient) {}

    getRunning(): Observable<TimeEntry | undefined> {
        // The API answers 204 No Content when idle, which HttpClient delivers as null.
        return this.http.get<TimeEntry | null>(`${API_BASE_URL}/timer/running`).pipe(
            map((entry) => entry ?? undefined),
            catchError(this.toError),
        );
    }

    start(title: string): Observable<TimeEntry> {
        return this.http.post<TimeEntry>(`${API_BASE_URL}/timer/start`, { title }).pipe(catchError(this.toError));
    }

    stop(): Observable<TimeEntry> {
        return this.http.post<TimeEntry>(`${API_BASE_URL}/timer/stop`, {}).pipe(catchError(this.toError));
    }

    private readonly toError = (error: HttpErrorResponse) => throwError(() => new Error(errorMessageOf(error)));
}
