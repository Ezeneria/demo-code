import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IThread } from '../entities/thread.interface';
import { chatPageActions, ChatPageActionsUnion } from './chat-page.actions';
import { IThreadCriteria } from '../entities/thread-criteria.interface';
import { FEATURE_NAME } from './token';

export interface State {
    selectedChatIds: number[];
    completed: boolean;
    threads: IThread[];
    loading: boolean; // threads loading
    criteria: IThreadCriteria;
}

export const initialState: State = {
    selectedChatIds: [],
    completed: true,
    threads: [],
    loading: false,
    criteria: {
        siteId: null,
        sort: true
    },
};

export function reducer(state: State = initialState, action: ChatPageActionsUnion): State {
    switch (action.type) {
        case chatPageActions.updateCriteria.type:
            return {
                ...state,
                criteria: action.criteria,
                selectedChatIds: []
            };
        case chatPageActions.updateUnnasignedCriteria.type:
            return {
                ...state,
                threads: [],
                completed: initialState.completed,
                selectedChatIds: []
            };
        case chatPageActions.clearSelectedChatIds.type:
            return {
                ...state,
                selectedChatIds: []
            };
        case chatPageActions.updateSelectedChatIds.type:
            let selectedChatIds = action.isSelect
                ? [...state.selectedChatIds, action.chatId]
                : state.selectedChatIds.filter((chatId) => chatId !== action.chatId);

            return {
                ...state,
                selectedChatIds
            };
        case chatPageActions.resetPage.type:
            return {
                ...state,
                threads: initialState.threads,
                completed: initialState.completed,
                selectedChatIds: initialState.selectedChatIds
            };
        case chatPageActions.updateThreadsSuccess.type:
            return {
                ...state,
                threads: action.threads,
            };
        case chatPageActions.loadThreads.type:
            return {
                ...state,
                threads: action.resetList ? [] : state.threads,
                loading: true
            };
        case chatPageActions.loadThreadsSuccess.type:
            return {
                ...state,
                completed: action.threads.length < action.take,
                threads: [...state.threads, ...action.threads],
                loading: false,
            };
        case chatPageActions.loadThreadsFail.type:
            return {
                ...state,
                loading: false
            };
        case chatPageActions.removeThread.type:
            return {
                ...state,
                threads: state.threads.filter((t) => t.chatId !== action.chatId)
            };
        case chatPageActions.clear.type:
            return initialState;
        default:
            return state;
    }
}

const getChatState = createFeatureSelector<{ threads: State }>(FEATURE_NAME);

const getThreadsState = createSelector(
    getChatState,
    (state: { threads: State }) => state.threads
);

const criteriaSelector = createSelector(
    getThreadsState,
    (state: State) => state.criteria
);

const threadsSelector = createSelector(
    getThreadsState,
    (state: State) => state.threads
);

const preparedThreads = createSelector(
    threadsSelector,
    criteriaSelector,
    (getThreads, getCriteria) => {
        let result: IThread[] = getThreads.map((t) => {
            return {
                ...t,
                // hidden: criteria.siteId && criteria.siteId !== t.siteId
            };
        });

        let currentSortFn = getCriteria.sort
            ? (odd: IThread, even: IThread) => +even.lastMessageTime - +odd.lastMessageTime
            : (odd: IThread, even: IThread) => +odd.lastMessageTime - +even.lastMessageTime;

        return result.sort(currentSortFn);
    }
);

const loadingSelector = createSelector(
    getThreadsState,
    (state: State) => state.loading
);

const completedSelector = createSelector(
    getThreadsState,
    (state: State) => state.completed
);

export const threadsState = {
    threads: threadsSelector,
    loading: loadingSelector,
    completed: completedSelector,
    criteria: criteriaSelector,
    noItems: createSelector(
        threadsSelector,
        loadingSelector,
        completedSelector,
        (threads, loading, completed) => !loading && completed && threads.length === 0
    ),
    criteriaSiteId: createSelector(
        criteriaSelector,
        (getCriteria) => getCriteria.siteId
    ),
    selectedChatIds: createSelector(
        getThreadsState,
        (state: any) => state.selectedChatIds
    ),
    preparedThreads,
    preparedThreadsLength: createSelector(
        preparedThreads,
        (getThreads) => getThreads.length
    )
};
