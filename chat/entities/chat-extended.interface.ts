import { IUserRepresent, toUserRepresent } from 'c4-admin-app/modules/common/components/user-represent/user-represent.interface';
import { IDefListItem, toDefListText } from 'c4-admin-app/modules/common/components/def-list/def-list';
import { AppDate, AppUtils } from '@core/entities';
import { DurationPipe } from '@core/shared';
import { IPinMessage, toPinMessage } from './pin-message.interface';
import { UserType } from 'c4-admin-app/modules/shared/entities/users/user-type';

export interface IChatExtended {
    threadUsersHeading: string;
    threadUsers: IUserRepresent[];
    chatDetails: IDefListItem[];
    pinnedItems: IPinMessage[];
    members;
}

function toPinnedItem(item) {
    return toPinMessage(
        item.chatId,
        item.uuid,
        item.userName,
        item.message,
        AppDate.fromISO(item.timestamp),
        true
    );
}

function toThreadUser(user: any) {
    return toUserRepresent(
        user,
        user.type === UserType.Angel,
        user.verified,
        AppDate.fromISO(user.birthday),
        user.location
    );
}

function toChatDetails(details): IDefListItem[] {
    return [
        toDefListText('Start Time', AppDate.transform(details.startTime, 'MMM. dd @ h:mm a Z', 'en-US')), // TODO check GMT
        toDefListText('Duration', new DurationPipe().transform(details.duration)),
        toDefListText('Inactivity', new DurationPipe().transform(details.inactivity)),
        toDefListText('Browser', details.browser),
        toDefListText('Location', details.location),
        toDefListText('IP Address', details.ipAddress),
        toDefListText('Posts', details.posts)
    ];
}

export function toChatExtended(data): IChatExtended {
    const threadUsers = AppUtils.mapArray(data.members, toThreadUser);
    let total = threadUsers.length;
    let onlineTotal = threadUsers.reduce((prev, current) => prev + (current['isOnline'] ? 1 : 0), 0);

    return {
        pinnedItems: AppUtils.mapArray(data.pinnedItems, toPinnedItem),
        chatDetails: data.details && toChatDetails(data.details) || [],
        threadUsers,
        threadUsersHeading: `Members(${onlineTotal}/${total})`,
        members: data.members
    };
}
