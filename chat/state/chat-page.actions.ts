import { createAction, props, union } from '@ngrx/store';
import { IChatItemResponse } from '@core/chat';
import { IPinMessage } from '../entities/pin-message.interface';
import { IThreadTotals } from '../entities/thread-totals.interface';
import { IChatExtended } from '../entities/chat-extended.interface';
import { IAdminChat } from '../entities/admin-chat.interface';
import { IThreadCriteria } from '../entities/thread-criteria.interface';
import { IThread } from '../entities/thread.interface';
import { ThreadType } from '../entities/thread-type';
import { IUnnasignedCriteria } from '../entities/unnasigned-criteria.interface';

export const chatPageActions = {
    translate: createAction(
        '[Chat Page] Create Success',
        props<{ chatId: number, uuid: string, message: string }>(),
    ),
    // TODO move to Chat Core Extend
    create: createAction(
        '[Chat Page] Create',
        props<{
            fromUserId: number;
            toUserId: number;
            message: string;
            translationLanguageId: number;
            foreignText: string;
            siteId: number;
            ownerToken: string;
        }>()
    ),
    createSuccess: createAction(
        '[Chat Page] Create Success',
        props<{ chatId: number }>(),
    ),
    fail: createAction(
        '[Chat Page] Fail',
        props<{ err: Error }>(),
    ),
    // end move
    updateSelectedChatIds: createAction(
        '[Chat Page] Update Selected Chat Ids',
        props<{ isSelect: boolean, chatId: number }>(),
    ),
    clearSelectedChatIds: createAction(
        '[Chat Page] Clear Selected Chat Ids',
    ),
    clear: createAction(
        '[Chat Page] Clear',
    ),
    updateCriteria: createAction(
        '[Chat Page] Update Criteria',
        props<{ criteria: IThreadCriteria }>()
    ),
    updateUnnasignedCriteria: createAction(
        '[Chat Page] Update Unnasigned Criteria',
        props<{ criteria: IUnnasignedCriteria }>()
    ),
    adminList: createAction(
        '[Chat Page] Admin List',
    ),
    adminListSuccess: createAction(
        '[Chat Page] Admin List Success',
        props<{ items: IAdminChat[] }>()
    ),
    adminListFail: createAction(
        '[Chat Page] Admin List Fail',
        props<{ err: Error }>(),
    ),
    resetPage: createAction(
        '[Chat Page] Reset Page',
        props<{ pageType: ThreadType, ownerId: number }>(),
    ),
    updateCounters: createAction(
        '[Chat Page] Update Counters',
    ),
    updateThreads: createAction(
        '[Chat Page] Update Threads',
        props<{ message: IChatItemResponse }>()
    ),
    updateThreadsSuccess: createAction(
        '[Chat Page] Update Threads Success',
        props<{ threads: IThread[] }>()
    ),
    updateThreadsFail: createAction(
        '[Chat Page] Update Threads Fail',
        props<{ err: Error }>()
    ),
    extended: createAction(
        '[Chat Page] Extended',
    ),
    extendedSuccess: createAction(
        '[Chat Page] Extended Success',
        props<{ extended: IChatExtended }>()
    ),
    extendedFail: createAction(
        '[Chat Page] Extended Fail',
        props<{ err: Error }>()
    ),
    loadThreads: createAction(
        '[Chat Page] Load Threads',
        props<{ resetList: boolean }>()
    ),
    loadThreadsSuccess: createAction(
        '[Chat Page] Load Threads Success',
        props<{ threads: IThread[], take: number }>()
    ),
    loadThreadsFail: createAction(
        '[Chat Page] Load Threads Fail',
        props<{ err: Error }>()
    ),
    updateTotals: createAction(
        '[Chat Page] Update Totals'
    ),
    updateTotalsSuccess: createAction(
        '[Chat Page] Update Totals Success',
        props<{ totals: IThreadTotals }>()
    ),
    updateTotalsFail: createAction(
        '[Chat Page] Update Totals Fail',
        props<{ err: Error }>()
    ),
    togglePin: createAction(
        '[Chat Page] Toggle Pin',
        props<{ pin: IPinMessage, value: boolean }>(),
    ),
    togglePinSuccess: createAction(
        '[Chat Page] Toggle Pin Success',
        props<{ pin: IPinMessage }>(),
    ),
    togglePinFail: createAction(
        '[Chat Page] Toggle Pin Fail',
        props<{ err: Error }>()
    ),
    removeThread: createAction(
        '[Chat Page] Remove Thread',
        props<{ chatId: number }>()
    ),
};

const all = union(chatPageActions);

export type ChatPageActionsUnion = typeof all;
