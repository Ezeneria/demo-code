import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AuthState } from '@core/auth';
import { coreChatActions, CoreChatActionsComponent, IChatItemResponse } from '@core/chat';
import { AppDate, AppUtils, SizeType } from '@core/entities';
import { IMediaItem } from '@core/media';
import { OverlayService } from '@core/modal';
import { ModalService } from '@core/overlay';
import { Store } from '@ngrx/store';
import { PositionType } from '@core/dynamic';
import { FileExplorerComponent } from 'c4-admin-app/modules/shared/components/file-explorer/file-explorer.component';
import { IAdminNote } from 'c4-admin-app/modules/shared/entities/admin-notes/admin-note.interface';
import { AdminNoteService } from 'c4-admin-app/modules/shared/services/admin-note/admin-note.service';
import { TranslationService } from 'c4-admin-app/modules/translations';
import { finalize, map } from 'rxjs/operators';
import { IChatEventResponse } from '../../../entities/chat-event-response.interface';
import { MessageType } from '../../../entities/message-type';
import { IThread } from '../../../entities/thread.interface';
import { toUserEventEdit } from '../../../entities/user-event-edit.interface';
import { IUserEvent } from '../../../entities/user-event.interface';
import { UserEventComponent } from '../../user-event/user-event.component';

@Component({
    selector: 'app-chat-actions',
    templateUrl: './chat-actions.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatActionsComponent extends CoreChatActionsComponent implements OnChanges {
    @HostBinding('class.active') public isActive: boolean = false;

    @Input() public thread: IThread;

    public isAdminNoteView: boolean;

    public translation: FormControl = new FormControl(null, Validators.required);

    public loading: boolean = false;

    public get PositionType(): typeof PositionType {
        return PositionType;
    }

    constructor(store: Store<any>,
        private _authState: AuthState,
        private _adminNoteService: AdminNoteService,
        private _overlayService: OverlayService,
        private _modalService: ModalService,
        private _translationService: TranslationService) {
        super(store);
    }

    // TODO check if too much
    public ngOnChanges() {
        if (this.inputEl) {
            this.inputEl.nativeElement.focus();
        }
    }

    // it will be better to add SEND button instead of enter
    public trySend() {
        if (this.isAdminNoteView && this.chatInput.valid) {
            this._onCreateAgentNote(this.chatInput.value);
        } else {
            let message = this.prepareMessage();
            let foreignText = this._prepareForeignText();

            if (!message) {
                return;
            }

            if (this.thread.translationLanguage && !foreignText) {
                return;
            }

            this.store.dispatch(coreChatActions.send({
                fromUserId: this.thread.angel.id,
                message,
                foreignText,
                messageType: MessageType.Text,
                ownerToken: AppUtils.guid()
            }));
        }

        this.reset(true);
    }

    public trySendOrTranslate($event) {
        $event.stopPropagation();
        $event.preventDefault();

        if (this.thread.translationLanguage && !this.isAdminNoteView) {
            this.translate();
        } else {
            this.trySend();
        }
    }

    public translate() {
        // const source: number = 'en';
        const target: number = this.thread.translationLanguage.id;

        this.loading = true;
        this._translationService.translate(this.chatInput.value, [target]).pipe(
            map((value) => value[target]),
            finalize(() => this.loading = false)
        ).subscribe(
            (value: string) => this.translation.setValue(value)
        );
    }

    public toggleAdminNoteView() {
        this.isAdminNoteView = !this.isAdminNoteView;
        this.inputEl.nativeElement.focus();
    }

    public onCreateAngelEvent() {
        this._onCreateUserEvent(MessageType.AngelEvent);
    }

    public onCreateMemberEvent() {
        this._onCreateUserEvent(MessageType.MemberEvent);
    }

    public openFileExplorer() {
        this._modalService.show({
            data: {
                userId: this.thread.angel.id,
                chatId: this.thread.chatId,
                sendFn: (
                    images: IMediaItem[],
                    cb: () => void
                ) => this.addImages(images, cb)
            },
            component: FileExplorerComponent,
            size: SizeType.Large,
            headingKey: 'SELECT_FILES'
        });
    }

    protected reset(focus: boolean) {
        this.isAdminNoteView = false;
        this.translation.setValue(null);
        super.reset(focus);
    }

    private _onCreateAgentNote(text: string): void {
        this._adminNoteService.create({
            userId: this.thread.member.id,
            text,
            chatId: this.thread.chatId
        }).subscribe(
            (createdId) => {
                let message = JSON.stringify(<IAdminNote> {
                    text,
                    id: createdId,
                    adminId: this._authState.currentUserId
                });
                this._createMessage(message, MessageType.AgentNote);
            }
            // TODO processError
        );
    }

    private _onCreateUserEvent(type: MessageType) {
        let onAfterSave = (event: IUserEvent) => {
            // manual create message only for visual compatibility
            let message = JSON.stringify(<IChatEventResponse> {
                id: event.id,
                location: event.location,
                whenEventLeftTimeStamp: event.to,
                text: event.comment,
            });
            this._createMessage(message, type);
            this._overlayService.close(); // TODO check it and focus
        };

        let data = toUserEventEdit(
            this.thread.chatId,
            type,
            false,
            onAfterSave,
            null
        );

        const headingKey = type === MessageType.AngelEvent ?
            'LIVE_PAGE.ANGEL_EVENT' :
            'LIVE_PAGE.MEMBER_EVENT';

        this._modalService.show({
            data,
            component: UserEventComponent,
            headingKey
        });
    }

    // manually create message only for visual compatibility
    private _createMessage(message: string, type: MessageType) {
        let newMessage: IChatItemResponse = {
            type: <string> type,
            chatId: this.thread.chatId,
            message,
            timestamp: AppDate.current(),
            isRead: true,
            chatMessageId: null,
            userId: this.thread.angel.id,
            isPinned: false,
            uuid: AppUtils.guid()
        };

        this.store.dispatch(coreChatActions.loadMessagesSuccess({
            messages: [newMessage],
            addBefore: false,
        }));
    }

    private _prepareForeignText() {
        let message: string = this.translation.value || '';
        let imagesText: string = this.prepareImagesAsText();
        message = this.appendImagesToMessage(message, imagesText);

        if (!message) {
            return null;
        }

        return message;
    }
}
