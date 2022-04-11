import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { IUserRepresent } from 'c4-admin-app/modules/common/components/user-represent/user-represent.interface';
import { UserService } from 'c4-admin-app/modules/shared/services/users/user.service';
import { IDefListItem } from 'c4-admin-app/modules/common/components/def-list/def-list';
import { IUserExtended } from 'c4-admin-app/modules/shared/entities/users/user-extended.interface';
import { AngelService } from 'c4-admin-app/modules/shared/services/angel/angel.service';
import { IChatExtended } from '../../entities/chat-extended.interface';

@Component({
    selector: 'app-chat-extended',
    templateUrl: './chat-extended.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatExtendedComponent implements OnChanges {
    // for session component
    @Input() public isStatic: boolean = false;

    @Input() public extended: IChatExtended;

    @Input() public readonly: boolean = false;

    @Output() public updateWidget: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Output() public toggle: EventEmitter<boolean> = new EventEmitter<boolean>();

    public loading: boolean;

    public selected: IUserRepresent;

    public selectedInfo: IUserExtended;

    // it's prevent AOT compile error for selectedInfo as MemberExtended while real type is angelExtended
    public selectedInfoListAngel: IDefListItem[];

    constructor(private _userService: UserService,
        private _angelService: AngelService,
        private _store: Store<any>) {
    }

    public ngOnChanges() {
        this.unselectUser(false);
    }

    public selectUser(user: IUserRepresent) {
        this.loading = true;
        this.selected = user;
        this.selectedInfo = null;
        this.selectedInfoListAngel = null;

        let fn = (data) => {
            this.selectedInfo = data;
            this.loading = false;
            this.updateWidget.emit(true);
        };

        let errFn = () => {
            this.selected = null;
            this.loading = false;
        };

        if (user.isAngel) {
            this._angelService.findAngelById(user.id).subscribe(
                (data) => {
                    this.selectedInfoListAngel = data.listAngel;
                    fn(data);
                },
                errFn
            );
        } else {
            this._userService.findMemberById(user.id).subscribe(
                (data) => fn(data),
                errFn
            );
        }
    }

    public unselectUser(updateWidget: boolean = true) {
        this.selected = null;
        this.selectedInfo = null;
        this.selectedInfoListAngel = null;

        if (updateWidget) {
            this.updateWidget.emit(true);
        }
    }
}
