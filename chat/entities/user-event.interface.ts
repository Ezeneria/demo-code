export interface IUserEvent {
    id: number;
    chatId: number;
    location: string;
    from: Date;
    to: Date;
    allDay: boolean;
    timezone: string;
    comment: string;
    timestamp: number;
}
