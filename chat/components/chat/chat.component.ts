import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CoreChat } from '@core/chat';
import { ScrollPosition, ScrollUtils } from '@core/entities';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { BoxScrollComponent } from '@core/shared';
import { chatPageActions } from 'c4-admin-app/modules/chat/state/chat-page.actions';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ChatComponent extends CoreChat implements OnInit {
    @ViewChild(BoxScrollComponent, {static: true}) public chatScroll: BoxScrollComponent;

    @Input() public readonly: boolean;

    constructor(store: Store<any>,
        private _actions: Actions<any>) {
        super(store);
    }

    public ngOnInit() {
        super.ngOnInit();

        this._actions.pipe(
            ofType(chatPageActions.translate)
        ).subscribe(
            () => this.updateChatScroll(ScrollPosition.ToBottomIfNowBottom)
        );
    }

    public updateChatScroll(position: ScrollPosition) {
        ScrollUtils.updatePosition(this.chatScroll, position);
    }
}
