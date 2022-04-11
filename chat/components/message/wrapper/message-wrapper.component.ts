import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { IChatItemResponse } from '@core/chat';
import { AppDate } from '@core/entities';
import { IThread } from 'c4-admin-app/modules/chat/entities/thread.interface';
import { MessageType } from 'c4-admin-app/modules/chat/entities/message-type';
import { IUser } from 'c4-admin-app/modules/shared/entities/users/user.interface';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-message-wrapper',
    templateUrl: './message-wrapper.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageWrapperComponent implements OnInit {
    public isMyMessage: boolean = false;

    public user: IUser;

    public className: string;

    public sentText: string;

    public timestamp$: Observable<string>;

    @Input() public message: IChatItemResponse;

    @Input() public thread: IThread;

    public ngOnInit(): void {
        this._setBindings();

        this.timestamp$ = AppDate.timeago$(this.message.timestamp);

        this.isMyMessage = this.message.userId === this.thread.angel.id;

        this.user = this.isMyMessage ? this.thread.angel : this.thread.member;
    }

    private _setBindings(): string {
        switch (this.message.type) {
            case MessageType.Text:
                this.className = 'type-text';
                this.sentText = 'Sent';
                return;
            case MessageType.AgentNote:
                this.className = 'type-admin-note';
                this.sentText = 'Agent Note added';
                return;
            case MessageType.AngelEvent:
                this.className = 'type-angel-event';
                this.sentText = 'Angel Event added';
                return;
            case MessageType.MemberEvent:
                this.className = 'type-member-event';
                this.sentText = 'Member Event added';
                return;
            default:
                console.warn('Unknown type', this.message.type);
                return '';
        }
    }
}
