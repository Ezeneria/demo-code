import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { ChatClientStatus } from '@core/chat';

@Component({
    selector: 'app-chat-status',
    templateUrl: './chat-status.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatStatusComponent {
    public loading: boolean;
    public ready: boolean;
    public failed: boolean;

    @Input() set status(status: ChatClientStatus) {
        switch (status) {
            case ChatClientStatus.Ready:
                this.loading = false;
                this.ready = true;
                this.failed = false;
                break;
            case ChatClientStatus.Loading:
                this.loading = true;
                this.ready = false;
                this.failed = false;
                break;
            case ChatClientStatus.Failed:
                this.loading = false;
                this.ready = false;
                this.failed = true;
                break;
            default:
                console.warn('Unknown', status);
        }
    }
}
