import { Injectable } from '@angular/core';
import { CoreChatClientService } from '@core/chat';
import { ConfigService } from '@core/config';
import { ChatService } from './chat.service';
import { Store } from '@ngrx/store';

@Injectable({
    providedIn: 'root'
})
export class ChatClientService extends CoreChatClientService {
    constructor(store: Store<any>,
        private _chatService: ChatService,
        private _configService: ConfigService) {
        super(store);
    }

    public init() {
        const chatServerUrl = this._configService.chatServerUrl;
        super.init(() => this._chatService.auth(), chatServerUrl);
    }
}
