import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';

export interface Health {
    status: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
    constructor(private readonly http: HttpClient) {}

    getHealth(): Observable<Health> {
        return this.http.get<Health>(`${API_BASE_URL}/health`);
    }
}
