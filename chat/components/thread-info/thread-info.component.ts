import { Component, Input, ViewEncapsulation } from '@angular/core';
import { IThread } from '../../entities/thread.interface';

@Component({
    selector: 'app-thread-info',
    templateUrl: './thread-info.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ThreadInfoComponent {
    @Input() public thread: IThread;
}
