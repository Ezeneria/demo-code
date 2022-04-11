import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { IChatItemResponse } from '@core/chat';
import { IDictionary, SizeType } from '@core/entities';
import { ModalService } from '@core/overlay';
import { Store } from '@ngrx/store';
import { AdminNoteEditComponent } from 'c4-admin-app/modules/admins/components/admin-note-edit/admin-note-edit.component';
import { Open } from 'c4-admin-app/modules/gallery-overlay/gallery-overlay-actions';
import { IAdminNoteEdit, toAdminNoteEdit } from 'c4-admin-app/modules/shared/entities/admin-notes/admin-note-edit.interface';
import { IAdminNote } from 'c4-admin-app/modules/shared/entities/admin-notes/admin-note.interface';
import { IGallery, toGallery } from 'c4-admin-app/modules/shared/entities/gallery/gallery.interface';
import { IChatEventResponse } from '../../../entities/chat-event-response.interface';
import { MessageType } from '../../../entities/message-type';
import { PinMessage } from '../../../entities/pin-message';
import { IPinMessage, toPinMessage } from '../../../entities/pin-message.interface';
import { IThread } from '../../../entities/thread.interface';
import { toUserEventEdit } from '../../../entities/user-event-edit.interface';
import { IUserEvent } from '../../../entities/user-event.interface';
import { ChatService } from '../../../providers/chat.service';
import { chatPageActions } from '../../../state/chat-page.actions';
import { PinMessageComponent } from '../../pin/pin-message.component';
import { UserEventComponent } from '../../user-event/user-event.component';

@Component({
    selector: 'app-message-text',
    templateUrl: './message-text.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageTextComponent implements OnChanges {
    @Output() public changeMessage: EventEmitter<{ uuid: string, value: IDictionary<any> }> = new EventEmitter<{ uuid: string, value: IDictionary<any> }>();

    @Input() public readonly: boolean;

    @Input() public thread: IThread;

    @Input() public message: IChatItemResponse;

    public text: string;

    public foreignMessage: string;

    public ableToPin: boolean = false;

    public ableToEdit: boolean = false;

    private _eventId: number;

    constructor(private _store: Store<any>,
        private _modalService: ModalService,
        private _chatService: ChatService) {
    }

    public ngOnChanges() {
        switch (this.message.type) {
            case MessageType.Text:
                this.text = this.message.message;
                this.foreignMessage = this.message.foreignMessage;
                this.ableToPin = !this.readonly;
                return;
            case MessageType.AgentNote:
                this._extractAdminNote();
                this.ableToEdit = !this.readonly;
                return;
            case MessageType.MemberEvent:
            case MessageType.AngelEvent:
                this.ableToEdit = !this.readonly;
                this._extractEvent();
                return;
            default:
                console.warn('Unknown type');
        }
    }

    public tryOpenGallery($event) {
        if ($event.target.tagName === 'IMG') {
            let src = $event.target.src;
            let gallery: IGallery = toGallery([src]);
            this._store.dispatch(new Open(gallery));
        }
    }

    public togglePin() {
        if (this.readonly) {
            return;
        }

        let pinMessage: IPinMessage = toPinMessage(
            this.message.chatId,
            this.message.uuid,
            this.thread.member.userName,
            this.message.message,
            this.message.timestamp,
            this.message.isPinned
        );

        let onConfirm = () => {
            this._chatService.togglePin(pinMessage.chatId, pinMessage.uuid, !this.message.isPinned).subscribe(
                () => {
                    this._store.dispatch(chatPageActions.togglePinSuccess({
                        pin: {
                            ...pinMessage,
                            isPinned: !this.message.isPinned
                        }
                    }));
                }
            );
        };

        let pinData = new PinMessage(
            this.message.isPinned ? 'Unpin Message' : 'Pin Message',
            pinMessage,
            onConfirm,
        );

        this._modalService.show({
            data: pinData,
            component: PinMessageComponent,
            size: SizeType.Large,
            heading: pinData.heading
        });
    }

    public toggleEdit(): void {
        switch (this.message.type) {
            case MessageType.AgentNote:
                this._adminNoteEdit();
                break;
            case MessageType.AngelEvent:
            case MessageType.MemberEvent:
                this._eventEdit();
                break;
            default:
            // nothing
        }
    }

    private _extractAdminNote() {
        let adminNote: IAdminNote;
        try {
            adminNote = JSON.parse(this.message.message);
            this.text = adminNote.text;
        } catch (e) {
            console.warn(e);
        }
    }

    private _extractEvent() {
        let event: IChatEventResponse;
        try {
            event = JSON.parse(this.message.message);
            this.text = event.text;
            this._eventId = event.id;
        } catch (e) {
            console.warn(e);
        }
    }

    private _adminNoteEdit() {
        let data: IAdminNoteEdit = toAdminNoteEdit(this.message);
        this._modalService.show({
            data,
            component: AdminNoteEditComponent,
            headingKey: 'AGENT_NOTE.HEADING'
        });
    }

    private _eventEdit() {
        let afterSave = (event: IUserEvent) => {
            this.changeMessage.emit({
                uuid: this.message.uuid,
                value: {
                    message: JSON.stringify({
                        id: event.id,
                        location: event.location,
                        text: event.comment,
                        whenEventLeftTimeStamp: event.to,
                        timestamp: event.timestamp
                    })
                }
            });
        };

        const headingKey = this.message.type === MessageType.AngelEvent ?
            'LIVE_PAGE.ANGEL_EVENT' :
            'LIVE_PAGE.MEMBER_EVENT';

        this._modalService.show({
            data: toUserEventEdit(
                this.thread.chatId,
                this.message.type,
                true,
                afterSave,
                this._eventId
            ),
            component: UserEventComponent,
            headingKey
        });
    }
}
