import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { AppDate, IDictionary } from '@core/entities';
import { IChatItemResponse } from '@core/chat';
import { Observable } from 'rxjs';
import { IThread } from '../../entities/thread.interface';
import { MessageType } from '../../entities/message-type';
import { IChatEventResponse, toChatEventResponse } from '../../entities/chat-event-response.interface';

@Component({
    selector: 'app-chat-event',
    templateUrl: './chat-event.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatEventComponent implements OnInit {
    @Input() public readonly: boolean;

    @Input() public thread: IThread;

    @Output() public changeMessage: EventEmitter<{ uuid: string, value: IDictionary<any> }> = new EventEmitter<{ uuid: string, value: IDictionary<any> }>();

    public className: string;

    public text: string;

    public location: string;

    public leftTimeAgo$: Observable<string>;

    private _message: IChatItemResponse;

    get message(): IChatItemResponse {
        return this._message;
    }

    @Input()
    set message(value: IChatItemResponse) {
        this._message = value;
        this._extractEvent();
    }

    public ngOnInit() {
        this._extractEvent();
    }

    private _extractEvent() {
        this._setBindings();

        let event: IChatEventResponse;
        try {
            event = toChatEventResponse(JSON.parse(this._message.message));
            this.text = event.text;
            this.location = event.location;
            this.leftTimeAgo$ = AppDate.timeago$(event.whenEventLeftTimeStamp);
        } catch (e) {
            console.warn(e);
        }
    }

    private _setBindings(): string {
        switch (this._message.type) {
            case MessageType.AngelEvent:
                this.className = 'type-angel-event';
                return;
            case MessageType.MemberEvent:
                this.className = 'type-member-event';
                return;
            default:
                console.warn('Unknown type', this._message.type);
                return '';
        }
    }
}
