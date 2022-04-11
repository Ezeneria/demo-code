import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { confirmActions } from '@core/modal';
import { IPinMessage } from '../../entities/pin-message.interface';
import { chatPageActions } from '../../state/chat-page.actions';

@Component({
    selector: 'app-pinned-items',
    templateUrl: './pinned-items.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class PinnedItemsComponent {
    @Input() public items: IPinMessage[];

    @Input() public readonly: boolean;

    constructor(private _store: Store<any>) {
    }

    public unpin(pin: IPinMessage) {
        if (this.readonly) {
            return;
        }

        let data = {
            heading: 'Unpin message?',
            confirm: {
                action: chatPageActions.togglePin({
                    pin,
                    value: false
                }),
                waitFor: [chatPageActions.togglePinSuccess.type, chatPageActions.togglePinFail.type]
            }
        };

        this._store.dispatch(confirmActions.show(data));
    }

    public trackByFn(index, item: IPinMessage) {
        return item.uuid || index;
    }
}
