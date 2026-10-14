import { provideHttpClient } from '@angular/common/http';
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TimerModule } from './modules/timer/timer.module';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, AppRoutingModule, TimerModule],
    providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
    bootstrap: [AppComponent],
})
export class AppModule {}
