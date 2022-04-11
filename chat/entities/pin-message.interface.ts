import { AppDate } from '@core/entities';
import { MarkdownLib } from '@core/markdown';

export interface IPinMessage {
    userName: string;
    message: string;
    messageTime: string;
    messageTimeShort: string;
    uuid: string;
    chatId: number;
    isPinned: boolean;
}

export function toPinMessage(chatId: number,
    uuid: string,
    userName: string,
    message: string,
    date: Date,
    isPinned: boolean): IPinMessage {
    return {
        chatId,
        uuid,
        userName,
        message: MarkdownLib.mdToMessage(message),
        messageTime: AppDate.transform(date, 'MMM d y @ h:mm a', 'en-US'),
        messageTimeShort: AppDate.transform(date, 'MMM. d', 'en-US'),
        isPinned
    };
}
