import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
    let http: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot([])],
            declarations: [AppComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
    });

    it('shows the status reported by the backend', async () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        http.expectOne((req) => req.url.endsWith('/api/health')).flush({ status: 'ok' });
        await fixture.whenStable();
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('ok');
    });

    it('shows "unreachable" when the backend cannot be reached', async () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        http.expectOne((req) => req.url.endsWith('/api/health')).error(new ProgressEvent('error'));
        await fixture.whenStable();
        fixture.detectChanges();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('unreachable');
    });
});
