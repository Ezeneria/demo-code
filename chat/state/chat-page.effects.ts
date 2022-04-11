import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { catchError, debounceTime, delay, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { authState } from '@core/auth';
import { OverlayService } from '@core/modal';
import { ICriterion } from '@core/criteria';
import { ConfigService } from '@core/config';
import { AddNotification, NoteGroup } from '@core/note';
import { coreChatActions, coreChatState, IChatItemResponse } from '@core/chat';
import { IThread, updateThreadWithNewMessage } from '../entities/thread.interface';
import { ThreadType } from '../entities/thread-type';
import { ChatService } from '../providers/chat.service';
import { IUnnasignedCriteria } from '../entities/unnasigned-criteria.interface';
import { chatPageActions, ChatPageActionsUnion } from './chat-page.actions';
import { MessageType } from '../entities/message-type';
import { Observable, of } from 'rxjs';
import { IChatExtended } from '../entities/chat-extended.interface';
import { IAdminChat } from '../entities/admin-chat.interface';
import { IThreadTotals } from '../entities/thread-totals.interface';
import { chatPageState } from './chat-page.reducer';
import { UserType } from '../../shared/entities/users/user-type';

@Injectable()
export class ChatPageEffects {
    @Effect()
    public loadThreads$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.loadThreads.type),
        withLatestFrom(
            this._store.pipe(select(chatPageState.threads.threads)),
            this._store.pipe(select(chatPageState.threads.criteriaSiteId)),
            this._store.pipe(select(chatPageState.ui.pageType)),
            this._store.pipe(select(chatPageState.ui.currentOwnerId)),
            this._store.pipe(select(chatPageState.ui.unnasignedCriteria)),
        ),
        switchMap(([{resetList}, oldThreads, siteId, pageType, ownerId, unnasignedCriteria]) => {
            const pageSize: number = this._configService.pageSize;

            const threads: IThread[] = resetList ? [] : oldThreads;
            const searchCriteria: ICriterion[] = this._prepareCriteria(threads, siteId, pageType, unnasignedCriteria);

            let loadThreadsFn: Observable<IThread[]>;
            if (pageType === ThreadType.AgentChats) {
                loadThreadsFn = this._chatService.byAdmin(ownerId, searchCriteria, pageSize);
            } else {
                loadThreadsFn = this._chatService.list(searchCriteria, pageSize);
            }

            return loadThreadsFn.pipe(
                map((newThreads: IThread[]) => chatPageActions.loadThreadsSuccess({
                    threads: newThreads,
                    take: pageSize
                })),
                catchError((err: Error) => of(chatPageActions.loadThreadsFail({err})))
            );
        })
    );

    @Effect({dispatch: false})
    public updateThreads$ = this._actions$.pipe(
        ofType(chatPageActions.updateThreads.type),
        withLatestFrom(
            this._store.pipe(select(chatPageState.threads.threads)),
            this._store.pipe(select(chatPageState.ui.pageType)),
            this._store.pipe(select(chatPageState.ui.currentOwnerId)),
            this._store.pipe(select(authState.currentUserId))
        ),
        tap(([{message}, threads, pageType, ownerId, userId]) => {
            let find = threads.find((u) => u.chatId === message.chatId);
            if (find) {
                this._updateThreads(threads, find, message);
            } else {
                const isMyChatPage: boolean = pageType === ThreadType.Active;
                const isAdminChatPage: boolean = pageType === ThreadType.AgentChats;
                const isCurrentUserOwner: boolean = ownerId === userId;
                const isMyChatAdminPage: boolean = isAdminChatPage && isCurrentUserOwner;

                if (isMyChatPage || isMyChatAdminPage) {
                    this._chatService.details(message.chatId).subscribe(
                        (newThread: IThread) => {
                            let exist = threads.find((t) => t.chatId === message.chatId);
                            if (exist) {
                                console.warn('Duplicate thread arrived', message, exist);
                                throw new Error('Duplicate thread arrived');
                            }

                            this._updateThreads(threads, newThread, message);
                        },
                        (err: Error) => this._store.dispatch(chatPageActions.updateThreadsFail({err}))
                    );
                }
            }
        })
    );

    // TODO split with $.filter()
    // counters with debounce feature
    @Effect({dispatch: false})
    public updateCounters$ = this._actions$.pipe(
        ofType(chatPageActions.updateCounters.type),
        debounceTime(1000),
        withLatestFrom(
            this._store.pipe(select(chatPageState.ui.pageType))
        ),
        tap(([action, pageType]) => {
            this._store.dispatch(chatPageActions.updateTotals());

            if (pageType === ThreadType.AgentChats) {
                this._store.dispatch(chatPageActions.adminList());
            }
        })
    );

    @Effect({dispatch: false})
    public removeThread$ = this._actions$.pipe(
        ofType(chatPageActions.removeThread.type),
        withLatestFrom(
            this._store.pipe(select(coreChatState.thread)),
            this._store.pipe(select(chatPageState.threads.completed)),
            this._store.pipe(select(chatPageState.threads.preparedThreadsLength))
        ),
        tap(([{chatId}, thread, completed, length]) => {
            this._store.dispatch(chatPageActions.updateCounters());

            if (thread && thread.chatId === chatId) {
                this._store.dispatch(coreChatActions.close({navigate: true}));
                this._router.navigate([], {queryParams: null});
            }

            if (length === 0 && !completed) {
                this._store.dispatch(chatPageActions.loadThreads({resetList: false}));
            }
        })
    );

    @Effect({dispatch: false})
    public updateCriteria$ = this._actions$.pipe(
        ofType(chatPageActions.updateCriteria.type),
        withLatestFrom(
            this._store.pipe(select(coreChatState.thread))
        ),
        tap(([{criteria}, thread]: [any, IThread]) => {
            if (criteria.siteId && thread && criteria.siteId !== thread.siteId) {
                this._store.dispatch(coreChatActions.close({navigate: true}));
            }
        })
    );

    @Effect()
    public admins$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.adminList.type),
        switchMap(() => this._chatService.admins().pipe(
            map((items: IAdminChat[]) => chatPageActions.adminListSuccess({items})),
            catchError((err: Error) => of(chatPageActions.adminListFail({err})))
        ))
    );

    @Effect()
    public updateTotals$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.updateTotals.type),
        withLatestFrom(
            this._store.pipe(select(chatPageState.threads.criteria))
        ),
        switchMap(([action, criteria]) => this._chatService.totals(criteria.siteId).pipe(
            map((totals: IThreadTotals) => chatPageActions.updateTotalsSuccess({totals})),
            catchError((err: Error) => of(chatPageActions.updateTotalsFail({err})))
        ))
    );

    @Effect()
    public create$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.create.type),
        withLatestFrom(
            this._store.pipe(select(coreChatState.isReady)),
        ),
        switchMap(([{fromUserId, toUserId, siteId, message, translationLanguageId, foreignText, ownerToken}, isReady]) => {
            if (!isReady) {
                return of(chatPageActions.fail({err: null}));
            }

            return this._chatService.create(fromUserId, toUserId, siteId, translationLanguageId).pipe(
                mergeMap((chatId) => [
                    coreChatActions.send({
                        fromUserId,
                        message,
                        foreignText,
                        messageType: MessageType.Text,
                        chatId,
                        ownerToken
                    }),
                    chatPageActions.createSuccess({chatId})
                ]),
                catchError((err: Error) => of(chatPageActions.fail({err})))
            );
        })
    );

    @Effect()
    public createSuccess$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.createSuccess.type),
        delay(1000), // wait for send message before open chat
        map(({chatId}) => coreChatActions.open({chatId})),
    );

    @Effect({dispatch: false})
    public fail$: Observable<any> = this._actions$.pipe(
        ofType(chatPageActions.fail.type),
        withLatestFrom(
            this._translateService.stream('CHAT.FAIL')
        ),
        tap(([{err}, msg]) => {
            if (this._configService.isProdEnv) {
                console.warn(err, msg);
            } else {
                // TODO same for public, refactor it
                if (err === null) {
                    this._store.dispatch(
                        new AddNotification({
                            body: msg,
                            group: NoteGroup.Error
                        })
                    );
                }
            }
        })
    );

    @Effect()
    public updateUnnasignedCriteria$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.updateUnnasignedCriteria.type),
        map(() => chatPageActions.loadThreads({resetList: false}))
    );

    @Effect()
    public extended$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.extended.type),
        withLatestFrom(
            this._store.pipe(select(coreChatState.chatId))
        ),
        switchMap(([action, chatId]) => this._chatService.extended(chatId).pipe(
            map((extended: IChatExtended) => chatPageActions.extendedSuccess({extended})),
            catchError((err: Error) => of(chatPageActions.extendedFail({err})))
        ))
    );

    @Effect()
    public togglePin$: Observable<Action> = this._actions$.pipe(
        ofType(chatPageActions.togglePin.type),
        switchMap(({pin, value}) => {
            return this._chatService.togglePin(
                pin.chatId,
                pin.uuid,
                value
            ).pipe(
                map(() => chatPageActions.togglePinSuccess({
                    pin: {
                        ...pin,
                        isPinned: value
                    }
                })),
                catchError((err: Error) => of(chatPageActions.togglePinFail({err})))
            );
        })
    );

    @Effect({dispatch: false})
    public togglePinSuccess$ = this._actions$.pipe(
        ofType(chatPageActions.togglePinSuccess.type),
        withLatestFrom(
            this._store.pipe(select(coreChatState.chatId))
        ),
        tap(([{pin}, chatId]) => {
            if (pin.chatId === chatId) {
                this._store.dispatch(coreChatActions.updateMessage({
                    uuid: pin.uuid,
                    value: {
                        isPinned: pin.isPinned
                    }
                }));
            }
        })
    );

    constructor(private _actions$: Actions<ChatPageActionsUnion>,
        private _store: Store<any>,
        private _translateService: TranslateService,
        private _configService: ConfigService,
        private _overlayService: OverlayService,
        private _router: Router,
        private _chatService: ChatService) {
    }

    private _updateThreads(threads: IThread[], oldThread: IThread, message: IChatItemResponse) {
        let newThread = updateThreadWithNewMessage(oldThread, message);
        let result = [
            ...threads.filter((t) => t.chatId !== message.chatId),
            newThread
        ];
        this._store.dispatch(chatPageActions.updateThreadsSuccess({threads: result}));
    }

    private _prepareCriteria(threads: IThread[], siteId: number, pageType: ThreadType, formValues: IUnnasignedCriteria): ICriterion[] {
        let criteria: ICriterion[] = [
            {field: 'skipChatIds', value: threads.map((t) => t.chatId)}
        ];

        if (siteId) {
            criteria.push(
                {field: 'siteId', value: siteId}
            );
        }

        if (pageType !== ThreadType.AgentChats &&
            pageType !== ThreadType.Unassigned &&
            pageType !== ThreadType.Bank) {
            criteria.push(
                {field: 'status', value: pageType}
            );
        }

        if (pageType === ThreadType.Unassigned) {
            criteria.push(
                {field: 'status', value: ThreadType.Unassigned},
                {field: 'userType', value: UserType.Member},
                {field: 'unassignedChatSearch', value: formValues.unassignedChatSearch},
                {field: 'unassignedChatStatus', value: formValues.unassignedChatStatus}
            );
        }

        if (pageType === ThreadType.Bank) {
            criteria.push(
                {field: 'status', value: ThreadType.Unassigned},
                {field: 'userType', value: UserType.Bank},
                {field: 'unassignedChatSearch', value: formValues.unassignedChatSearch},
                {field: 'unassignedChatStatus', value: formValues.unassignedChatStatus}
            );
        }

        return criteria;
    }
}
