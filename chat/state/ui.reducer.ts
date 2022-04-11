import { createFeatureSelector, createSelector } from '@ngrx/store';
import { coreChatActions } from '@core/chat';
import { IAdminChat } from '../entities/admin-chat.interface';
import { IThreadTotals } from '../entities/thread-totals.interface';
import { IUnnasignedCriteria } from '../entities/unnasigned-criteria.interface';
import { IChatExtended } from '../entities/chat-extended.interface';
import { ThreadType } from '../entities/thread-type';
import { chatPageActions } from './chat-page.actions';
import { FEATURE_NAME } from './token';

export interface State {
    loading: boolean;
    unassignedCriteria: IUnnasignedCriteria;
    pageType: ThreadType;
    ownerId: number;
    extended: IChatExtended;
    totals: IThreadTotals;
    resolved: boolean;
    admins: IAdminChat[];
}

export const initialState: State = {
    loading: false,
    unassignedCriteria: {
        unassignedChatSearch: null,
        unassignedChatStatus: 'notReplied'
    },
    pageType: null,
    ownerId: null,
    admins: [],
    extended: null,
    totals: {
        active: 0,
        scheduled: 0,
        unassigned: {
            all: 0,
            notReplied: 0,
            replied: 0
        }
    },
    resolved: false,
};

export function reducer(state: State = initialState, action): State {
    switch (action.type) {
        case chatPageActions.create.type:
            return {
                ...state,
                loading: true
            };
        case chatPageActions.createSuccess.type:
        case chatPageActions.fail.type:
            return {
                ...state,
                loading: false
            };
        case chatPageActions.togglePinSuccess.type:
            if (state.extended) {
                let pinnedItems = action.pin.isPinned
                    ? [action.pin, ...state.extended.pinnedItems]
                    : state.extended.pinnedItems.filter((item) => item.uuid !== action.pin.uuid);

                return {
                    ...state,
                    extended: {
                        ...state.extended,
                        pinnedItems
                    }
                };
            }

            return state;
        case chatPageActions.updateUnnasignedCriteria.type:
            return {
                ...state,
                unassignedCriteria: action.criteria,
            };
        case chatPageActions.adminListSuccess.type:
            return {
                ...state,
                admins: action.items
            };
        case chatPageActions.resetPage.type:
            return {
                ...state,
                pageType: action.pageType,
                ownerId: action.ownerId,
                // admins: initialState.admins,
                unassignedCriteria: initialState.unassignedCriteria,
            };
        case chatPageActions.adminListFail.type:
            return {
                ...state,
                admins: [],
            };
        case coreChatActions.close.type:
        case chatPageActions.extended.type:
        case chatPageActions.extendedFail.type:
            return {
                ...state,
                extended: null
            };
        case chatPageActions.extendedSuccess.type:
            return {
                ...state,
                extended: action.extended
            };
        case chatPageActions.updateTotalsSuccess.type:
            return {
                ...state,
                totals: action.totals,
                resolved: true,
            };
        case chatPageActions.updateTotalsFail.type:
            return {
                ...state,
                totals: initialState.totals,
                resolved: true
            };
        case chatPageActions.clear.type:
            return initialState;
        default:
            return state;
    }
}

const getChatState = createFeatureSelector<{ ui: State }>(FEATURE_NAME);

const getChatUIState = createSelector(
    getChatState,
    (state: { ui: State }) => state.ui
);

const pageType = createSelector(
    getChatUIState,
    (state: State) => state.pageType
);

const totals = createSelector(
    getChatUIState,
    (state: State) => state.totals
);

const currentOwnerId = createSelector(
    getChatUIState,
    (state: State) => state.ownerId
);

export const chatUIState = {
    loading: createSelector(
        getChatUIState,
        (state: State) => state.loading
    ),
    resolved: createSelector(
        getChatUIState,
        (state: State) => state.resolved
    ),
    pageType,
    readonly: createSelector(
        pageType,
        (getPageType) => getPageType !== ThreadType.Active
    ),
    unnasignedCriteria: createSelector(
        getChatUIState,
        (state: State) => state.unassignedCriteria
    ),
    currentOwnerId,
    totals,
    unnasignedTotals: createSelector(
        totals,
        (getTotals) => getTotals.unassigned
    ),
    extended: createSelector(
        getChatUIState,
        (state: State) => state.extended
    ),
    admins: createSelector(
        getChatUIState,
        (state: State) => state.admins
    ),
    isCriteriaVisible: createSelector(
        pageType,
        currentOwnerId,
        (page: ThreadType, ownerId: number) => !(page === ThreadType.AgentChats && ownerId === null)
    ),
};
