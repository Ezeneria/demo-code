import { AppDate } from '@core/entities';

export interface IChatEventResponse {
    id: number;
    text: string;
    location?: string;
    whenEventLeftTimeStamp: Date;
}

export function toChatEventResponse(item) {
    return {
        ...item,
        whenEventLeftTimeStamp: AppDate.fromISO(item.whenEventLeftTimeStamp)
    };
}
