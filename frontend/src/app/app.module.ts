import { provideHttpClient } from '@angular/common/http';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TimerModule } from './modules/timer/timer.module';
import { TimetableModule } from './modules/timetable/timetable.module';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, AppRoutingModule, TimerModule, TimetableModule],
    providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
    bootstrap: [AppComponent],
})
export class AppModule {}
