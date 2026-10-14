import { Component } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { HealthService } from './modules/core/services/health.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false,
})
export class AppComponent {
    readonly backendStatus$: Observable<string>;

    constructor(healthService: HealthService) {
        this.backendStatus$ = healthService.getHealth().pipe(
            map((health) => health.status),
            catchError(() => of('unreachable')),
        );
    }
}
