import { IModalComponent } from '@core/overlay';
import { dynamicToken } from '@core/dynamic';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalFormComponent } from '@core/forms';
import { AppUtils, getFirstValue, IGuidListItem, toGuidListItem } from '@core/entities';
import { ChatService } from '../../providers/chat.service';
import { IAdminChat } from '../../entities/admin-chat.interface';

@Component({
    templateUrl: './chat-assign.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatAssignComponent extends ModalFormComponent implements OnInit {
    public admins: IGuidListItem[];

    public loading: boolean = false;

    private _chatIds: number[];

    private _currentOwnerId: number;

    private _removeThreadsFn;

    constructor(@Inject(dynamicToken) public modal: IModalComponent,
        private _chatService: ChatService,
        private _formBuilder: FormBuilder) {
        super();
    }

    public ngOnInit(): void {
        super.ngOnInit();

        let data = this.modal.data;
        if (!data) {
            this.modal.close();
            return;
        }

        this._chatIds = data.chatIds;
        this._currentOwnerId = data.currentOwnerId;
        this._removeThreadsFn = data.removeThreadsFn;

        this.waitFor(
            this._chatService.admins()
        ).subscribe(
            (admins: IAdminChat[]) => {
                if (!Array.isArray(admins)) {
                    // TODO no admins
                    return;
                }

                this.admins = admins
                    .filter((item) => item.id !== this._currentOwnerId)
                    .map((admin) => {
                        let heading = `${admin.fullName} (${admin.userName}) | ${admin.totalChats} chats`;
                        return toGuidListItem(heading, admin.id);
                    });

                this.form.patchValue({
                    admin: getFirstValue(this.admins)
                });
            }
        );
    }

    public submit(): void {
        this.waitFor(
            this._chatService.assignChats(this._chatIds, this.form.value.admin)
        ).subscribe(
            () => {
                AppUtils.cycleHook(() => this._removeThreadsFn());
                this.modal.close();
            }
        );
    }

    protected initForm(): FormGroup {
        return this._formBuilder.group({
            admin: [null, Validators.required]
        });
    }
}
