import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { IChatItemResponse } from '@core/chat';
import { IDictionary } from '@core/entities';
import { IThread } from '../../entities/thread.interface';

@Component({
    selector: 'app-chat-message',
    templateUrl: './chat-message.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageComponent {
    @Output() public changeMessage: EventEmitter<{ uuid: string, value: IDictionary<any> }> = new EventEmitter<{ uuid: string, value: IDictionary<any> }>();

    @Input() public readonly: boolean;

    @Input() public thread: IThread;

    @Input() public message: IChatItemResponse;
}
