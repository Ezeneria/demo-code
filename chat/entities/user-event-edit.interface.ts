import { MessageType } from './message-type';
import { IUserEvent } from './user-event.interface';

export interface IUserEventEdit {
    chatId: number;
    eventId: number;
    type: MessageType;
    isEditMode: boolean;
    afterSave: (event: IUserEvent) => void;
}

export function toUserEventEdit(chatId: number,
    type: MessageType,
    isEditMode: boolean,
    afterSave: (event: IUserEvent) => void,
    eventId: number) {
    return {
        chatId,
        eventId,
        type,
        isEditMode,
        afterSave
    };
}
