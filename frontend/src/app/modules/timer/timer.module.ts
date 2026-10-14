import { NgModule } from '@angular/core';

import { TimerPanelComponent } from './components/timer-panel.component';

@NgModule({
    declarations: [TimerPanelComponent],
    exports: [TimerPanelComponent],
})
export class TimerModule {}
