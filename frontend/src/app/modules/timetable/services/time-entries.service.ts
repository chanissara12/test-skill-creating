import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { failWithMessage } from '../../../shared/helpers/http-error.helper';
import { TimeEntry } from '../../../shared/models/time-entry.model';

@Injectable({ providedIn: 'root' })
export class TimeEntriesService {
    constructor(private readonly http: HttpClient) {}

    // Every entry that overlaps [from, to), including ones that started earlier or are still running.
    list(from: Date, to: Date): Observable<TimeEntry[]> {
        const params = new HttpParams().set('fromUtc', from.toISOString()).set('toUtc', to.toISOString());
        return this.http.get<TimeEntry[]>(`${API_BASE_URL}/time-entries`, { params }).pipe(catchError(failWithMessage));
    }

    // Only a finished entry can be deleted; the API refuses the Running Timer with a message.
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE_URL}/time-entries/${id}`).pipe(catchError(failWithMessage));
    }
}
