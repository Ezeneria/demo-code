import { IThread, toThread } from './thread.interface';
import { IChatExtended, toChatExtended } from './chat-extended.interface';
import { IChatItemResponse, toChatItemResponse } from '@core/chat';
import { AppUtils } from '@core/entities';

export interface IChatSession {
    extended: IChatExtended;
    thread: IThread;
    messages: IChatItemResponse[];
}

export function toChatSession(data): IChatSession {
    let chat = {
        ...data.chat,
        users: data.chat.members,
        domain: data.domain
    };

    return {
        extended: toChatExtended(chat),
        thread: toThread(chat),
        messages: AppUtils.mapArray(data.messages, toChatItemResponse)
    };
}
