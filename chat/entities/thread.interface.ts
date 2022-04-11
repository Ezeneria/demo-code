import { AppDate } from '@core/entities';
import { IActiveChat, IChatItemResponse } from '@core/chat';
import { MarkdownLib } from '@core/markdown';
import { TruncatePipe } from '@core/shared';
import { IDomain } from 'c4-admin-app/modules/shared/entities/domain/domain.interface';
import { IAdmin, toAdmin } from 'c4-admin-app/modules/shared/entities/admins/admin.interface';
import { IUser, toUser } from 'c4-admin-app/modules/shared/entities/users/user.interface';
import { UserType } from 'c4-admin-app/modules/shared/entities/users/user-type';
import { ITranslationLanguage } from 'c4-admin-app/modules/translations';

export interface IThread extends IActiveChat {
    chatId: number;
    angel: IUser;
    member: IUser;
    hasBankUser: boolean;
    siteId: number;
    domain: IDomain;
    admin: IAdmin;
    lastMessage: string;
    lastMessageTime: Date;
    isMyMessage: boolean;
    sessionFinishTime: Date | null;
    translationLanguage: ITranslationLanguage | null;
}

export function updateThreadWithNewMessage(current: IThread, msg: IChatItemResponse): IThread {
    return {
        ...current,
        lastMessage: new TruncatePipe().transform(MarkdownLib.mdToMessage(msg.message), 100),
        lastMessageTime: new Date(msg.timestamp),
        isMyMessage: msg.userId === current.angel.id
    };
}

export function getLastMessage(msg) {
    if (!msg) {
        return '';
    }

    let message = msg.message || msg.foreignMessage;
    return new TruncatePipe().transform(MarkdownLib.mdToMessage(message), 100);
}

export function toThread(data): IThread {
    let angel = data.users.find((u) => u.type === UserType.Angel);
    if (!angel) {
        console.warn('No angel from thread data', data);
        // return null; // restMap() handle it
    }

    let user = data.users.find((u) => u.id !== angel.id);
    if (!user) {
        console.warn('No user from thread data', data);
        // return null; // restMap() handle it
    }

    let msg = data.lastMessage;
    return {
        chatId: data.id || data.chatId,

        angel: toUser(angel),
        member: toUser(user),

        lastMessage: getLastMessage(msg),
        lastMessageTime: msg && AppDate.fromISO(msg.timestamp) || null,
        isMyMessage: msg && msg.userId === angel.id,

        hasBankUser: !!data.users.find((u) => u.type === UserType.Bank),
        siteId: data.siteId,
        domain: data.domain, // TODO it can be remove and use page.sites
        admin: data.admin && toAdmin(data.admin) || null,

        sessionFinishTime: AppDate.fromISO(data.sessionFinishTime),

        // TODO check it for admin
        readonly: data.readOnly === true,

        translationLanguage: data.translationLanguage || null
    };
}
