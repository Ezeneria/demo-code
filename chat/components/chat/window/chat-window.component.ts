import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { IActiveChat, IChatItemResponse } from '@core/chat';
import { IDictionary } from '@core/entities';

@Component({
    selector: 'app-chat-window',
    templateUrl: './chat-window.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWindowComponent {
    @Output() public changeMessage: EventEmitter<{ uuid: string, value: IDictionary<any> }> = new EventEmitter<{ uuid: string, value: IDictionary<any> }>();

    @Output() public chatLoaded: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input() public readonly: boolean;

    @Input() public thread: IActiveChat;

    @Input() public trackByFn: (index: number, msg: IChatItemResponse) => string | number;

    @Input() public loadMoreVisible: boolean = false;

    @Input() public messages: IChatItemResponse[] = [];

    @Input() public loading: boolean = false;
}
