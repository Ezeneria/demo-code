import { getFullName } from 'c4-admin-app/modules/shared/entities/users/user.interface';

export interface IAdminChat {
    id: number;
    userName: string;
    fullName: string;
    online: boolean;
    totalChats: number;
}

export function toAdminChat(data): IAdminChat {
    return {
        id: data.id,
        online: data.online === true,
        totalChats: data.totalChats || 0,
        userName: data.userName,
        fullName: getFullName(data.firstName, data.lastName)
    };
}
