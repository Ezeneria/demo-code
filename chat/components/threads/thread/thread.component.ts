import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { AppDate } from '@core/entities';
import { IThread } from '../../../entities/thread.interface';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-thread',
    templateUrl: './thread.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadComponent {
    public item: IThread;

    public timeago$: Observable<string>;

    @Input() set thread(data: IThread) {
        this.item = data;

        this.timeago$ = AppDate.timeago$(data.lastMessageTime);
    }
}
