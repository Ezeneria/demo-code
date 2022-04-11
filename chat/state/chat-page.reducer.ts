import { ActionReducer, combineReducers } from '@ngrx/store';
import * as chatThreads from 'c4-admin-app/modules/chat/state/threads.reducer';
import * as chatUI from 'c4-admin-app/modules/chat/state/ui.reducer';
import { InjectionToken } from '@angular/core';
import { FEATURE_NAME } from 'c4-admin-app/modules/chat/state/token';

export const reducerToken: InjectionToken<ActionReducer<State>> = new InjectionToken<ActionReducer<State>>(FEATURE_NAME);

interface State {
    threads: chatThreads.State;
    ui: chatUI.State;
}

const initialState: State = {
    threads: chatThreads.initialState,
    ui: chatUI.initialState
};

const reducer = combineReducers({
    threads: chatThreads.reducer,
    ui: chatUI.reducer
}, initialState);

export const chatPageState = {
    threads: chatThreads.threadsState,
    ui: chatUI.chatUIState
};

export function reducerFactory(): ActionReducer<State> {
    return reducer;
}
