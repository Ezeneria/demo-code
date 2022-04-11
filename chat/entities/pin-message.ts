import { IPinMessage } from './pin-message.interface';

export class PinMessage {
    constructor(public heading: string,
        public pinMessage: IPinMessage,
        public onConfirm: () => void) {
    }
}
