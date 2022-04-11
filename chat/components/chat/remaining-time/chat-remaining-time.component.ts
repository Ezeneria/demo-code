import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { AppDate } from '@core/entities';

@Component({
    selector: 'app-chat-remaining-time',
    templateUrl: './chat-remaining-time.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatRemainingTimeComponent implements OnInit {
    @Input() public sessionFinishTime: Date;

    public remainingTime$: Observable<string>;

    public ngOnInit() {
        this.remainingTime$ = AppDate.timeago$(this.sessionFinishTime);
    }
}
