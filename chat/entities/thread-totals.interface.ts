export interface IThreadTotals {
    active: number;
    scheduled: number;
    unassigned: {
        all: number;
        replied: number;
        notReplied: number;
    };
}
