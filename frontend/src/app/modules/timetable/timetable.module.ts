import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TimetableComponent } from './components/timetable.component';

@NgModule({
    declarations: [TimetableComponent],
    imports: [CommonModule],
    exports: [TimetableComponent],
})
export class TimetableModule {}
