import { IModalComponent } from '@core/overlay';
import { dynamicToken } from '@core/dynamic';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { PinMessage } from '../../entities/pin-message';

@Component({
    selector: 'app-pin-message',
    templateUrl: './pin-message.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class PinMessageComponent {
    constructor(@Inject(dynamicToken) public modal: IModalComponent<PinMessage>) {
    }

    public pin() {
        this.modal.data.onConfirm();
        this.modal.close();
    }
}
