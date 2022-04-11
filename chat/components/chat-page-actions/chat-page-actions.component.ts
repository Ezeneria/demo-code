import { ModalService } from '@core/overlay';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { PermissionType } from 'c4-admin-app/modules/permissions/permission-type';
import { UserType } from 'c4-admin-app/modules/shared/entities/users/user-type';
import { ChatService } from '../../providers/chat.service';
import { ThreadType } from '../../entities/thread-type';
import { IThread } from '../../entities/thread.interface';
import { chatPageActions } from '../../state/chat-page.actions';
import { ChatAssignComponent } from '../assign/chat-assign.component';

@Component({
    selector: 'app-chat-page-actions',
    templateUrl: './chat-page-actions.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatPageActionsComponent {
    @Input() public selected: IThread;

    @Input() public selectedChatIds: number[];

    @Output() public toggle: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input() public isActive: boolean;

    @Input() public currentOwnerId: number = null;

    public hasAccessManageChats = PermissionType.ManageChats;

    public canEndChat: boolean;

    public isArchivePage: boolean;

    public isPausedPage: boolean;

    public member;

    @Input() set pageType(data: string) {
        this.canEndChat = data === ThreadType.Active || data === ThreadType.AgentChats;
        this.isArchivePage = data === ThreadType.Archived;
        this.isPausedPage = data === ThreadType.Paused;
    }

    @Input() set members(members: any[]) {
        if (!members) {
            return;
        }

        let angel = members.find((u) => u.type === UserType.Angel);
        if (angel) {
            let user = members.find((u) => u.id !== angel.id);
            if (user) {
                this.member = user;
            }
        }
    }

    get hasDivider(): boolean {
        return !!this.selected || this.selectedChatIds.length > 0;
    }

    constructor(private _store: Store<any>,
        private _modalService: ModalService,
        private _chatService: ChatService) {
    }

    public removeThreads(chatIds: number[]): void {
        chatIds.map((chatId) => {
            this._store.dispatch(chatPageActions.removeThread({chatId}));
        });

        this._store.dispatch(chatPageActions.clearSelectedChatIds());
    }

    public assign(isSingle: boolean = false) {
        let chatIds = this._getChats(isSingle);

        this._modalService.show({
            data: {
                chatIds,
                currentOwnerId: this.currentOwnerId,
                removeThreadsFn: () => this.removeThreads(chatIds)
            },
            component: ChatAssignComponent,
            headingKey: 'LIVE_PAGE.CHAT_ASSIGN'
        });
    }

    public end(isSingle: boolean = false) {
        let chatIds = this._getChats(isSingle);

        this._chatService.deassignChats(chatIds).subscribe(
            () => this.removeThreads(chatIds)
        );
    }

    public unpause(isSingle: boolean = false) {
        let chatIds = this._getChats(isSingle);

        this._chatService.unpauseChats(chatIds).subscribe(
            () => this.removeThreads(chatIds),
        );
    }

    public archive(isSingle: boolean = false) {
        let chatIds = this._getChats(isSingle);

        this._chatService.archiveChats(chatIds).subscribe(
            () => this.removeThreads(chatIds),
        );
    }

    public unarchive(isSingle: boolean = false) {
        let chatIds = this._getChats(isSingle);

        this._chatService.unarchiveChats(chatIds).subscribe(
            () => this.removeThreads(chatIds),
        );
    }

    private _getChats(isSingle: boolean): number[] {
        return isSingle ? [this.selected.chatId] : this.selectedChatIds;
    }
}
